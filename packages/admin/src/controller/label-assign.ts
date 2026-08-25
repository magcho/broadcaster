import { createServerFn } from "@tanstack/react-start"
import z from "zod"
import { createSponsorLabels } from "../infrastructure/db/create-sponsor-label.js"

export const LabelAssignSchema = z.object({
  sponsorIds: z.array(z.uuid()).min(1, "スポンサーを選択してください"),
  labelIds: z.array(z.uuid()).min(1, "ラベルを選択してください"),
})

export const assignLabelsController = createServerFn({ method: "POST" })
  .inputValidator(LabelAssignSchema)
  .handler(async ({ data: input }) => {
    await createSponsorLabels(input.sponsorIds, input.labelIds)
  })
