import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodFormResolver } from "@/lib/form"
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
import { ROLE_DESCRIPTIONS, USER_ROLES } from "@/lib/users"
import type { UserRole } from "@/lib/users"
import { useAppSettings } from "@/lib/app-settings"

export { ROLE_DESCRIPTIONS, USER_ROLES }
export type { UserRole }

type FormInput = {
  name: string
  email: string
  role?: UserRole
  password?: string
}

export interface UserFormData {
  name: string
  email: string
  role: UserRole
  password?: string
}

interface Props {
  trigger?: React.ReactNode
  user?: UserFormData
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSave?: (data: UserFormData) => Promise<void>
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
  const { security } = useAppSettings()
  const minLength = security.passwordMinLength

  const schema = useMemo(() => {
    const base = {
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email address"),
      role: z.enum(USER_ROLES, { error: "Role is required" }),
    }
    if (isEditing) return z.object(base)
    return z.object({
      ...base,
      password: z.string().min(minLength, `At least ${minLength} characters`),
    })
  }, [isEditing, minLength])

  // New users start at the configured default role (Settings → Users → Security).
  const blankUser = {
    name: "",
    email: "",
    role: security.defaultRole,
    password: "",
  }

  const form = useForm<FormInput>({
    resolver: zodFormResolver<FormInput>(schema),
    defaultValues: user ?? blankUser,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        user ?? {
          name: "",
          email: "",
          role: security.defaultRole,
          password: "",
        }
      )
      reset()
    }
  }, [open, user, form, reset, security.defaultRole])

  function onSubmit(values: FormInput) {
    run({
      action: () => onSave?.(values as UserFormData) ?? Promise.resolve(),
      onSuccess: () => {
        toast.success(isEditing ? "User updated" : "User created", {
          description: `${values.name} has been saved successfully.`,
        })
        schedule(() => setOpen(false), 900)
      },
      onError: (error) => {
        const message =
          error instanceof Error
            ? error.message
            : "The user could not be saved. Please try again."
        toast.error("Could not save user", { description: message })
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

            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporary Password</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        autoComplete="new-password"
                        placeholder="Set an initial password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The user can change this after their first sign-in.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
