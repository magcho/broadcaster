import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { data } from "../cache/slack-channels-list.cache.js"
import type { SlackChannel } from "../domain/model/SlackChannel.js"
import { verifySession } from "../libs/better-auth/server.js"

export const listSlackChannelsController = createServerFn({
  method: "GET",
}).handler(async () => {
  await verifySession(getRequestHeaders())
  return (Array.isArray(data) ? data : []) as SlackChannel[]
})
