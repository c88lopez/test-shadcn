import { zodResolver } from "@hookform/resolvers/zod"
import type { FieldValues, Resolver } from "react-hook-form"
import type { ZodType } from "zod"

// Our drawers intentionally type their fields looser than the schema's validated
// output (e.g. an optional `date` while the form is still empty). @hookform/resolvers
// v5 enforces the schema's input/output generics, which no longer accepts that
// divergence implicitly. This bridge keeps the resolver wired to the schema while
// presenting it as the form's own field-value shape.
export function zodFormResolver<T extends FieldValues>(
  schema: ZodType
): Resolver<T> {
  return zodResolver(schema as never) as unknown as Resolver<T>
}
