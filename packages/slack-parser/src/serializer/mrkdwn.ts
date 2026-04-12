import type {
  Diagnostic,
  MarkSet,
  SerializeMrkdwnOptions,
  SerializeMrkdwnResult,
  SlackBlock,
  SlackDocument,
  SlackInline,
} from "../types.js"

export function serializeToMrkdwn(
  document: SlackDocument,
  _options: SerializeMrkdwnOptions = {},
): SerializeMrkdwnResult {
  const diagnostics: Diagnostic[] = []
  return {
    text: document.blocks
      .map((block) => serializeBlock(block, diagnostics))
      .join("\n\n"),
    diagnostics,
  }
}

function serializeBlock(block: SlackBlock, diagnostics: Diagnostic[]): string {
  switch (block.kind) {
    case "paragraph":
      return serializeInlines(block.inlines, diagnostics)

    case "quote":
      return serializeInlines(block.inlines, diagnostics)
        .split("\n")
        .map((line) => (line.length > 0 ? `> ${line}` : ">"))
        .join("\n")

    case "preformatted":
      return `\`\`\`${block.language ?? ""}\n${block.text}\n\`\`\``

    case "list":
      return block.items
        .map((item, index) => {
          const prefixBase = "  ".repeat(Math.max(0, block.indent))
          const prefix =
            block.style === "ordered"
              ? `${prefixBase}${(block.offset ?? 1) + index}. `
              : `${prefixBase}- `
          const body = serializeInlines(item.inlines, diagnostics)
          return body
            .split("\n")
            .map(
              (line, lineIndex) =>
                `${lineIndex === 0 ? prefix : `${prefixBase}  `}${line}`,
            )
            .join("\n")
        })
        .join("\n")
  }
}

function serializeInlines(
  inlines: SlackInline[],
  diagnostics: Diagnostic[],
): string {
  return inlines.map((inline) => serializeInline(inline, diagnostics)).join("")
}

function serializeInline(
  inline: SlackInline,
  diagnostics: Diagnostic[],
): string {
  switch (inline.kind) {
    case "text":
      return wrapMarks(escapeText(inline.text), inline.marks)

    case "link": {
      if (inline.marks && Object.keys(inline.marks).length > 0) {
        diagnostics.push({
          severity: "warning",
          code: "lossy_mrkdwn_export",
          message: "Link style is dropped in mrkdwn fallback export.",
        })
      }
      const target =
        inline.isMailto && !inline.url.startsWith("mailto:")
          ? `mailto:${inline.url}`
          : inline.url
      if (inline.label) {
        return `<${target}|${inline.label}>`
      }
      return `<${target}>`
    }

    case "user":
      return `<@${inline.userId}>`

    case "usergroup":
      return `<!subteam^${inline.usergroupId}${inline.label ? `|${inline.label}` : ""}>`

    case "channel":
      return `<#${inline.channelId}${inline.label ? `|${inline.label}` : ""}>`

    case "broadcast":
      return `<!${inline.range}>`

    case "date":
      return `<!date^${inline.timestamp}^${inline.format}${inline.url ? `^${inline.url}` : ""}|${inline.fallback}>`

    case "emoji":
      return `:${inline.name}:`

    case "linebreak":
      return "\n"
  }
}

function wrapMarks(text: string, marks?: MarkSet): string {
  if (!marks) {
    return text
  }

  let result = text
  if (marks.code) {
    result = `\`${result}\``
  }
  if (marks.strike) {
    result = `~${result}~`
  }
  if (marks.italic) {
    result = `_${result}_`
  }
  if (marks.bold) {
    result = `*${result}*`
  }
  return result
}

function escapeText(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}
