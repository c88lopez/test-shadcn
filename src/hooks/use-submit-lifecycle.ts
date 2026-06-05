import { useCallback, useEffect, useRef, useState } from "react"

export type SubmitStatus = "idle" | "submitting" | "success" | "error"

interface RunOptions {
  willFail: boolean
  onSuccess: () => void
  onError: () => void
}

/**
 * PoC submit lifecycle: drives a progress bar and status flags through a
 * simulated async operation (submitting → success | error). Swap `run`'s
 * internals for a real request later; the returned state/UI contract stays the
 * same.
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
    ({ willFail, onSuccess, onError }: RunOptions) => {
      clearTimers()
      setStatus("submitting")
      setProgress(8)
      ;[25, 45, 65, 85].forEach((p, i) => {
        schedule(() => setProgress(p), 250 * (i + 1))
      })
      schedule(() => {
        if (willFail) {
          setProgress(0)
          setStatus("error")
          onError()
          return
        }
        setProgress(100)
        setStatus("success")
        onSuccess()
      }, 1500)
    },
    [clearTimers, schedule]
  )

  const isBusy = status === "submitting" || status === "success"

  return { status, progress, isBusy, run, reset, schedule }
}
