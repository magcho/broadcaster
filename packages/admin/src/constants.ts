import z from "zod"

const raw = process.env.SLACK_CLIENT_ID_SECRET
if (raw == null) {
  throw new Error("SLACK_CLIENT_ID_SECRET is not set")
}

const SlackClientIdSecretSchema = z.object({
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
})

const { client_id, client_secret } = SlackClientIdSecretSchema.parse(JSON.parse(raw))

export const slackClientId = client_id
export const slackClientSecret = client_secret
