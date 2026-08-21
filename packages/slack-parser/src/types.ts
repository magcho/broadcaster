export type SlackDocument = {
  kind: "document"
  blocks: SlackBlock[]
}

export type SlackBlock = ParagraphBlock | QuoteBlock | PreformattedBlock | ListBlock

export type ParagraphBlock = {
  kind: "paragraph"
  inlines: SlackInline[]
}

export type QuoteBlock = {
  kind: "quote"
  inlines: SlackInline[]
}

export type PreformattedBlock = {
  kind: "preformatted"
  text: string
  language?: string
}

export type ListBlock = {
  kind: "list"
  style: "bullet" | "ordered"
  indent: number
  offset?: number
  items: ListItem[]
}

export type ListItem = {
  inlines: SlackInline[]
}

export type SlackInline =
  | TextInline
  | LinkInline
  | UserInline
  | UserGroupInline
  | ChannelInline
  | BroadcastInline
  | DateInline
  | EmojiInline
  | LineBreakInline

export type MarkSet = {
  bold?: true
  italic?: true
  strike?: true
  code?: true
}

export type TextInline = {
  kind: "text"
  text: string
  marks?: MarkSet
}

export type LinkInline = {
  kind: "link"
  url: string
  label?: string
  isMailto?: true
  marks?: MarkSet
}

export type UserInline = {
  kind: "user"
  userId: string
}

export type UserGroupInline = {
  kind: "usergroup"
  usergroupId: string
  label?: string
}

export type ChannelInline = {
  kind: "channel"
  channelId: string
  label?: string
}

export type BroadcastInline = {
  kind: "broadcast"
  range: "here" | "channel" | "everyone"
}

export type DateInline = {
  kind: "date"
  timestamp: number
  format: string
  fallback: string
  url?: string
}

export type EmojiInline = {
  kind: "emoji"
  name: string
}

export type LineBreakInline = {
  kind: "linebreak"
}

export type SourceSpan = {
  start: number
  end: number
}

export type Diagnostic = {
  severity: "error" | "warning"
  code:
    | "unclosed_code_span"
    | "unclosed_style"
    | "malformed_entity"
    | "unknown_entity"
    | "invalid_date"
    | "unknown_date_token"
    | "unsupported_rich_text_element"
    | "unsupported_rich_text_style"
    | "unsupported_mark_combination"
    | "lossy_mrkdwn_export"
    | "downgraded_to_text"
  message: string
  span?: SourceSpan
}

export type ParseResult = {
  document: SlackDocument
  diagnostics: Diagnostic[]
}

export type NormalizeResult = {
  document: SlackDocument
  diagnostics: Diagnostic[]
}

export type SerializeMrkdwnResult = {
  text: string
  diagnostics: Diagnostic[]
}

export type ParseMrkdwnOptions = {
  source?: "publish" | "retrieved"
  surface?: "message_text" | "mrkdwn_text_object" | "attachment_text"
  mode?: "strict" | "compat"
  autolink?: boolean
}

export type ParseRichTextOptions = {
  mode?: "strict" | "compat"
}

export type NormalizeOptions = {
  keepEmptyParagraphs?: boolean
}

export type SerializeRichTextOptions = Record<string, never>

export type SerializeMrkdwnOptions = Record<string, never>

export type SerializeForChatPostMessageOptions = Record<string, never>

export type CreateDocumentInput = {
  blocks?: SlackBlock[]
}

export type ChatPostMessagePayloadDraft = {
  text: string
  blocks: [SlackRichTextBlock]
  diagnostics: Diagnostic[]
}

export type SlackRichTextBlock = {
  type: "rich_text"
  block_id?: string
  elements: SlackRichTextElement[]
}

export type SlackRichTextElement =
  | SlackRichTextSection
  | SlackRichTextList
  | SlackRichTextPreformatted
  | SlackRichTextQuote
  | SlackUnsupportedRichTextElement

export type SlackRichTextSection = {
  type: "rich_text_section"
  elements: SlackRichTextInline[]
}

export type SlackRichTextList = {
  type: "rich_text_list"
  style: "bullet" | "ordered"
  indent?: number
  offset?: number
  elements: SlackRichTextSection[]
}

export type SlackRichTextPreformatted = {
  type: "rich_text_preformatted"
  elements: SlackRichTextInline[]
  language?: string
}

export type SlackRichTextQuote = {
  type: "rich_text_quote"
  elements: SlackRichTextInline[]
}

export type SlackRichTextInline =
  | SlackRichTextText
  | SlackRichTextLink
  | SlackRichTextEmoji
  | SlackRichTextDate
  | SlackRichTextBroadcast
  | SlackRichTextChannel
  | SlackRichTextUser
  | SlackRichTextUsergroup
  | SlackUnsupportedRichTextInline

export type SlackStyle = {
  bold?: boolean
  italic?: boolean
  strike?: boolean
  code?: boolean
  underline?: boolean
  highlight?: boolean
  client_highlight?: boolean
  unlink?: boolean
}

export type SlackRichTextText = {
  type: "text"
  text: string
  style?: SlackStyle
}

export type SlackRichTextLink = {
  type: "link"
  url: string
  text?: string
  style?: SlackStyle
}

export type SlackRichTextEmoji = {
  type: "emoji"
  name: string
}

export type SlackRichTextDate = {
  type: "date"
  timestamp: number
  format: string
  fallback?: string
  url?: string
  style?: SlackStyle
}

export type SlackRichTextBroadcast = {
  type: "broadcast"
  range: "here" | "channel" | "everyone"
}

export type SlackRichTextChannel = {
  type: "channel"
  channel_id: string
  style?: SlackStyle
}

export type SlackRichTextUser = {
  type: "user"
  user_id: string
  style?: SlackStyle
}

export type SlackRichTextUsergroup = {
  type: "usergroup"
  usergroup_id: string
  style?: SlackStyle
}

export type SlackUnsupportedRichTextElement = {
  type: string
  [key: string]: unknown
}

export type SlackUnsupportedRichTextInline = {
  type: string
  [key: string]: unknown
}
