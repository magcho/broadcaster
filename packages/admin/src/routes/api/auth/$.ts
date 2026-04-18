import { createFileRoute } from "@tanstack/react-router"
import { auth } from "../../../libs/better-auth/server.js"

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => auth.handler(request),
      POST: async ({ request }) => auth.handler(request),
    },
  },
})
