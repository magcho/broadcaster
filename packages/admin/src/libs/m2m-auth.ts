import z from "zod"
import { parseBearer } from "../utils/bearer.js"
import { safeParseJson } from "../utils/json.js"
import { AuthError } from "./auth-error.js"

const M2M_API_TOKENS = process.env.M2M_API_TOKENS
if (M2M_API_TOKENS == null) {
  throw new Error("M2M_API_TOKENS is not set in environment variables.")
}

const result = z
  .record(z.string(), z.string())
  .safeParse(safeParseJson(M2M_API_TOKENS))

if (!result.success) {
  console.error(result)
  throw new Error("M2M_API_TOKENS is not a valid JSON object.")
}

const createM2mAuthClient = (apiKeys: Record<string, string>) => {
  return {
    async verify(headers: Headers) {
      const token = parseBearer(headers)
      if (token == null) {
        throw new AuthError("Unauthorized", 401)
      }
      const apiKeyEntry = Object.entries(apiKeys).find(
        ([, value]) => value === token,
      )
      if (apiKeyEntry == null) {
        throw new AuthError("Unauthorized", 401)
      }
      const [appName] = apiKeyEntry
      return { appName }
    },
  }
}

export const m2mAuthClient = createM2mAuthClient(result.data)
