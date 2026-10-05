import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useChat } from "@ai-sdk/react"
import { lastAssistantMessageIsCompleteWithApprovalResponses } from "ai"
import { useTranslation } from "react-i18next"
import {
  IconMessagePlus,
  IconPlayerStopFilled,
  IconSend,
  IconSparkles,
  IconUpload,
  IconX,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface AssistantContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const AssistantContext = createContext<AssistantContextValue | null>(null)

export function useAssistant() {
  const ctx = useContext(AssistantContext)
  if (!ctx)
    throw new Error("useAssistant must be used within AssistantProvider")
  return ctx
}

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const value = useMemo(() => ({ open, setOpen }), [open])
  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  )
}

export function AssistantTrigger() {
  const { t } = useTranslation()
  const { open, setOpen } = useAssistant()
  return (
    <Button
      variant={open ? "secondary" : "ghost"}
      size="icon"
      className="size-8"
      title={`${t("assistant.open")} (⌘J)`}
      aria-expanded={open}
      onClick={() => setOpen(!open)}
    >
      <IconSparkles className="size-4" />
      <span className="sr-only">{t("assistant.open")}</span>
    </Button>
  )
}

// Minimal shape of a tool UI part we render (avoids deep SDK generics).
interface ToolPart {
  type: string
  toolCallId: string
  state: string
  input?: unknown
  output?: unknown
  errorText?: string
  approval?: { id: string; isAutomatic?: boolean }
}

interface PlayerRow {
  id: string
  fullName: string
  phone: string
  age: number
  gender: string
  category: string
}

function PlayersResult({ output }: { output: unknown }) {
  const { t } = useTranslation()
  const data = output as
    | { ok?: boolean; error?: string; count?: number; players?: PlayerRow[] }
    | undefined
  if (!data || !data.players) {
    return (
      <p className="mt-2 text-xs text-destructive">
        {data?.error ?? t("assistant.error")}
      </p>
    )
  }
  const players = data.players
  return (
    <div className="mt-2 overflow-x-auto rounded-md border">
      <div className="px-3 py-2 text-xs text-muted-foreground">
        {t("assistant.playersFound", {
          count: data.count ?? players.length,
        })}
      </div>
      {players.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.fullName")}</TableHead>
              <TableHead>{t("fields.age")}</TableHead>
              <TableHead>{t("fields.category")}</TableHead>
              <TableHead>{t("fields.phone")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.fullName}</TableCell>
                <TableCell>{p.age}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{p.phone}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

function ToolPartView({
  part,
  onApprove,
}: {
  part: ToolPart
  onApprove: (id: string, approved: boolean) => void
}) {
  const { t } = useTranslation()
  const toolName = part.type.replace(/^tool-/, "")

  if (part.type === "tool-searchPlayers" && part.state === "output-available") {
    return <PlayersResult output={part.output} />
  }

  if (part.state === "approval-requested" && part.approval) {
    const approval = part.approval
    return (
      <div className="mt-2 rounded-md border border-primary/40 bg-primary/5 p-3">
        <p className="text-sm font-medium">{t("assistant.approveTitle")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{toolName}</p>
        <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-2 text-xs">
          {JSON.stringify(part.input, null, 2)}
        </pre>
        <div className="mt-2 flex gap-2">
          <Button size="sm" onClick={() => onApprove(approval.id, true)}>
            {t("assistant.approve")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onApprove(approval.id, false)}
          >
            {t("assistant.deny")}
          </Button>
        </div>
      </div>
    )
  }

  if (part.state === "output-available") {
    return (
      <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-2 text-xs">
        {JSON.stringify(part.output, null, 2)}
      </pre>
    )
  }

  if (part.state === "output-error") {
    return (
      <p className="mt-2 text-xs text-destructive">
        {part.errorText ?? t("assistant.error")}
      </p>
    )
  }

  return (
    <p className="mt-2 text-xs text-muted-foreground">
      {t("assistant.running", { tool: toolName })}
    </p>
  )
}

// Non-modal floating panel: the page behind stays interactive, and the panel
// stays mounted while hidden so the conversation survives closing it and
// navigating between pages.
export function AssistantPanel() {
  const { t } = useTranslation()
  const { open, setOpen } = useAssistant()
  const [input, setInput] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const {
    messages,
    setMessages,
    sendMessage,
    addToolApprovalResponse,
    status,
    stop,
  } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  })

  const busy = status === "submitted" || status === "streaming"

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy])

  function submit() {
    const text = input.trim()
    if (!text || busy) return
    sendMessage({ text })
    setInput("")
  }

  function newChat() {
    void stop()
    setMessages([])
    setInput("")
    inputRef.current?.focus()
  }

  async function onCsvSelected(file: File) {
    const text = await file.text()
    setInput(`${t("assistant.csvPrompt")}\n\n\`\`\`csv\n${text.trim()}\n\`\`\``)
    inputRef.current?.focus()
  }

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-label={t("assistant.title")}
      hidden={!open}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false)
      }}
      className={cn(
        "fixed inset-x-2 bottom-2 z-40 flex h-[min(640px,calc(100svh-4rem))] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[420px]",
        open && "animate-in duration-200 fade-in-0 slide-in-from-bottom-4"
      )}
    >
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <IconSparkles className="size-4 text-primary" />
        <h2 className="flex-1 text-sm font-semibold">{t("assistant.title")}</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          title={t("assistant.newChat")}
          disabled={messages.length === 0}
          onClick={newChat}
        >
          <IconMessagePlus className="size-4" />
          <span className="sr-only">{t("assistant.newChat")}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title={t("assistant.close")}
          onClick={() => setOpen(false)}
        >
          <IconX className="size-4" />
          <span className="sr-only">{t("assistant.close")}</span>
        </Button>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
      >
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t("assistant.empty")}
          </p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                {message.role === "user"
                  ? t("assistant.you")
                  : t("assistant.assistant")}
              </span>
              <div className="mt-1 space-y-1">
                {message.parts.map((part, i) => {
                  if (part.type === "text") {
                    return (
                      <p key={i} className="whitespace-pre-wrap">
                        {part.text}
                      </p>
                    )
                  }
                  if (part.type.startsWith("tool-")) {
                    return (
                      <ToolPartView
                        key={i}
                        part={part as unknown as ToolPart}
                        onApprove={(id, approved) =>
                          addToolApprovalResponse({ id, approved })
                        }
                      />
                    )
                  }
                  return null
                })}
              </div>
            </div>
          ))
        )}
        {busy && (
          <p className="text-xs text-muted-foreground">
            {t("assistant.thinking")}
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex shrink-0 items-center gap-2 border-t p-3"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void onCsvSelected(file)
            e.target.value = ""
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          title={t("assistant.uploadCsv")}
          onClick={() => fileRef.current?.click()}
        >
          <IconUpload className="size-4" />
          <span className="sr-only">{t("assistant.uploadCsv")}</span>
        </Button>
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("assistant.placeholder")}
          className="flex-1"
        />
        {busy ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            title={t("assistant.stop")}
            onClick={() => void stop()}
          >
            <IconPlayerStopFilled className="size-4" />
            <span className="sr-only">{t("assistant.stop")}</span>
          </Button>
        ) : (
          <Button type="submit" size="icon" disabled={!input.trim()}>
            <IconSend className="size-4" />
          </Button>
        )}
      </form>
    </section>
  )
}
