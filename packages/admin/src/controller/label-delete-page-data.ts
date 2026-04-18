import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import z from "zod"
import { verifySession } from "../libs/better-auth/server.js"
import { getLabelController } from "./label-get.js"

const LabelDeletePageDataSchema = z.object({
  labelId: z.string().uuid(),
})

export const getLabelDeletePageDataController = createServerFn({
  method: "GET",
})
  .inputValidator(LabelDeletePageDataSchema)
  .handler(async ({ data }) => {
    await verifySession(getRequestHeaders())
    return {
      label: await getLabelController(data.labelId).catch(() => null),
    }
  })
