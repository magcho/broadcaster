import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import z from "zod"
import { verifySession } from "../libs/better-auth/server.js"
import { promiseAllMap } from "../utils/promise-all.js"
import { listLabelsController } from "./label-list.js"
import { getSponsorController } from "./sponsor-get.js"

const SponsorEditPageDataSchema = z.object({
  sponsorId: z.string().uuid(),
})

export const getSponsorEditPageDataController = createServerFn({
  method: "GET",
})
  .inputValidator(SponsorEditPageDataSchema)
  .handler(async ({ data }) => {
    await verifySession(getRequestHeaders())

    return await promiseAllMap({
      sponsor: getSponsorController(data.sponsorId).catch(() => null),
      labels: listLabelsController(),
    })
  })
