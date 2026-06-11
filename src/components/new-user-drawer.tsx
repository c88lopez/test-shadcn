import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
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

function describeRole(
  t: TFunction,
  role: string | undefined
): string | undefined {
  if (!role) return undefined
  if (role === SUPER_ADMIN_ROLE) return t("forms.user.superAdminDescription")
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
  const { t } = useTranslation()
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
      name: z.string().min(1, t("validation.nameRequired")),
      email: z.string().email(t("validation.emailInvalid")),
      role: z.enum(roleOptions as [string, ...string[]], {
        error: t("validation.roleRequired"),
      }),
      clubId: z.string().nullish(),
    }
    const obj = isEditing
      ? z.object(base)
      : z.object({
          ...base,
          password: z
            .string()
            .min(minLength, t("validation.passwordMin", { count: minLength })),
        })
    // Super-admins must pick a club for any non-super-admin user.
    if (!canManageClubs) return obj
    return obj.refine((v) => v.role === SUPER_ADMIN_ROLE || !!v.clubId, {
      message: t("validation.selectClubRequired"),
      path: ["clubId"],
    })
  }, [isEditing, minLength, canManageClubs, roleOptions, t])

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
        toast.success(
          isEditing ? t("forms.user.updated") : t("forms.user.created"),
          {
            description: t("common.savedSuccess", { name: values.name }),
          }
        )
        schedule(() => setOpen(false), 900)
      },
      onError: (error) => {
        const message =
          error instanceof Error
            ? error.message
            : t("forms.user.errorDescription")
        toast.error(t("forms.user.errorTitle"), { description: message })
      },
    })
  }

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {isEditing ? t("forms.user.titleEdit") : t("forms.user.titleNew")}
          </DrawerTitle>
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
                  <FormLabel>{t("fields.fullName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("forms.user.namePlaceholder")}
                      {...field}
                    />
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
                  <FormLabel>{t("fields.email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("forms.user.emailPlaceholder")}
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
                  <FormLabel>{t("fields.role")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("placeholders.selectRole")}
                        />
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
                      {describeRole(t, field.value)}
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
                    <FormLabel>{t("fields.club")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("placeholders.selectClub")}
                          />
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
                    <FormLabel>{t("forms.user.temporaryPassword")}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        autoComplete="new-password"
                        placeholder={t("forms.user.passwordPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("forms.user.passwordHelp")}
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
                label={
                  isEditing
                    ? t("common.saveChanges")
                    : t("forms.user.submitNew")
                }
              />
              <DrawerClose asChild>
                <Button variant="outline" disabled={status === "submitting"}>
                  {t("common.cancel")}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  )
}
