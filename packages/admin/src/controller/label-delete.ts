import { createServerFn } from "@tanstack/react-start"
import z from "zod"
import { deleteLabels } from "../infrastructure/db/delete-labels.js"

export const deleteLabelController = createServerFn({ method: "POST" })
  .inputValidator(z.uuid())
  .handler(async ({ data: labelId }) => {
    return await deleteLabels([labelId])
  })
