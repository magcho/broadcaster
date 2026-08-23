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
    <section className="rounded-3xl border border-slate-300 border-dashed bg-white p-8 text-center shadow-sm">
      <p className="font-medium text-slate-500 text-sm uppercase tracking-[0.24em]">404</p>
      <h1 className="mt-3 font-semibold text-3xl text-slate-950">Page not found.</h1>
      <p className="mx-auto mt-3 max-w-2xl text-slate-600 text-sm leading-6">
        指定した管理画面のルートは見つかりませんでした。
      </p>
      <div className="mt-6">
        <Link
          to="/message/send"
          className="inline-flex rounded-full bg-slate-950 px-4 py-2 font-medium text-white transition hover:bg-slate-800"
        >
          Back to Bootstrap
        </Link>
      </div>
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
