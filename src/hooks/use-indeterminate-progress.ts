import { useEffect, useRef, useState } from "react"

/**
 * Drives a progress-bar fill (0–100) from a boolean busy flag, for buttons that
 * only know "loading / not loading" (no real progress signal). Climbs toward
 * ~95% while active, snaps to 100% on completion, then resets.
 */
export function useIndeterminateProgress(active: boolean): number {
  const [progress, setProgress] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (active) {
      setProgress(8)
      ;[25, 45, 65, 85, 95].forEach((p, i) => {
        timers.current.push(setTimeout(() => setProgress(p), 180 * (i + 1)))
      })
    } else {
      // Finish the bar before clearing it, but only if it was actually running.
      // Hold at 100% long enough for callers that close a dialog on completion.
      setProgress((p) => (p > 0 ? 100 : 0))
      timers.current.push(setTimeout(() => setProgress(0), 600))
    }
    return () => timers.current.forEach(clearTimeout)
  }, [active])

  return progress
}
