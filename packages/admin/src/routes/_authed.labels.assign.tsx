import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { getLabelsAssignPageDataController } from "../controller/label-assign-page-data.js"
import { PageSection } from "../ui/components/page-section.js"
import { LabelAssignForm } from "../ui/views/label-assign.js"

export const Route = createFileRoute("/_authed/labels/assign")({
  loader: async () => await getLabelsAssignPageDataController(),
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { sponsors, labels } = Route.useLoaderData()

  return (
    <PageSection title="ラベル付与">
      <LabelAssignForm
        sponsors={sponsors}
        labels={labels}
        onComplete={async () => {
          await navigate({ to: "/sponsors" })
        }}
      />
    </PageSection>
  )
}
