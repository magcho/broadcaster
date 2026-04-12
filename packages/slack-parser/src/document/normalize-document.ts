import type {
  Diagnostic,
  LineBreakInline,
  ListItem,
  MarkSet,
  NormalizeOptions,
  NormalizeResult,
  SlackBlock,
  SlackDocument,
  SlackInline,
  TextInline,
} from "../types.js"

const lineBreak: LineBreakInline = { kind: "linebreak" }

export function normalizeDocument(
  document: SlackDocument,
  options: NormalizeOptions = {},
): NormalizeResult {
  const diagnostics: Diagnostic[] = []
  const blocks = document.blocks
    .map((block) => normalizeBlock(block, diagnostics))
    .filter((block): block is SlackBlock => {
      if (!block) {
        return false
      }
      if (options.keepEmptyParagraphs) {
        return true
      }
      if (block.kind === "preformatted") {
        return block.text.length > 0
      }
      if (block.kind === "list") {
        return block.items.length > 0
      }
      return block.inlines.length > 0
    })

  return {
    document: {
      kind: "document",
      blocks,
    },
    diagnostics,
  }
}

function normalizeBlock(
  block: SlackBlock,
  diagnostics: Diagnostic[],
): SlackBlock | null {
  switch (block.kind) {
    case "paragraph": {
      // NOTE: 改行をTrimしない（入力中は改行を許容するため）
      const inlines = normalizeInlines(block.inlines, diagnostics)
      if (inlines.length === 0) {
        return null
      }
      return {
        kind: block.kind,
        inlines,
      }
    }
    case "quote": {
      const inlines = trimLineBreaks(
        normalizeInlines(block.inlines, diagnostics),
      )
      if (inlines.length === 0) {
        return null
      }
      return {
        kind: block.kind,
        inlines,
      }
    }

    case "preformatted":
      return {
        kind: "preformatted",
        text: block.text,
        ...(block.language ? { language: block.language } : {}),
      }

    case "list": {
      const items = block.items
        .map((item) => normalizeListItem(item, diagnostics))
        .filter((item): item is ListItem => item.inlines.length > 0)

      if (items.length === 0) {
        return null
      }

      return {
        kind: "list",
        style: block.style,
        indent: Math.max(0, block.indent),
        ...(block.offset !== undefined ? { offset: block.offset } : {}),
        items,
      }
    }
  }
}

function normalizeListItem(
  item: ListItem,
  diagnostics: Diagnostic[],
): ListItem {
  return {
    inlines: trimLineBreaks(normalizeInlines(item.inlines, diagnostics)),
  }
}

function normalizeInlines(
  inlines: SlackInline[],
  diagnostics: Diagnostic[],
): SlackInline[] {
  const normalized: SlackInline[] = []

  for (const inline of inlines) {
    if (inline.kind === "text") {
      if (inline.text.length === 0) {
        continue
      }

      const marks = normalizeMarks(inline.marks)
      appendText(normalized, {
        kind: "text",
        text: inline.text,
        ...(marks ? { marks } : {}),
      })
      continue
    }

    if (inline.kind === "link") {
      const marks = normalizeMarks(inline.marks)
      normalized.push({
        kind: "link",
        url: inline.url,
        ...(inline.label ? { label: inline.label } : {}),
        ...(inline.isMailto ? { isMailto: true } : {}),
        ...(marks ? { marks } : {}),
      })
      continue
    }

    if (inline.kind === "linebreak") {
      if (normalized.length === 0) {
        continue
      }
      normalized.push(lineBreak)
      continue
    }

    if ("marks" in inline && inline.marks) {
      diagnostics.push({
        severity: "warning",
        code: "unsupported_mark_combination",
        message: `Marks are not supported on ${inline.kind}.`,
      })
    }

    normalized.push(inline)
  }

  return normalized
}

function trimLineBreaks(inlines: SlackInline[]): SlackInline[] {
  let start = 0
  let end = inlines.length

  while (start < end && inlines[start]?.kind === "linebreak") {
    start += 1
  }

  while (end > start && inlines[end - 1]?.kind === "linebreak") {
    end -= 1
  }

  return inlines.slice(start, end)
}

function normalizeMarks(marks?: MarkSet): MarkSet | undefined {
  if (!marks) {
    return undefined
  }

  const next: MarkSet = {}

  if (marks.bold) {
    next.bold = true
  }
  if (marks.italic) {
    next.italic = true
  }
  if (marks.strike) {
    next.strike = true
  }
  if (marks.code) {
    next.code = true
  }

  return Object.keys(next).length > 0 ? next : undefined
}

function appendText(target: SlackInline[], next: TextInline): void {
  const previous = target.at(-1)
  if (previous?.kind === "text" && sameMarks(previous.marks, next.marks)) {
    previous.text += next.text
    return
  }
  target.push(next)
}

function sameMarks(left?: MarkSet, right?: MarkSet): boolean {
  return (
    Boolean(left?.bold) === Boolean(right?.bold) &&
    Boolean(left?.italic) === Boolean(right?.italic) &&
    Boolean(left?.strike) === Boolean(right?.strike) &&
    Boolean(left?.code) === Boolean(right?.code)
  )
}
