import { useCallback, useEffect, useRef, useState } from "react"

export type SubmitStatus = "idle" | "submitting" | "success" | "error"

interface RunOptions {
  /**
   * Async work to perform. The progress bar animates while the promise is
   * pending, then completes on resolve or resets on reject.
   */
  action: () => Promise<unknown>
  onSuccess: () => void
  onError: (error?: unknown) => void
}

/**
 * Submit lifecycle: drives a progress bar and status flags around an async
 * operation (submitting → success | error).
 */
export function useSubmitLifecycle() {
  const [status, setStatus] = useState<SubmitStatus>("idle")
  const [progress, setProgress] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const schedule = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms))
  }, [])

  const reset = useCallback(() => {
    clearTimers()
    setStatus("idle")
    setProgress(0)
  }, [clearTimers])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const run = useCallback(
    ({ action, onSuccess, onError }: RunOptions) => {
      clearTimers()
      setStatus("submitting")
      setProgress(8)

      const succeed = () => {
        clearTimers()
        setProgress(100)
        setStatus("success")
        onSuccess()
      }
      const fail = (error?: unknown) => {
        clearTimers()
        setProgress(0)
        setStatus("error")
        onError(error)
      }

      // Climb progress while the request is in flight.
      ;[25, 45, 65, 85].forEach((p, i) => {
        schedule(() => setProgress(p), 200 * (i + 1))
      })
      action().then(succeed, fail)
    },
    [clearTimers, schedule]
  )

  const isBusy = status === "submitting" || status === "success"

  return { status, progress, isBusy, run, reset, schedule }
}
