import type { en } from "./en"

/** Same nested shape as `en`, but every leaf widened to `string`. */
type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>
}

/** Spanish translations. Mirrors the shape of `en` (enforced by the type). */
export const es: DeepString<typeof en> = {
  common: {
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    create: "Crear",
    new: "Nuevo",
    export: "Exportar",
    search: "Buscar",
    reset: "Restablecer",
    resetToDefaults: "Restablecer valores predeterminados",
    close: "Cerrar",
    confirm: "Confirmar",
    loading: "Cargando…",
    actions: "Acciones",
  },
  nav: {
    groups: {
      courts: "Pistas",
      inventory: "Inventario",
      coaches: "Entrenadores",
      players: "Jugadores",
      tournaments: "Torneos",
    },
    items: {
      dashboard: "Panel",
      reservations: "Reservas",
      inventoryDashboard: "Panel",
      stock: "Stock",
      salesLog: "Registro de ventas",
      coaches: "Entrenadores",
      classes: "Clases",
      players: "Jugadores",
      tournaments: "Torneos",
      settings: "Configuración",
    },
    account: {
      profile: "Perfil",
      signOut: "Cerrar sesión",
      yourClubs: "Tus clubes",
      account: "Cuenta",
    },
  },
  settings: {
    title: "Configuración",
    description:
      "Administra tu club, reservas, notificaciones, usuarios y apariencia.",
    nav: {
      general: "General",
      reservations: "Reservas",
      notifications: "Notificaciones",
      inventory: "Inventario",
      users: "Usuarios",
      clubs: "Clubes",
      ui: "Interfaz",
    },
    ui: {
      title: "Interfaz",
      description:
        "Personaliza el tema, el color de acento y el tamaño del texto.",
      theme: {
        title: "Tema",
        description: "Elige claro, oscuro o sigue tu sistema operativo.",
        light: "Claro",
        dark: "Oscuro",
        system: "Sistema",
      },
      accent: {
        title: "Color de acento",
        description:
          "Se usa en botones principales, resaltados y estados activos.",
      },
      fontSize: {
        title: "Tamaño de fuente",
        description: "Escala el texto y el espaciado en toda la app.",
        small: "Pequeño",
        default: "Predeterminado",
        large: "Grande",
      },
      language: {
        title: "Idioma",
        description: "Elige el idioma usado en toda la app.",
      },
      resetToast: "Apariencia restablecida a los valores predeterminados",
    },
  },
  pages: {
    dashboard: {
      title: "Panel",
      description: "Resumen del club de pádel",
    },
    reservations: {
      title: "Reservas",
      description: "Administra las reservas de pistas.",
    },
    players: {
      title: "Jugadores",
      description: "Administra los socios del club.",
    },
    coaches: {
      title: "Entrenadores",
      description: "Administra los entrenadores del club.",
    },
    classes: {
      title: "Clases",
      description:
        "Sesiones dirigidas por entrenadores y vinculadas a pistas reservadas.",
    },
    stock: {
      title: "Stock",
      manage: "Administra los niveles de stock.",
      clickToEdit: "Haz clic en una cantidad para editarla.",
      threshold:
        "Se resaltan los artículos con {{threshold}} unidades o menos.",
    },
    inventoryDashboard: {
      title: "Panel de ventas",
      description: "Resumen de ventas de productos de esta semana.",
    },
    salesLog: {
      title: "Registro de ventas",
      description: "Haz clic en una fila para ver sus líneas.",
    },
    tournaments: {
      title: "Torneos",
      description: "Administra los torneos del club.",
    },
  },
}
