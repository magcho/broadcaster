import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router"
import { getLabelEditPageDataController } from "../controller/label-edit-page-data.js"
import { PageSection } from "../ui/components/page-section.js"
import { LabelUpsertForm } from "../ui/views/label-upsert.js"

export const Route = createFileRoute("/_authed/labels/$labelId/edit")({
  loader: async ({ params }) => {
    const { label } = await getLabelEditPageDataController({
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
    <PageSection title="ラベル編集">
      <LabelUpsertForm
        label={label}
        initValue={{
          label: label.label,
          color: label.color,
        }}
        onComplete={() => {
          void navigate({ to: "/labels" })
        }}
      />
    </PageSection>
  )
}
