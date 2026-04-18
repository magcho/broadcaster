import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import z from "zod"
import { verifySession } from "../libs/better-auth/server.js"
import { getSponsorByChannelController } from "./sponsor-get-by-channel.js"

const ChannelPageDataSchema = z.object({
  channel: z.string(),
})

export const getChannelPageDataController = createServerFn({
  method: "GET",
})
  .inputValidator(ChannelPageDataSchema)
  .handler(async ({ data }) => {
    await verifySession(getRequestHeaders())
    return {
      sponsor: await getSponsorByChannelController(data.channel),
    }
  })
