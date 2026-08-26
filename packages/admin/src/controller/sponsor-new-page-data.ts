import { createServerFn } from "@tanstack/react-start"
import { listLabelsController } from "./label-list.js"

export const getSponsorNewPageDataController = createServerFn({
  method: "GET",
}).handler(async () => {
  const labels = await listLabelsController()
  return {
    labels,
  }
})
