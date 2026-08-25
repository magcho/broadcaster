import type { MessageTemplateWithDetail } from "../../domain/model/Message.js"
import { MessageCollection, mongoDb, SponsorCollection } from "../../libs/db.js"

export const getScheduledMessages = async (): Promise<MessageTemplateWithDetail[]> => {
  const rows = await mongoDb
    .collection<MessageCollection>(MessageCollection.name)
    .find({
      scheduledAt: {
        $gt: new Date().toISOString(),
      },
      sentAt: null,
    })
    .toArray()

  return rows.map((row) => ({
    id: row._id,
    message: row.message,
    addMention: row.addMention,
    scheduledAt: row.scheduledAt,
    // target:,
    sentAt: row.sentAt == null ? null : new Date(row.sentAt),
  }))
}
