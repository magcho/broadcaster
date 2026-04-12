import type { CreateDocumentInput, SlackDocument } from "../types.js"

export function createDocument(input?: CreateDocumentInput): SlackDocument {
  return {
    kind: "document",
    blocks: input?.blocks ? [...input.blocks] : [],
  }
}
