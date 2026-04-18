import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { verifySession } from "../libs/better-auth/server.js"
import { listSponsorsController } from "./sponsor-list.js"

export const getSponsorsIndexPageDataController = createServerFn({
  method: "GET",
}).handler(async () => {
  await verifySession(getRequestHeaders())
  return {
    sponsors: await listSponsorsController(),
  }
})
