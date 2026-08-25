import { mongoDb, SponsorCollection } from "../../libs/db"
import { getLabelsByNames } from "./get-label-by-name"

export const upsertSponsor = async (
  sponsorId: string,
  sponsor: {
    name: string
    readableId: string
    slackChannelId: string
    slackUserIds: string[]
    labels: string[]
  },
) => {
  const labels = await getLabelsByNames(sponsor.labels)
  const labelMap = new Map(labels.map((label) => [label.label, label]))

  await mongoDb.collection<SponsorCollection>(SponsorCollection.name).updateOne(
    {
      _id: sponsorId,
    },
    {
      $set: {
        name: sponsor.name,
        readableId: sponsor.readableId,
        slackChannelId: sponsor.slackChannelId,
        slackUserIds: sponsor.slackUserIds,
        labelIds: sponsor.labels
          .map((labelName) => {
            const label = labelMap.get(labelName)
            if (label == null) {
              console.warn("Label not found", label)
            }
            return label?.id
          })
          .filter((label) => label != null),
      },
    },
    {
      upsert: true,
    },
  )
}
