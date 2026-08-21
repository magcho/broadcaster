import { getLabels2 } from "../infrastructure/db/get-labels.js"

export const getLabelController = async (labelId: string) => {
  const labels = await getLabels2([labelId])

  if (labels.length === 0) {
    throw new Error("Label not found")
  }

  return labels[0]!
}
