import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { verifySession } from "../libs/better-auth/server.js"
import { createSlackMessage } from "./internal/create-slack-message.js"
import { sendTestSlackMessage } from "./internal/send-test-slack-message.js"
import { CreateAndSendSlackMessageSchema } from "./slack-message-create-and-send-schema.js"

export const createAndSendSlackMessageController = createServerFn({
  method: "POST",
})
  .inputValidator(CreateAndSendSlackMessageSchema)
  .handler(async ({ data: input }) => {
    await verifySession(getRequestHeaders())

    if (input.targetType === "Test") {
      await sendTestSlackMessage(input.message)
    } else {
      await createSlackMessage({
        message: input.message,
        addMention: input.addMention,
        scheduledAt: input.scheduledAt,
        target:
          0 < input.sponsorIds.length
            ? {
                type: "Sponsor",
                sponsorIds: input.sponsorIds,
              }
            : {
                type: "Label",
                labelIds: input.labelIds,
              },
      })
    }
  })
