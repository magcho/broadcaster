import assert from "node:assert/strict"
import test from "node:test"
import type { EditorState, SlackDocument } from "../src/index.js"
import {
  applyCommand,
  createCollapsedSelection,
  createDocument,
  createEditorState,
  getDocumentEndPoint,
  serializeForChatPostMessage,
} from "../src/index.js"

function run(
  state: EditorState,
  ...commands: Parameters<typeof applyCommand>[1][]
) {
  return commands.reduce(
    (current, command) => applyCommand(current, command).state,
    state,
  )
}

test("integration: author text, toggle bold, insert mention, and serialize", () => {
  const state = run(
    createEditorState(),
    { type: "insert_text", text: "Hello" },
    { type: "insert_text", text: " " },
    { type: "toggle_mark", mark: "bold" },
    { type: "insert_text", text: "world" },
    { type: "toggle_mark", mark: "bold" },
    { type: "insert_text", text: " " },
    { type: "insert_mention", mention: { kind: "user", userId: "U123" } },
  )

  assert.deepEqual(state.document, {
    kind: "document",
    blocks: [
      {
        kind: "paragraph",
        inlines: [
          { kind: "text", text: "Hello " },
          { kind: "text", text: "world", marks: { bold: true } },
          { kind: "text", text: " " },
          { kind: "user", userId: "U123" },
        ],
      },
    ],
  } satisfies SlackDocument)

  const payload = serializeForChatPostMessage(state.document)
  assert.equal(payload.text, "Hello *world* <@U123>")
  assert.equal(payload.blocks[0].type, "rich_text")
})

test("integration: selection-aware insertion splits text and delete_backward removes atomic inline", () => {
  let state = createEditorState({
    document: createDocument({
      blocks: [
        {
          kind: "paragraph",
          inlines: [{ kind: "text", text: "Hello world" }],
        },
      ],
    }),
  })

  state = run(
    state,
    {
      type: "set_selection",
      selection: createCollapsedSelection({
        path: [0, 0],
        offset: 6,
      }),
    },
    { type: "toggle_mark", mark: "bold" },
    { type: "insert_text", text: "Slack " },
    { type: "toggle_mark", mark: "bold" },
    {
      type: "insert_mention",
      mention: { kind: "channel", channelId: "C123", label: "general" },
    },
    { type: "delete_backward", unit: "character" },
  )

  assert.deepEqual(state.document.blocks, [
    {
      kind: "paragraph",
      inlines: [
        { kind: "text", text: "Hello " },
        { kind: "text", text: "Slack ", marks: { bold: true } },
        { kind: "text", text: "world" },
      ],
    },
  ])
})

test("integration: quote, list, preformatted block, undo, and redo work transactionally", () => {
  let state = createEditorState()
  state = run(
    state,
    { type: "insert_text", text: "item one" },
    { type: "wrap_quote" },
    { type: "toggle_list", style: "bullet" },
    { type: "insert_preformatted_block", text: "const x = 1", language: "ts" },
  )

  assert.deepEqual(state.document.blocks, [
    {
      kind: "list",
      style: "bullet",
      indent: 0,
      items: [{ inlines: [{ kind: "text", text: "item one" }] }],
    },
    {
      kind: "preformatted",
      text: "const x = 1",
      language: "ts",
    },
  ])

  state = applyCommand(state, { type: "undo" }).state
  assert.deepEqual(state.document.blocks, [
    {
      kind: "list",
      style: "bullet",
      indent: 0,
      items: [{ inlines: [{ kind: "text", text: "item one" }] }],
    },
  ])

  state = applyCommand(state, { type: "redo" }).state
  assert.equal(state.document.blocks[1]?.kind, "preformatted")
})

test("integration: paste_text inserts line breaks and end selection remains valid", () => {
  const state = run(createEditorState(), {
    type: "paste_text",
    text: "alpha\nbeta",
  })

  assert.deepEqual(state.document.blocks, [
    {
      kind: "paragraph",
      inlines: [
        { kind: "text", text: "alpha" },
        { kind: "linebreak" },
        { kind: "text", text: "beta" },
      ],
    },
  ])
  assert.deepEqual(
    state.selection,
    createCollapsedSelection(getDocumentEndPoint(state.document)),
  )
})

test("integration: delete_backward at block start merges adjacent paragraphs", () => {
  let state = createEditorState({
    document: createDocument({
      blocks: [
        { kind: "paragraph", inlines: [{ kind: "text", text: "alpha" }] },
        { kind: "paragraph", inlines: [{ kind: "text", text: "beta" }] },
      ],
    }),
    selection: createCollapsedSelection({ path: [1, 0], offset: 0 }),
  })

  state = applyCommand(state, { type: "delete_backward", unit: "character" }).state

  assert.deepEqual(state.document.blocks, [
    {
      kind: "paragraph",
      inlines: [{ kind: "text", text: "alphabeta" }],
    },
  ])
})

test("integration: delete_forward at block end merges adjacent paragraphs", () => {
  let state = createEditorState({
    document: createDocument({
      blocks: [
        { kind: "paragraph", inlines: [{ kind: "text", text: "alpha" }] },
        { kind: "paragraph", inlines: [{ kind: "text", text: "beta" }] },
      ],
    }),
    selection: createCollapsedSelection({ path: [0, 0], offset: 5 }),
  })

  state = applyCommand(state, { type: "delete_forward", unit: "character" }).state

  assert.deepEqual(state.document.blocks, [
    {
      kind: "paragraph",
      inlines: [{ kind: "text", text: "alphabeta" }],
    },
  ])
})

test("integration: toggle_mark can span multiple inline containers", () => {
  let state = createEditorState({
    document: createDocument({
      blocks: [
        { kind: "paragraph", inlines: [{ kind: "text", text: "alpha" }] },
        { kind: "paragraph", inlines: [{ kind: "text", text: "beta" }] },
      ],
    }),
  })

  state = applyCommand(state, {
    type: "set_selection",
    selection: {
      anchor: { path: [0, 0], offset: 2 },
      focus: { path: [1, 0], offset: 2 },
    },
  }).state

  state = applyCommand(state, { type: "toggle_mark", mark: "bold" }).state

  assert.deepEqual(state.document.blocks, [
    {
      kind: "paragraph",
      inlines: [
        { kind: "text", text: "al" },
        { kind: "text", text: "pha", marks: { bold: true } },
      ],
    },
    {
      kind: "paragraph",
      inlines: [
        { kind: "text", text: "be", marks: { bold: true } },
        { kind: "text", text: "ta" },
      ],
    },
  ])
})

test("integration: replace_range can collapse content across blocks into one container", () => {
  let state = createEditorState({
    document: createDocument({
      blocks: [
        { kind: "paragraph", inlines: [{ kind: "text", text: "alpha" }] },
        { kind: "paragraph", inlines: [{ kind: "text", text: "beta" }] },
      ],
    }),
  })

  state = applyCommand(state, {
    type: "replace_range",
    range: {
      start: { path: [0, 0], offset: 2 },
      end: { path: [1, 0], offset: 2 },
    },
    content: {
      blocks: [
        {
          kind: "paragraph",
          inlines: [{ kind: "text", text: "X" }],
        },
      ],
    },
  }).state

  assert.deepEqual(state.document.blocks, [
    {
      kind: "paragraph",
      inlines: [{ kind: "text", text: "alXta" }],
    },
  ])
})

test("integration: replacing a middle range keeps the caret at the replacement point after normalization", () => {
  let state = createEditorState({
    document: createDocument({
      blocks: [
        { kind: "paragraph", inlines: [{ kind: "text", text: "abcdef" }] },
      ],
    }),
  })

  state = applyCommand(state, {
    type: "set_selection",
    selection: {
      anchor: { path: [0, 0], offset: 2 },
      focus: { path: [0, 0], offset: 4 },
    },
  }).state

  state = run(
    state,
    { type: "insert_text", text: "X" },
    { type: "insert_text", text: "Y" },
  )

  assert.deepEqual(state.document.blocks, [
    {
      kind: "paragraph",
      inlines: [{ kind: "text", text: "abXYef" }],
    },
  ])
})
