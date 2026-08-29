import { createStart } from "@tanstack/react-start"
import { loggerMiddleware } from "./middleware/logger"
import { authMiddleware } from "./middleware/auth"

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [authMiddleware, loggerMiddleware],
  }
})
