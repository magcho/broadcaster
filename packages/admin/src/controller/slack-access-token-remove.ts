import { createServerFn } from "@tanstack/react-start"
import { mongoDb, SlackTokenCollection } from "../libs/db"
import z from "zod"

export const removeSlackAccessTokenController = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string(),
    }),
  )
  .handler(async ({ data: { userId } }) => {
    await mongoDb.collection<SlackTokenCollection>(SlackTokenCollection.name).deleteOne({
      _id: userId,
    })
  })
