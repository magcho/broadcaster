import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import z from "zod"
import { deleteLabels } from "../infrastructure/db/delete-labels.js"
import { verifySession } from "../libs/better-auth/server.js"

export const deleteLabelController = createServerFn({ method: "POST" })
  .inputValidator(z.uuid())
  .handler(async ({ data: labelId }) => {
    await verifySession(getRequestHeaders())
    return await deleteLabels([labelId])
  })
