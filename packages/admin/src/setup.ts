import { initMongoDb } from "./libs/db.js"

try {
  await initMongoDb()
} catch (e) {
  console.error(e)
  process.exit(1)
} finally {
  process.exit(0)
}
