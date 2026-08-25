import { mongoDb, SponsorCollection } from "../../libs/db"

export const createSponsorLabels = async (sponsorIds: string[], labelIds: string[]) => {
  await mongoDb.collection<SponsorCollection>(SponsorCollection.name).updateMany(
    {
      _id: {
        $in: sponsorIds,
      },
    },
    {
      $addToSet: {
        labelIds: {
          $each: labelIds,
        },
      },
    },
  )
}
