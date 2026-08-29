import { createServerFn } from "@tanstack/react-start"
import z from "zod"
import { getSponsorController } from "./sponsor-get.js"

const SponsorDeletePageDataSchema = z.object({
  sponsorId: z.uuid(),
})

export const getSponsorDeletePageDataController = createServerFn({
  method: "GET",
})
  .inputValidator(SponsorDeletePageDataSchema)
  .handler(async ({ data }) => {
    return {
      sponsor: await getSponsorController(data.sponsorId).catch(() => null),
    }
  })
