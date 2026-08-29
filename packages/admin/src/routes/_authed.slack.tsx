import { createFileRoute } from "@tanstack/react-router"
import { PageSection } from "../ui/components/page-section"
import { getSlackIntegStatusController } from "../controller/slack-integ-status"
import { Button } from "broadcaster-components/button"
import { removeSlackAccessTokenController } from "../controller/slack-access-token-remove"

export const Route = createFileRoute("/_authed/slack")({
  component: RouteComponent,
  loader: async () => {
    const { integrationStatus } = await getSlackIntegStatusController()
    return {
      integrationStatus,
    }
  },
})

function RouteComponent() {
  const { integrationStatus } = Route.useLoaderData()

  const handleConnectSlack = async () => {
    window.location.assign("/api/auth/slack/authorize")
  }

  const handleRemoveSlackAccessToken = async () => {
    await removeSlackAccessTokenController()
    window.location.reload()
  }

  return (
    <PageSection title="Slack 連携">
      <div className="flex flex-col gap-4 max-w-[640px]">
        <div className="border border-slate-400 rounded-lg pl-4 p-3 w-full bg-white flex items-center justify-between">
          Slack 連携：{integrationStatus === "not-ready" ? "未接続" : "接続済み"}
          {integrationStatus === "not-ready" ? (
            <Button onClick={handleConnectSlack}>連携する</Button>
          ) : (
            <Button onClick={handleRemoveSlackAccessToken} variant="secondary">
              アクセストークン削除
            </Button>
          )}
        </div>
      </div>
    </PageSection>
  )
}
