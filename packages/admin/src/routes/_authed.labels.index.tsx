import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "broadcaster-components/button.js"
import { TbPlus } from "react-icons/tb"
import { getLabelsIndexPageDataController } from "../controller/label-index-page-data.js"
import { PageSection } from "../ui/components/page-section.js"
import { LabelListView } from "../ui/views/label-list.js"

export const Route = createFileRoute("/_authed/labels/")({
  loader: async () => await getLabelsIndexPageDataController(),
  component: RouteComponent,
})

function RouteComponent() {
  const { labels } = Route.useLoaderData()

  return (
    <PageSection
      title="ラベル管理"
      leading={
        <Button prefix={<TbPlus />} as={Link} to="/labels/new">
          ラベル追加
        </Button>
      }
    >
      <LabelListView labels={labels} />
    </PageSection>
  )
}
