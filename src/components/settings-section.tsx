import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Wraps a list of `SettingsSection`s with a top border and dividers between
 * sections, replacing the old card-per-section layout.
 */
export function SettingsSectionList({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col divide-y border-t", className)}>
      {children}
    </div>
  )
}

/**
 * A single settings subsection: title + description in a left column, the
 * controls in the right column. Stacks on mobile. Layout-agnostic — callers
 * provide their own grid/flex wrapper for the controls.
 */
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="grid gap-x-8 gap-y-4 py-8 last:pb-0 md:grid-cols-[16rem_1fr]">
      <div className="md:max-w-xs">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  )
}
