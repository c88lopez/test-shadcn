import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { zodFormResolver } from "@/lib/form"
import { z } from "zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { IconCalendar } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { DrawerSubmitButton } from "@/components/drawer-submit-button"
import { useSubmitLifecycle } from "@/hooks/use-submit-lifecycle"
import { useAppSettings } from "@/lib/app-settings"
import {
  createReservation,
  updateReservation,
} from "@/lib/reservations.functions"
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

function makeSchema(t: TFunction) {
  return z.object({
    player: z.string().min(1, t("validation.playerRequired")),
    court: z.string().min(1, t("validation.courtRequired")),
    date: z.date({ error: t("validation.dateRequired") }),
    time: z.string().min(1, t("validation.timeRequired")),
    duration: z.string().min(1, t("validation.durationRequired")),
    paymentStatus: z.string().min(1, t("validation.paymentStatusRequired")),
  })
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>
type FormInput = Omit<FormValues, "date"> & { date?: Date }

export interface ReservationData {
  player: string
  court: string
  date: Date
  time: string
  duration: string
  paymentStatus: string
}

interface Props {
  trigger?: React.ReactNode
  reservation?: ReservationData & { id?: string }
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSaved?: () => void
}

export function NewReservationDrawer({
  trigger,
  reservation,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSaved,
}: Props) {
  const { t } = useTranslation()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen
  const isEditing = !!reservation

  const { reservations: reservationSettings } = useAppSettings()
  const courts = reservationSettings.courts.filter((c) => c.active)

  const { status, progress, run, reset, schedule } = useSubmitLifecycle()
  const schema = useMemo(() => makeSchema(t), [t])

  const form = useForm<FormInput>({
    resolver: zodFormResolver<FormInput>(schema),
    defaultValues: reservation ?? {
      player: "",
      court: "",
      time: "",
      duration: "",
      paymentStatus: "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        reservation ?? {
          player: "",
          court: "",
          time: "",
          duration: "",
          paymentStatus: "",
        }
      )
      reset()
    }
  }, [open, reservation, form, reset])

  function onSubmit(values: FormInput) {
    const payload = {
      court: Number(values.court),
      player: values.player,
      date: format(values.date as Date, "yyyy-MM-dd"),
      startTime: values.time,
      durationMinutes: Number(values.duration),
      paymentStatus: values.paymentStatus as "paid" | "partial" | "unpaid",
    }
    run({
      action: () =>
        reservation?.id
          ? updateReservation({ data: { id: reservation.id, ...payload } })
          : createReservation({ data: payload }),
      onSuccess: () => {
        toast.success(
          isEditing
            ? t("forms.reservation.updated")
            : t("forms.reservation.created"),
          {
            description: t("forms.reservation.savedDescription", {
              player: values.player,
            }),
          }
        )
        onSaved?.()
        schedule(() => setOpen(false), 900)
      },
      onError: (error) => {
        const message =
          error instanceof Error
            ? error.message
            : t("forms.reservation.errorDescription")
        toast.error(t("forms.reservation.errorTitle"), { description: message })
      },
    })
  }

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {isEditing
              ? t("forms.reservation.titleEdit")
              : t("forms.reservation.titleNew")}
          </DrawerTitle>
        </DrawerHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2"
          >
            <FormField
              control={form.control}
              name="player"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.player")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("forms.reservation.playerPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="court"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.court")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("placeholders.selectCourt")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courts.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.date")}</FormLabel>
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
                            : t("common.pickDate")}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.startTime")}</FormLabel>
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
                  <FormLabel>{t("fields.duration")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("placeholders.selectDuration")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="60">{t("options.oneHour")}</SelectItem>
                      <SelectItem value="90">
                        {t("options.onePointFiveHours")}
                      </SelectItem>
                      <SelectItem value="120">
                        {t("options.twoHours")}
                      </SelectItem>
                      <SelectItem value="150">
                        {t("options.twoPointFiveHours")}
                      </SelectItem>
                      <SelectItem value="180">
                        {t("options.threeHours")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.payment")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("placeholders.selectPaymentStatus")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="paid">{t("options.paid")}</SelectItem>
                      <SelectItem value="partial">
                        {t("options.partiallyPaid")}
                      </SelectItem>
                      <SelectItem value="unpaid">
                        {t("options.unpaid")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DrawerFooter className="px-0 pt-4">
              <DrawerSubmitButton
                status={status}
                progress={progress}
                label={
                  isEditing
                    ? t("common.saveChanges")
                    : t("forms.reservation.submitNew")
                }
              />
              <DrawerClose asChild>
                <Button variant="outline" disabled={status === "submitting"}>
                  {t("common.cancel")}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  )
}
