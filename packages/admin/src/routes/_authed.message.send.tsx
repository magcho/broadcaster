import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { getMessageSendPageDataController } from "../controller/message-send-page-data.js"
import { PageSection } from "../ui/components/page-section.js"
import { SendMessageForm } from "../ui/views/message-send.js"

export const Route = createFileRoute("/_authed/message/send")({
  loader: async () => await getMessageSendPageDataController(),
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { sponsors, labels } = Route.useLoaderData()

  return (
    <PageSection title="Slack一斉送信">
      <SendMessageForm
        sponsors={sponsors}
        labels={labels}
        onComplete={() => {
          void navigate({ to: "/message" })
        }}
      />
    </PageSection>
  )
}
