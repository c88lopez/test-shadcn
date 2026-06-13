import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useIndeterminateProgress } from "@/hooks/use-indeterminate-progress"

type ProgressButtonProps = React.ComponentProps<typeof Button> & {
  loading?: boolean
}

/**
 * A submit/action button that fills with a progress bar while `loading` instead
 * of showing a spinner. Disabled while loading.
 */
export function ProgressButton({
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ProgressButtonProps) {
  const progress = useIndeterminateProgress(loading)
  return (
    <Button
      className={cn("relative overflow-hidden", className)}
      disabled={disabled || loading}
      {...props}
    >
      {progress > 0 && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-primary-foreground/25 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </Button>
  )
}
