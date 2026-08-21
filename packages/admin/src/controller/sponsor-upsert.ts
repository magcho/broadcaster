import z from "zod"
import { upsertSponsor2 } from "../infrastructure/db/upsert-sponsor.js"
import { SponsorUpsertFormSchema } from "./sponsor-upsert-schema.js"

export const upsertSponsorController = async (
  rawId: string | null,
  raw: z.infer<typeof SponsorUpsertFormSchema>,
) => {
  try {
    const id = z.string().nullable().parse(rawId)
    const input = SponsorUpsertFormSchema.parse(raw)

    const sponsorId = id ?? crypto.randomUUID()
    await upsertSponsor2(sponsorId, input)
    return sponsorId
  } catch (e) {
    console.error(e)
    throw e
  }
}
