import { LabelCollection, mongoDb, SponsorCollection } from "../../libs/db"

export const deleteLabels = async (labelIds: string[]) => {
  await mongoDb.collection<LabelCollection>(LabelCollection.name).deleteMany({
    _id: {
      $in: labelIds,
    },
  })

  await mongoDb.collection<SponsorCollection>(SponsorCollection.name).updateMany(
    {},
    {
      $pull: {
        labelIds: {
          $in: labelIds,
        },
      },
    },
  )
}
