import { LabelCollection, mongoDb } from "../../libs/db"

export const upsertLabel = async (id: string, data: { label: string; color: string }) => {
  const maxOrderPlan = await mongoDb
    .collection<LabelCollection>(LabelCollection.name)
    .findOne({}, { sort: { order: "desc" } })
  const nextOrder = maxOrderPlan?.order ?? 0

  await mongoDb.collection<LabelCollection>(LabelCollection.name).updateOne(
    {
      _id: id,
    },
    {
      $set: {
        label: data.label,
        color: data.color,
        order: nextOrder,
      },
    },
    {
      upsert: true,
    },
  )
}
