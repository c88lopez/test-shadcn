import { useMemo, useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { clampNumber, setAppSettings, useAppSettings } from "@/lib/app-settings"
import type { SecuritySettings } from "@/lib/app-settings"
import {
  createUser,
  deleteUser,
  listUsers,
  resetUserPassword,
  setUserArchived,
  updateUser,
} from "@/lib/users.functions"

export const Route = createFileRoute("/_authenticated/settings/users")({
  loader: async () => ({ users: await listUsers() }),
  component: UsersSettingsPage,
})

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: string
}

function UserActions({ user }: { user: User }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isArchived = user.status === "archived"

  async function handleResetPassword() {
    try {
      const { tempPassword } = await resetUserPassword({
        data: { id: user.id },
      })
      toast.success("Temporary password set", {
        description: `${user.email} — ${tempPassword}`,
        duration: 10000,
      })
    } catch (error) {
      toast.error("Could not reset password", {
        description: error instanceof Error ? error.message : "Try again.",
      })
    }
  }

  async function handleToggleArchive() {
    try {
      await setUserArchived({
        data: { id: user.id, archived: !isArchived },
      })
      toast.success(isArchived ? "User restored" : "User archived", {
        description: `${user.name} is now ${isArchived ? "active" : "archived"}.`,
      })
      router.invalidate()
    } catch (error) {
      toast.error("Could not update user", {
        description: error instanceof Error ? error.message : "Try again.",
      })
    }
  }

  async function handleDelete() {
    try {
      await deleteUser({ data: { id: user.id } })
      toast.success("User deleted", {
        description: `${user.name} was removed.`,
      })
      router.invalidate()
    } catch (error) {
      toast.error("Could not delete user", {
        description: error instanceof Error ? error.message : "Try again.",
      })
    } finally {
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <NewUserDrawer
        user={{ name: user.name, email: user.email, role: user.role }}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={async (data) => {
          await updateUser({
            data: {
              id: user.id,
              name: data.name,
              email: data.email,
              role: data.role,
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
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResetPassword}>
            Reset password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleArchive}>
            {isArchived ? "Restore" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the user and their access. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function SecuritySection() {
  const settings = useAppSettings()
  const { security } = settings

  function update(partial: Partial<SecuritySettings>) {
    setAppSettings({ ...settings, security: { ...security, ...partial } })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Defaults for new accounts, password policy and sessions.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Default role for new users</Label>
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
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sessionTimeout">Session timeout (minutes)</Label>
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
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Password policy</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="minLength">Minimum length</Label>
              <Input
                id="minLength"
                type="number"
                min={6}
                value={security.passwordMinLength}
                onChange={(e) =>
                  update({ passwordMinLength: clampNumber(e.target.value, 6) })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="expiryDays">Expiry (days, 0 = never)</Label>
              <Input
                id="expiryDays"
                type="number"
                min={0}
                value={security.passwordExpiryDays}
                onChange={(e) =>
                  update({ passwordExpiryDays: clampNumber(e.target.value, 0) })
                }
              />
            </div>
          </div>
          <div className="flex flex-col divide-y rounded-md border">
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-sm">Require an uppercase letter</span>
              <Switch
                checked={security.passwordRequireUppercase}
                onCheckedChange={(c) => update({ passwordRequireUppercase: c })}
              />
            </div>
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-sm">Require a number</span>
              <Switch
                checked={security.passwordRequireNumber}
                onCheckedChange={(c) => update({ passwordRequireNumber: c })}
              />
            </div>
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-sm">Require a symbol</span>
              <Switch
                checked={security.passwordRequireSymbol}
                onCheckedChange={(c) => update({ passwordRequireSymbol: c })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function UsersSettingsPage() {
  const router = useRouter()
  const { users: rawUsers } = Route.useLoaderData()
  const users: User[] = rawUsers.map((u) => ({
    ...u,
    role: u.role as UserRole,
  }))

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
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
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.getValue<UserRole>("role")}</Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) =>
          row.getValue<string>("status") === "active" ? (
            <Badge variant="default">Active</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Archived
            </Badge>
          ),
      },
      {
        id: "actions",
        enableSorting: false,
        meta: { className: "text-right" },
        cell: ({ row }) => <UserActions user={row.original} />,
      },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium">Users</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite teammates, assign roles and manage access.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search users..."
        exportFileName="users"
        action={
          <NewUserDrawer
            onSave={async (data) => {
              await createUser({
                data: {
                  name: data.name,
                  email: data.email,
                  role: data.role,
                  password: data.password ?? "",
                },
              })
              router.invalidate()
            }}
            trigger={
              <Button size="sm">
                <IconPlus className="size-4" />
                New User
              </Button>
            }
          />
        }
      />

      <SecuritySection />
    </div>
  )
}
