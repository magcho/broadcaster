import { createServerFn } from "@tanstack/react-start"
import { getSlackAccessToken } from "./slack-access-token-get"

export const getSlackIntegStatusController = createServerFn().handler(
  async ({ context: { user } }) => {
    const token = await getSlackAccessToken(user.id)
    return {
      integrationStatus: token == null ? "not-ready" : "integrated",
    }
  },
)
