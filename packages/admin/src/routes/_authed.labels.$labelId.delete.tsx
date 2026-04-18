import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router"
import { getLabelDeletePageDataController } from "../controller/label-delete-page-data.js"
import { PageSection } from "../ui/components/page-section.js"
import { LabelDeleteForm } from "../ui/views/label-delete.js"

export const Route = createFileRoute("/_authed/labels/$labelId/delete")({
  loader: async ({ params }) => {
    const { label } = await getLabelDeletePageDataController({
      data: { labelId: params.labelId },
    })
    if (label == null) {
      throw notFound()
    }
    return { label }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { label } = Route.useLoaderData()

  return (
    <PageSection title="ラベル削除">
      <LabelDeleteForm
        label={label}
        onComplete={() => {
          void navigate({ to: "/labels" })
        }}
      />
    </PageSection>
  )
}
