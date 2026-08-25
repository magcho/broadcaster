import { mongoDb, SponsorCollection } from "../../libs/db"

export const deleteSponsorLabels = async (sponsorId: string, labelId: string) => {
  await mongoDb.collection<SponsorCollection>(SponsorCollection.name).updateOne(
    {
      _id: sponsorId,
    },
    {
      $pull: {
        labelIds: labelId,
      },
    },
  )
}
