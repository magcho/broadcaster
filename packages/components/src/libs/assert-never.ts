export class AssertNever extends Error {
  constructor(_: never, message?: string, option?: ErrorOptions) {
    super(message, option)
  }
}
