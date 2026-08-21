export function findLeafFromDomPosition(
  baseNode: HTMLDivElement,
  node: Node,
  offset: number,
): HTMLElement | null {
  const directLeaf = closestLeaf(node)
  if (directLeaf && baseNode.contains(directLeaf)) {
    return directLeaf
  }

  if (node instanceof Element) {
    const children = [...node.childNodes]
    const next = children[offset] ?? children[offset - 1] ?? node
    const nextLeaf = closestLeaf(next)
    if (nextLeaf && baseNode.contains(nextLeaf)) {
      return nextLeaf
    }
  }

  return baseNode.querySelector("[data-editor-path]")
}

function closestLeaf(node: Node): HTMLElement | null {
  if (node instanceof HTMLElement && node.dataset.editorPath) {
    return node
  }
  if (node.parentElement?.dataset.editorPath) {
    return node.parentElement
  }
  return node.parentElement?.closest("[data-editor-path]") ?? null
}

export function resolveTextOffset(leaf: HTMLElement, node: Node, offset: number): number {
  if (node.nodeType === Node.TEXT_NODE) {
    return offset
  }
  if (node === leaf) {
    const textLength = leaf.textContent === "\u200b" ? 0 : (leaf.textContent?.length ?? 0)
    return offset <= 0 ? 0 : textLength
  }
  return 0
}

export function resolveAtomicOffset(leaf: HTMLElement, node: Node, offset: number): 0 | 1 {
  if (node === leaf) {
    return offset <= 0 ? 0 : 1
  }
  if (node.parentNode) {
    const siblings = [...node.parentNode.childNodes]
    const leafIndex = siblings.indexOf(leaf)
    if (leafIndex !== -1) {
      return offset <= leafIndex ? 0 : 1
    }
  }
  return 1
}

export function selectionBelongsToNode(selection: Selection, baseNode: HTMLDivElement): boolean {
  const anchorNode = selection.anchorNode
  const focusNode = selection.focusNode
  return Boolean(
    anchorNode && focusNode && baseNode.contains(anchorNode) && baseNode.contains(focusNode),
  )
}
