import { createFileRoute } from "@tanstack/react-router"
import { slackClientId } from "../../../../constants"

const baseUrl = process.env.BASE_URL

if (baseUrl == null) {
  throw new Error("BASE_URL not found")
}

export const Route = createFileRoute("/api/auth/slack/authorize")({
  server: {
    handlers: {
      GET: async () => {
        console.log(slackClientId)
        const params = new URLSearchParams({
          client_id: slackClientId,
          user_scope: "channels:read,groups:read,users:read",
          redirect_uri: new URL("/api/auth/slack/callback", baseUrl).toString(),
        })

        return new Response(null, {
          status: 302,
          headers: {
            Location: `https://slack.com/oauth/v2/authorize?${params.toString()}`,
          },
        })
      },
    },
  },
})
