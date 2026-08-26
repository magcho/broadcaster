import { mongoDb, SlackTokenCollection } from "../libs/db"
import { decryptToken } from "../libs/encryption"

const SLACK_TOKEN_ENCRYPTION_KEY = process.env.SLACK_TOKEN_ENCRYPTION_KEY
if (SLACK_TOKEN_ENCRYPTION_KEY == null) {
  throw new Error("SLACK_TOKEN_ENCRYPTION_KEY not found")
}

export const getSlackAccessToken = async (userId: string) => {
  const row = await mongoDb.collection<SlackTokenCollection>(SlackTokenCollection.name).findOne({
    _id: userId,
  })

  const token = row?.encryptedToken

  return token == null ? null : decryptToken(SLACK_TOKEN_ENCRYPTION_KEY, token)
}
