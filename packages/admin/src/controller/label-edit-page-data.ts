import { createServerFn } from "@tanstack/react-start"
import z from "zod"
import { getLabelController } from "./label-get.js"

const LabelEditPageDataSchema = z.object({
  labelId: z.uuid(),
})

export const getLabelEditPageDataController = createServerFn({
  method: "GET",
})
  .inputValidator(LabelEditPageDataSchema)
  .handler(async ({ data }) => {
    return {
      label: await getLabelController(data.labelId).catch(() => null),
    }
  })
