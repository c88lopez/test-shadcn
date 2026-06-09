export interface SaleLineItem {
  item: string
  quantity: number
  unitPrice: number
}

export interface Sale {
  id: string
  date: string
  soldBy?: string
  items: SaleLineItem[]
}

export function saleTotal(sale: Pick<Sale, "items">): number {
  return sale.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
}
