import { createFileRoute } from "@tanstack/react-router"
import { createServerOnlyFn } from "@tanstack/react-start"
import { saveSlackAccessToken } from "../../../../controller/slack-access-token-save"

const slackClientId = createServerOnlyFn(() => process.env.SLACK_CLIENT_ID!)
const slackClientSecret = createServerOnlyFn(() => process.env.SLACK_CLIENT_SECRET!)
const slackWorkspaceId = createServerOnlyFn(() => process.env.SLACK_WORKSPACE_ID!)

type SlackOAuthV2AccessResponse = {
  ok: boolean
  app_id: string
  authed_user: {
    id: string
    scope: string
    access_token: string
    token_type: string
  }
  team: {
    id: string
    name: string
  }
}

export const Route = createFileRoute("/api/auth/slack/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const query = new URLSearchParams(new URL(request.url).search)
        const code = query.get("code") as string | undefined
        if (code == null) {
          throw new Error("Code not found")
        }

        const body = new URLSearchParams({
          client_id: slackClientId(),
          client_secret: slackClientSecret(),
          code,
          redirect_uri: "http://localhost:3000/api/auth/slack/callback",
        })

        const res = await fetch("https://slack.com/api/oauth.v2.access", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        })
        if (!res.ok) {
          console.error(res)
          return new Response("Failed", { status: 500 })
        }

        const result: SlackOAuthV2AccessResponse = await res.json()
        if (!result.ok) {
          console.error(res)
          return new Response("Failed", { status: 500 })
        }

        if (result.team.id !== slackWorkspaceId()) {
          console.error("Unknown slack workspace id", result.team.id)
          return new Response("Failed", { status: 500 })
        }

        await saveSlackAccessToken("TEST_USER_ID", result.authed_user.access_token)

        return new Response(null, {
          status: 302,
          headers: {
            Location: "/",
          },
        })
      },
    },
  },
})
