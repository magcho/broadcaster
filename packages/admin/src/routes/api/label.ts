import { createFileRoute } from "@tanstack/react-router"
import { listLabelsController } from "../../controller/label-list.js"
import { toErrorResponse } from "../../libs/error-response.js"
import { m2mAuthClient } from "../../libs/m2m-auth.js"

export const Route = createFileRoute("/api/label")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await m2mAuthClient.verify(request.headers)
          const labels = await listLabelsController()
          return Response.json(labels, { status: 200 })
        } catch (error) {
          return toErrorResponse(error)
        }
      },
    },
  },
})
