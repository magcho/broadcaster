import { createDocument } from "../document/create-document.js"
import { normalizeDocument } from "../document/normalize-document.js"
import type {
  Diagnostic,
  MarkSet,
  ParseResult,
  ParseRichTextOptions,
  SlackBlock,
  SlackInline,
  SlackRichTextBlock,
  SlackRichTextElement,
  SlackRichTextInline,
  SlackRichTextLink,
  SlackRichTextList,
  SlackRichTextPreformatted,
  SlackRichTextQuote,
  SlackRichTextSection,
  SlackRichTextText,
  SlackStyle,
} from "../types.js"
import { ExhaustiveError } from "../utils/exhaustive.js"

export function parseRichText(
  block: SlackRichTextBlock,
  _options: ParseRichTextOptions = {},
): ParseResult {
  const diagnostics: Diagnostic[] = []
  const blocks = block.elements.flatMap((element) => parseBlockElement(element, diagnostics))
  const normalized = normalizeDocument(createDocument({ blocks }))
  return {
    document: normalized.document,
    diagnostics: [...diagnostics, ...normalized.diagnostics],
  }
}

function parseBlockElement(element: SlackRichTextElement, diagnostics: Diagnostic[]): SlackBlock[] {
  switch (element.type) {
    case "rich_text_section": {
      const section = element as SlackRichTextSection
      return [
        {
          kind: "paragraph",
          inlines: parseInlineElements(section.elements, diagnostics),
        },
      ]
    }

    case "rich_text_quote": {
      const quote = element as SlackRichTextQuote
      return [
        {
          kind: "quote",
          inlines: parseInlineElements(quote.elements, diagnostics),
        },
      ]
    }

    case "rich_text_preformatted": {
      const preformatted = element as SlackRichTextPreformatted
      return [
        {
          kind: "preformatted",
          text: renderPlainText(parseInlineElements(preformatted.elements, diagnostics)),
          ...(preformatted.language ? { language: preformatted.language } : {}),
        },
      ]
    }

    case "rich_text_list": {
      const list = element as SlackRichTextList
      return [
        {
          kind: "list",
          style: list.style,
          indent: list.indent ?? 0,
          ...(list.offset !== undefined ? { offset: list.offset } : {}),
          items: list.elements.map((item) => ({
            inlines: parseInlineElements(item.elements, diagnostics),
          })),
        },
      ]
    }

    default: {
      diagnostics.push({
        severity: "warning",
        code: "unsupported_rich_text_element",
        message: `Unsupported rich_text block element: ${element.type}`,
      })
      return [
        {
          kind: "paragraph",
          inlines: [{ kind: "text", text: fallbackTextForUnknown(element) }],
        },
      ]
    }
  }
}

function parseInlineElements(
  elements: SlackRichTextInline[],
  diagnostics: Diagnostic[],
): SlackInline[] {
  const inlines: SlackInline[] = []

  for (const element of elements) {
    switch (element.type) {
      case "text": {
        const text = element as SlackRichTextText
        pushText(inlines, text.text, styleToMarks(text.style, diagnostics))
        break
      }

      case "link": {
        const link = element as SlackRichTextLink
        const marks = styleToMarks(link.style, diagnostics)
        inlines.push({
          kind: "link",
          url: link.url,
          ...(link.text ? { label: link.text } : {}),
          ...(marks ? { marks } : {}),
        })
        break
      }

      case "emoji":
        inlines.push({
          kind: "emoji",
          name: String((element as { name: string }).name),
        })
        break

      case "date": {
        const date = element as Extract<SlackRichTextInline, { type: "date" }>
        inlines.push({
          kind: "date",
          timestamp: date.timestamp,
          format: date.format,
          fallback: date.fallback ?? date.format,
          ...(date.url ? { url: date.url } : {}),
        })
        collectUnsupportedStyle(date.style, "date", diagnostics)
        break
      }

      case "broadcast": {
        const broadcast = element as Extract<SlackRichTextInline, { type: "broadcast" }>
        inlines.push({
          kind: "broadcast",
          range: broadcast.range,
        })
        break
      }

      case "channel": {
        const channel = element as Extract<SlackRichTextInline, { type: "channel" }>
        inlines.push({
          kind: "channel",
          channelId: channel.channel_id,
        })
        collectUnsupportedStyle(channel.style, "channel", diagnostics)
        break
      }

      case "user": {
        const user = element as Extract<SlackRichTextInline, { type: "user" }>
        inlines.push({
          kind: "user",
          userId: user.user_id,
        })
        collectUnsupportedStyle(user.style, "user", diagnostics)
        break
      }

      case "usergroup": {
        const usergroup = element as Extract<SlackRichTextInline, { type: "usergroup" }>
        inlines.push({
          kind: "usergroup",
          usergroupId: usergroup.usergroup_id,
        })
        collectUnsupportedStyle(usergroup.style, "usergroup", diagnostics)
        break
      }

      default:
        diagnostics.push({
          severity: "warning",
          code: "unsupported_rich_text_element",
          message: `Unsupported rich_text inline element: ${element.type}`,
        })
        pushText(inlines, fallbackTextForUnknown(element))
        break
    }
  }

  return inlines
}

function pushText(target: SlackInline[], text: string, marks?: MarkSet): void {
  if (text.length === 0) {
    return
  }

  const parts = text.split("\n")
  parts.forEach((part, index) => {
    if (part.length > 0) {
      const previous = target.at(-1)
      if (previous?.kind === "text" && sameMarks(previous.marks, marks)) {
        previous.text += part
      } else {
        target.push({
          kind: "text",
          text: part,
          ...(marks ? { marks } : {}),
        })
      }
    }
    if (index < parts.length - 1) {
      target.push({ kind: "linebreak" })
    }
  })
}

function styleToMarks(
  style: SlackStyle | undefined,
  diagnostics: Diagnostic[],
): MarkSet | undefined {
  if (!style) {
    return undefined
  }

  const marks: MarkSet = {}
  if (style.bold) {
    marks.bold = true
  }
  if (style.italic) {
    marks.italic = true
  }
  if (style.strike) {
    marks.strike = true
  }
  if (style.code) {
    marks.code = true
  }

  if (style.underline || style.highlight || style.client_highlight || style.unlink) {
    diagnostics.push({
      severity: "warning",
      code: "unsupported_rich_text_style",
      message: "Unsupported rich_text style flag was dropped.",
    })
  }

  return Object.keys(marks).length > 0 ? marks : undefined
}

function collectUnsupportedStyle(
  style: SlackStyle | undefined,
  kind: string,
  diagnostics: Diagnostic[],
): void {
  if (!style) {
    return
  }
  diagnostics.push({
    severity: "warning",
    code: "unsupported_rich_text_style",
    message: `Style on ${kind} was dropped during import.`,
  })
}

function renderPlainText(inlines: SlackInline[]): string {
  return inlines
    .map((inline) => {
      switch (inline.kind) {
        case "text":
          return inline.text
        case "linebreak":
          return "\n"
        case "link":
          return inline.label ?? inline.url
        case "user":
          return `<@${inline.userId}>`
        case "usergroup":
          return `<!subteam^${inline.usergroupId}${inline.label ? `|${inline.label}` : ""}>`
        case "channel":
          return `<#${inline.channelId}${inline.label ? `|${inline.label}` : ""}>`
        case "broadcast":
          return `<!${inline.range}>`
        case "date":
          return inline.fallback
        case "emoji":
          return `:${inline.name}:`
      }
      throw new ExhaustiveError(inline)
    })
    .join("")
}

function sameMarks(left?: MarkSet, right?: MarkSet): boolean {
  return (
    Boolean(left?.bold) === Boolean(right?.bold) &&
    Boolean(left?.italic) === Boolean(right?.italic) &&
    Boolean(left?.strike) === Boolean(right?.strike) &&
    Boolean(left?.code) === Boolean(right?.code)
  )
}

function fallbackTextForUnknown(element: { type: string }): string {
  return `[unsupported:${element.type}]`
}
