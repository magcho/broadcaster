import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { getSponsorNewPageDataController } from "../controller/sponsor-new-page-data.js"
import { PageSection } from "../ui/components/page-section.js"
import { SponsorUpsertForm } from "../ui/views/sponsor-upsert.js"

export const Route = createFileRoute("/_authed/sponsors/new")({
  loader: async () => await getSponsorNewPageDataController(),
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { labels } = Route.useLoaderData()

  return (
    <PageSection title="スポンサー登録">
      <SponsorUpsertForm
        sponsor={null}
        labels={labels}
        onComplete={() => {
          void navigate({ to: "/sponsors" })
        }}
      />
    </PageSection>
  )
}
