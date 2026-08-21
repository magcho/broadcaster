import { normalizeDocument } from "../document/normalize-document.js"
import type { ChatPostMessagePayloadDraft, SlackDocument } from "../types.js"
import { serializeToMrkdwn } from "./mrkdwn.js"
import { serializeToRichText } from "./rich-text.js"

export function serializeForChatPostMessage(document: SlackDocument): ChatPostMessagePayloadDraft {
  const normalized = normalizeDocument(document)
  const richText = serializeToRichText(normalized.document)
  const mrkdwn = serializeToMrkdwn(normalized.document)

  return {
    text: mrkdwn.text,
    blocks: [richText],
    diagnostics: [...normalized.diagnostics, ...mrkdwn.diagnostics],
  }
}
