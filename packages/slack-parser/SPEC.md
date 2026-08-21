# slack-parser 仕様書

最終確認日: 2026-04-11

## 1. 目的

`slack-parser` のプライマリユースケースは、ユーザーが Web アプリ上で入力したテキストを、Slack API 経由で安全かつ安定して Slack に投稿できるようにすることです。

このパッケージは parser 単体ではなく、次の一連の流れを支える authoring 基盤として設計します。

1. Web アプリ内の editor が Slack 送信可能な document を保持する
2. 必要に応じて Slack 由来の `mrkdwn` または `rich_text` を editor state に取り込む
3. editor state を Slack API に渡せる payload に serialize する

この仕様では、入力互換よりも「送信可能な状態を一貫して保てること」を優先します。

## 2. 設計原則

- canonical model は editor が直接保持する authoring model とする
- canonical model には、原則として serializer が Slack API 向けに出力できる要素だけを入れる
- parser は import のための補助機能であり、主役は authoring と serialization である
- Slack 由来の未知要素は、可能な限り sendable な既知要素へ degrade し、diagnostic で通知する
- `rich_text` は第一の構造化出力形式とする
- `mrkdwn` は互換入力および fallback 出力として扱う
- editor が作る document は、normalize 後に常に sendable であることを保証対象にする

## 3. 対象範囲

### 3.1 対象

- Web アプリ内 editor が保持する canonical document model
- canonical document model から Slack API 投稿用 payload へ変換する serializer
- Slack 互換 text の import:
  - Block Kit text object の `mrkdwn`
  - message top-level `text`
  - legacy attachment text
  - 取得済み message に含まれる canonicalized `mrkdwn`
- Slack `rich_text` block の import
- 次の authoring feature subset:
  - paragraph
  - line break
  - quote
  - fenced code block
  - bullet list
  - ordered list
  - bold
  - italic
  - strike
  - inline code
  - link
  - mailto link
  - channel mention
  - user mention
  - user group mention
  - special mention: `here` / `channel` / `everyone`
  - Slack date expression
  - emoji

### 3.2 対象外

- Slack message payload 全体の parse
- `section`、`actions`、`image`、`context` など非テキスト block の parse
- Slack `markdown` block の parse
- Slack Web API を使った runtime entity resolution
- ID の存在検証
- rendering
- Slack 上のすべての `rich_text` 機能の lossless round-trip

補足:

- 現時点では authoring-safe な subset を優先する
- `color`、`border`、`highlight`、`client_highlight`、`unlink` など client / import 依存の要素や style は、canonical model の正式サポート対象に含めない
- 将来「既存 Slack message の完全編集」が要件化された場合は、別バージョンの model 拡張で扱う

## 4. 主要ユースケース

### 4.1 Primary: author and post

1. ユーザーが Web アプリの editor でテキストを入力する
2. editor は canonical document model を更新する
3. `normalizeDocument()` で sendable invariant を満たす
4. `serializeForChatPostMessage()` で Slack API 向け payload を作る
5. 呼び出し側が `chat.postMessage` などへ渡す

### 4.2 Secondary: import and continue editing

1. 既存の Slack message 由来 text または `rich_text` を受け取る
2. `parseMrkdwn()` または `parseRichText()` で canonical document に変換する
3. unsupported / lossy な箇所は diagnostic を返す
4. document 自体は sendable subset に正規化される

## 5. 公開 API

`parseAny()` のような曖昧な入口は持ちません。呼び出し側は input kind を明示して、適切な entry point を使います。

### 5.1 `createDocument(input?)`

空 document、または seed 付き document を生成します。

```ts
function createDocument(input?: CreateDocumentInput): SlackDocument
```

用途:

- editor 初期化
- programmatic な初期値生成

### 5.2 `parseMrkdwn(text, options)`

Slack 互換 text を import し、canonical document に変換します。

```ts
function parseMrkdwn(text: string, options?: ParseMrkdwnOptions): ParseResult
```

```ts
type ParseMrkdwnOptions = {
  source?: "publish" | "retrieved"
  surface?: "message_text" | "mrkdwn_text_object" | "attachment_text"
  mode?: "strict" | "compat"
  autolink?: boolean
}
```

補足:

- `source` は text が publish 前入力か、取得済み canonical text かを表す
- `surface` は Slack 側の解釈差異を表す
- `autolink` は bare URL を `LinkInline` に変換する import 補助であり、既定では `true`

### 5.3 `parseRichText(block, options)`

Slack `rich_text` block を import し、canonical document に変換します。

```ts
function parseRichText(block: SlackRichTextBlock, options?: ParseRichTextOptions): ParseResult
```

```ts
type ParseRichTextOptions = {
  mode?: "strict" | "compat"
}
```

### 5.4 `normalizeDocument(document, options?)`

editor 操作後または import 後の document を正規化し、sendable invariant を満たす形に揃えます。

```ts
function normalizeDocument(document: SlackDocument, options?: NormalizeOptions): NormalizeResult
```

### 5.5 `serializeToRichText(document, options?)`

canonical document を、Slack API に渡せる `rich_text` block に変換します。

```ts
function serializeToRichText(
  document: SlackDocument,
  options?: SerializeRichTextOptions,
): SlackRichTextBlock
```

### 5.6 `serializeToMrkdwn(document, options?)`

canonical document を fallback 用 `mrkdwn` に変換します。

```ts
function serializeToMrkdwn(
  document: SlackDocument,
  options?: SerializeMrkdwnOptions,
): SerializeMrkdwnResult
```

`mrkdwn` は完全な round-trip を保証しません。lossy な箇所は diagnostic で通知します。

### 5.7 `serializeForChatPostMessage(document, options?)`

Slack API 投稿向けの高水準 API です。primary use case ではこれを使います。

```ts
function serializeForChatPostMessage(
  document: SlackDocument,
  options?: SerializeForChatPostMessageOptions,
): ChatPostMessagePayloadDraft
```

```ts
type ChatPostMessagePayloadDraft = {
  text: string
  blocks: [SlackRichTextBlock]
  diagnostics: Diagnostic[]
}
```

責務:

- `blocks` に `rich_text` block を入れる
- `text` に notification / accessibility fallback を入れる
- fallback 生成時の degrade を diagnostic で返す

## 6. Canonical Document Model

canonical model は editor が直接持つ authoring-safe な subset です。parse 時の raw lexeme や source span は document 本体に持ちません。

```ts
type SlackDocument = {
  kind: "document"
  blocks: SlackBlock[]
}
```

### 6.1 Block node

```ts
type SlackBlock = ParagraphBlock | QuoteBlock | PreformattedBlock | ListBlock

type ParagraphBlock = {
  kind: "paragraph"
  inlines: SlackInline[]
}

type QuoteBlock = {
  kind: "quote"
  inlines: SlackInline[]
}

type PreformattedBlock = {
  kind: "preformatted"
  text: string
  language?: string
}

type ListBlock = {
  kind: "list"
  style: "bullet" | "ordered"
  indent: number
  offset?: number
  items: ListItem[]
}

type ListItem = {
  inlines: SlackInline[]
}
```

制約:

- `ParagraphBlock` と `QuoteBlock` は inline container であり、子 block を持たない
- 複数行 quote は `LineBreakInline` を使って表す
- `PreformattedBlock` の中身は plain text のみとする
- list item は 1 段の inline content のみを正式サポートする

この制約は、Slack `rich_text` への安定した serialize を優先したものです。

### 6.2 Inline node

```ts
type SlackInline =
  | TextInline
  | LinkInline
  | UserInline
  | UserGroupInline
  | ChannelInline
  | BroadcastInline
  | DateInline
  | EmojiInline
  | LineBreakInline

type MarkSet = {
  bold?: true
  italic?: true
  strike?: true
  code?: true
}

type TextInline = {
  kind: "text"
  text: string
  marks?: MarkSet
}

type LinkInline = {
  kind: "link"
  url: string
  label?: string
  isMailto?: true
  marks?: MarkSet
}

type UserInline = {
  kind: "user"
  userId: string
}

type UserGroupInline = {
  kind: "usergroup"
  usergroupId: string
  label?: string
}

type ChannelInline = {
  kind: "channel"
  channelId: string
  label?: string
}

type BroadcastInline = {
  kind: "broadcast"
  range: "here" | "channel" | "everyone"
}

type DateInline = {
  kind: "date"
  timestamp: number
  format: string
  fallback: string
  url?: string
}

type EmojiInline = {
  kind: "emoji"
  name: string
}

type LineBreakInline = {
  kind: "linebreak"
}
```

制約:

- marks は `text` と `link` にのみ付与できる
- mention / date / emoji / linebreak には marks を付けない
- `LinkInline.label` は plain string のみとする
- `DateInline.fallback` は必須とする

## 7. Parse Result と Diagnostics

parser は document と diagnostics を分離して返します。

```ts
type ParseResult = {
  document: SlackDocument
  diagnostics: Diagnostic[]
}

type NormalizeResult = {
  document: SlackDocument
  diagnostics: Diagnostic[]
}

type SerializeMrkdwnResult = {
  text: string
  diagnostics: Diagnostic[]
}

type Diagnostic = {
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

type SourceSpan = {
  start: number
  end: number
}
```

`SourceSpan` は parse 対象の raw input 上の UTF-16 code unit offset とします。

## 8. `mrkdwn` Import 仕様

`mrkdwn` parser は publish と retrieved の両方を受け付けますが、対象は authoring-safe subset に限ります。

### 8.1 Block subset

認識対象:

- paragraph
- single newline
- list run
- quote run
- fenced code block

ルール:

- 単一改行は paragraph / quote 内で `LineBreakInline` として保持する
- 空行は block 境界として扱う
- list run は `- ` と `<number>. ` を認識する
- list item の継続行は item marker と同じ indent に対して追加の 2 space を要求する
- 同一 style / indent の連続 item は 1 つの `ListBlock` にまとめる
- fenced code block は triple backtick のみを認識する
- opening fence 行の language identifier は `language` に保存する

### 8.2 Inline subset

認識対象:

- `*bold*`
- `_italic_`
- `~strike~`
- `` `code` ``
- `<...>` angle entity
- plain text

ルール:

- style delimiter は入れ子可能だが交差不可
- inline code の内側では追加 parse を行わない
- 空 style run は plain text に recover する
- 閉じていない style / code は plain text に recover する

### 8.3 Angle entity

認識対象:

- `<https://example.com>`
- `<https://example.com|label>`
- `<mailto:dev@example.com|label>`
- `<#C123>`
- `<#C123|general>`
- `<@U123>`
- `<!subteam^S123>`
- `<!subteam^S123|eng>`
- `<!here>`
- `<!channel>`
- `<!everyone>`
- `<!date^timestamp^token_string^optional_link|fallback>`
- bare broadcast mentions: `@here`, `@channel`, `@everyone`
- bare user references: `@alice`
- bare channel references: `#general`

ルール:

- unknown angle form は可能なら plain text に downgrade し、必要に応じて diagnostic を返す
- colon emoji `:pray:` などは `EmojiInline` として受け入れてよい
- `mode: "compat"` では bare user / channel / broadcast / URL など自然記法の import を許可してよい
- parse 時に decode する HTML entity は `&amp;`、`&lt;`、`&gt;` の 3 つだけとする

### 8.4 Bare URL

bare URL の扱いは import 補助です。

- `autolink: false`: plain text のまま保持する
- `autolink: true`: URL らしい text run を `LinkInline` に変換してよい

コア serializer は bare URL 自動検出に依存しません。

## 9. `rich_text` Import 仕様

`rich_text` parser は、supported subset へ安全に写像できる範囲だけを正式サポートします。

### 9.1 Supported block mapping

| Slack `rich_text` element | canonical model     |
| ------------------------- | ------------------- |
| `rich_text_section`       | `ParagraphBlock`    |
| `rich_text_list`          | `ListBlock`         |
| `rich_text_preformatted`  | `PreformattedBlock` |
| `rich_text_quote`         | `QuoteBlock`        |

### 9.2 Supported inline mapping

| Slack inline element | canonical model   |
| -------------------- | ----------------- |
| `text`               | `TextInline`      |
| `link`               | `LinkInline`      |
| `emoji`              | `EmojiInline`     |
| `date`               | `DateInline`      |
| `broadcast`          | `BroadcastInline` |
| `channel`            | `ChannelInline`   |
| `user`               | `UserInline`      |
| `usergroup`          | `UserGroupInline` |

### 9.3 Unsupported import behavior

`color` など canonical model にない要素や、未対応 style flag は次のいずれかで recover します。

1. sendable な text 相当に downgrade する
2. downgrade 不可能なら要素全体を無害な plain text に変換する
3. そのうえで diagnostic を返す

lossless preservation は現仕様の保証対象ではありません。

## 10. Serialization 仕様

### 10.1 `serializeToRichText()`

`SlackDocument` は 1 個の `rich_text` block に serialize します。

ルール:

- `blocks` 配列の各要素は `rich_text.elements[]` に順番どおり出力する
- `QuoteBlock` は `rich_text_quote` に変換する
- `PreformattedBlock` は `rich_text_preformatted` に変換する
- `ListBlock` は `rich_text_list` に変換する
- `LinkInline.label` は Slack `link.text` に出力する
- unsupported state は `normalizeDocument()` 済みで存在しない前提とする

### 10.2 `serializeToMrkdwn()`

fallback 生成用の best-effort serializer です。

ルール:

- paragraph / quote / preformatted / list を `mrkdwn` に変換する
- inline subset を angle entity または style delimiter に変換する
- `mrkdwn` で自然に表現しづらい差異は loss を許容し、diagnostic を返す

例:

- ordered list の numbering start 情報
- `rich_text` と `mrkdwn` の行構造差
- import 時に downgrade された要素由来の情報

### 10.3 `serializeForChatPostMessage()`

primary use case 向けの posting serializer です。

出力方針:

- `blocks` は `[serializeToRichText(document)]`
- `text` は `serializeToMrkdwn(document).text`
- `diagnostics` は `serializeToMrkdwn()` 由来の loss 情報を含む

この API の目的は、「Slack に投稿するための最終 payload を 1 回で作ること」です。

## 11. Strict Mode と Compat Mode

### 11.1 Strict mode

- documented shape のみ受け入れる
- 数値でない date timestamp を error とする
- 未知 token や未知 entity を積極的に diagnostic 化する
- import 結果の recover を最小限にする

### 11.2 Compat mode

- retrieved message 由来の variant を受け入れる
- optional label 付き mention variant を受け入れる
- colon emoji を受け入れる
- downgrade と継続を優先する

既定 mode は `compat` とします。

## 12. Normalization ルール

`normalizeDocument()` は少なくとも次を行います。

- 隣接 `TextInline` の merge
- 空 text node の削除
- block 先頭・末尾の不要な `LineBreakInline` の整理
- 空 paragraph の削除
- list item 内の空 inline 列の整理
- invalid mark 組み合わせの除去
- mention / date / emoji に付いた不正 marks の除去

normalize 後の document は `serializeToRichText()` 可能でなければなりません。

## 13. 最低限の受け入れテスト

### 13.1 authoring / posting

- 空 document を生成できる
- editor で構築した document を normalize 後に `serializeForChatPostMessage()` できる
- `serializeForChatPostMessage()` が `text` と `blocks` を返す
- `blocks[0]` が常に `rich_text` block になる
- fallback `text` が空でない

### 13.2 `mrkdwn` import

- plain text
- bold と italic の入れ子
- punctuation を含む strike
- inline code
- language あり / なしの fenced code block
- 複数行 quote
- label 付き link
- retrieved bare URL canonical form
- retrieved fallback label 付き channel mention
- user mention
- user-group mention
- `<!here>`、`<!channel>`、`<!everyone>`
- 正常な `<!date...>` expression
- 壊れた `<!date...>` の recover
- `&amp;`、`&lt;`、`&gt;` の decode

### 13.3 `rich_text` import

- style 付き text を含む section
- `indent` による list
- `offset` を持つ ordered list
- `language` を持つ preformatted block
- quote block
- custom label を持つ link
- emoji
- channel、user、usergroup mention
- broadcast element
- date element
- unsupported element が text downgrade と diagnostic になる

### 13.4 export

- `mrkdwn` から parse した document を `rich_text` に serialize できる
- `rich_text` から parse した supported subset が再 serialize で維持される
- lossy `mrkdwn` export で diagnostic が返る

## 14. 実装メモ

実装は hand-written scanner と validator / serializer の組み合わせを前提とします。

推奨 module 分割:

- `types.ts`
- `document/create-document.ts`
- `document/normalize-document.ts`
- `parser/mrkdwn.ts`
- `parser/rich-text.ts`
- `serializer/rich-text.ts`
- `serializer/mrkdwn.ts`
- `serializer/chat-post-message.ts`
- `diagnostics.ts`
- `index.ts`

## 15. 将来拡張

次が要件化された場合は、別途 spec revision を行います。

- `markdown` block import
- full-fidelity rich-text editing
- unsupported rich-text element の raw preservation
- Slack API resolver と連携した name-to-ID 解決
- 既存 Slack message の差分編集

## 16. 参照

2026-04-11 時点で確認した Slack Developer Docs:

- https://docs.slack.dev/messaging/formatting-message-text/
- https://docs.slack.dev/reference/block-kit/composition-objects/text-object/
- https://docs.slack.dev/reference/block-kit/blocks/rich-text-block/
- https://docs.slack.dev/reference/block-kit/blocks/markdown-block/
