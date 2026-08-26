import { addHours } from "date-fns"
import { mongoDb, SlackTokenCollection } from "../libs/db"
import { encryptToken } from "../libs/encryption"

const SLACK_TOKEN_ENCRYPTION_KEY = process.env.SLACK_TOKEN_ENCRYPTION_KEY
if (SLACK_TOKEN_ENCRYPTION_KEY == null) {
  throw new Error("SLACK_TOKEN_ENCRYPTION_KEY not found")
}

export const saveSlackAccessToken = async (userId: string, token: string) => {
  const now = new Date()

  const encryptedToken = encryptToken(SLACK_TOKEN_ENCRYPTION_KEY, token)

  await mongoDb.collection<SlackTokenCollection>(SlackTokenCollection.name).insertOne({
    _id: userId,
    encryptedToken,
    createdAt: now.toISOString(),
    expiredAt: addHours(now, 1),
  })

  return {
    userId,
    token,
  }
}
