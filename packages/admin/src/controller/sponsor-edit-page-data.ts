import { createServerFn } from "@tanstack/react-start"
import z from "zod"
import { promiseAllMap } from "../utils/promise-all.js"
import { listLabelsController } from "./label-list.js"
import { getSponsorController } from "./sponsor-get.js"

const SponsorEditPageDataSchema = z.object({
  sponsorId: z.uuid(),
})

export const getSponsorEditPageDataController = createServerFn({
  method: "GET",
})
  .inputValidator(SponsorEditPageDataSchema)
  .handler(async ({ data }) => {
    return await promiseAllMap({
      sponsor: getSponsorController(data.sponsorId).catch(() => null),
      labels: listLabelsController(),
    })
  })
