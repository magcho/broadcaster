export class ExhaustiveError extends Error {
  constructor(value: never, options?: ErrorOptions) {
    super(`Unexpected value: ${value}`, options)
  }
}
