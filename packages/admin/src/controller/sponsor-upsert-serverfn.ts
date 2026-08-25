import { createServerFn } from "@tanstack/react-start"
import z from "zod"
import { upsertSponsorController } from "./sponsor-upsert.js"
import { SponsorUpsertFormSchema } from "./sponsor-upsert-schema.js"

const SponsorUpsertServerFnSchema = z.object({
  rawId: z.string().nullable(),
  raw: SponsorUpsertFormSchema,
})

export const upsertSponsorControllerFn = createServerFn({ method: "POST" })
  .inputValidator(SponsorUpsertServerFnSchema)
  .handler(async ({ data }) => {
    return await upsertSponsorController(data.rawId, data.raw)
  })
