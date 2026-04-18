import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { PageSection } from "../ui/components/page-section.js"
import { LabelUpsertForm } from "../ui/views/label-upsert.js"

export const Route = createFileRoute("/_authed/labels/new")({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  return (
    <PageSection title="ラベル追加">
      <LabelUpsertForm
        label={null}
        onComplete={() => {
          void navigate({ to: "/labels" })
        }}
      />
    </PageSection>
  )
}
