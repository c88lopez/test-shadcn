import { useState } from "react"
import { useTranslation } from "react-i18next"
import { IconDotsVertical } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
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

interface RowActionsProps {
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  deleteLabel?: string
}

export function RowActions({
  onEdit,
  onDuplicate,
  onDelete,
  deleteLabel,
}: RowActionsProps) {
  const { t } = useTranslation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const resolvedDeleteLabel = deleteLabel ?? t("rowActions.delete")

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <IconDotsVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            {t("rowActions.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            {t("rowActions.duplicate")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            {resolvedDeleteLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("rowActions.areYouSure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("rowActions.cannotBeUndone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("rowActions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={() => {
                onDelete?.()
                setConfirmOpen(false)
              }}
            >
              {resolvedDeleteLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
