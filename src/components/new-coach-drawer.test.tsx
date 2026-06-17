import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { NewCoachDrawer } from "./new-coach-drawer"
import { createCoach, updateCoach } from "@/lib/coaches.functions"

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

vi.mock("@/lib/coaches.functions", () => ({
  createCoach: vi.fn(() => Promise.resolve({})),
  updateCoach: vi.fn(() => Promise.resolve({})),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe("NewCoachDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("validates required fields before creating", async () => {
    const user = userEvent.setup()
    render(<NewCoachDrawer open onOpenChange={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "Add Coach" }))

    expect(await screen.findByText("Name is required")).toBeInTheDocument()
    expect(createCoach).not.toHaveBeenCalled()
  })

  it("creates a coach without a birthday (sends null)", async () => {
    const user = userEvent.setup()
    render(<NewCoachDrawer open onOpenChange={vi.fn()} />)

    await user.type(screen.getByLabelText("Full Name"), "Coach Carter")
    await user.type(screen.getByLabelText("Phone"), "+34 600 000 000")

    await user.click(screen.getByRole("button", { name: "Add Coach" }))

    await waitFor(() =>
      expect(createCoach).toHaveBeenCalledWith({
        data: {
          name: "Coach Carter",
          phone: "+34 600 000 000",
          birthday: null,
        },
      })
    )
  })

  it("pre-fills fields when editing and formats the birthday on save", async () => {
    const user = userEvent.setup()
    render(
      <NewCoachDrawer
        open
        coach={{
          id: "coach-1",
          name: "Coach K",
          phone: "+34 611 111 111",
          birthday: new Date(1990, 4, 15), // local midnight → 1990-05-15
        }}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText("Full Name")).toHaveValue("Coach K")

    await user.click(screen.getByRole("button", { name: "Save Changes" }))

    await waitFor(() =>
      expect(updateCoach).toHaveBeenCalledWith({
        data: {
          id: "coach-1",
          name: "Coach K",
          phone: "+34 611 111 111",
          birthday: "1990-05-15",
        },
      })
    )
    expect(createCoach).not.toHaveBeenCalled()
  })
})
