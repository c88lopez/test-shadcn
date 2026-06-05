import { useEffect, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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

export const stockItemNames = [
  "Water Bottle (500ml)",
  "Energy Drink",
  "Sports Juice",
  "Isotonic Drink",
  "Padel Racket (Basic)",
  "Padel Racket (Pro)",
  "Ball Pack (3 units)",
  "Overgrip Tape",
  "Wristband",
  "Sports Towel",
  "Padel Bag",
  "Sports Socks",
]

const lineItemSchema = z.object({
  item: z.string().min(1, "Item is required"),
  quantity: z.coerce.number().int().positive("Must be at least 1"),
  unitPrice: z.coerce.number().positive("Price must be greater than 0"),
})

const schema = z.object({
  date: z.date({ error: "Date is required" }),
  items: z.array(lineItemSchema).min(1, "Add at least one item"),
})

type FormValues = z.infer<typeof schema>
type FormInput = Omit<FormValues, "date"> & { date?: Date }

export function NewSaleDrawer({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const currencySymbol = getCurrencySymbol()

  const { status, progress, run, reset, schedule } = useSubmitLifecycle()

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      items: [{ item: "", quantity: 1, unitPrice: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  useEffect(() => {
    if (open) {
      form.reset({ items: [{ item: "", quantity: 1, unitPrice: 0 }] })
      reset()
    }
  }, [open, form, reset])

  function onSubmit(values: FormInput) {
    // PoC: type "fail" anywhere in the form to exercise the error path.
    run({
      willFail: JSON.stringify(values).toLowerCase().includes("fail"),
      onSuccess: () => {
        console.log("New sale:", values)
        const count = values.items.length
        toast.success("Sale recorded", {
          description: `${count} ${count === 1 ? "item" : "items"} have been saved.`,
        })
        schedule(() => setOpen(false), 900)
      },
      onError: () => {
        toast.error("Something went wrong", {
          description: "The sale could not be saved. Please try again.",
        })
      },
    })
  }

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>New Sale</DrawerTitle>
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

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Items</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ item: "", quantity: 1, unitPrice: 0 })
                  }
                >
                  <IconPlus className="size-3.5" />
                  Add Item
                </Button>
              </div>

              {fields.map((fieldItem, index) => (
                <div
                  key={fieldItem.id}
                  className="flex flex-col gap-3 rounded-md border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Item {index + 1}
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
                    name={`items.${index}.item`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stockItemNames.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
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
                          <FormLabel>Qty</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="1"
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
                          <FormLabel>Unit Price ({currencySymbol})</FormLabel>
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
                label="Record Sale"
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
