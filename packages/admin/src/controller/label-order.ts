import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import z from "zod"
import { changeLabelsOrder } from "../infrastructure/db/change-labels-order.js"
import { verifySession } from "../libs/better-auth/server.js"

const LabelOrderSchema = z.array(z.string().uuid())

export const changeLabelsOrderController = createServerFn({ method: "POST" })
  .inputValidator(LabelOrderSchema)
  .handler(async ({ data: ids }) => {
    await verifySession(getRequestHeaders())

    try {
      await changeLabelsOrder(ids)
    } catch (e) {
      console.error("Failed to change labels order:", e)
      throw e
    }
  })
