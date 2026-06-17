import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { NewPlayerDrawer } from "./new-player-drawer"
import { createPlayer, updatePlayer } from "@/lib/players.functions"

// `vaul` reads computed transforms on pointer events and crashes under jsdom;
// swap the drawer shell for passthroughs so we test the form inside it.
vi.mock("@/components/ui/drawer", () => {
  const Pass = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  return {
    Drawer: Pass,
    DrawerTrigger: Pass,
    DrawerContent: Pass,
    DrawerHeader: Pass,
    DrawerTitle: Pass,
    DrawerFooter: Pass,
    DrawerClose: Pass,
  }
})

vi.mock("@/lib/players.functions", () => ({
  createPlayer: vi.fn(() => Promise.resolve({})),
  updatePlayer: vi.fn(() => Promise.resolve({})),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const existingPlayer = {
  id: "player-1",
  fullName: "John Smith",
  email: "john@example.com",
  phone: "+34 600 000 000",
  age: 40,
  gender: "Male" as const,
  category: "C4",
}

describe("NewPlayerDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("validates required fields before creating", async () => {
    const user = userEvent.setup()
    render(<NewPlayerDrawer open onOpenChange={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "Add Player" }))

    expect(await screen.findByText("Full name is required")).toBeInTheDocument()
    expect(createPlayer).not.toHaveBeenCalled()
  })

  it("keeps category disabled until a gender is chosen and scopes its options", async () => {
    const user = userEvent.setup()
    render(<NewPlayerDrawer open onOpenChange={vi.fn()} />)

    const [genderTrigger, categoryTrigger] = screen.getAllByRole("combobox")
    expect(categoryTrigger).toBeDisabled()

    await user.click(genderTrigger)
    await user.click(await screen.findByRole("option", { name: "Female" }))

    const enabledCategory = screen.getAllByRole("combobox")[1]
    expect(enabledCategory).toBeEnabled()

    await user.click(enabledCategory)
    // Female players get the D-series categories, not the male C-series.
    expect(
      await screen.findByRole("option", { name: "D8" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "C8" })).not.toBeInTheDocument()
  })

  it("creates a player with the age coerced to a number", async () => {
    const user = userEvent.setup()
    render(<NewPlayerDrawer open onOpenChange={vi.fn()} />)

    await user.type(screen.getByLabelText("Full Name"), "Jane Doe")
    await user.type(screen.getByLabelText("Email"), "jane@example.com")
    await user.type(screen.getByLabelText("Phone"), "+34 600 111 222")
    await user.type(screen.getByLabelText("Age"), "28")

    const [genderTrigger] = screen.getAllByRole("combobox")
    await user.click(genderTrigger)
    await user.click(await screen.findByRole("option", { name: "Male" }))

    const categoryTrigger = screen.getAllByRole("combobox")[1]
    await user.click(categoryTrigger)
    await user.click(await screen.findByRole("option", { name: "C5" }))

    await user.click(screen.getByRole("button", { name: "Add Player" }))

    await waitFor(() =>
      expect(createPlayer).toHaveBeenCalledWith({
        data: {
          fullName: "Jane Doe",
          email: "jane@example.com",
          phone: "+34 600 111 222",
          age: 28,
          gender: "Male",
          category: "C5",
        },
      })
    )
  })

  it("pre-fills fields when editing and saves via updatePlayer", async () => {
    const user = userEvent.setup()
    render(
      <NewPlayerDrawer open player={existingPlayer} onOpenChange={vi.fn()} />
    )

    expect(screen.getByLabelText("Full Name")).toHaveValue("John Smith")
    expect(screen.getByLabelText("Age")).toHaveValue(40)

    await user.click(screen.getByRole("button", { name: "Save Changes" }))

    await waitFor(() =>
      expect(updatePlayer).toHaveBeenCalledWith({
        data: {
          id: "player-1",
          fullName: "John Smith",
          email: "john@example.com",
          phone: "+34 600 000 000",
          age: 40,
          gender: "Male",
          category: "C4",
        },
      })
    )
    expect(createPlayer).not.toHaveBeenCalled()
  })
})
