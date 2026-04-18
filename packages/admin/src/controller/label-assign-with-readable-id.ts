import { createServerFn } from "@tanstack/react-start"
import z from "zod"
import { createSponsorLabels } from "../infrastructure/db/create-sponsor-label.js"
import { getLabelByName } from "../infrastructure/db/get-label-by-name.js"
import { getSponsorByReadableId } from "../infrastructure/db/get-sponsor-by-readbale-id.js"

const schema = z.object({
  readableId: z.string(),
  label: z.string(),
})

export const assignLabelWithReadableIdController = createServerFn()
  .inputValidator(schema)
  .handler(async ({ data }) => {
    const sponsor = await getSponsorByReadableId(data.readableId)
    const label = await getLabelByName(data.label)

    if (sponsor == null || label == null) {
      return false
    }

    await createSponsorLabels([sponsor.id], [label.id])
    return true
  })
