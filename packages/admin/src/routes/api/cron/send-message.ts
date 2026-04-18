import { createFileRoute } from "@tanstack/react-router"
import { sendScheduledSlackMessageController } from "../../../controller/slack-message-send-scheduled-message.js"
import { toErrorResponse } from "../../../libs/error-response.js"
import { m2mAuthClient } from "../../../libs/m2m-auth.js"

export const Route = createFileRoute("/api/cron/send-message")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await m2mAuthClient.verify(request.headers)
          const result = await sendScheduledSlackMessageController()
          return new Response(result, { status: 200 })
        } catch (error) {
          return toErrorResponse(error)
        }
      },
    },
  },
})
