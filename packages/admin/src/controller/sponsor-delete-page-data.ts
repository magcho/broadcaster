import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import z from "zod"
import { verifySession } from "../libs/better-auth/server.js"
import { getSponsorController } from "./sponsor-get.js"

const SponsorDeletePageDataSchema = z.object({
  sponsorId: z.string().uuid(),
})

export const getSponsorDeletePageDataController = createServerFn({
  method: "GET",
})
  .inputValidator(SponsorDeletePageDataSchema)
  .handler(async ({ data }) => {
    await verifySession(getRequestHeaders())
    return {
      sponsor: await getSponsorController(data.sponsorId).catch(() => null),
    }
  })
