import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { verifySession } from "../libs/better-auth/server.js"
import { listLabelsController } from "./label-list.js"

export const getLabelsIndexPageDataController = createServerFn({
  method: "GET",
}).handler(async () => {
  await verifySession(getRequestHeaders())
  return {
    labels: await listLabelsController(),
  }
})
