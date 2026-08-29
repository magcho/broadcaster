import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router"
import { getSponsorEditPageDataController } from "../controller/sponsor-edit-page-data.js"
import { PageSection } from "../ui/components/page-section.js"
import { SponsorUpsertForm } from "../ui/views/sponsor-upsert.js"

export const Route = createFileRoute("/_authed/sponsors/$sponsorId/edit")({
  loader: async ({ params }) => {
    const { sponsor, labels } = await getSponsorEditPageDataController({
      data: { sponsorId: params.sponsorId },
    })
    if (sponsor == null) {
      throw notFound()
    }
    return { sponsor, labels }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { sponsor, labels } = Route.useLoaderData()

  return (
    <PageSection title={sponsor.name}>
      <SponsorUpsertForm
        sponsor={sponsor}
        labels={labels}
        initValue={{
          name: sponsor.name,
          readableId: sponsor.readableId,
          slackChannelId: sponsor.slackChannel?.id ?? "",
          slackUserIds: sponsor.slackUsers,
          labels: sponsor.labels.map((label) => label.label),
        }}
        onComplete={() => {
          void navigate({ to: "/sponsors" })
        }}
      />
    </PageSection>
  )
}
