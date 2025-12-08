export class NetworkRequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'NetworkRequestError'
  }
}
