import { mongoDb, SponsorCollection } from "../../libs/db"

export const deleteSponsors = async (sponsorIds: string[]) => {
  await mongoDb.collection<SponsorCollection>(SponsorCollection.name).deleteMany({
    _id: {
      $in: sponsorIds,
    },
  })
}
