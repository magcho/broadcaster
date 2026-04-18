import { createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen.js"

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
  })
}

export type AppRouter = ReturnType<typeof getRouter>

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter
  }
}
