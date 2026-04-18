import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "broadcaster-components/button.js"
import { TbPlus } from "react-icons/tb"
import { getSponsorsIndexPageDataController } from "../controller/sponsor-index-page-data.js"
import { PageSection } from "../ui/components/page-section.js"
import { SponsorListView } from "../ui/views/sponsor-list.js"

export const Route = createFileRoute("/_authed/sponsors/")({
  loader: async () => await getSponsorsIndexPageDataController(),
  component: RouteComponent,
})

function RouteComponent() {
  const { sponsors } = Route.useLoaderData()

  return (
    <PageSection
      title="スポンサー管理"
      leading={
        <Button prefix={<TbPlus />} as={Link} to="/sponsors/new">
          スポンサー追加
        </Button>
      }
    >
      <SponsorListView sponsors={sponsors} />
    </PageSection>
  )
}
