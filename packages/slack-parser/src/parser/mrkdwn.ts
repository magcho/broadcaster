import { createDocument } from "../document/create-document.js"
import { normalizeDocument } from "../document/normalize-document.js"
import type {
  BroadcastInline,
  ChannelInline,
  DateInline,
  Diagnostic,
  EmojiInline,
  LinkInline,
  MarkSet,
  ParseMrkdwnOptions,
  ParseResult,
  SlackBlock,
  SlackInline,
  SourceSpan,
  TextInline,
  UserGroupInline,
  UserInline,
} from "../types.js"

const MARK_BY_DELIMITER = {
  "*": "bold",
  _: "italic",
  "~": "strike",
} as const

type Marker = keyof typeof MARK_BY_DELIMITER

type InlineState = {
  text: string
  pos: number
  diagnostics: Diagnostic[]
  options: Required<Pick<ParseMrkdwnOptions, "source" | "mode" | "surface" | "autolink">>
  baseOffset: number
}

type InlineParseResult = {
  inlines: SlackInline[]
  closed: boolean
}

type ListMarker = {
  style: "bullet" | "ordered"
  indent: number
  body: string
  contentOffset: number
  offset?: number
}

export function parseMrkdwn(text: string, options: ParseMrkdwnOptions = {}): ParseResult {
  const normalizedText = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n")
  const diagnostics: Diagnostic[] = []
  const resolvedOptions = {
    source: options.source ?? "publish",
    surface: options.surface ?? "message_text",
    mode: options.mode ?? "compat",
    autolink: options.autolink ?? true,
  } as const

  const blocks = parseBlocks(normalizedText, resolvedOptions, diagnostics)
  const normalized = normalizeDocument(createDocument({ blocks }))
  return {
    document: normalized.document,
    diagnostics: [...diagnostics, ...normalized.diagnostics],
  }
}

function parseBlocks(
  text: string,
  options: Required<Pick<ParseMrkdwnOptions, "source" | "mode" | "surface" | "autolink">>,
  diagnostics: Diagnostic[],
): SlackBlock[] {
  const lines = text.split("\n")
  const lineOffsets = buildLineOffsets(text)
  const blocks: SlackBlock[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index] ?? ""
    if (line.trim() === "") {
      index += 1
      continue
    }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim() || undefined
      const body: string[] = []
      index += 1
      while (index < lines.length && lines[index] !== "```") {
        body.push(lines[index] ?? "")
        index += 1
      }
      if (index < lines.length && lines[index] === "```") {
        index += 1
      }
      blocks.push({
        kind: "preformatted",
        text: body.join("\n"),
        ...(language ? { language } : {}),
      })
      continue
    }

    if (line.startsWith(">")) {
      const quoteLines: string[] = []
      const start = lineOffsets[index] ?? 0
      while (index < lines.length && (lines[index] ?? "").startsWith(">")) {
        const current = lines[index] ?? ""
        quoteLines.push(current.startsWith("> ") ? current.slice(2) : current.slice(1))
        index += 1
      }
      const combined = quoteLines.join("\n")
      const parsed = parseInlineSequence({
        text: combined,
        pos: 0,
        diagnostics,
        options,
        baseOffset: start,
      })
      blocks.push({
        kind: "quote",
        inlines: parsed.inlines,
      })
      continue
    }

    const listMarker = parseListMarker(line)
    if (listMarker) {
      const { block, nextIndex } = parseListBlock(lines, lineOffsets, index, options, diagnostics)
      blocks.push(block)
      index = nextIndex
      continue
    }

    const paragraphLines: string[] = []
    const start = lineOffsets[index] ?? 0
    while (
      index < lines.length &&
      (lines[index] ?? "").trim() !== "" &&
      !(lines[index] ?? "").startsWith(">") &&
      !(lines[index] ?? "").startsWith("```") &&
      !parseListMarker(lines[index] ?? "")
    ) {
      paragraphLines.push(lines[index] ?? "")
      index += 1
    }

    const parsed = parseInlineSequence({
      text: paragraphLines.join("\n"),
      pos: 0,
      diagnostics,
      options,
      baseOffset: start,
    })
    blocks.push({
      kind: "paragraph",
      inlines: parsed.inlines,
    })
  }

  return blocks
}

function buildLineOffsets(text: string): number[] {
  const offsets = [0]
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") {
      offsets.push(index + 1)
    }
  }
  return offsets
}

function parseListBlock(
  lines: string[],
  lineOffsets: number[],
  startIndex: number,
  options: Required<Pick<ParseMrkdwnOptions, "source" | "mode" | "surface" | "autolink">>,
  diagnostics: Diagnostic[],
): { block: SlackBlock; nextIndex: number } {
  const firstMarker = parseListMarker(lines[startIndex] ?? "")
  if (!firstMarker) {
    throw new Error("Expected list marker at startIndex.")
  }

  const items: { inlines: SlackInline[] }[] = []
  let index = startIndex

  while (index < lines.length) {
    const marker = parseListMarker(lines[index] ?? "")
    if (!marker || marker.style !== firstMarker.style || marker.indent !== firstMarker.indent) {
      break
    }

    const itemStart = index
    const itemLines = [marker.body]
    index += 1

    while (index < lines.length) {
      const current = lines[index] ?? ""
      if (current.trim() === "" || current.startsWith(">") || current.startsWith("```")) {
        break
      }

      if (parseListMarker(current)) {
        break
      }

      const continuation = parseListContinuation(current, marker.indent)
      if (continuation === null) {
        break
      }

      itemLines.push(continuation)
      index += 1
    }

    const parsed = parseInlineSequence({
      text: itemLines.join("\n"),
      pos: 0,
      diagnostics,
      options,
      baseOffset: (lineOffsets[itemStart] ?? 0) + marker.contentOffset,
    })

    items.push({
      inlines: parsed.inlines,
    })
  }

  return {
    block: {
      kind: "list",
      style: firstMarker.style,
      indent: firstMarker.indent,
      ...(firstMarker.offset !== undefined ? { offset: firstMarker.offset } : {}),
      items,
    },
    nextIndex: index,
  }
}

function parseListMarker(line: string): ListMarker | null {
  const bulletMatch = /^(\s*)-\s+(.*)$/.exec(line)
  if (bulletMatch) {
    const leading = bulletMatch[1] ?? ""
    return {
      style: "bullet",
      indent: Math.floor(leading.length / 2),
      body: bulletMatch[2] ?? "",
      contentOffset: leading.length + 2,
    }
  }

  const orderedMatch = /^(\s*)(\d+)\.\s+(.*)$/.exec(line)
  if (orderedMatch) {
    const leading = orderedMatch[1] ?? ""
    const offset = Number(orderedMatch[2])
    return {
      style: "ordered",
      indent: Math.floor(leading.length / 2),
      offset: Number.isInteger(offset) ? offset : 1,
      body: orderedMatch[3] ?? "",
      contentOffset: leading.length + (orderedMatch[2] ?? "").length + 2,
    }
  }

  return null
}

function parseListContinuation(line: string, indent: number): string | null {
  const prefix = "  ".repeat(Math.max(0, indent) + 1)
  if (!line.startsWith(prefix)) {
    return null
  }
  return line.slice(prefix.length)
}

function parseInlineSequence(state: InlineState, stopMarker?: Marker): InlineParseResult {
  const inlines: SlackInline[] = []
  let buffer = ""
  const _startPos = state.pos

  const flush = () => {
    if (buffer.length === 0) {
      return
    }
    const buffered = state.options.autolink
      ? autolinkText(buffer)
      : [{ kind: "text", text: buffer } satisfies TextInline]
    for (const inline of buffered) {
      appendInline(inlines, inline)
    }
    buffer = ""
  }

  while (state.pos < state.text.length) {
    const current = state.text[state.pos]
    if (!current) {
      break
    }

    if (stopMarker && current === stopMarker) {
      flush()
      state.pos += 1
      return { inlines, closed: true }
    }

    if (current === ":") {
      const emoji = parseColonEmoji(state)
      if (emoji) {
        flush()
        inlines.push(emoji)
        continue
      }
    }

    if (state.options.mode !== "strict" && current === "@") {
      const bareEntity = parseBareBroadcastMention(state) ?? parseBareUserMention(state)
      if (bareEntity) {
        flush()
        inlines.push(bareEntity)
        continue
      }
    }

    if (state.options.mode !== "strict" && current === "#") {
      const channel = parseBareChannelReference(state)
      if (channel) {
        flush()
        inlines.push(channel)
        continue
      }
    }

    if (current === "<") {
      const entity = parseAngleEntity(state)
      if (entity) {
        flush()
        appendInline(inlines, entity)
        continue
      }
    }

    if (current === "`") {
      flush()
      const codeStart = state.pos
      const closing = state.text.indexOf("`", state.pos + 1)
      if (closing === -1) {
        const raw = state.text.slice(codeStart)
        appendInline(inlines, { kind: "text", text: raw })
        state.diagnostics.push({
          severity: "warning",
          code: "unclosed_code_span",
          message: "Inline code span is not closed.",
          span: spanFromState(state, codeStart, state.text.length),
        })
        state.pos = state.text.length
        break
      }

      const innerText = state.text.slice(state.pos + 1, closing)
      appendInline(inlines, {
        kind: "text",
        text: innerText,
        marks: { code: true },
      })
      state.pos = closing + 1
      continue
    }

    if (isMarker(current)) {
      flush()
      const styleStart = state.pos
      state.pos += 1
      const inner = parseInlineSequence(state, current)
      if (inner.closed && inner.inlines.length > 0) {
        for (const inline of applyMark(
          inner.inlines,
          MARK_BY_DELIMITER[current],
          state.diagnostics,
        )) {
          appendInline(inlines, inline)
        }
        continue
      }

      const raw = state.text.slice(styleStart, state.pos)
      appendInline(inlines, { kind: "text", text: raw })
      state.diagnostics.push({
        severity: "warning",
        code: "unclosed_style",
        message: "Styled span is not closed.",
        span: spanFromState(state, styleStart, state.pos),
      })
      continue
    }

    if (current === "\n") {
      flush()
      inlines.push({ kind: "linebreak" })
      state.pos += 1
      continue
    }

    const decoded = decodeHtmlEntity(state.text, state.pos)
    if (decoded) {
      buffer += decoded.value
      state.pos += decoded.length
      continue
    }

    buffer += current
    state.pos += 1
  }

  flush()
  return {
    inlines,
    closed: stopMarker === undefined,
  }
}

function parseColonEmoji(state: InlineState): EmojiInline | null {
  const match = /^:([a-z0-9_+-]+):/i.exec(state.text.slice(state.pos))
  if (!match) {
    return null
  }
  state.pos += match[0].length
  return {
    kind: "emoji",
    name: match[1] ?? "",
  }
}

function parseBareBroadcastMention(state: InlineState): BroadcastInline | null {
  const body = state.text.slice(state.pos)
  const match = /^@(here|channel|everyone)(?=$|[^A-Za-z0-9_.-])/i.exec(body)
  if (!match) {
    return null
  }

  if (!hasBareMentionBoundary(state.text[state.pos - 1])) {
    return null
  }

  state.pos += match[0].length
  return {
    kind: "broadcast",
    range: match[1]?.toLowerCase() as BroadcastInline["range"],
  }
}

function parseBareUserMention(state: InlineState): UserInline | null {
  const body = state.text.slice(state.pos)
  const match = /^@([A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9_.-])/i.exec(body)
  if (!match) {
    return null
  }

  if (!hasBareMentionBoundary(state.text[state.pos - 1])) {
    return null
  }

  const name = match[1]
  if (!name || BROADCAST_NAMES.has(name.toLowerCase())) {
    return null
  }

  state.pos += match[0].length
  return {
    kind: "user",
    userId: name,
  }
}

function parseBareChannelReference(state: InlineState): ChannelInline | null {
  const body = state.text.slice(state.pos)
  const match = /^#([A-Za-z][A-Za-z0-9_-]*)(?=$|[^A-Za-z0-9_-])/i.exec(body)
  if (!match) {
    return null
  }

  if (!hasBareMentionBoundary(state.text[state.pos - 1])) {
    return null
  }

  const channelName = match[1]
  if (!channelName) {
    return null
  }

  state.pos += match[0].length
  return {
    kind: "channel",
    channelId: channelName,
  }
}

function hasBareMentionBoundary(previous: string | undefined): boolean {
  if (previous == null) {
    return true
  }
  return !/[A-Za-z0-9_./@#-]/.test(previous)
}

const BROADCAST_NAMES = new Set(["here", "channel", "everyone"])

function parseAngleEntity(state: InlineState): SlackInline | null {
  const start = state.pos
  const end = state.text.indexOf(">", start + 1)
  if (end === -1) {
    return null
  }

  const body = state.text.slice(start + 1, end)
  state.pos = end + 1

  if (body.startsWith("#")) {
    const [channelId, label] = splitOnce(body.slice(1), "|")
    const channel: ChannelInline = {
      kind: "channel",
      channelId,
      ...(label ? { label } : {}),
    }
    return channel
  }

  if (body.startsWith("@")) {
    const user: UserInline = {
      kind: "user",
      userId: body.slice(1),
    }
    return user
  }

  if (body.startsWith("!subteam^")) {
    const [usergroupId, label] = splitOnce(body.slice("!subteam^".length), "|")
    const group: UserGroupInline = {
      kind: "usergroup",
      usergroupId,
      ...(label ? { label } : {}),
    }
    return group
  }

  if (body === "!here" || body === "!channel" || body === "!everyone") {
    const broadcast: BroadcastInline = {
      kind: "broadcast",
      range: body.slice(1) as BroadcastInline["range"],
    }
    return broadcast
  }

  if (body.startsWith("!date^")) {
    const date = parseDateEntity(body, state.diagnostics, state.baseOffset + start)
    if (date) {
      return date
    }
    return { kind: "text", text: `<${body}>` }
  }

  if (body.startsWith("mailto:")) {
    const [url, label] = splitOnce(body, "|")
    const link: LinkInline = {
      kind: "link",
      url,
      isMailto: true,
      ...(label ? { label } : {}),
    }
    return link
  }

  if (looksLikeUrl(body)) {
    const [url, label] = splitOnce(body, "|")
    const link: LinkInline = {
      kind: "link",
      url,
      ...(label ? { label } : {}),
    }
    return link
  }

  state.diagnostics.push({
    severity: "warning",
    code: "unknown_entity",
    message: `Unsupported angle entity: <${body}>`,
    span: spanFromState(state, start, end + 1),
  })
  return {
    kind: "text",
    text: `<${body}>`,
  }
}

function parseDateEntity(
  body: string,
  diagnostics: Diagnostic[],
  offset: number,
): DateInline | null {
  const [left, fallback] = splitOnce(body, "|")
  if (!fallback) {
    diagnostics.push({
      severity: "warning",
      code: "invalid_date",
      message: "Date entity is missing fallback text.",
      span: { start: offset, end: offset + body.length + 2 },
    })
    return null
  }

  const parts = left.split("^")
  if (parts.length !== 3 && parts.length !== 4) {
    diagnostics.push({
      severity: "warning",
      code: "invalid_date",
      message: "Date entity has an invalid shape.",
      span: { start: offset, end: offset + body.length + 2 },
    })
    return null
  }

  const timestamp = Number(parts[1])
  if (!Number.isInteger(timestamp)) {
    diagnostics.push({
      severity: "warning",
      code: "invalid_date",
      message: "Date timestamp must be an integer.",
      span: { start: offset, end: offset + body.length + 2 },
    })
    return null
  }

  return {
    kind: "date",
    timestamp,
    format: parts[2] ?? "",
    fallback,
    ...(parts[3] ? { url: parts[3] } : {}),
  }
}

function applyMark(
  inlines: SlackInline[],
  mark: keyof MarkSet,
  diagnostics: Diagnostic[],
): SlackInline[] {
  return inlines.map((inline) => {
    if (inline.kind === "text" || inline.kind === "link") {
      return {
        ...inline,
        marks: {
          ...inline.marks,
          [mark]: true,
        },
      }
    }

    if (inline.kind !== "linebreak") {
      diagnostics.push({
        severity: "warning",
        code: "unsupported_mark_combination",
        message: `Cannot apply ${mark} mark to ${inline.kind}.`,
      })
    }
    return inline
  })
}

function appendInline(target: SlackInline[], inline: SlackInline): void {
  if (inline.kind === "text" && inline.text.length === 0) {
    return
  }
  const previous = target.at(-1)
  if (
    previous?.kind === "text" &&
    inline.kind === "text" &&
    sameMarks(previous.marks, inline.marks)
  ) {
    previous.text += inline.text
    return
  }
  target.push(inline)
}

function sameMarks(left?: MarkSet, right?: MarkSet): boolean {
  return (
    Boolean(left?.bold) === Boolean(right?.bold) &&
    Boolean(left?.italic) === Boolean(right?.italic) &&
    Boolean(left?.strike) === Boolean(right?.strike) &&
    Boolean(left?.code) === Boolean(right?.code)
  )
}

function autolinkText(text: string): SlackInline[] {
  const result: SlackInline[] = []
  const regex = /https?:\/\/[^\s<]+/g
  let lastIndex = 0

  for (const match of text.matchAll(regex)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      result.push({ kind: "text", text: text.slice(lastIndex, index) })
    }
    result.push({ kind: "link", url: match[0] })
    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) {
    result.push({ kind: "text", text: text.slice(lastIndex) })
  }

  return result.length > 0 ? result : [{ kind: "text", text }]
}

function looksLikeUrl(value: string): boolean {
  const candidate = value.split("|")[0] ?? value
  return candidate.startsWith("http://") || candidate.startsWith("https://")
}

function splitOnce(text: string, separator: string): [string, string | undefined] {
  const index = text.indexOf(separator)
  if (index === -1) {
    return [text, undefined]
  }
  return [text.slice(0, index), text.slice(index + separator.length)]
}

function decodeHtmlEntity(text: string, index: number): { value: string; length: number } | null {
  if (text.startsWith("&amp;", index)) {
    return { value: "&", length: 5 }
  }
  if (text.startsWith("&lt;", index)) {
    return { value: "<", length: 4 }
  }
  if (text.startsWith("&gt;", index)) {
    return { value: ">", length: 4 }
  }
  return null
}

function spanFromState(state: InlineState, start: number, end: number): SourceSpan {
  return {
    start: state.baseOffset + start,
    end: state.baseOffset + end,
  }
}

function isMarker(value: string): value is Marker {
  return value === "*" || value === "_" || value === "~"
}
