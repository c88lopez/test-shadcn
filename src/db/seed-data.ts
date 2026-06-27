import type {
  NewCoach,
  NewPlayer,
  NewStockItem,
  NewTournament,
} from "@/db/schema"

// Initial player roster used to seed an empty database. Mirrors the data that
// previously lived inline in the Players route.
export const seedPlayers: Omit<NewPlayer, "id" | "createdAt" | "clubId">[] = [
  {
    fullName: "Carlos López",
    email: "carlos.lopez@email.com",
    phone: "+34 623 456 789",
    age: 35,
    gender: "Male",
    category: "C6",
  },
  {
    fullName: "Pedro Sánchez",
    email: "pedro.sanchez@email.com",
    phone: "+34 645 678 901",
    age: 41,
    gender: "Male",
    category: "C5",
  },
  {
    fullName: "Diego Ruiz",
    email: "diego.ruiz@email.com",
    phone: "+34 667 890 123",
    age: 25,
    gender: "Male",
    category: "C8",
  },
  {
    fullName: "Javier Moreno",
    email: "javier.moreno@email.com",
    phone: "+34 689 012 345",
    age: 38,
    gender: "Male",
    category: "C5",
  },
  {
    fullName: "Miguel Álvarez",
    email: "miguel.alvarez@email.com",
    phone: "+34 601 234 567",
    age: 45,
    gender: "Male",
    category: "C4",
  },
  {
    fullName: "Antonio Díaz",
    email: "antonio.diaz@email.com",
    phone: "+34 623 456 780",
    age: 52,
    gender: "Male",
    category: "C7",
  },
  {
    fullName: "Francisco Pérez",
    email: "francisco.perez@email.com",
    phone: "+34 645 678 902",
    age: 24,
    gender: "Male",
    category: "C8",
  },
  {
    fullName: "Roberto Martín",
    email: "roberto.martin@email.com",
    phone: "+34 667 890 124",
    age: 43,
    gender: "Male",
    category: "C5",
  },
  {
    fullName: "Alejandro Castro",
    email: "alex.castro@email.com",
    phone: "+34 689 012 346",
    age: 39,
    gender: "Male",
    category: "C4",
  },
  {
    fullName: "Sergio Navarro",
    email: "sergio.navarro@email.com",
    phone: "+34 611 223 344",
    age: 31,
    gender: "Male",
    category: "C6",
  },
  {
    fullName: "Maria García",
    email: "maria.garcia@email.com",
    phone: "+34 612 345 678",
    age: 28,
    gender: "Female",
    category: "D6",
  },
  {
    fullName: "Ana Martínez",
    email: "ana.martinez@email.com",
    phone: "+34 634 567 890",
    age: 22,
    gender: "Female",
    category: "D8",
  },
  {
    fullName: "Laura Fernández",
    email: "laura.fernandez@email.com",
    phone: "+34 656 789 012",
    age: 30,
    gender: "Female",
    category: "D7",
  },
  {
    fullName: "Sofía Torres",
    email: "sofia.torres@email.com",
    phone: "+34 678 901 234",
    age: 33,
    gender: "Female",
    category: "D4",
  },
  {
    fullName: "Isabel Jiménez",
    email: "isabel.jimenez@email.com",
    phone: "+34 690 123 456",
    age: 27,
    gender: "Female",
    category: "D6",
  },
  {
    fullName: "Elena Romero",
    email: "elena.romero@email.com",
    phone: "+34 612 345 679",
    age: 29,
    gender: "Female",
    category: "D8",
  },
  {
    fullName: "Carmen López",
    email: "carmen.lopez@email.com",
    phone: "+34 634 567 891",
    age: 31,
    gender: "Female",
    category: "D5",
  },
  {
    fullName: "Lucía González",
    email: "lucia.gonzalez@email.com",
    phone: "+34 656 789 013",
    age: 36,
    gender: "Female",
    category: "D4",
  },
  {
    fullName: "Patricia Sanz",
    email: "patricia.sanz@email.com",
    phone: "+34 678 901 235",
    age: 26,
    gender: "Female",
    category: "D7",
  },
  {
    fullName: "Marta Iglesias",
    email: "marta.iglesias@email.com",
    phone: "+34 699 334 455",
    age: 34,
    gender: "Female",
    category: "D5",
  },
]

// Reservations to seed for "today" (the `date` is filled in at seed time).
// No two share a court+time, so they satisfy conflict detection. `court` is the
// court number, mapped to a court id at seed time.
export interface ReservationSeed {
  court: number
  player: string
  bookedBy: string
  startTime: string
  durationMinutes: number
  paymentStatus: string
}

export const reservationSeeds: ReservationSeed[] = [
  {
    court: 1,
    player: "Maria García",
    bookedBy: "Admin",
    startTime: "09:00",
    durationMinutes: 90,
    paymentStatus: "paid",
  },
  {
    court: 3,
    player: "Carlos López",
    bookedBy: "Carlos López",
    startTime: "10:00",
    durationMinutes: 60,
    paymentStatus: "unpaid",
  },
  {
    court: 2,
    player: "Ana Martínez",
    bookedBy: "Admin",
    startTime: "11:00",
    durationMinutes: 90,
    paymentStatus: "paid",
  },
  {
    court: 1,
    player: "Pedro Sánchez",
    bookedBy: "Pedro Sánchez",
    startTime: "12:00",
    durationMinutes: 90,
    paymentStatus: "paid",
  },
  {
    court: 4,
    player: "Laura Fernández",
    bookedBy: "Admin",
    startTime: "16:00",
    durationMinutes: 90,
    paymentStatus: "unpaid",
  },
  {
    court: 2,
    player: "Diego Ruiz",
    bookedBy: "Diego Ruiz",
    startTime: "18:00",
    durationMinutes: 90,
    paymentStatus: "paid",
  },
  {
    court: 5,
    player: "Sofía Torres",
    bookedBy: "Admin",
    startTime: "08:00",
    durationMinutes: 90,
    paymentStatus: "paid",
  },
  {
    court: 6,
    player: "Javier Moreno",
    bookedBy: "Javier Moreno",
    startTime: "09:30",
    durationMinutes: 90,
    paymentStatus: "unpaid",
  },
  {
    court: 3,
    player: "Isabel Jiménez",
    bookedBy: "Admin",
    startTime: "13:00",
    durationMinutes: 90,
    paymentStatus: "paid",
  },
  {
    court: 1,
    player: "Miguel Álvarez",
    bookedBy: "Miguel Álvarez",
    startTime: "15:00",
    durationMinutes: 90,
    paymentStatus: "paid",
  },
  {
    court: 4,
    player: "Elena Romero",
    bookedBy: "Admin",
    startTime: "17:30",
    durationMinutes: 90,
    paymentStatus: "unpaid",
  },
  {
    court: 2,
    player: "Antonio Díaz",
    bookedBy: "Antonio Díaz",
    startTime: "19:30",
    durationMinutes: 90,
    paymentStatus: "paid",
  },
  {
    court: 6,
    player: "Carmen López",
    bookedBy: "Admin",
    startTime: "11:00",
    durationMinutes: 90,
    paymentStatus: "paid",
  },
  {
    court: 5,
    player: "Francisco Pérez",
    bookedBy: "Francisco Pérez",
    startTime: "14:00",
    durationMinutes: 90,
    paymentStatus: "unpaid",
  },
  {
    court: 3,
    player: "Lucía González",
    bookedBy: "Admin",
    startTime: "20:00",
    durationMinutes: 90,
    paymentStatus: "paid",
  },
]

// Initial stock catalogue used to seed an empty database. Mirrors the data that
// previously lived inline in the inventory mock.
// Thresholds vary by item: fast-moving drinks need a higher reorder point than
// pricey rackets that sell a few units at a time.
export const stockSeeds: Omit<NewStockItem, "id" | "createdAt" | "clubId">[] = [
  {
    name: "Water Bottle (500ml)",
    category: "Drinks",
    price: 1.5,
    stock: 120,
    lowStockThreshold: 40,
  },
  {
    name: "Energy Drink",
    category: "Drinks",
    price: 2.5,
    stock: 48,
    lowStockThreshold: 24,
  },
  {
    name: "Sports Juice",
    category: "Drinks",
    price: 2.0,
    stock: 60,
    lowStockThreshold: 24,
  },
  {
    name: "Isotonic Drink",
    category: "Drinks",
    price: 2.2,
    stock: 35,
    lowStockThreshold: 24,
  },
  {
    name: "Padel Racket (Basic)",
    category: "Equipment",
    price: 49.99,
    stock: 8,
    lowStockThreshold: 3,
  },
  {
    name: "Padel Racket (Pro)",
    category: "Equipment",
    price: 149.99,
    stock: 4,
    lowStockThreshold: 2,
  },
  {
    name: "Ball Pack (3 units)",
    category: "Equipment",
    price: 6.99,
    stock: 55,
    lowStockThreshold: 20,
  },
  {
    name: "Overgrip Tape",
    category: "Accessories",
    price: 3.5,
    stock: 80,
    lowStockThreshold: 15,
  },
  {
    name: "Wristband",
    category: "Accessories",
    price: 4.0,
    stock: 40,
    lowStockThreshold: 10,
  },
  {
    name: "Sports Towel",
    category: "Accessories",
    price: 8.99,
    stock: 22,
    lowStockThreshold: 8,
  },
  {
    name: "Padel Bag",
    category: "Equipment",
    price: 34.99,
    stock: 6,
    lowStockThreshold: 3,
  },
  {
    name: "Sports Socks",
    category: "Accessories",
    price: 5.99,
    stock: 50,
    lowStockThreshold: 12,
  },
]

// Historical sales to seed. `daysAgo` is resolved to a date at seed time. These
// are recorded as history only; the stock levels above are treated as current.
export interface SaleSeedLine {
  item: string
  quantity: number
  unitPrice: number
}

export interface SaleSeed {
  daysAgo: number
  items: SaleSeedLine[]
}

export const coachSeeds: Omit<NewCoach, "id" | "createdAt" | "clubId">[] = [
  { name: "Marcos Delgado", phone: "+34 611 234 567", birthday: "1985-03-12" },
  { name: "Elena Vidal", phone: "+34 622 345 678", birthday: "1990-07-24" },
  { name: "Rubén Fernández", phone: "+34 633 456 789", birthday: "1988-11-05" },
  { name: "Patricia Ríos", phone: "+34 644 567 890", birthday: "1993-02-18" },
  { name: "Jorge Salinas", phone: "+34 655 678 901", birthday: "1979-09-30" },
]

// Classes to seed. `coach` is resolved to a coach id and `offsetDays` to a date
// (relative to today) at seed time, giving a spread of past/current/future
// sessions so the derived status shows a mix of Completed/Ongoing/Upcoming.
export interface ClassSeed {
  coach: string
  court: number
  offsetDays: number
  startTime: string
  durationMinutes: number
}

export const classSeeds: ClassSeed[] = [
  {
    coach: "Marcos Delgado",
    court: 1,
    offsetDays: -2,
    startTime: "09:00",
    durationMinutes: 90,
  },
  {
    coach: "Elena Vidal",
    court: 3,
    offsetDays: -1,
    startTime: "10:30",
    durationMinutes: 60,
  },
  {
    coach: "Rubén Fernández",
    court: 5,
    offsetDays: 0,
    startTime: "12:00",
    durationMinutes: 90,
  },
  {
    coach: "Patricia Ríos",
    court: 2,
    offsetDays: 0,
    startTime: "18:00",
    durationMinutes: 60,
  },
  {
    coach: "Jorge Salinas",
    court: 4,
    offsetDays: 1,
    startTime: "10:00",
    durationMinutes: 120,
  },
  {
    coach: "Marcos Delgado",
    court: 6,
    offsetDays: 2,
    startTime: "17:00",
    durationMinutes: 90,
  },
]

export const saleSeeds: SaleSeed[] = [
  {
    daysAgo: 1,
    items: [
      { item: "Water Bottle (500ml)", quantity: 6, unitPrice: 1.5 },
      { item: "Energy Drink", quantity: 3, unitPrice: 2.5 },
    ],
  },
  {
    daysAgo: 1,
    items: [{ item: "Ball Pack (3 units)", quantity: 2, unitPrice: 6.99 }],
  },
  {
    daysAgo: 2,
    items: [
      { item: "Overgrip Tape", quantity: 4, unitPrice: 3.5 },
      { item: "Padel Racket (Basic)", quantity: 1, unitPrice: 49.99 },
      { item: "Water Bottle (500ml)", quantity: 8, unitPrice: 1.5 },
    ],
  },
  {
    daysAgo: 3,
    items: [
      { item: "Sports Juice", quantity: 5, unitPrice: 2.0 },
      { item: "Isotonic Drink", quantity: 4, unitPrice: 2.2 },
      { item: "Sports Towel", quantity: 2, unitPrice: 8.99 },
    ],
  },
  {
    daysAgo: 4,
    items: [
      { item: "Padel Racket (Pro)", quantity: 1, unitPrice: 149.99 },
      { item: "Ball Pack (3 units)", quantity: 3, unitPrice: 6.99 },
    ],
  },
  {
    daysAgo: 5,
    items: [
      { item: "Energy Drink", quantity: 6, unitPrice: 2.5 },
      { item: "Padel Bag", quantity: 1, unitPrice: 34.99 },
    ],
  },
  {
    daysAgo: 6,
    items: [
      { item: "Sports Socks", quantity: 4, unitPrice: 5.99 },
      { item: "Wristband", quantity: 3, unitPrice: 4.0 },
    ],
  },
]

// Tournaments to seed. `offsetDays` is relative to seed time, mapped to a date.
export interface TournamentSeed extends Omit<
  NewTournament,
  "id" | "createdAt" | "clubId" | "date"
> {
  offsetDays: number
}

export const tournamentSeeds: TournamentSeed[] = [
  {
    name: "Summer Open 2026",
    offsetDays: 14,
    category: "C5",
    format: "elimination",
    maxTeams: 16,
  },
  {
    name: "Mixed Doubles Cup",
    offsetDays: 30,
    category: "Mixed",
    format: "round_robin",
    maxTeams: 8,
  },
  {
    name: "Club Championship",
    offsetDays: 45,
    category: "C4",
    format: "double_elimination",
    maxTeams: 32,
  },
]
