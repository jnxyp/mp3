export class CustomError extends Error {
  constructor(message, statusCode = 400, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
  }
}
