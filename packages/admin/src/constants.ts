import z from "zod"

const raw = process.env.SLACK_CLIENT_ID_SECRET
if (raw == null) {
  throw new Error("SLACK_CLIENT_ID_SECRET is not set")
}

const SlackClientIdSecretSchema = z.object({
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
})

export const { client_id: slackClientId, client_secret: slackClientSecret } =
  SlackClientIdSecretSchema.parse(JSON.parse(raw))
