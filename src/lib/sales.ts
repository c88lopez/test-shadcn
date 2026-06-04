export interface SaleLineItem {
  item: string
  quantity: number
  unitPrice: number
}

export interface Sale {
  id: number
  date: string
  items: SaleLineItem[]
}

export function saleTotal(sale: Pick<Sale, "items">): number {
  return sale.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
}
