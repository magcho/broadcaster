import { createServerFn } from "@tanstack/react-start"
import z from "zod"
import { getLabelController } from "./label-get.js"

const LabelDeletePageDataSchema = z.object({
  labelId: z.uuid(),
})

export const getLabelDeletePageDataController = createServerFn({
  method: "GET",
})
  .inputValidator(LabelDeletePageDataSchema)
  .handler(async ({ data }) => {
    return {
      label: await getLabelController(data.labelId).catch(() => null),
    }
  })
