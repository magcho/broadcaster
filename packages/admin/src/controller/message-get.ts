import { createServerFn } from "@tanstack/react-start"
import { slackSdk } from "../libs/slack-sdk.js"
import { MessageRefSchema } from "./message-get-schema.js"

export const getMessageController = createServerFn({ method: "POST" })
  .inputValidator(MessageRefSchema)
  .handler(async ({ data: input }) => {
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
