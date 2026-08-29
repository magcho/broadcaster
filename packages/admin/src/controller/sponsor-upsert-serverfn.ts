import { createServerFn } from "@tanstack/react-start"
import z from "zod"
import { upsertSponsorController } from "./sponsor-upsert.js"
import { SponsorUpsertFormSchema } from "./sponsor-upsert-schema.js"
import { getSlackAccessToken } from "./slack-access-token-get.js"
import { slackApi } from "../libs/slack-api.js"

const SponsorUpsertServerFnSchema = z.object({
  rawId: z.string().nullable(),
  raw: SponsorUpsertFormSchema,
})

export const upsertSponsorControllerFn = createServerFn({ method: "POST" })
  .inputValidator(SponsorUpsertServerFnSchema)
  .handler(async ({ data, context: { user } }) => {
    const token = await getSlackAccessToken(user.id)
    if (token == null) {
      throw new Error("Slack integration not completed")
    }

    const channelRaw = await slackApi.conversationsInfo(token, data.raw.slackChannelId)
    const channel = {
      id: channelRaw.id,
      name: channelRaw.name,
      kind: channelRaw.is_private ? ("private" as const) : ("public" as const),
      isExtShared: channelRaw.is_shared,
    }

    return await upsertSponsorController(data.rawId, data.raw, channel)
  })
