import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { getSession } from "./server.js"

export const getSessionServerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    return await getSession(getRequestHeaders())
  },
)
