import { createStart, createMiddleware } from "@tanstack/react-start"
import { getRequestHeader } from "@tanstack/react-start/server"

const loggerMiddleware = createMiddleware().server(async ({ next, request }) => {
  console.log("REQUEST", request.method, request.url)

  const user = getRequestHeader("X-Forwarded-User")
  const group = getRequestHeader("X-Forwarded-Groups")
  const username = getRequestHeader("X-Forwarded-Preferred-Username")
  console.log({ user, group, username })

  return await next()
})

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [loggerMiddleware],
  }
})
