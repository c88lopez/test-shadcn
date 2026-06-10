import { useMemo, useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
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
import { NewClubDrawer } from "@/components/new-club-drawer"
import {
  createClub,
  deleteClub,
  listClubs,
  updateClub,
} from "@/lib/clubs.functions"
import type { ClubRecord } from "@/lib/clubs.functions"

export const Route = createFileRoute("/_authenticated/settings/clubs")({
  beforeLoad: ({ context }) =>
    ensurePermission(context.user.role, "clubs:manage"),
  loader: async () => ({ clubs: await listClubs() }),
  component: ClubsSettingsPage,
})

function ClubActions({ club }: { club: ClubRecord }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isDefault = club.slug === "default"

  async function handleDelete() {
    try {
      await deleteClub({ data: { id: club.id } })
      toast.success("Club deleted", {
        description: `${club.name} was removed.`,
      })
      router.invalidate()
    } catch (error) {
      toast.error("Could not delete club", {
        description: error instanceof Error ? error.message : "Try again.",
      })
    } finally {
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <NewClubDrawer
        club={{
          name: club.name,
          status: club.status === "inactive" ? "inactive" : "active",
        }}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={async (data) => {
          await updateClub({ data: { id: club.id, ...data } })
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
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            disabled={isDefault}
            onClick={() => setConfirmOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {club.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the club and <strong>all</strong> of its
              data — players, reservations, inventory, sales, coaches, classes
              and {club.memberCount} member account(s). This cannot be undone.
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

function ClubsSettingsPage() {
  const router = useRouter()
  const { clubs } = Route.useLoaderData()

  const columns = useMemo<ColumnDef<ClubRecord>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "slug",
        header: "Slug",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.slug}</span>
        ),
      },
      {
        accessorKey: "memberCount",
        header: "Members",
        cell: ({ row }) => row.original.memberCount,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) =>
          row.original.status === "active" ? (
            <Badge variant="default">Active</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Inactive
            </Badge>
          ),
      },
      {
        id: "actions",
        enableSorting: false,
        meta: { className: "text-right" },
        cell: ({ row }) => <ClubActions club={row.original} />,
      },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium">Clubs</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Provision clubs and review their membership. Assign users to a club
          from the Users tab.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={clubs}
        searchPlaceholder="Search clubs..."
        exportFileName="clubs"
        action={
          <NewClubDrawer
            onSave={async (data) => {
              await createClub({ data })
              router.invalidate()
            }}
            trigger={
              <Button size="sm">
                <IconPlus className="size-4" />
                New Club
              </Button>
            }
          />
        }
      />
    </div>
  )
}
