import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import z from "zod"
import { upsertLabel2 } from "../infrastructure/db/upsert-label.js"
import { verifySession } from "../libs/better-auth/server.js"
import { LabelUpsertFormSchema } from "./label-upsert-schema.js"

const LabelUpsertServerFnSchema = z.object({
  labelId: z.string().nullable(),
  raw: LabelUpsertFormSchema,
})

export const upsertLabelController = createServerFn({ method: "POST" })
  .inputValidator(LabelUpsertServerFnSchema)
  .handler(async ({ data }) => {
    await verifySession(getRequestHeaders())

    const id = data.labelId ?? crypto.randomUUID()

    await upsertLabel2(id, {
      label: data.raw.label,
      color: data.raw.color,
    }).catch(console.error)
  })
