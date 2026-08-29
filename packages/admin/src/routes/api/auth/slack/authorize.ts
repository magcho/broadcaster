import { createFileRoute } from "@tanstack/react-router"
import { slackClientId } from "../../../../constants"

export const Route = createFileRoute("/api/auth/slack/authorize")({
  server: {
    handlers: {
      GET: async () => {
        const params = new URLSearchParams({
          client_id: slackClientId,
          user_scope: "channels:read,groups:read,users:read",
          redirect_uri: "http://localhost:3000/api/auth/slack/callback",
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
