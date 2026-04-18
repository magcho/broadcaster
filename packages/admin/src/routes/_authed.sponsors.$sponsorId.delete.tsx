import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router"
import { getSponsorDeletePageDataController } from "../controller/sponsor-delete-page-data.js"
import { PageSection } from "../ui/components/page-section.js"
import { SponsorDeleteForm } from "../ui/views/sponsor-delete.js"

export const Route = createFileRoute("/_authed/sponsors/$sponsorId/delete")({
  loader: async ({ params }) =>
    await getSponsorDeletePageDataController({
      data: { sponsorId: params.sponsorId },
    }),
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { sponsor } = Route.useLoaderData()

  if (sponsor == null) {
    throw notFound()
  }

  return (
    <PageSection title="スポンサー削除">
      <SponsorDeleteForm
        sponsor={sponsor}
        onComplete={() => {
          void navigate({ to: "/sponsors" })
        }}
      />
    </PageSection>
  )
}
