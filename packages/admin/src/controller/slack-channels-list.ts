import { createServerFn } from "@tanstack/react-start"
import { getSlackAccessToken } from "./slack-access-token-get"
import { slackApi } from "../libs/slack-api"
import type { SlackChannel } from "../domain/model/SlackChannel"

export const listSlackChannelsController = createServerFn().handler(async () => {
  const token = await getSlackAccessToken("TEST_USER_ID")
  if (token == null) {
    return {
      err: "SLACK_TOKEN_NOT_FOUND",
      data: undefined,
    }
  }

  const result = await slackApi.conversationsList(token)
  const channels = result
    .filter((channel) => channel.is_channel)
    .map(
      (channel) =>
        ({
          id: channel.id,
          name: channel.name,
          kind: channel.is_private ? "private" : "public",
          isExtShared: channel.is_shared ?? false,
        }) satisfies SlackChannel,
    )
    .toSorted((a, b) => a.name.localeCompare(b.name))

  return { data: channels }
})
