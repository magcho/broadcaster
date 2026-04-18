import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import z from "zod"
import { verifySession } from "../libs/better-auth/server.js"
import { getLabelController } from "./label-get.js"

const LabelEditPageDataSchema = z.object({
  labelId: z.string().uuid(),
})

export const getLabelEditPageDataController = createServerFn({
  method: "GET",
})
  .inputValidator(LabelEditPageDataSchema)
  .handler(async ({ data }) => {
    await verifySession(getRequestHeaders())
    return {
      label: await getLabelController(data.labelId).catch(() => null),
    }
  })
