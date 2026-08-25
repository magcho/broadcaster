import { createServerFn } from "@tanstack/react-start"
import { listMessages } from "../infrastructure/db/list-messages.js"

export const getMessageIndexPageDataController = createServerFn({
  method: "GET",
}).handler(async () => {
  return {
    messages: await listMessages(),
  }
})
