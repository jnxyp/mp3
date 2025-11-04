import { CustomError } from '../utils/CustomError.js';

export function errorHandler(err, req, res, next) {
  const customError = CustomError.fromError(err);

  res.status(customError.statusCode).json({
    message: customError.message,
    data: customError.data
  });
}
