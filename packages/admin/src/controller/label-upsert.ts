import { createServerFn } from "@tanstack/react-start"
import z from "zod"
import { upsertLabel } from "../infrastructure/db/upsert-label.js"
import { LabelUpsertFormSchema } from "./label-upsert-schema.js"

const LabelUpsertServerFnSchema = z.object({
  labelId: z.string().nullable(),
  raw: LabelUpsertFormSchema,
})

export const upsertLabelController = createServerFn({ method: "POST" })
  .inputValidator(LabelUpsertServerFnSchema)
  .handler(async ({ data }) => {
    const id = data.labelId ?? crypto.randomUUID()

    await upsertLabel(id, {
      label: data.raw.label,
      color: data.raw.color,
    }).catch(console.error)
  })
