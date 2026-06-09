import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodFormResolver } from "@/lib/form"
import { z } from "zod"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import { IconCalendar } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { DrawerSubmitButton } from "@/components/drawer-submit-button"
import { useSubmitLifecycle } from "@/hooks/use-submit-lifecycle"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { createClass, updateClass } from "@/lib/classes.functions"
import type { Coach } from "@/db/schema"

const schema = z.object({
  coachId: z.string().min(1, "Coach is required"),
  court: z.string().min(1, "Court is required"),
  date: z.date({ error: "Date is required" }),
  time: z.string().min(1, "Time is required"),
  duration: z.string().min(1, "Duration is required"),
})

type FormValues = z.infer<typeof schema>
type FormInput = Omit<FormValues, "date"> & { date?: Date }

export interface ClassData {
  id?: string
  coachId: string | null
  court: number
  date: string
  startTime: string
  durationMinutes: number
}

interface Props {
  trigger?: React.ReactNode
  coaches: Coach[]
  coachClass?: ClassData
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSaved?: () => void
}

const EMPTY: FormInput = { coachId: "", court: "", time: "", duration: "" }

function toFormValues(c: ClassData): FormInput {
  return {
    coachId: c.coachId ?? "",
    court: String(c.court),
    date: parseISO(c.date),
    time: c.startTime,
    duration: String(c.durationMinutes),
  }
}

export function NewClassDrawer({
  trigger,
  coaches,
  coachClass,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSaved,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen
  const isEditing = !!coachClass

  const { status, progress, run, reset, schedule } = useSubmitLifecycle()

  const form = useForm<FormInput>({
    resolver: zodFormResolver<FormInput>(schema),
    defaultValues: coachClass ? toFormValues(coachClass) : EMPTY,
  })

  useEffect(() => {
    if (open) {
      form.reset(coachClass ? toFormValues(coachClass) : EMPTY)
      reset()
    }
  }, [open, coachClass, form, reset])

  function onSubmit(values: FormInput) {
    const payload = {
      coachId: values.coachId,
      court: Number(values.court),
      date: format(values.date as Date, "yyyy-MM-dd"),
      startTime: values.time,
      durationMinutes: Number(values.duration),
    }
    run({
      action: () =>
        coachClass?.id
          ? updateClass({ data: { id: coachClass.id, ...payload } })
          : createClass({ data: payload }),
      onSuccess: () => {
        const coachName =
          coaches.find((c) => c.id === values.coachId)?.name ?? "coach"
        toast.success(isEditing ? "Class updated" : "Class scheduled", {
          description: `Class with ${coachName} has been saved.`,
        })
        onSaved?.()
        schedule(() => setOpen(false), 900)
      },
      onError: () => {
        toast.error("Something went wrong", {
          description: "The class could not be saved. Please try again.",
        })
      },
    })
  }

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEditing ? "Edit Class" : "New Class"}</DrawerTitle>
        </DrawerHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2"
          >
            <FormField
              control={form.control}
              name="coachId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coach</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a coach" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {coaches.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="court"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Court</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a court" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          Court {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <IconCalendar className="mr-2 size-4" />
                          {field.value
                            ? format(field.value, "PPP")
                            : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="60">60 min</SelectItem>
                        <SelectItem value="90">90 min</SelectItem>
                        <SelectItem value="120">120 min</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DrawerFooter className="px-0 pt-4">
              <DrawerSubmitButton
                status={status}
                progress={progress}
                label={isEditing ? "Save Changes" : "Schedule Class"}
              />
              <DrawerClose asChild>
                <Button variant="outline" disabled={status === "submitting"}>
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  )
}
