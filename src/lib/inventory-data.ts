/** Shared mock stock data so the Stock page and notifications can read it. */

import type { StockItemData } from "@/components/new-stock-item-drawer"

export interface StockItem extends StockItemData {
  id: number
}

export const stockItems: StockItem[] = [
  {
    id: 1,
    name: "Water Bottle (500ml)",
    category: "Drinks",
    price: 1.5,
    stock: 120,
  },
  { id: 2, name: "Energy Drink", category: "Drinks", price: 2.5, stock: 48 },
  { id: 3, name: "Sports Juice", category: "Drinks", price: 2.0, stock: 60 },
  { id: 4, name: "Isotonic Drink", category: "Drinks", price: 2.2, stock: 35 },
  {
    id: 5,
    name: "Padel Racket (Basic)",
    category: "Equipment",
    price: 49.99,
    stock: 8,
  },
  {
    id: 6,
    name: "Padel Racket (Pro)",
    category: "Equipment",
    price: 149.99,
    stock: 4,
  },
  {
    id: 7,
    name: "Ball Pack (3 units)",
    category: "Equipment",
    price: 6.99,
    stock: 55,
  },
  {
    id: 8,
    name: "Overgrip Tape",
    category: "Accessories",
    price: 3.5,
    stock: 80,
  },
  { id: 9, name: "Wristband", category: "Accessories", price: 4.0, stock: 40 },
  {
    id: 10,
    name: "Sports Towel",
    category: "Accessories",
    price: 8.99,
    stock: 22,
  },
  { id: 11, name: "Padel Bag", category: "Equipment", price: 34.99, stock: 6 },
  {
    id: 12,
    name: "Sports Socks",
    category: "Accessories",
    price: 5.99,
    stock: 50,
  },
]
