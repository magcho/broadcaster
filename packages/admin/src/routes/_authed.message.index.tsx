import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "broadcaster-components/button.js"
import { TbPlus } from "react-icons/tb"
import { getMessageIndexPageDataController } from "../controller/message-index-page-data.js"
import { PageSection } from "../ui/components/page-section.js"
import { MessageListView } from "../ui/views/message-list.js"

export const Route = createFileRoute("/_authed/message/")({
  loader: async () => await getMessageIndexPageDataController(),
  component: RouteComponent,
})

function RouteComponent() {
  const { messages } = Route.useLoaderData()

  return (
    <PageSection
      title="メッセージ管理"
      leading={
        <Button prefix={<TbPlus />} as={Link} to="/message/send">
          送信
        </Button>
      }
    >
      <MessageListView messages={messages} />
    </PageSection>
  )
}
