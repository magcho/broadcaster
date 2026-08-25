import { createServerFn } from "@tanstack/react-start"
import { data } from "../cache/slack-channels-list.cache.js"
import type { SlackChannel } from "../domain/model/SlackChannel.js"

export const listSlackChannelsController = createServerFn({
  method: "GET",
}).handler(async () => {
  return (Array.isArray(data) ? data : []) as SlackChannel[]
})
