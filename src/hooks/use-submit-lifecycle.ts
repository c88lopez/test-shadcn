import { useCallback, useEffect, useRef, useState } from "react"

export type SubmitStatus = "idle" | "submitting" | "success" | "error"

interface RunOptions {
  /** Simulated failure (only used when no real `action` is provided). */
  willFail?: boolean
  /**
   * Real async work to perform. When provided, the progress bar animates while
   * the promise is pending, then completes on resolve or resets on reject.
   */
  action?: () => Promise<unknown>
  onSuccess: () => void
  onError: (error?: unknown) => void
}

/**
 * Submit lifecycle: drives a progress bar and status flags around an async
 * operation (submitting → success | error). Pass `action` to await a real
 * request; omit it to run the simulated PoC path (toggle with `willFail`).
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
    ({ willFail, action, onSuccess, onError }: RunOptions) => {
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

      // Real async path: climb progress while the request is in flight.
      if (action) {
        ;[25, 45, 65, 85].forEach((p, i) => {
          schedule(() => setProgress(p), 200 * (i + 1))
        })
        action().then(succeed, fail)
        return
      }

      // Simulated PoC path.
      ;[25, 45, 65, 85].forEach((p, i) => {
        schedule(() => setProgress(p), 250 * (i + 1))
      })
      schedule(() => {
        if (willFail) fail()
        else succeed()
      }, 1500)
    },
    [clearTimers, schedule]
  )

  const isBusy = status === "submitting" || status === "success"

  return { status, progress, isBusy, run, reset, schedule }
}
