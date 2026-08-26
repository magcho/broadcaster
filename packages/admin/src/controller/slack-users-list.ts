import { slackApi } from "../libs/slack-api.js"
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start"
import z from "zod"
import type { SlackUser } from "../domain/model/SlackChannel.js"
import { getSlackAccessToken } from "./slack-access-token-get.js"

const slackWorkspaceId = createServerOnlyFn(() => process.env.SLACK_WORKSPACE_ID!)

export const listSlackUsersController = createServerFn()
  .inputValidator(
    z.object({
      channelId: z.string(),
    }),
  )
  .handler(async ({ data: { channelId } }) => {
    const token = await getSlackAccessToken("TEST_USER_ID")
    if (token == null) {
      // TODO: 取得処理
      return []
    }

    const members = await slackApi.conversationsMembers(token, channelId)
    return members
      .filter((member) => !member.deleted && !member.isBot && !member.isAppUser)
      .map(
        (member) =>
          ({
            id: member.id,
            name: member.real_name,
            displayName: member.displayName,
            iconUrl: member.iconUrl,
            kind:
              member.teamId !== slackWorkspaceId()
                ? "connect"
                : member.isUltraRestricted
                  ? "single_channel_guest"
                  : member.isRestricted
                    ? "multi_channel_guest"
                    : "normal",
          }) satisfies SlackUser,
      )
  })
