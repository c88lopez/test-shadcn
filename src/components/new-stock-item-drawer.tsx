import { useCallback, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { zodFormResolver } from "@/lib/form"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DrawerSubmitButton } from "@/components/drawer-submit-button"
import { useSubmitLifecycle } from "@/hooks/use-submit-lifecycle"
import { createStockItem, updateStockItem } from "@/lib/inventory.functions"
import { getCurrencySymbol } from "@/lib/app-settings"
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
  FormDescription,
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
    category: z.string().min(1, t("validation.categoryRequired")),
    price: z.coerce.number().positive(t("validation.pricePositive")),
    stock: z.coerce.number().int().min(0, t("validation.stockNonNegative")),
    // Required: an empty field becomes `undefined` (not 0) so it fails as
    // "required" instead of silently defaulting to zero.
    lowStockThreshold: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.coerce
        .number({ message: t("validation.thresholdRequired") })
        .int()
        .min(0, t("validation.thresholdNonNegative"))
    ),
  })
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>
// While editing, the threshold may be empty until the user types a value.
type FormInput = Omit<FormValues, "lowStockThreshold"> & {
  lowStockThreshold?: number
}

export interface StockItemData {
  name: string
  category: string
  price: number
  stock: number
  lowStockThreshold: number
}

interface Props {
  trigger?: React.ReactNode
  item?: StockItemData & { id?: string }
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSaved?: () => void
}

export function NewStockItemDrawer({
  trigger,
  item,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSaved,
}: Props) {
  const { t } = useTranslation()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen
  const isEditing = !!item
  const currencySymbol = getCurrencySymbol()

  const { status, progress, run, reset, schedule } = useSubmitLifecycle()
  const schema = useMemo(() => makeSchema(t), [t])

  const toValues = useCallback(
    (it?: StockItemData): FormInput => ({
      name: it?.name ?? "",
      category: it?.category ?? "",
      price: it?.price ?? 0,
      stock: it?.stock ?? 0,
      // No default — the user must enter a threshold for every new item.
      lowStockThreshold: it?.lowStockThreshold,
    }),
    []
  )

  const form = useForm<FormInput>({
    resolver: zodFormResolver<FormInput>(schema),
    defaultValues: toValues(item),
  })

  useEffect(() => {
    if (open) {
      form.reset(toValues(item))
      reset()
    }
  }, [open, item, form, reset, toValues])

  function onSubmit(values: FormInput) {
    run({
      action: () =>
        item?.id
          ? updateStockItem({ data: { id: item.id, ...values } })
          : createStockItem({ data: values }),
      onSuccess: () => {
        toast.success(
          isEditing ? t("forms.stock.updated") : t("forms.stock.created"),
          {
            description: t("common.savedSuccess", { name: values.name }),
          }
        )
        onSaved?.()
        schedule(() => setOpen(false), 900)
      },
      onError: () => {
        toast.error(t("common.genericError"), {
          description: t("forms.stock.errorDescription"),
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
            {isEditing ? t("forms.stock.titleEdit") : t("forms.stock.titleNew")}
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
                  <FormLabel>{t("fields.productName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("forms.stock.namePlaceholder")}
                      {...field}
                    />
                  </FormControl>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("placeholders.selectCategoryA")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Drinks">
                        {t("options.drinks")}
                      </SelectItem>
                      <SelectItem value="Equipment">
                        {t("options.equipment")}
                      </SelectItem>
                      <SelectItem value="Accessories">
                        {t("options.accessories")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("forms.stock.priceLabel", { symbol: currencySymbol })}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.stock")}</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lowStockThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.lowStockThreshold")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 10"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("forms.stock.thresholdHelp")}
                  </FormDescription>
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
                    : t("forms.stock.submitNew")
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
