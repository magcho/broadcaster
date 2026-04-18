import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import z from "zod"
import { createSponsorLabels } from "../infrastructure/db/create-sponsor-label.js"
import { verifySession } from "../libs/better-auth/server.js"

export const LabelAssignSchema = z.object({
  sponsorIds: z.array(z.uuid()).min(1, "スポンサーを選択してください"),
  labelIds: z.array(z.uuid()).min(1, "ラベルを選択してください"),
})

export const assignLabelsController = createServerFn({ method: "POST" })
  .inputValidator(LabelAssignSchema)
  .handler(async ({ data: input }) => {
    await verifySession(getRequestHeaders())

    await createSponsorLabels(input.sponsorIds, input.labelIds)
  })
