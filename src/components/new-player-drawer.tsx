import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { zodFormResolver } from "@/lib/form"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DrawerSubmitButton } from "@/components/drawer-submit-button"
import { useSubmitLifecycle } from "@/hooks/use-submit-lifecycle"
import { createPlayer, updatePlayer } from "@/lib/players.functions"
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

const maleCategories = ["C8", "C7", "C6", "C5", "C4"] as const
const femaleCategories = ["D8", "D7", "D6", "D5", "D4"] as const

function makeSchema(t: TFunction) {
  return z.object({
    fullName: z.string().min(1, t("validation.fullNameRequired")),
    email: z.string().email(t("validation.emailInvalid")),
    phone: z.string().min(1, t("validation.phoneRequired")),
    age: z.coerce.number().int().min(5).max(99),
    gender: z.enum(["Male", "Female"], {
      error: t("validation.genderRequired"),
    }),
    category: z.string().min(1, t("validation.categoryRequired")),
  })
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>
type FormInput = Omit<FormValues, "age" | "gender"> & {
  age?: number
  gender?: "Male" | "Female"
}

export interface PlayerData {
  fullName: string
  email: string
  phone: string
  age: number
  gender: "Male" | "Female"
  category: string
}

interface Props {
  trigger?: React.ReactNode
  player?: PlayerData & { id?: string }
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSaved?: () => void
}

export function NewPlayerDrawer({
  trigger,
  player,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSaved,
}: Props) {
  const { t } = useTranslation()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen
  const isEditing = !!player

  const { status, progress, run, reset, schedule } = useSubmitLifecycle()
  const schema = useMemo(() => makeSchema(t), [t])

  const form = useForm<FormInput>({
    resolver: zodFormResolver<FormInput>(schema),
    defaultValues: player ?? {
      fullName: "",
      email: "",
      phone: "",
      age: undefined,
      gender: undefined,
      category: "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        player ?? {
          fullName: "",
          email: "",
          phone: "",
          age: undefined,
          gender: undefined,
          category: "",
        }
      )
      reset()
    }
  }, [open, player, form, reset])

  const gender = form.watch("gender")
  const categories = gender === "Female" ? femaleCategories : maleCategories

  function onSubmit(values: FormInput) {
    const payload = {
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      age: values.age as number,
      gender: values.gender as "Male" | "Female",
      category: values.category,
    }
    run({
      action: () =>
        player?.id
          ? updatePlayer({ data: { id: player.id, ...payload } })
          : createPlayer({ data: payload }),
      onSuccess: () => {
        toast.success(
          isEditing ? t("forms.player.updated") : t("forms.player.created"),
          {
            description: t("common.savedSuccess", { name: values.fullName }),
          }
        )
        onSaved?.()
        schedule(() => setOpen(false), 900)
      },
      onError: () => {
        toast.error(t("common.genericError"), {
          description: t("forms.player.errorDescription"),
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
            {isEditing
              ? t("forms.player.titleEdit")
              : t("forms.player.titleNew")}
          </DrawerTitle>
        </DrawerHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2"
          >
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.fullName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("placeholders.fullName")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("forms.player.emailPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.phone")}</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder={t("forms.player.phonePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.age")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="5"
                      max="99"
                      placeholder={t("forms.player.agePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.gender")}</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val)
                      form.setValue("category", "")
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("placeholders.selectGender")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Male">{t("options.male")}</SelectItem>
                      <SelectItem value="Female">
                        {t("options.female")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.category")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!gender}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            gender
                              ? t("placeholders.selectCategory")
                              : t("placeholders.selectGenderFirst")
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
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
                    : t("forms.player.submitNew")
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
