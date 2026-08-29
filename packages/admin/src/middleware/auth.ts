import { createMiddleware } from "@tanstack/react-start"
import { getRequestHeader } from "@tanstack/react-start/server"

/**
 * oauth2-proxy が付与する HTTP header を参照する
 */
export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const id = getRequestHeader("X-Forwarded-User")
  const email = getRequestHeader("X-Forwarded-Email")

  if (id == null || email == null) {
    throw new Error("User or email not found")
  }

  return await next({
    context: {
      user: {
        id,
        email,
      },
    },
  })
})
