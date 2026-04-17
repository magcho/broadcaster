import { sendScheduledSlackMessageController } from "../../../../../controller/slack-message-send-scheduled-message.js"
import { toErrorResponse } from "../../../../../libs/error-response.js"
import { m2mAuthClient } from "../../../../../libs/m2m-auth.js"

export const POST = async (request: Request): Promise<Response> => {
  try {
    await m2mAuthClient.verify(request.headers)

    await sendScheduledSlackMessageController()

    return new Response("Done", { status: 200 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
