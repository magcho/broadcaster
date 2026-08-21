import { MongoClient } from "mongodb"
import z from "zod"

const client = new MongoClient(process.env.MONGODB_URI!)
export const mongoDb = client.db("broadcaster")

export const SponsorCollection = {
  name: "sponsors",
  schema: z.object({
    _id: z.string(),
    name: z.string(),
    readableId: z.string(),
    slackChannelId: z.string(),
    slackUserIds: z.array(z.string()),
    labelIds: z.array(z.string()),
  }),
}
export type SponsorCollection = z.infer<typeof SponsorCollection.schema>

export const LabelCollection = {
  name: "labels",
  schema: z.object({
    _id: z.string(),
    label: z.string(),
    color: z.string(),
    order: z.int(),
  }),
}
export type LabelCollection = z.infer<typeof LabelCollection.schema>
