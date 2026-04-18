import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { listMessages } from "../infrastructure/db/list-messages.js"
import { verifySession } from "../libs/better-auth/server.js"

export const getMessageIndexPageDataController = createServerFn({
  method: "GET",
}).handler(async () => {
  await verifySession(getRequestHeaders())
  return {
    messages: await listMessages(),
  }
})
