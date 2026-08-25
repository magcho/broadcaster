import { createServerFn } from "@tanstack/react-start"
import { listSponsorsController } from "./sponsor-list.js"

export const getSponsorsIndexPageDataController = createServerFn({
  method: "GET",
}).handler(async () => {
  return {
    sponsors: await listSponsorsController(),
  }
})
