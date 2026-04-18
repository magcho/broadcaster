import { parseMrkdwn, serializeForChatPostMessage } from "slack-parser/index.js"
import {
  type MessageTemplateWithDetail,
  resolveMessageTemplate,
} from "../../domain/model/Message.js"
import { getSponsorRelatedVariablesForTemplate } from "../../domain/model/Sponsor.js"
import { getSponsorsByLabels } from "../../infrastructure/db/get-sponsors-by-labels.js"
import { updateMessageAsAlreadySent } from "../../infrastructure/db/update-message-as-already-sent.js"
import { slackSdk } from "../../libs/slack-sdk.js"

export const sendSlackMessage = async (message: MessageTemplateWithDetail) => {
  const sponsors =
    message.target.type === "Sponsor"
      ? message.target.sponsors
      : await getSponsorsByLabels(
          message.target.labels.map((label) => label.id),
        )

  if (sponsors.length === 0) {
    console.info(
      "No sponsors found for the message target. Skipping message sending.",
    )
    // 送信済み扱いにする
    await updateMessageAsAlreadySent(message.id)
    return
  }

  const messageItems = sponsors.flatMap((sponsor) => {
    if (sponsor.slackChannelId == null || sponsor.slackChannelId === "") {
      return []
    }

    const variables = getSponsorRelatedVariablesForTemplate(sponsor)

    // addMentionがtrueの場合、担当者のメンションを含める
    const baseMessage = message.addMention
      ? `{{SPONSOR_MENTIONS}}\n${message.message}`
      : message.message

    return {
      channel: sponsor.slackChannelId,
      blocks: serializeForChatPostMessage(
        parseMrkdwn(resolveMessageTemplate(baseMessage, variables)).document,
      ).blocks,
    }
  })

  if (messageItems.length === 0) {
    console.info("No valid sponsors with Slack channel to send message.")
    // 送信済み扱いにする
    await updateMessageAsAlreadySent(message.id)
    return
  }

  await slackSdk.bulkPostMessage(messageItems)

  // メッセージ送信したことをDBに記録
  await updateMessageAsAlreadySent(message.id)
}
