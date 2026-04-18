import type {
  MarkSet,
  SerializeRichTextOptions,
  SlackBlock,
  SlackDocument,
  SlackInline,
  SlackRichTextBlock,
  SlackRichTextElement,
  SlackRichTextInline,
  SlackStyle,
} from "../types.js"

export function serializeToRichText(
  document: SlackDocument,
  _options: SerializeRichTextOptions = {},
): SlackRichTextBlock {
  return {
    type: "rich_text",
    elements: document.blocks.map(serializeBlock),
  }
}

function serializeBlock(block: SlackBlock): SlackRichTextElement {
  switch (block.kind) {
    case "paragraph":
      return {
        type: "rich_text_section",
        elements: serializeInlines(block.inlines),
      }

    case "quote":
      return {
        type: "rich_text_quote",
        elements: serializeInlines(block.inlines),
      }

    case "preformatted":
      return {
        type: "rich_text_preformatted",
        elements: [{ type: "text", text: block.text }],
        ...(block.language ? { language: block.language } : {}),
      }

    case "list":
      return {
        type: "rich_text_list",
        style: block.style,
        ...(block.indent ? { indent: block.indent } : {}),
        ...(block.offset !== undefined ? { offset: block.offset } : {}),
        elements: block.items.map((item) => ({
          type: "rich_text_section",
          elements: serializeInlines(item.inlines),
        })),
      }
  }
}

function serializeInlines(inlines: SlackInline[]): SlackRichTextInline[] {
  return inlines.map((inline) => {
    switch (inline.kind) {
      case "text":
        return {
          type: "text",
          text: inline.text,
          ...(inline.marks ? { style: marksToStyle(inline.marks) } : {}),
        }

      case "link":
        return {
          type: "link",
          url: inline.url,
          ...(inline.label ? { text: inline.label } : {}),
          ...(inline.marks ? { style: marksToStyle(inline.marks) } : {}),
        }

      case "user":
        return {
          type: "user",
          user_id: inline.userId,
        }

      case "usergroup":
        return {
          type: "usergroup",
          usergroup_id: inline.usergroupId,
        }

      case "channel":
        return {
          type: "channel",
          channel_id: inline.channelId,
        }

      case "broadcast":
        return {
          type: "broadcast",
          range: inline.range,
        }

      case "date":
        return {
          type: "date",
          timestamp: inline.timestamp,
          format: inline.format,
          fallback: inline.fallback,
          ...(inline.url ? { url: inline.url } : {}),
        }

      case "emoji":
        return {
          type: "emoji",
          name: inline.name,
        }

      case "linebreak":
        return {
          type: "text",
          text: "\n",
        }
      default:
        throw new Error(`Unsupported inline type: ${inline}`)
    }
  })
}

function marksToStyle(marks: MarkSet): SlackStyle {
  const style: SlackStyle = {}
  if (marks.bold) {
    style.bold = true
  }
  if (marks.italic) {
    style.italic = true
  }
  if (marks.strike) {
    style.strike = true
  }
  if (marks.code) {
    style.code = true
  }
  return style
}
