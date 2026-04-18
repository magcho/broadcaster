import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import z from "zod"
import { verifySession } from "../libs/better-auth/server.js"
import { upsertSponsorController } from "./sponsor-upsert.js"
import { SponsorUpsertFormSchema } from "./sponsor-upsert-schema.js"

const SponsorUpsertServerFnSchema = z.object({
  rawId: z.string().nullable(),
  raw: SponsorUpsertFormSchema,
})

export const upsertSponsorControllerFn = createServerFn({ method: "POST" })
  .inputValidator(SponsorUpsertServerFnSchema)
  .handler(async ({ data }) => {
    await verifySession(getRequestHeaders())
    return await upsertSponsorController(data.rawId, data.raw)
  })
