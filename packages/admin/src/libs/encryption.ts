import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"

export const encryptToken = (plainEncriptionKey: string, text: string) => {
  const encriptionKey = Buffer.from(plainEncriptionKey, "base64")

  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, encriptionKey, iv)

  const encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex")

  const authTag = cipher.getAuthTag().toString("hex")

  return `${iv.toString("hex")}:${authTag}:${encrypted}`
}

export const decryptToken = (plainEncriptionKey: string, erypted: string) => {
  const encriptionKey = Buffer.from(plainEncriptionKey, "base64")

  const [ivHex, authTagHex, encryptedText] = erypted.split(":")

  if (ivHex == null || authTagHex == null || encryptedText == null) {
    throw new Error("Invalid format")
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, encriptionKey, Buffer.from(ivHex, "hex"))

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"))

  const decrypted = decipher.update(encryptedText, "hex", "utf8") + decipher.final("utf8")

  return decrypted
}
