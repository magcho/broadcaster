import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router"
import type { ReactNode } from "react"

import appCss from "../ui/styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "robots",
        content: "noindex",
      },
      {
        title: "Broadcaster Admin",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
      {
        rel: "apple-touch-icon",
        href: "/slack-icon.png",
      },
    ],
  }),
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
  component: RootComponent,
})

function RootComponent() {
  return <Outlet />
}

function NotFoundPage() {
  return (
    <section className="p-4">
      Not found
      <br />
      <Link className="text-blue-600 underline hover:no-underline" to="/">
        Home
      </Link>
    </section>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body className="bg-slate-50 text-slate-950">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
