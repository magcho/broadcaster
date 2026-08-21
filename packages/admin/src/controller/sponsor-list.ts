import { listSponsors2 } from "../infrastructure/db/list-sponsor.js"

export const listSponsorsController = async () => {
  const sponsors = await listSponsors2()
  return sponsors
}
