import { createServerFn } from "@tanstack/react-start"
import { listLabelsController } from "./label-list.js"

export const getSponsorNewPageDataController = createServerFn({
  method: "GET",
}).handler(async () => {
  return {
    labels: await listLabelsController(),
  }
})
