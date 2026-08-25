import { createServerFn } from "@tanstack/react-start"
import z from "zod"
import { getSponsorByChannelController } from "./sponsor-get-by-channel.js"

const ChannelPageDataSchema = z.object({
  channel: z.string(),
})

export const getChannelPageDataController = createServerFn({
  method: "GET",
})
  .inputValidator(ChannelPageDataSchema)
  .handler(async ({ data }) => {
    return {
      sponsor: await getSponsorByChannelController(data.channel),
    }
  })
