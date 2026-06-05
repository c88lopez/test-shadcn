import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DrawerSubmitButton } from "@/components/drawer-submit-button"
import { useSubmitLifecycle } from "@/hooks/use-submit-lifecycle"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const USER_ROLES = [
  "Owner",
  "Admin",
  "Manager",
  "Coach",
  "Front Desk",
] as const

export type UserRole = (typeof USER_ROLES)[number]

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  Owner: "Full access, including billing and ownership transfer.",
  Admin: "Manage all club data, users and settings.",
  Manager: "Manage reservations, players and coaches.",
  Coach: "View schedules and manage their own classes.",
  "Front Desk": "Handle bookings and point-of-sale.",
}

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(USER_ROLES, { error: "Role is required" }),
})

type FormValues = z.infer<typeof schema>
type FormInput = Omit<FormValues, "role"> & { role?: UserRole }

export interface UserFormData {
  name: string
  email: string
  role: UserRole
}

interface Props {
  trigger?: React.ReactNode
  user?: UserFormData
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSave?: (data: UserFormData) => void
}

export function NewUserDrawer({
  trigger,
  user,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSave,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen
  const isEditing = !!user

  const { status, progress, run, reset, schedule } = useSubmitLifecycle()

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: user ?? { name: "", email: "", role: undefined },
  })

  useEffect(() => {
    if (open) {
      form.reset(user ?? { name: "", email: "", role: undefined })
      reset()
    }
  }, [open, user, form, reset])

  function onSubmit(values: FormInput) {
    // PoC: type "fail" anywhere in the form to exercise the error path.
    run({
      willFail: JSON.stringify(values).toLowerCase().includes("fail"),
      onSuccess: () => {
        onSave?.(values as UserFormData)
        toast.success(isEditing ? "User updated" : "User created", {
          description: `${values.name} has been saved successfully.`,
        })
        schedule(() => setOpen(false), 900)
      },
      onError: () => {
        toast.error("Something went wrong", {
          description: "The user could not be saved. Please try again.",
        })
      },
    })
  }

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEditing ? "Edit User" : "New User"}</DrawerTitle>
        </DrawerHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ana Martínez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {USER_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.value && (
                    <FormDescription>
                      {ROLE_DESCRIPTIONS[field.value]}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DrawerFooter className="px-0 pt-4">
              <DrawerSubmitButton
                status={status}
                progress={progress}
                label={isEditing ? "Save Changes" : "Add User"}
              />
              <DrawerClose asChild>
                <Button variant="outline" disabled={status === "submitting"}>
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  )
}
