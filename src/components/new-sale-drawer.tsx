import { useEffect, useMemo, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { zodFormResolver } from "@/lib/form"
import { z } from "zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { IconCalendar, IconPlus, IconTrash } from "@tabler/icons-react"
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
import { getCurrencySymbol } from "@/lib/app-settings"
import { createSale } from "@/lib/sales.functions"
import { translateError } from "@/lib/errors"
import type { StockItem } from "@/db/schema"

function makeSchema(t: TFunction) {
  const lineItemSchema = z.object({
    stockItemId: z.string().min(1, t("validation.itemRequired")),
    quantity: z.coerce.number().int().positive(t("validation.minQuantity")),
    unitPrice: z.coerce.number().positive(t("validation.pricePositive")),
  })

  return z.object({
    date: z.date({ error: t("validation.dateRequired") }),
    items: z.array(lineItemSchema).min(1, t("validation.minOneItem")),
  })
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>
type FormInput = Omit<FormValues, "date"> & { date?: Date }

const EMPTY_LINE = { stockItemId: "", quantity: 1, unitPrice: 0 }

interface Props {
  trigger: React.ReactNode
  stockItems: StockItem[]
  onSaved?: () => void
}

export function NewSaleDrawer({ trigger, stockItems, onSaved }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const currencySymbol = getCurrencySymbol()

  const { status, progress, run, reset, schedule } = useSubmitLifecycle()
  const schema = useMemo(() => makeSchema(t), [t])

  const form = useForm<FormInput>({
    resolver: zodFormResolver<FormInput>(schema),
    defaultValues: { items: [{ ...EMPTY_LINE }] },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  useEffect(() => {
    if (open) {
      form.reset({ items: [{ ...EMPTY_LINE }] })
      reset()
    }
  }, [open, form, reset])

  function onSubmit(values: FormInput) {
    const payload = {
      date: format(values.date as Date, "yyyy-MM-dd"),
      items: values.items.map((i) => ({
        stockItemId: i.stockItemId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    }
    run({
      action: () => createSale({ data: payload }),
      onSuccess: () => {
        const count = values.items.length
        toast.success(t("forms.sale.recorded"), {
          description:
            count === 1
              ? t("forms.sale.recordedOne", { count })
              : t("forms.sale.recordedOther", { count }),
        })
        onSaved?.()
        schedule(() => setOpen(false), 900)
      },
      onError: (error) => {
        toast.error(t("common.genericError"), {
          description: translateError(
            error,
            t,
            t("forms.sale.errorDescription")
          ),
        })
      },
    })
  }

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("forms.sale.title")}</DrawerTitle>
        </DrawerHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2"
          >
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
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t("forms.sale.items")}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ ...EMPTY_LINE })}
                >
                  <IconPlus className="size-3.5" />
                  {t("forms.sale.addItem")}
                </Button>
              </div>

              {fields.map((fieldItem, index) => (
                <div
                  key={fieldItem.id}
                  className="flex flex-col gap-3 rounded-md border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t("forms.sale.itemN", { n: index + 1 })}
                    </span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-destructive hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <IconTrash className="size-3.5" />
                      </Button>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name={`items.${index}.stockItemId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("fields.product")}</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            // Pre-fill the unit price from the selected product.
                            const product = stockItems.find(
                              (s) => s.id === value
                            )
                            if (product) {
                              form.setValue(
                                `items.${index}.unitPrice`,
                                product.price
                              )
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("placeholders.selectProduct")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stockItems.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {t("forms.sale.productInStock", {
                                  name: product.name,
                                  stock: product.stock,
                                })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("fields.qty")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder={t("forms.sale.qtyPlaceholder")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("forms.sale.unitPriceLabel", {
                              symbol: currencySymbol,
                            })}
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
                  </div>
                </div>
              ))}
            </div>

            <DrawerFooter className="px-0 pt-4">
              <DrawerSubmitButton
                status={status}
                progress={progress}
                label={t("forms.sale.submit")}
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
