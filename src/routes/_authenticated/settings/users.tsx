import { useCallback, useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
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
import type { UserFormData, UserRole } from "@/components/new-user-drawer"
import { cn } from "@/lib/utils"
import { clampNumber, setAppSettings, useAppSettings } from "@/lib/app-settings"
import type { SecuritySettings } from "@/lib/app-settings"

export const Route = createFileRoute("/_authenticated/settings/users")({
  component: UsersSettingsPage,
})

type UserStatus = "active" | "archived"

interface User extends UserFormData {
  id: number
  status: UserStatus
}

const seedUsers: User[] = [
  {
    id: 1,
    name: "Cristian Lopez",
    email: "cristian@coperniq.io",
    role: "Owner",
    status: "active",
  },
  {
    id: 2,
    name: "Ana Martínez",
    email: "ana@padelclub.es",
    role: "Admin",
    status: "active",
  },
  {
    id: 3,
    name: "Diego Ruiz",
    email: "diego@padelclub.es",
    role: "Manager",
    status: "active",
  },
  {
    id: 4,
    name: "Laura Fernández",
    email: "laura@padelclub.es",
    role: "Coach",
    status: "active",
  },
  {
    id: 5,
    name: "Pedro Sánchez",
    email: "pedro@padelclub.es",
    role: "Front Desk",
    status: "archived",
  },
]

function UserActions({
  user,
  onUpdate,
  onToggleArchive,
  onDelete,
}: {
  user: User
  onUpdate: (id: number, data: UserFormData) => void
  onToggleArchive: (id: number) => void
  onDelete: (id: number) => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isArchived = user.status === "archived"

  return (
    <>
      <NewUserDrawer
        user={{ name: user.name, email: user.email, role: user.role }}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={(data) => onUpdate(user.id, data)}
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
          <DropdownMenuItem
            onClick={() =>
              toast.success("Password reset link sent", {
                description: user.email,
              })
            }
          >
            Reset password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggleArchive(user.id)}>
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
              onClick={() => {
                onDelete(user.id)
                setConfirmOpen(false)
              }}
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
  const [users, setUsers] = useState<User[]>(seedUsers)

  const addUser = useCallback((data: UserFormData) => {
    setUsers((prev) => [
      ...prev,
      {
        ...data,
        id: Math.max(0, ...prev.map((u) => u.id)) + 1,
        status: "active",
      },
    ])
  }, [])

  const updateUser = useCallback((id: number, data: UserFormData) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)))
  }, [])

  const toggleArchive = useCallback(
    (id: number) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, status: u.status === "archived" ? "active" : "archived" }
            : u
        )
      )
      const target = users.find((u) => u.id === id)
      if (target) {
        const willArchive = target.status === "active"
        toast.success(willArchive ? "User archived" : "User restored", {
          description: `${target.name} is now ${willArchive ? "archived" : "active"}.`,
        })
      }
    },
    [users]
  )

  const deleteUser = useCallback(
    (id: number) => {
      setUsers((prev) => prev.filter((u) => u.id !== id))
      const target = users.find((u) => u.id === id)
      if (target) {
        toast.success("User deleted", {
          description: `${target.name} was removed.`,
        })
      }
    },
    [users]
  )

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
          row.getValue<UserStatus>("status") === "active" ? (
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
        cell: ({ row }) => (
          <UserActions
            user={row.original}
            onUpdate={updateUser}
            onToggleArchive={toggleArchive}
            onDelete={deleteUser}
          />
        ),
      },
    ],
    [updateUser, toggleArchive, deleteUser]
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
            onSave={addUser}
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
