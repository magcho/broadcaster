import { createServerFn } from "@tanstack/react-start"
import { getSlackAccessToken } from "./slack-access-token-get"

export const getSlackIntegStatusController = createServerFn().handler(async () => {
  const token = await getSlackAccessToken("TEST_USER_ID")
  return {
    integrationStatus: token == null ? "not-ready" : "integrated",
  }
})
