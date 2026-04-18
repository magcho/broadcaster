import { parseMrkdwn, serializeForChatPostMessage } from "slack-parser/index.js"
import { slackSdk } from "../../libs/slack-sdk.js"

const SLACK_TEST_CHANNEL_ID = process.env.SLACK_TEST_CHANNEL_ID
if (SLACK_TEST_CHANNEL_ID == null) {
  throw new Error("SLACK_TEST_CHANNEL_ID is not defined")
}

export const sendTestSlackMessage = async (message: string) => {
  const { blocks } = serializeForChatPostMessage(parseMrkdwn(message).document)
  await slackSdk.bulkPostMessage([
    {
      channel: SLACK_TEST_CHANNEL_ID,
      blocks,
    },
  ])
}
