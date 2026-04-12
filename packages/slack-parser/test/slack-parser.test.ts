import assert from "node:assert/strict"
import test from "node:test"

import {
  createDocument,
  normalizeDocument,
  parseMrkdwn,
  parseRichText,
  serializeForChatPostMessage,
  serializeToMrkdwn,
  serializeToRichText,
} from "../src/index.js"
import type { SlackDocument, SlackRichTextBlock } from "../src/types.js"

test("serializeForChatPostMessage builds rich_text blocks and mrkdwn fallback", () => {
  const document: SlackDocument = {
    kind: "document",
    blocks: [
      {
        kind: "paragraph",
        inlines: [
          { kind: "text", text: "Hello " },
          { kind: "user", userId: "U123" },
          { kind: "text", text: " world", marks: { bold: true } },
        ],
      },
      {
        kind: "quote",
        inlines: [
          { kind: "text", text: "quoted" },
          { kind: "linebreak" },
          { kind: "text", text: "line" },
        ],
      },
    ],
  }

  const result = serializeForChatPostMessage(document)

  assert.equal(result.blocks[0].type, "rich_text")
  assert.equal(result.text, "Hello <@U123>* world*\n\n> quoted\n> line")
  assert.deepEqual(result.diagnostics, [])
})

test("parseMrkdwn imports nested marks and HTML entity decoding", () => {
  const result = parseMrkdwn("Hello &amp; *bold _italic_*")

  assert.deepEqual(result.document.blocks, [
    {
      kind: "paragraph",
      inlines: [
        { kind: "text", text: "Hello & " },
        { kind: "text", text: "bold ", marks: { bold: true } },
        { kind: "text", text: "italic", marks: { bold: true, italic: true } },
      ],
    },
  ])
  assert.deepEqual(result.diagnostics, [])
})

test("parseMrkdwn imports quotes, code fences, entities, and retrieved emoji", () => {
  const input = [
    "> quoted",
    "> line",
    "",
    "```ts",
    "const x = 1",
    "```",
    "",
    "<#C123|general> <!subteam^S123|eng> <!date^1720710212^{date_num}|2024-07-11> :tada:",
  ].join("\n")

  const result = parseMrkdwn(input, { source: "retrieved" })

  assert.deepEqual(result.document.blocks, [
    {
      kind: "quote",
      inlines: [
        { kind: "text", text: "quoted" },
        { kind: "linebreak" },
        { kind: "text", text: "line" },
      ],
    },
    {
      kind: "preformatted",
      text: "const x = 1",
      language: "ts",
    },
    {
      kind: "paragraph",
      inlines: [
        { kind: "channel", channelId: "C123", label: "general" },
        { kind: "text", text: " " },
        { kind: "usergroup", usergroupId: "S123", label: "eng" },
        { kind: "text", text: " " },
        {
          kind: "date",
          timestamp: 1720710212,
          format: "{date_num}",
          fallback: "2024-07-11",
        },
        { kind: "text", text: " " },
        { kind: "emoji", name: "tada" },
      ],
    },
  ])
  assert.deepEqual(result.diagnostics, [])
})

test("parseRichText imports supported subset and downgrades unsupported elements", () => {
  const block: SlackRichTextBlock = {
    type: "rich_text",
    elements: [
      {
        type: "rich_text_section",
        elements: [
          { type: "text", text: "Hello", style: { bold: true } },
          { type: "text", text: "\nworld" },
          { type: "link", url: "https://example.com", text: "example" },
        ],
      },
      {
        type: "rich_text_list",
        style: "ordered",
        indent: 1,
        offset: 3,
        elements: [
          {
            type: "rich_text_section",
            elements: [{ type: "user", user_id: "U123" }],
          },
        ],
      },
      {
        type: "rich_text_color",
        value: "#ff00ff",
      },
    ],
  }

  const result = parseRichText(block)

  assert.deepEqual(result.document.blocks, [
    {
      kind: "paragraph",
      inlines: [
        { kind: "text", text: "Hello", marks: { bold: true } },
        { kind: "linebreak" },
        { kind: "text", text: "world" },
        { kind: "link", url: "https://example.com", label: "example" },
      ],
    },
    {
      kind: "list",
      style: "ordered",
      indent: 1,
      offset: 3,
      items: [
        {
          inlines: [{ kind: "user", userId: "U123" }],
        },
      ],
    },
    {
      kind: "paragraph",
      inlines: [{ kind: "text", text: "[unsupported:rich_text_color]" }],
    },
  ])
  assert.equal(result.diagnostics[0]?.code, "unsupported_rich_text_element")
})

test("normalizeDocument merges adjacent text and removes empty blocks", () => {
  const result = normalizeDocument(
    createDocument({
      blocks: [
        {
          kind: "paragraph",
          inlines: [
            { kind: "linebreak" },
            { kind: "text", text: "a" },
            { kind: "text", text: "b" },
            { kind: "text", text: "" },
            { kind: "linebreak" },
          ],
        },
        {
          kind: "paragraph",
          inlines: [],
        },
      ],
    }),
  )

  assert.deepEqual(result.document.blocks, [
    {
      kind: "paragraph",
      inlines: [{ kind: "text", text: "ab" }],
    },
  ])
})

test("serializeToMrkdwn reports lossy link style export", () => {
  const result = serializeToMrkdwn({
    kind: "document",
    blocks: [
      {
        kind: "paragraph",
        inlines: [
          {
            kind: "link",
            url: "https://example.com",
            label: "example",
            marks: { bold: true },
          },
        ],
      },
    ],
  })

  assert.equal(result.text, "<https://example.com|example>")
  assert.equal(result.diagnostics[0]?.code, "lossy_mrkdwn_export")
})

test("mrkdwn to rich_text export keeps supported structure", () => {
  const parsed = parseMrkdwn("*hi* <@U123>")
  const block = serializeToRichText(parsed.document)

  assert.deepEqual(block, {
    type: "rich_text",
    elements: [
      {
        type: "rich_text_section",
        elements: [
          { type: "text", text: "hi", style: { bold: true } },
          { type: "text", text: " " },
          { type: "user", user_id: "U123" },
        ],
      },
    ],
  })
})
