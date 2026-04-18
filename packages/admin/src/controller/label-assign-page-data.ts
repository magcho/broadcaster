import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { verifySession } from "../libs/better-auth/server.js"
import { promiseAllMap } from "../utils/promise-all.js"
import { listLabelsController } from "./label-list.js"
import { listSponsorsController } from "./sponsor-list.js"

export const getLabelsAssignPageDataController = createServerFn({
  method: "GET",
}).handler(async () => {
  await verifySession(getRequestHeaders())

  return await promiseAllMap({
    sponsors: listSponsorsController(),
    labels: listLabelsController(),
  })
})
