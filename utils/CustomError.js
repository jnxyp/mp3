export class CustomError extends Error {
  constructor(message, statusCode = 400, data = null, originalError = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.originalError = originalError;

    if (originalError) {
      this._extractErrorInfo(originalError);
    }
  }

  _extractErrorInfo(err) {
    if (err.name === 'ValidationError') {
      this.statusCode = 400;
      this.message = 'Invalid request data';
      this.data = Object.keys(err.errors).map(k => err.errors[k].message);
    }
    else if (err.name === 'CastError') {
      this.statusCode = 400;
      this.message = `Invalid ID format: ${err.path || 'unknown field'}`;
    }
    else if (err.code === 11000) {
      this.statusCode = 409;
      this.message = 'Duplicate key error';
      const field = Object.keys(err.keyValue || {})[0];
      if (field) {
        this.data = `Duplicate value for field: ${field}`;
      }
    }
  }

  static fromError(err) {
    if (err instanceof CustomError) {
      return err;
    }
    return new CustomError('An unexpected error occurred', 500, null, err);
  }
}
