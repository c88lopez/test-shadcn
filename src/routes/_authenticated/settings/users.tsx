import { useMemo, useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { ensurePermission } from "@/lib/route-guards"
import type { ColumnDef } from "@tanstack/react-table"
import { IconDotsVertical, IconPlus } from "@tabler/icons-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SettingsSection,
  SettingsSectionList,
} from "@/components/settings-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NewUserDrawer, USER_ROLES } from "@/components/new-user-drawer"
import type { UserRole } from "@/components/new-user-drawer"
import { cn } from "@/lib/utils"
import {
  clampNumber,
  setAppSettings,
  useAppSettings,
  useAppSettingsHydrated,
} from "@/lib/app-settings"
import type { SecuritySettings } from "@/lib/app-settings"
import { can } from "@/lib/permissions"
import { listClubOptions } from "@/lib/clubs.functions"
import {
  createUser,
  deleteUser,
  listUsers,
  resetUserPassword,
  setUserArchived,
  updateUser,
} from "@/lib/users.functions"

type ClubOption = { id: string; name: string }

export const Route = createFileRoute("/_authenticated/settings/users")({
  beforeLoad: ({ context }) =>
    ensurePermission(context.user.role, "users:manage"),
  loader: async ({ context }) => {
    const canManageClubs = can(context.user.role, "clubs:manage")
    const [users, clubs] = await Promise.all([listUsers(), listClubOptions()])
    return { users, clubs, canManageClubs }
  },
  component: UsersSettingsPage,
})

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: string
  clubId: string | null
  clubName: string | null
  clubIds: string[]
}

function UserActions({
  user,
  clubs,
  canManageClubs,
}: {
  user: User
  clubs: ClubOption[]
  canManageClubs: boolean
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isArchived = user.status === "archived"

  async function handleResetPassword() {
    try {
      const { tempPassword } = await resetUserPassword({
        data: { id: user.id },
      })
      toast.success(t("settings.users.tempPasswordSet"), {
        description: t("settings.users.tempPasswordDescription", {
          email: user.email,
          password: tempPassword,
        }),
        duration: 10000,
      })
    } catch (error) {
      toast.error(t("settings.users.resetPasswordError"), {
        description:
          error instanceof Error ? error.message : t("common.tryAgain"),
      })
    }
  }

  async function handleToggleArchive() {
    try {
      await setUserArchived({
        data: { id: user.id, archived: !isArchived },
      })
      toast.success(
        isArchived
          ? t("settings.users.userRestored")
          : t("settings.users.userArchived"),
        {
          description: isArchived
            ? t("settings.users.restoredDescription", { name: user.name })
            : t("settings.users.archivedDescription", { name: user.name }),
        }
      )
      router.invalidate()
    } catch (error) {
      toast.error(t("settings.users.updateError"), {
        description:
          error instanceof Error ? error.message : t("common.tryAgain"),
      })
    }
  }

  async function handleDelete() {
    try {
      await deleteUser({ data: { id: user.id } })
      toast.success(t("settings.users.deleted"), {
        description: t("settings.users.deletedDescription", {
          name: user.name,
        }),
      })
      router.invalidate()
    } catch (error) {
      toast.error(t("settings.users.deleteError"), {
        description:
          error instanceof Error ? error.message : t("common.tryAgain"),
      })
    } finally {
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <NewUserDrawer
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
          clubIds: user.clubIds,
        }}
        canManageClubs={canManageClubs}
        canAssignClubs={clubs.length > 0}
        clubs={clubs}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={async (data) => {
          await updateUser({
            data: {
              id: user.id,
              name: data.name,
              email: data.email,
              role: data.role,
              clubIds: data.clubIds,
            },
          })
          router.invalidate()
        }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <IconDotsVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            {t("common.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResetPassword}>
            {t("settings.users.resetPassword")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleArchive}>
            {isArchived
              ? t("settings.users.restore")
              : t("settings.users.archive")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings.users.deleteTitle", { name: user.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.users.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function SecuritySection() {
  const { t } = useTranslation()
  const settings = useAppSettings()
  // Per-club settings load from localStorage after mount; until then show a
  // skeleton so the controls don't flash from default to real values.
  const ready = useAppSettingsHydrated()
  const { security } = settings

  function update(partial: Partial<SecuritySettings>) {
    setAppSettings({ ...settings, security: { ...security, ...partial } })
  }

  return (
    <SettingsSectionList>
      <SettingsSection
        title={t("settings.users.security.title")}
        description={t("settings.users.security.description")}
      >
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("settings.users.security.defaultRole")}</Label>
              {ready ? (
                <Select
                  value={security.defaultRole}
                  onValueChange={(v) => update({ defaultRole: v as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Skeleton className="h-8 w-full rounded-2xl" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sessionTimeout">
                {t("settings.users.security.sessionTimeout")}
              </Label>
              {ready ? (
                <Input
                  id="sessionTimeout"
                  type="number"
                  min={5}
                  value={security.sessionTimeoutMinutes}
                  onChange={(e) =>
                    update({
                      sessionTimeoutMinutes: clampNumber(e.target.value, 5),
                    })
                  }
                />
              ) : (
                <Skeleton className="h-8 w-full rounded-2xl" />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">
              {t("settings.users.security.passwordPolicy")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="minLength">
                  {t("settings.users.security.minLength")}
                </Label>
                {ready ? (
                  <Input
                    id="minLength"
                    type="number"
                    min={6}
                    value={security.passwordMinLength}
                    onChange={(e) =>
                      update({
                        passwordMinLength: clampNumber(e.target.value, 6),
                      })
                    }
                  />
                ) : (
                  <Skeleton className="h-8 w-full rounded-2xl" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="expiryDays">
                  {t("settings.users.security.expiry")}
                </Label>
                {ready ? (
                  <Input
                    id="expiryDays"
                    type="number"
                    min={0}
                    value={security.passwordExpiryDays}
                    onChange={(e) =>
                      update({
                        passwordExpiryDays: clampNumber(e.target.value, 0),
                      })
                    }
                  />
                ) : (
                  <Skeleton className="h-8 w-full rounded-2xl" />
                )}
              </div>
            </div>
            <div className="flex flex-col divide-y rounded-md border">
              <div className="flex items-center gap-3 px-3 py-2.5">
                {ready ? (
                  <Switch
                    checked={security.passwordRequireUppercase}
                    onCheckedChange={(c) =>
                      update({ passwordRequireUppercase: c })
                    }
                  />
                ) : (
                  <Skeleton className="h-5 w-9 rounded-full" />
                )}
                <span className="text-sm">
                  {t("settings.users.security.requireUppercase")}
                </span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5">
                {ready ? (
                  <Switch
                    checked={security.passwordRequireNumber}
                    onCheckedChange={(c) =>
                      update({ passwordRequireNumber: c })
                    }
                  />
                ) : (
                  <Skeleton className="h-5 w-9 rounded-full" />
                )}
                <span className="text-sm">
                  {t("settings.users.security.requireNumber")}
                </span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5">
                {ready ? (
                  <Switch
                    checked={security.passwordRequireSymbol}
                    onCheckedChange={(c) =>
                      update({ passwordRequireSymbol: c })
                    }
                  />
                ) : (
                  <Skeleton className="h-5 w-9 rounded-full" />
                )}
                <span className="text-sm">
                  {t("settings.users.security.requireSymbol")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>
    </SettingsSectionList>
  )
}

function buildColumns(
  t: TFunction,
  clubs: ClubOption[],
  canManageClubs: boolean
): ColumnDef<User>[] {
  return [
    {
      accessorKey: "name",
      header: t("settings.users.colName"),
      cell: ({ row }) => (
        <span
          className={cn(
            "font-medium",
            row.original.status === "archived" && "text-muted-foreground"
          )}
        >
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: t("fields.email"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "role",
      header: t("fields.role"),
      cell: ({ row }) => (
        <Badge variant="secondary">{row.getValue<UserRole>("role")}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: t("common.status"),
      cell: ({ row }) =>
        row.getValue<string>("status") === "active" ? (
          <Badge variant="default">{t("common.active")}</Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            {t("settings.users.archived")}
          </Badge>
        ),
    },
    ...(canManageClubs
      ? [
          {
            accessorKey: "clubName",
            header: t("fields.club"),
            cell: ({ row }) => (
              <span className="text-muted-foreground">
                {row.original.clubName ??
                  t("settings.users.platformPlaceholder")}
              </span>
            ),
          } satisfies ColumnDef<User>,
        ]
      : []),
    {
      id: "actions",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <UserActions
          user={row.original}
          clubs={clubs}
          canManageClubs={canManageClubs}
        />
      ),
    },
  ]
}

function UsersSettingsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { users: rawUsers, clubs, canManageClubs } = Route.useLoaderData()
  const users: User[] = rawUsers.map((u) => ({
    ...u,
    role: u.role as UserRole,
  }))

  const columns = useMemo(
    () => buildColumns(t, clubs, canManageClubs),
    [t, clubs, canManageClubs]
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium">{t("settings.users.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.users.description")}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder={t("settings.users.searchPlaceholder")}
        exportFileName="users"
        action={
          <NewUserDrawer
            canManageClubs={canManageClubs}
            canAssignClubs={clubs.length > 0}
            clubs={clubs}
            onSave={async (data) => {
              await createUser({
                data: {
                  name: data.name,
                  email: data.email,
                  role: data.role,
                  password: data.password ?? "",
                  clubIds: data.clubIds,
                },
              })
              router.invalidate()
            }}
            trigger={
              <Button size="sm">
                <IconPlus className="size-4" />
                {t("settings.users.newButton")}
              </Button>
            }
          />
        }
      />

      <SecuritySection />
    </div>
  )
}
