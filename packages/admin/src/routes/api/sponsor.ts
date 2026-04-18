import { createFileRoute } from "@tanstack/react-router"
import z from "zod"
import { upsertSponsorController } from "../../controller/sponsor-upsert.js"
import { toErrorResponse } from "../../libs/error-response.js"
import { m2mAuthClient } from "../../libs/m2m-auth.js"

const inputSchema = z.object({
  labels: z.array(z.string()).nullish(),
  name: z.string(),
  readableId: z.string().refine((value) => /^[a-zA-Z0-9-_]+$/.test(value), {
    message:
      "readableId must contain only alphanumeric characters, hyphens, or underscores",
  }),
  slackChannelId: z.string(),
  slackUserIds: z.array(z.string()),
})

export const Route = createFileRoute("/api/sponsor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await m2mAuthClient.verify(request.headers)

          const json = await request.json()
          const input = inputSchema.parse(json)

          const sponsorId = await upsertSponsorController(null, {
            labels: input.labels ?? [],
            name: input.name,
            readableId: input.readableId,
            slackChannelId: input.slackChannelId,
            slackUserIds: input.slackUserIds,
          })

          return Response.json({ id: sponsorId }, { status: 200 })
        } catch (error) {
          return toErrorResponse(error)
        }
      },
    },
  },
})
