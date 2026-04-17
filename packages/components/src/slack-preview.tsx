"use client"

import type { ReactNode } from "react"
import type {
  MarkSet,
  SlackBlock,
  SlackDocument,
  SlackInline,
} from "slack-parser"
import { EMOJI_ALIAS } from "./libs/emoji-alias.js"
import { cn } from "./utils/cn.js"

type Props = {
  message: SlackDocument
  className?: string
}

export const SlackPreview = ({ message, className }: Props) => {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] text-slate-900 shadow-sm",
        className,
      )}
    >
      <div className="border-slate-200 border-b bg-white/80 px-4 py-3 backdrop-blur-sm">
        <div className="font-semibold text-slate-700 text-sm tracking-wide">
          Slack Preview
        </div>
        <div className="text-slate-500 text-xs">
          {message.blocks.length} block{message.blocks.length === 1 ? "" : "s"}
        </div>
      </div>
      <div className="space-y-4 px-4 py-4">
        {message.blocks.map((block, index) => (
          <PreviewBlock key={`${block.kind}-${index}`} block={block} />
        ))}
      </div>
    </div>
  )
}

export const UnstyledSlackPreview = ({ message }: Props) => {
  return (
    <div>
      {message.blocks.map((block, index) => (
        <PreviewBlock key={`${block.kind}-${index}`} block={block} />
      ))}
    </div>
  )
}

function PreviewBlock({ block }: { block: SlackBlock }) {
  switch (block.kind) {
    case "paragraph":
      return <PreviewParagraph inlines={block.inlines} />
    case "quote":
      return <PreviewQuote inlines={block.inlines} />
    case "preformatted":
      return <PreviewCode block={block} />
    case "list":
      return <PreviewList block={block} />
  }
}

function PreviewParagraph({ inlines }: { inlines: SlackInline[] }) {
  return (
    <p
      data-slack-type="paragraph"
      className="whitespace-pre-wrap text-[15px] text-slate-900 leading-6"
    >
      {renderInlines(inlines)}
    </p>
  )
}

function PreviewQuote({ inlines }: { inlines: SlackInline[] }) {
  return (
    <blockquote
      data-slack-type="quote"
      className="border-[#DDDDDD] border-l-[3px] py-1 pl-3 text-[15px] text-slate-800"
    >
      {renderInlines(inlines)}
    </blockquote>
  )
}

function PreviewCode({
  block,
}: {
  block: Extract<SlackBlock, { kind: "preformatted" }>
}) {
  return (
    <div className="my-2 w-full rounded border border-gray-300 bg-[#F6F6F6] p-1 font-mono text-[12px] text-black">
      <code>{block.text}</code>
    </div>
  )
}

function PreviewList({
  block,
}: {
  block: Extract<SlackBlock, { kind: "list" }>
}) {
  const style = { paddingLeft: `${Math.max(1, block.indent + 1) * 1.25}rem` }
  if (block.style === "ordered") {
    return (
      <ol
        data-slack-type="list"
        className="list-decimal space-y-2 text-[15px] text-slate-900 leading-6"
        style={style}
        start={block.offset}
      >
        {block.items.map((item, index) => (
          <li key={index} data-slack-type="list-item" className="m-0">
            <div className="whitespace-pre-wrap">
              {renderInlines(item.inlines)}
            </div>
          </li>
        ))}
      </ol>
    )
  }

  return (
    <ul
      data-slack-type="list"
      className="list-disc space-y-2 text-[15px] text-slate-900 leading-6"
      style={style}
    >
      {block.items.map((item, index) => (
        <li key={index} data-slack-type="list-item" className="m-0">
          <div className="whitespace-pre-wrap">
            {renderInlines(item.inlines)}
          </div>
        </li>
      ))}
    </ul>
  )
}

function renderInlines(inlines: SlackInline[]): ReactNode[] {
  return inlines.map((inline, index) => <Inline key={index} inline={inline} />)
}

function Inline({ inline }: { inline: SlackInline }) {
  switch (inline.kind) {
    case "text":
      return renderTextInline(inline.text, inline.marks)
    case "link":
      return (
        <a
          data-slack-type="link"
          href={
            inline.isMailto
              ? `mailto:${inline.url.replace(/^mailto:/, "")}`
              : inline.url
          }
          target="_blank"
          rel="noreferrer"
          className={cn(
            "rounded text-sky-700 decoration-sky-700 hover:underline",
            inline.marks?.bold && "font-semibold",
            inline.marks?.italic && "italic",
            inline.marks?.strike && "line-through",
            inline.marks?.code &&
              "rounded bg-slate-800 px-1 font-mono text-slate-100 no-underline",
          )}
        >
          {inline.label ?? inline.url}
        </a>
      )
    case "user":
      return <MentionChip type="user">@{inline.userId}</MentionChip>
    case "usergroup":
      return (
        <MentionChip type="usergroup">
          @{inline.label ?? inline.usergroupId}
        </MentionChip>
      )
    case "channel":
      return (
        <MentionChip type="channel">
          #{inline.label ?? inline.channelId}
        </MentionChip>
      )
    case "broadcast":
      return <MentionChip type="broadcast">@{inline.range}</MentionChip>
    case "date":
      return (
        <span
          data-slack-type="date"
          className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-900"
        >
          {inline.fallback}
        </span>
      )
    case "emoji": {
      const emoji = EMOJI_ALIAS[inline.name]
      return emoji != null ? (
        <span data-slack-type="emoji" className="font-medium">
          {emoji}
        </span>
      ) : (
        <span
          data-slack-type="emoji"
          className="font-medium text-slate-500 tracking-tighter"
        >
          :{inline.name}:
        </span>
      )
    }
    case "linebreak":
      return <br data-slack-type="linebreak" />
  }
}

function renderTextInline(text: string, marks?: MarkSet) {
  return (
    <span
      data-slack-type="text"
      className={cn(
        marks?.bold && "font-semibold",
        marks?.italic && "italic",
        marks?.strike && "line-through",
        marks?.code &&
          "mx-0.5 rounded border border-gray-300 bg-[#F6F6F6] p-0.5 font-mono text-[#C21F49] text-[0.92em]",
      )}
    >
      {text}
    </span>
  )
}

function MentionChip({
  type,
  children,
}: {
  type: "user" | "usergroup" | "channel" | "broadcast"
  children: ReactNode
}) {
  return (
    <span
      data-slack-type="mention"
      data-slack-mention-type={type}
      className="inline-flex rounded-sm bg-[#D1E5F0] px-1 text-[#1164A3]"
    >
      {children}
    </span>
  )
}
