import { createServerFn } from "@tanstack/react-start"
import z from "zod"
import { changeLabelsOrder } from "../infrastructure/db/change-labels-order.js"

const LabelOrderSchema = z.array(z.uuid())

export const changeLabelsOrderController = createServerFn({ method: "POST" })
  .inputValidator(LabelOrderSchema)
  .handler(async ({ data: ids }) => {
    try {
      await changeLabelsOrder(ids)
    } catch (e) {
      console.error("Failed to change labels order:", e)
      throw e
    }
  })
