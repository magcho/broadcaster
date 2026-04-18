import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import z from "zod"
import { deleteSponsors } from "../infrastructure/db/delete-sponsors.js"
import { verifySession } from "../libs/better-auth/server.js"

const SponsorDeleteSchema = z.string().uuid()

export const deleteSponsorController = createServerFn({ method: "POST" })
  .inputValidator(SponsorDeleteSchema)
  .handler(async ({ data: sponsorId }) => {
    await verifySession(getRequestHeaders())
    return await deleteSponsors([sponsorId])
  })
