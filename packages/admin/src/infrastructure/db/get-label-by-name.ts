import { LabelCollection, mongoDb } from "../../libs/db"

export const getLabelsByNames = async (labelNames: string[]) => {
  const labels = await mongoDb
    .collection<LabelCollection>(LabelCollection.name)
    .find({
      label: {
        $in: labelNames,
      },
    })
    .map((doc) => ({
      id: doc._id,
      label: doc.label,
      color: doc.color,
    }))
    .toArray()

  return labels
}

export const getLabelByName = async (label: string) => {
  const labels = await getLabelsByNames([label])
  const first = labels[0]
  if (first == null) {
    throw new Error("Label not found")
  }
  return first
}
