import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import type { SubmitStatus } from "@/hooks/use-submit-lifecycle"

interface DrawerSubmitButtonProps {
  status: SubmitStatus
  progress: number
  label: string
  savingLabel?: string
  successLabel?: string
}

export function DrawerSubmitButton({
  status,
  progress,
  label,
  savingLabel = "Saving…",
  successLabel = "Saved",
}: DrawerSubmitButtonProps) {
  const busy = status === "submitting" || status === "success"
  return (
    <Button type="submit" disabled={busy} className="relative overflow-hidden">
      {busy && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-primary-foreground/25 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {status === "submitting" && (
          <IconLoader2 className="size-4 animate-spin" />
        )}
        {status === "submitting"
          ? savingLabel
          : status === "success"
            ? successLabel
            : label}
      </span>
    </Button>
  )
}
