import { createFileRoute, notFound, redirect } from "@tanstack/react-router"
import { getChannelPageDataController } from "../controller/channel-page-data.js"

export const Route = createFileRoute("/_authed/channel/$channel")({
  beforeLoad: async ({ params }) => {
    const { sponsor } = await getChannelPageDataController({
      data: { channel: params.channel },
    })

    if (sponsor != null) {
      throw redirect({
        to: "/sponsors/$sponsorId/edit",
        params: { sponsorId: sponsor.id },
      })
    }

    throw notFound()
  },
})
