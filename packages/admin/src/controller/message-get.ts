import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { verifySession } from "../libs/better-auth/server.js"
import { slackSdk } from "../libs/slack-sdk.js"
import { MessageRefSchema } from "./message-get-schema.js"

export const getMessageController = createServerFn({ method: "POST" })
  .inputValidator(MessageRefSchema)
  .handler(async ({ data: input }) => {
    await verifySession(getRequestHeaders())

    try {
      const message = await slackSdk.getMessage({
        channel: input.channel,
        timestamp: input.timestamp,
      })
      return message?.text
    } catch (e) {
      console.error(e)
    }
  })
