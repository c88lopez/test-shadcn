import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { zodFormResolver } from "@/lib/form"
import { translateError } from "@/lib/errors"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function makeSchema(t: TFunction) {
  return z.object({
    name: z.string().min(1, t("validation.nameRequired")),
    status: z.enum(["active", "inactive"]),
  })
}

type FormInput = z.infer<ReturnType<typeof makeSchema>>

export interface ClubFormData {
  name: string
  status: "active" | "inactive"
}

interface Props {
  trigger?: React.ReactNode
  club?: ClubFormData
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSave?: (data: ClubFormData) => Promise<void>
}

export function NewClubDrawer({
  trigger,
  club,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSave,
}: Props) {
  const { t } = useTranslation()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen
  const isEditing = !!club

  const { status, progress, run, reset, schedule } = useSubmitLifecycle()
  const schema = useMemo(() => makeSchema(t), [t])

  const blankClub: FormInput = { name: "", status: "active" }
  const form = useForm<FormInput>({
    resolver: zodFormResolver<FormInput>(schema),
    defaultValues: club ?? blankClub,
  })

  useEffect(() => {
    if (open) {
      form.reset(club ?? blankClub)
      reset()
    }
  }, [open, club])

  function onSubmit(values: FormInput) {
    run({
      action: () => onSave?.(values) ?? Promise.resolve(),
      onSuccess: () => {
        toast.success(
          isEditing ? t("forms.club.updated") : t("forms.club.created"),
          {
            description: t("common.savedSuccess", { name: values.name }),
          }
        )
        schedule(() => setOpen(false), 900)
      },
      onError: (error) => {
        toast.error(t("forms.club.errorTitle"), {
          description: translateError(
            error,
            t,
            t("forms.club.errorDescription")
          ),
        })
      },
    })
  }

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {isEditing ? t("forms.club.titleEdit") : t("forms.club.titleNew")}
          </DrawerTitle>
        </DrawerHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.club.nameLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("forms.club.namePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.status")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("placeholders.selectStatus")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">
                        {t("options.active")}
                      </SelectItem>
                      <SelectItem value="inactive">
                        {t("options.inactive")}
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
                    : t("forms.club.submitNew")
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
