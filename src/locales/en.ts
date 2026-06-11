/**
 * English translations (source of truth). When adding a key here, mirror it in
 * every other locale file so `Resources` stays exhaustive and type-checked.
 */
export const en = {
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    new: "New",
    export: "Export",
    search: "Search",
    reset: "Reset",
    resetToDefaults: "Reset to defaults",
    close: "Close",
    confirm: "Confirm",
    loading: "Loading…",
    actions: "Actions",
  },
  nav: {
    groups: {
      courts: "Courts",
      inventory: "Inventory",
      coaches: "Coaches",
      players: "Players",
      tournaments: "Tournaments",
    },
    items: {
      dashboard: "Dashboard",
      reservations: "Reservations",
      inventoryDashboard: "Dashboard",
      stock: "Stock",
      salesLog: "Sales Log",
      coaches: "Coaches",
      classes: "Classes",
      players: "Players",
      tournaments: "Tournaments",
      settings: "Settings",
    },
    account: {
      profile: "Profile",
      signOut: "Sign out",
      yourClubs: "Your clubs",
      account: "Account",
    },
  },
  settings: {
    title: "Settings",
    description:
      "Manage your club, reservations, notifications, users and appearance.",
    nav: {
      general: "General",
      reservations: "Reservations",
      notifications: "Notifications",
      inventory: "Inventory",
      users: "Users",
      clubs: "Clubs",
      ui: "UI",
    },
    ui: {
      title: "UI",
      description: "Customize the theme, accent color and text size.",
      theme: {
        title: "Theme",
        description: "Choose light, dark, or match your operating system.",
        light: "Light",
        dark: "Dark",
        system: "System",
      },
      accent: {
        title: "Accent color",
        description: "Used for primary buttons, highlights and active states.",
      },
      fontSize: {
        title: "Font size",
        description: "Scales text and spacing across the whole app.",
        small: "Small",
        default: "Default",
        large: "Large",
      },
      language: {
        title: "Language",
        description: "Choose the language used across the app.",
      },
      resetToast: "Appearance reset to defaults",
    },
  },
  pages: {
    dashboard: {
      title: "Dashboard",
      description: "Padel club overview",
    },
    reservations: {
      title: "Reservations",
      description: "Manage court reservations.",
    },
    players: {
      title: "Players",
      description: "Manage club members.",
    },
    coaches: {
      title: "Coaches",
      description: "Manage club coaches.",
    },
    classes: {
      title: "Classes",
      description: "Coach-led sessions linked to reserved courts.",
    },
    stock: {
      title: "Stock",
      manage: "Manage stock levels.",
      clickToEdit: "Click a count to edit it.",
      threshold: "Items at or below {{threshold}} units are highlighted.",
    },
    inventoryDashboard: {
      title: "Sales Dashboard",
      description: "Product sales overview for this week.",
    },
    salesLog: {
      title: "Sales Log",
      description: "Click a row to expand its line items.",
    },
    tournaments: {
      title: "Tournaments",
      description: "Manage club tournaments.",
    },
  },
} as const
