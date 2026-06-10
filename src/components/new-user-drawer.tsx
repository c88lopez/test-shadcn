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
import { SUPER_ADMIN_ROLE } from "@/lib/permissions"
import { useAppSettings } from "@/lib/app-settings"

export { ROLE_DESCRIPTIONS, USER_ROLES }
export type { UserRole }

type DrawerRole = UserRole | typeof SUPER_ADMIN_ROLE

function describeRole(role: string | undefined): string | undefined {
  if (!role) return undefined
  if (role === SUPER_ADMIN_ROLE)
    return "Platform-wide access across all clubs. Not tied to a single club."
  return ROLE_DESCRIPTIONS[role as UserRole]
}

type FormInput = {
  name: string
  email: string
  role?: DrawerRole
  password?: string
  clubId?: string | null
}

export interface UserFormData {
  name: string
  email: string
  role: DrawerRole
  password?: string
  clubId?: string | null
}

interface Props {
  trigger?: React.ReactNode
  user?: UserFormData
  /** When true, the actor may assign clubs and the Super Admin role. */
  canManageClubs?: boolean
  /** Clubs available for assignment (only used when canManageClubs). */
  clubs?: { id: string; name: string }[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSave?: (data: UserFormData) => Promise<void>
}

export function NewUserDrawer({
  trigger,
  user,
  canManageClubs = false,
  clubs = [],
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

  const roleOptions: DrawerRole[] = canManageClubs
    ? [...USER_ROLES, SUPER_ADMIN_ROLE]
    : [...USER_ROLES]

  const schema = useMemo(() => {
    const base = {
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email address"),
      role: z.enum(roleOptions as [string, ...string[]], {
        error: "Role is required",
      }),
      clubId: z.string().nullish(),
    }
    const obj = isEditing
      ? z.object(base)
      : z.object({
          ...base,
          password: z.string().min(minLength, `At least ${minLength} chars`),
        })
    // Super-admins must pick a club for any non-super-admin user.
    if (!canManageClubs) return obj
    return obj.refine((v) => v.role === SUPER_ADMIN_ROLE || !!v.clubId, {
      message: "Select a club",
      path: ["clubId"],
    })
  }, [isEditing, minLength, canManageClubs, roleOptions])

  // New users start at the configured default role (Settings → Users → Security).
  const blankUser = {
    name: "",
    email: "",
    role: security.defaultRole as DrawerRole,
    password: "",
    clubId: null,
  }

  const form = useForm<FormInput>({
    resolver: zodFormResolver<FormInput>(schema),
    defaultValues: user ?? blankUser,
  })

  const selectedRole = form.watch("role")

  useEffect(() => {
    if (open) {
      form.reset(user ?? blankUser)
      reset()
    }
  }, [open, user])

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
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.value && (
                    <FormDescription>
                      {describeRole(field.value)}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {canManageClubs && selectedRole !== SUPER_ADMIN_ROLE && (
              <FormField
                control={form.control}
                name="clubId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select club" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clubs.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
