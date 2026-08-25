import { listLabels2 } from "./list-labels"
import { LabelCollection, mongoDb } from "../../libs/db"

export const changeLabelsOrder = async (ids: string[]) => {
  const labels = await listLabels2()
  const labelMap = new Map(labels.map((label) => [label.id, label]))
  const ordered = ids
    .map((id, index) => {
      const label = labelMap.get(id)
      return {
        ...label,
        order: index,
      }
    })
    .filter((label) => label != null)

  await mongoDb.collection<LabelCollection>(LabelCollection.name).bulkWrite(
    ordered.map((label) => ({
      updateOne: {
        filter: {
          _id: label.id,
        },
        update: {
          $set: {
            order: label.order,
          },
        },
        upsert: true,
      },
    })),
  )
}
