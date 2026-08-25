import { createServerFn } from "@tanstack/react-start"
import z from "zod"
import { deleteSponsors } from "../infrastructure/db/delete-sponsors.js"

const SponsorDeleteSchema = z.string().uuid()

export const deleteSponsorController = createServerFn({ method: "POST" })
  .inputValidator(SponsorDeleteSchema)
  .handler(async ({ data: sponsorId }) => {
    return await deleteSponsors([sponsorId])
  })
