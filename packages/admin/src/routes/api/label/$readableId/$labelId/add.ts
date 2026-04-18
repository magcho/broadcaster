import { createFileRoute } from "@tanstack/react-router"
import { assignLabelWithReadableIdController } from "../../../../../controller/label-assign-with-readable-id.js"
import { toErrorResponse } from "../../../../../libs/error-response.js"
import { m2mAuthClient } from "../../../../../libs/m2m-auth.js"

export const Route = createFileRoute("/api/label/$readableId/$labelId/add")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        try {
          await m2mAuthClient.verify(request.headers)

          const success = await assignLabelWithReadableIdController({
            data: {
              label: params.labelId,
              readableId: params.readableId,
            },
          })

          if (success) {
            return Response.json({ message: "Success" }, { status: 200 })
          }

          return Response.json(
            { message: "Sponsor or label not found" },
            { status: 404 },
          )
        } catch (error) {
          return toErrorResponse(error)
        }
      },
    },
  },
})
