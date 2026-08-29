import { createServerFn } from "@tanstack/react-start"
import { mongoDb, SlackTokenCollection } from "../libs/db"

export const removeSlackAccessTokenController = createServerFn({ method: "POST" }).handler(
  async ({ context: { user } }) => {
    await mongoDb.collection<SlackTokenCollection>(SlackTokenCollection.name).deleteOne({
      _id: user.id,
    })
  },
)
