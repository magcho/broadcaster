import { AuthError } from "./auth-error.js"

export const toErrorResponse = (error: unknown): Response => {
  if (error instanceof AuthError) {
    return Response.json({ message: error.message }, { status: error.status })
  }

  console.error("Unhandled API error:", error)
  return Response.json({ message: "Internal Server Error" }, { status: 500 })
}
