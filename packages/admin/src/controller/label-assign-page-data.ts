import { createServerFn } from "@tanstack/react-start"
import { promiseAllMap } from "../utils/promise-all.js"
import { listLabelsController } from "./label-list.js"
import { listSponsorsController } from "./sponsor-list.js"

export const getLabelsAssignPageDataController = createServerFn({
  method: "GET",
}).handler(async () => {
  return await promiseAllMap({
    sponsors: listSponsorsController(),
    labels: listLabelsController(),
  })
})
