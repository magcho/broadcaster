import { createDocument } from "./document/create-document.js"
import { normalizeDocument } from "./document/normalize-document.js"
import type {
  MarkSet,
  SlackBlock,
  SlackDocument,
  SlackInline,
} from "./types.js"

export type EditorPoint = {
  path: [number, number]
  offset: number
}

export type EditorSelection = {
  anchor: EditorPoint
  focus: EditorPoint
}

export type EditorState = {
  document: SlackDocument
  selection: EditorSelection
  activeMarks?: MarkSet
  history: {
    undo: EditorSnapshot[]
    redo: EditorSnapshot[]
  }
}

type EditorSnapshot = {
  document: SlackDocument
  selection: EditorSelection
  activeMarks?: MarkSet
}

type MentionInput =
  | { kind: "user"; userId: string }
  | { kind: "channel"; channelId: string; label?: string }
  | { kind: "usergroup"; usergroupId: string; label?: string }
  | { kind: "broadcast"; range: "here" | "channel" | "everyone" }
  | { kind: "emoji"; name: string }

type EditorCommand =
  | { type: "set_selection"; selection: EditorSelection }
  | { type: "insert_text"; text: string }
  | { type: "paste_text"; text: string }
  | { type: "insert_mention"; mention: MentionInput }
  | { type: "toggle_mark"; mark: keyof MarkSet }
  | { type: "delete_backward"; unit: "character" }
  | { type: "delete_forward"; unit: "character" }
  | { type: "wrap_quote" }
  | { type: "toggle_list"; style: "bullet" | "ordered" }
  | { type: "insert_preformatted_block"; text: string; language?: string }
  | { type: "replace_range"; range: EditorRange; content: SlackDocument }
  | { type: "undo" }
  | { type: "redo" }

type EditorRange = {
  start: EditorPoint
  end: EditorPoint
}

type InlineSlice = {
  before: SlackInline[]
  after: SlackInline[]
}

type ReplacementResult = {
  blocks: SlackBlock[]
  caret: {
    blockOffset: number
    linearOffset: number
  }
}

export function createCollapsedSelection(point: EditorPoint): EditorSelection {
  return {
    anchor: clonePoint(point),
    focus: clonePoint(point),
  }
}

export function getDocumentEndPoint(document: SlackDocument): EditorPoint {
  const lastBlock = document.blocks.at(-1)
  if (!lastBlock) {
    return { path: [0, 0], offset: 0 }
  }

  const blockIndex = document.blocks.length - 1
  const inlines = getEditableInlines(lastBlock)
  if (!inlines) {
    return { path: [blockIndex, 0], offset: 0 }
  }

  const lastInline = inlines.at(-1)
  if (!lastInline) {
    return { path: [blockIndex, 0], offset: 0 }
  }

  return {
    path: [blockIndex, inlines.length - 1],
    offset: inlineLength(lastInline),
  }
}

export function createEditorState(
  input: { document?: SlackDocument; selection?: EditorSelection } = {},
): EditorState {
  const document = ensureEditableDocument(input.document ?? createDocument())
  return {
    document,
    selection: input.selection
      ? cloneSelection(input.selection)
      : createCollapsedSelection(getDocumentEndPoint(document)),
    history: {
      undo: [],
      redo: [],
    },
  }
}

export function applyCommand(
  state: EditorState,
  command: EditorCommand,
): { state: EditorState } {
  switch (command.type) {
    case "set_selection":
      return {
        state: {
          ...state,
          selection: cloneSelection(command.selection),
        },
      }

    case "undo":
      return { state: applyUndo(state) }

    case "redo":
      return { state: applyRedo(state) }
  }

  const snapshot = takeSnapshot(state)
  let next: EditorState

  switch (command.type) {
    case "insert_text":
      next = insertContent(state, textDocument(command.text, state.activeMarks))
      break

    case "paste_text":
      next = insertContent(state, textDocument(command.text, state.activeMarks))
      break

    case "insert_mention":
      next = insertContent(
        state,
        inlineDocument(mentionToInline(command.mention)),
      )
      break

    case "toggle_mark":
      next = toggleMark(state, command.mark)
      break

    case "delete_backward":
      next = deleteBackward(state)
      break

    case "delete_forward":
      next = deleteForward(state)
      break

    case "wrap_quote":
      next = wrapQuote(state)
      break

    case "toggle_list":
      next = toggleList(state, command.style)
      break

    case "insert_preformatted_block":
      next = insertPreformattedBlock(state, command.text, command.language)
      break

    case "replace_range":
      next = replaceRange(state, command.range, command.content)
      break
  }

  return {
    state: {
      ...next,
      history: {
        undo: [...state.history.undo, snapshot],
        redo: [],
      },
    },
  }
}

function applyUndo(state: EditorState): EditorState {
  const previous = state.history.undo.at(-1)
  if (!previous) {
    return state
  }

  return {
    ...restoreSnapshot(previous),
    history: {
      undo: state.history.undo.slice(0, -1),
      redo: [...state.history.redo, takeSnapshot(state)],
    },
  }
}

function applyRedo(state: EditorState): EditorState {
  const next = state.history.redo.at(-1)
  if (!next) {
    return state
  }

  return {
    ...restoreSnapshot(next),
    history: {
      undo: [...state.history.undo, takeSnapshot(state)],
      redo: state.history.redo.slice(0, -1),
    },
  }
}

function insertContent(
  state: EditorState,
  content: SlackDocument,
): EditorState {
  const range = getSelectionRange(state.selection)
  return replaceRange(state, range, content)
}

function replaceRange(
  state: EditorState,
  range: EditorRange,
  content: SlackDocument,
): EditorState {
  const normalizedRange = normalizeRange(range)
  const document = ensureEditableDocument(state.document)
  const blocks = document.blocks.slice()
  const startBlock = blocks[normalizedRange.start.path[0]]
  const endBlock = blocks[normalizedRange.end.path[0]]

  if (!startBlock || !endBlock) {
    return state
  }

  const startInlines = getEditableInlines(startBlock)
  const endInlines = getEditableInlines(endBlock)
  if (!startInlines || !endInlines) {
    return state
  }

  const startSlice = splitInlines(startInlines, normalizedRange.start)
  const endSlice = splitInlines(endInlines, normalizedRange.end)
  const replacementBlocks = cloneDocument(content).blocks
  const replacement = mergeReplacementBlocks(
    startBlock,
    startSlice.before,
    replacementBlocks,
    endBlock,
    endSlice.after,
  )

  blocks.splice(
    normalizedRange.start.path[0],
    normalizedRange.end.path[0] - normalizedRange.start.path[0] + 1,
    ...replacement.blocks,
  )

  const normalizedDocument = normalizeEditorDocument({
    kind: "document",
    blocks,
  })
  return {
    ...state,
    document: normalizedDocument,
    selection: createCollapsedSelection(
      findPointAtLinearOffset(
        normalizedDocument.blocks[
          Math.min(
            normalizedRange.start.path[0] + replacement.caret.blockOffset,
            normalizedDocument.blocks.length - 1,
          )
        ],
        Math.min(
          normalizedRange.start.path[0] + replacement.caret.blockOffset,
          normalizedDocument.blocks.length - 1,
        ),
        replacement.caret.linearOffset,
      ),
    ),
  }
}

function toggleMark(state: EditorState, mark: keyof MarkSet): EditorState {
  const range = getSelectionRange(state.selection)
  if (isCollapsedRange(range)) {
    const activeMarks = { ...(state.activeMarks ?? {}) }
    if (activeMarks[mark]) {
      delete activeMarks[mark]
    } else {
      activeMarks[mark] = true
    }
    const { activeMarks: _ignored, ...rest } = state
    return Object.keys(activeMarks).length > 0 ? { ...rest, activeMarks } : rest
  }

  const normalizedRange = normalizeRange(range)
  const shouldAdd = !allSelectedTextHasMark(
    state.document,
    normalizedRange,
    mark,
  )
  const blocks = state.document.blocks.map((block, blockIndex) => {
    if (
      blockIndex < normalizedRange.start.path[0] ||
      blockIndex > normalizedRange.end.path[0]
    ) {
      return block
    }

    const inlines = getEditableInlines(block)
    if (!inlines) {
      return block
    }

    const startPoint =
      blockIndex === normalizedRange.start.path[0]
        ? normalizedRange.start
        : { path: [blockIndex, 0] as [number, number], offset: 0 }
    const endPoint =
      blockIndex === normalizedRange.end.path[0]
        ? normalizedRange.end
        : endPointForInlines(blockIndex, inlines)

    const startSlice = splitInlines(inlines, startPoint)
    const selectedSlice = splitInlines(
      startSlice.after,
      rebasePoint(endPoint, startSlice.before.length),
    )

    return setBlockInlines(block, [
      ...startSlice.before,
      ...applyMarkToInlines(selectedSlice.before, mark, shouldAdd),
      ...selectedSlice.after,
    ])
  })

  const document = normalizeEditorDocument({
    kind: "document",
    blocks,
  })
  return {
    ...state,
    document,
    selection: cloneSelection(state.selection),
  }
}

function deleteBackward(state: EditorState): EditorState {
  const range = getSelectionRange(state.selection)
  if (!isCollapsedRange(range)) {
    return replaceRange(state, range, createDocument())
  }

  const point = range.start
  const block = state.document.blocks[point.path[0]]
  const inlines = block ? getEditableInlines(block) : null
  if (!block || !inlines) {
    return state
  }

  const inline = inlines[point.path[1]]
  if (inline && point.offset > 0) {
    if (inline.kind === "text") {
      return replaceRange(
        state,
        {
          start: {
            path: point.path,
            offset: point.offset - 1,
          },
          end: point,
        },
        createDocument(),
      )
    }

    return replaceRange(
      state,
      {
        start: {
          path: point.path,
          offset: 0,
        },
        end: point,
      },
      createDocument(),
    )
  }

  if (point.path[1] > 0) {
    const previous = inlines[point.path[1] - 1]
    return replaceRange(
      state,
      {
        start: {
          path: [point.path[0], point.path[1] - 1],
          offset: previous?.kind === "text" ? previous.text.length : 0,
        },
        end: point,
      },
      createDocument(),
    )
  }

  if (point.path[0] > 0) {
    return mergeAdjacentBlocks(state, point.path[0] - 1, point.path[0])
  }

  return state
}

function deleteForward(state: EditorState): EditorState {
  const range = getSelectionRange(state.selection)
  if (!isCollapsedRange(range)) {
    return replaceRange(state, range, createDocument())
  }

  const point = range.start
  const block = state.document.blocks[point.path[0]]
  const inlines = block ? getEditableInlines(block) : null
  if (!block || !inlines) {
    return state
  }

  const inline = inlines[point.path[1]]
  if (inline && point.offset < inlineLength(inline)) {
    return replaceRange(
      state,
      {
        start: point,
        end: {
          path: point.path,
          offset: point.offset + 1,
        },
      },
      createDocument(),
    )
  }

  if (point.path[1] + 1 < inlines.length) {
    return replaceRange(
      state,
      {
        start: {
          path: [point.path[0], point.path[1] + 1],
          offset: 0,
        },
        end: {
          path: [point.path[0], point.path[1] + 1],
          offset: 1,
        },
      },
      createDocument(),
    )
  }

  if (point.path[0] + 1 < state.document.blocks.length) {
    return mergeAdjacentBlocks(state, point.path[0], point.path[0] + 1)
  }

  return state
}

function wrapQuote(state: EditorState): EditorState {
  const blockIndex = state.selection.anchor.path[0]
  const block = state.document.blocks[blockIndex]
  if (!block) {
    return state
  }

  const inlines = getEditableInlines(block)
  if (!inlines) {
    return state
  }

  const blocks = state.document.blocks.slice()
  blocks[blockIndex] = {
    kind: "quote",
    inlines: cloneInlines(inlines),
  }

  return {
    ...state,
    document: normalizeEditorDocument({
      kind: "document",
      blocks,
    }),
  }
}

function toggleList(
  state: EditorState,
  style: "bullet" | "ordered",
): EditorState {
  const blockIndex = state.selection.anchor.path[0]
  const block = state.document.blocks[blockIndex]
  if (!block) {
    return state
  }

  const inlines = getEditableInlines(block)
  if (!inlines) {
    return state
  }

  const blocks = state.document.blocks.slice()
  blocks[blockIndex] = {
    kind: "list",
    style,
    indent: 0,
    items: [{ inlines: cloneInlines(inlines) }],
  }

  return {
    ...state,
    document: normalizeEditorDocument({
      kind: "document",
      blocks,
    }),
  }
}

function insertPreformattedBlock(
  state: EditorState,
  text: string,
  language?: string,
): EditorState {
  const blockIndex = Math.min(
    state.selection.anchor.path[0] + 1,
    state.document.blocks.length,
  )
  const blocks = state.document.blocks.slice()
  blocks.splice(blockIndex, 0, {
    kind: "preformatted",
    text,
    ...(language ? { language } : {}),
  })

  const document = normalizeEditorDocument({
    kind: "document",
    blocks,
  })

  return {
    ...state,
    document,
    selection: createCollapsedSelection(getDocumentEndPoint(document)),
  }
}

function mergeAdjacentBlocks(
  state: EditorState,
  leftIndex: number,
  rightIndex: number,
): EditorState {
  const left = state.document.blocks[leftIndex]
  const right = state.document.blocks[rightIndex]
  const leftInlines = left ? getEditableInlines(left) : null
  const rightInlines = right ? getEditableInlines(right) : null
  if (!left || !right || !leftInlines || !rightInlines) {
    return state
  }

  const blocks = state.document.blocks.slice()
  blocks.splice(rightIndex, 1)
  blocks[leftIndex] = setBlockInlines(left, [...leftInlines, ...rightInlines])

  const document = normalizeEditorDocument({
    kind: "document",
    blocks,
  })
  return {
    ...state,
    document,
    selection: createCollapsedSelection(getDocumentEndPoint(document)),
  }
}

function textDocument(text: string, marks?: MarkSet): SlackDocument {
  return createDocument({
    blocks: [
      {
        kind: "paragraph",
        inlines: parseTextToInlines(text, marks),
      },
    ],
  })
}

function inlineDocument(inline: SlackInline): SlackDocument {
  return createDocument({
    blocks: [
      {
        kind: "paragraph",
        inlines: [cloneInline(inline)],
      },
    ],
  })
}

function parseTextToInlines(text: string, marks?: MarkSet): SlackInline[] {
  const lines = text.split("\n")
  const inlines: SlackInline[] = []
  lines.forEach((part, index) => {
    if (part.length > 0) {
      inlines.push({
        kind: "text",
        text: part,
        ...(marks ? { marks: { ...marks } } : {}),
      })
    }
    if (index < lines.length - 1) {
      inlines.push({ kind: "linebreak" })
    }
  })
  return inlines
}

function mentionToInline(mention: MentionInput): SlackInline {
  switch (mention.kind) {
    case "user":
      return { kind: "user", userId: mention.userId }
    case "channel":
      return {
        kind: "channel",
        channelId: mention.channelId,
        ...(mention.label ? { label: mention.label } : {}),
      }
    case "usergroup":
      return {
        kind: "usergroup",
        usergroupId: mention.usergroupId,
        ...(mention.label ? { label: mention.label } : {}),
      }
    case "broadcast":
      return { kind: "broadcast", range: mention.range }
    case "emoji":
      return { kind: "emoji", name: mention.name }
  }
}

function getSelectionRange(selection: EditorSelection): EditorRange {
  return {
    start: clonePoint(selection.anchor),
    end: clonePoint(selection.focus),
  }
}

function normalizeRange(range: EditorRange): EditorRange {
  return comparePoints(range.start, range.end) <= 0
    ? { start: clonePoint(range.start), end: clonePoint(range.end) }
    : { start: clonePoint(range.end), end: clonePoint(range.start) }
}

function isCollapsedRange(range: EditorRange): boolean {
  return comparePoints(range.start, range.end) === 0
}

function comparePoints(left: EditorPoint, right: EditorPoint): number {
  if (left.path[0] !== right.path[0]) {
    return left.path[0] - right.path[0]
  }
  if (left.path[1] !== right.path[1]) {
    return left.path[1] - right.path[1]
  }
  return left.offset - right.offset
}

function splitInlines(inlines: SlackInline[], point: EditorPoint): InlineSlice {
  const before: SlackInline[] = []
  const after = cloneInlines(inlines)
  const inlineIndex = Math.min(point.path[1], after.length)

  for (let index = 0; index < inlineIndex; index += 1) {
    const inline = after.shift()
    if (inline) {
      before.push(inline)
    }
  }

  const current = after.shift()
  if (!current) {
    return { before, after }
  }

  if (current.kind === "text") {
    const offset = clamp(point.offset, 0, current.text.length)
    if (offset > 0) {
      before.push({
        kind: "text",
        text: current.text.slice(0, offset),
        ...(current.marks ? { marks: { ...current.marks } } : {}),
      })
    }
    if (offset < current.text.length) {
      after.unshift({
        kind: "text",
        text: current.text.slice(offset),
        ...(current.marks ? { marks: { ...current.marks } } : {}),
      })
    }
    return { before, after }
  }

  if (point.offset > 0) {
    before.push(current)
  } else {
    after.unshift(current)
  }
  return { before, after }
}

function mergeReplacementBlocks(
  startBlock: SlackBlock,
  prefix: SlackInline[],
  replacementBlocks: SlackBlock[],
  endBlock: SlackBlock,
  suffix: SlackInline[],
): ReplacementResult {
  const startKind = getEditableBlockKind(startBlock)
  const endKind = getEditableBlockKind(endBlock)

  if (startKind && endKind && startKind === endKind) {
    if (replacementBlocks.length === 0) {
      return {
        blocks: [makeInlineBlock(startKind, [...prefix, ...suffix])],
        caret: {
          blockOffset: 0,
          linearOffset: getLinearLength(prefix),
        },
      }
    }

    const first = replacementBlocks[0]
    const last = replacementBlocks.at(-1)
    const firstKind = first ? getEditableBlockKind(first) : null
    const lastKind = last ? getEditableBlockKind(last) : null
    if (first && last && firstKind === startKind && lastKind === endKind) {
      const merged = replacementBlocks.map((block) => cloneBlock(block))
      const firstInlines = getEditableInlines(first)
      const lastInlines = getEditableInlines(last)
      if (firstInlines && lastInlines) {
        if (merged.length === 1) {
          const mergedInlines = [...prefix, ...firstInlines, ...suffix]
          merged[0] = setBlockInlines(first, mergedInlines)
          return {
            blocks: merged,
            caret: {
              blockOffset: 0,
              linearOffset: getLinearLength([...prefix, ...firstInlines]),
            },
          }
        } else {
          merged[0] = setBlockInlines(first, [...prefix, ...firstInlines])
          merged[merged.length - 1] = setBlockInlines(last, [
            ...lastInlines,
            ...suffix,
          ])
          return {
            blocks: merged,
            caret: {
              blockOffset: merged.length - 1,
              linearOffset: getLinearLength(lastInlines),
            },
          }
        }
      }
    }
  }

  const blocks = [
    ...(prefix.length > 0 && startKind
      ? [makeInlineBlock(startKind, prefix)]
      : []),
    ...replacementBlocks.map((block) => cloneBlock(block)),
    ...(suffix.length > 0 && endKind ? [makeInlineBlock(endKind, suffix)] : []),
  ]
  const prefixBlockCount = prefix.length > 0 && startKind ? 1 : 0
  if (replacementBlocks.length > 0) {
    const lastReplacement = replacementBlocks.at(-1)
    const lastInlines = lastReplacement
      ? getEditableInlines(lastReplacement)
      : null
    return {
      blocks,
      caret: {
        blockOffset: prefixBlockCount + replacementBlocks.length - 1,
        linearOffset: getLinearLength(lastInlines ?? []),
      },
    }
  }

  return {
    blocks,
    caret: {
      blockOffset: 0,
      linearOffset: prefix.length > 0 ? getLinearLength(prefix) : 0,
    },
  }
}

function getBlockEndPoint(
  block: SlackBlock | undefined,
  blockIndex: number,
): EditorPoint {
  if (!block) {
    return { path: [Math.max(0, blockIndex), 0], offset: 0 }
  }
  const inlines = getEditableInlines(block)
  if (!inlines || inlines.length === 0) {
    return { path: [blockIndex, 0], offset: 0 }
  }
  const inlineIndex = inlines.length - 1
  return {
    path: [blockIndex, inlineIndex],
    offset: inlineLength(inlines[inlineIndex] as SlackInline),
  }
}

function getEditableBlockKind(block: SlackBlock): "paragraph" | "quote" | null {
  return block.kind === "paragraph" || block.kind === "quote"
    ? block.kind
    : null
}

function getEditableInlines(block: SlackBlock): SlackInline[] | null {
  switch (block.kind) {
    case "paragraph":
    case "quote":
      return block.inlines
    case "list":
      return block.items[0]?.inlines ?? []
    default:
      return null
  }
}

function setBlockInlines(
  block: SlackBlock,
  inlines: SlackInline[],
): SlackBlock {
  switch (block.kind) {
    case "paragraph":
      return { kind: "paragraph", inlines: cloneInlines(inlines) }
    case "quote":
      return { kind: "quote", inlines: cloneInlines(inlines) }
    case "list":
      return {
        ...block,
        items: [
          {
            inlines: cloneInlines(inlines),
          },
          ...block.items.slice(1).map((item) => ({
            inlines: cloneInlines(item.inlines),
          })),
        ],
      }
    default:
      return cloneBlock(block)
  }
}

function makeInlineBlock(
  kind: "paragraph" | "quote",
  inlines: SlackInline[],
): SlackBlock {
  return {
    kind,
    inlines: cloneInlines(inlines),
  }
}

function allSelectedTextHasMark(
  document: SlackDocument,
  range: EditorRange,
  mark: keyof MarkSet,
): boolean {
  let sawText = false
  for (
    let blockIndex = range.start.path[0];
    blockIndex <= range.end.path[0];
    blockIndex += 1
  ) {
    const block = document.blocks[blockIndex]
    const inlines = block ? getEditableInlines(block) : null
    if (!inlines) {
      continue
    }

    const startPoint =
      blockIndex === range.start.path[0]
        ? range.start
        : { path: [blockIndex, 0] as [number, number], offset: 0 }
    const endPoint =
      blockIndex === range.end.path[0]
        ? range.end
        : endPointForInlines(blockIndex, inlines)

    const startSlice = splitInlines(inlines, startPoint)
    const selectedSlice = splitInlines(
      startSlice.after,
      rebasePoint(endPoint, startSlice.before.length),
    )
    for (const inline of selectedSlice.before) {
      if (inline.kind === "text" || inline.kind === "link") {
        sawText = true
        if (!inline.marks?.[mark]) {
          return false
        }
      }
    }
  }

  return sawText
}

function applyMarkToInlines(
  inlines: SlackInline[],
  mark: keyof MarkSet,
  enabled: boolean,
): SlackInline[] {
  return inlines.map((inline) => {
    if (inline.kind !== "text" && inline.kind !== "link") {
      return cloneInline(inline)
    }

    const nextMarks = { ...(inline.marks ?? {}) }
    if (enabled) {
      nextMarks[mark] = true
    } else {
      delete nextMarks[mark]
    }

    return {
      ...inline,
      ...(Object.keys(nextMarks).length > 0 ? { marks: nextMarks } : {}),
    }
  })
}

function endPointForInlines(
  blockIndex: number,
  inlines: SlackInline[],
): EditorPoint {
  if (inlines.length === 0) {
    return { path: [blockIndex, 0], offset: 0 }
  }
  const inlineIndex = inlines.length - 1
  return {
    path: [blockIndex, inlineIndex],
    offset: inlineLength(inlines[inlineIndex] as SlackInline),
  }
}

function rebasePoint(
  point: EditorPoint,
  removedLeadingInlines: number,
): EditorPoint {
  return {
    path: [point.path[0], Math.max(0, point.path[1] - removedLeadingInlines)],
    offset: point.offset,
  }
}

function inlineLength(inline: SlackInline): number {
  return inline.kind === "text" ? inline.text.length : 1
}

function getLinearLength(inlines: SlackInline[]): number {
  return inlines.reduce((sum, inline) => sum + inlineLength(inline), 0)
}

function findPointAtLinearOffset(
  block: SlackBlock | undefined,
  blockIndex: number,
  linearOffset: number,
): EditorPoint {
  if (!block) {
    return { path: [Math.max(0, blockIndex), 0], offset: 0 }
  }

  const inlines = getEditableInlines(block)
  if (!inlines || inlines.length === 0) {
    return { path: [blockIndex, 0], offset: 0 }
  }

  let remaining = Math.max(0, linearOffset)
  for (let index = 0; index < inlines.length; index += 1) {
    const inline = inlines[index] as SlackInline
    const length = inlineLength(inline)
    if (remaining <= length) {
      return {
        path: [blockIndex, index],
        offset: remaining,
      }
    }
    remaining -= length
  }

  return getBlockEndPoint(block, blockIndex)
}

function ensureEditableDocument(document: SlackDocument): SlackDocument {
  if (document.blocks.length > 0) {
    return cloneDocument(document)
  }

  return createDocument({
    blocks: [{ kind: "paragraph", inlines: [] }],
  })
}

function normalizeEditorDocument(document: SlackDocument): SlackDocument {
  const normalized = normalizeDocument(document).document
  return ensureEditableDocument(normalized)
}

function takeSnapshot(state: EditorState): EditorSnapshot {
  return {
    document: cloneDocument(state.document),
    selection: cloneSelection(state.selection),
    ...(state.activeMarks ? { activeMarks: { ...state.activeMarks } } : {}),
  }
}

function restoreSnapshot(
  snapshot: EditorSnapshot,
): Omit<EditorState, "history"> {
  return {
    document: cloneDocument(snapshot.document),
    selection: cloneSelection(snapshot.selection),
    ...(snapshot.activeMarks
      ? { activeMarks: { ...snapshot.activeMarks } }
      : {}),
  }
}

function cloneDocument(document: SlackDocument): SlackDocument {
  return {
    kind: "document",
    blocks: document.blocks.map((block) => cloneBlock(block)),
  }
}

function cloneBlock(block: SlackBlock): SlackBlock {
  switch (block.kind) {
    case "paragraph":
      return { kind: "paragraph", inlines: cloneInlines(block.inlines) }
    case "quote":
      return { kind: "quote", inlines: cloneInlines(block.inlines) }
    case "preformatted":
      return {
        kind: "preformatted",
        text: block.text,
        ...(block.language ? { language: block.language } : {}),
      }
    case "list":
      return {
        kind: "list",
        style: block.style,
        indent: block.indent,
        ...(block.offset !== undefined ? { offset: block.offset } : {}),
        items: block.items.map((item) => ({
          inlines: cloneInlines(item.inlines),
        })),
      }
  }
}

function cloneInlines(inlines: SlackInline[]): SlackInline[] {
  return inlines.map((inline) => cloneInline(inline))
}

function cloneInline(inline: SlackInline): SlackInline {
  if ("marks" in inline && inline.marks) {
    return {
      ...inline,
      marks: { ...inline.marks },
    }
  }
  return { ...inline }
}

function cloneSelection(selection: EditorSelection): EditorSelection {
  return {
    anchor: clonePoint(selection.anchor),
    focus: clonePoint(selection.focus),
  }
}

function clonePoint(point: EditorPoint): EditorPoint {
  return {
    path: [point.path[0], point.path[1]],
    offset: point.offset,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
