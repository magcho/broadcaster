import type { Label } from "../../domain/model/Sponsor"
import { LabelCollection, mongoDb } from "../../libs/db"

export const getLabels = async (labelIds: string[]): Promise<Label[]> => {
  const labels = await mongoDb
    .collection<LabelCollection>(LabelCollection.name)
    .find({
      _id: {
        $in: labelIds,
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
