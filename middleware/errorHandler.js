export function errorHandler(err, req, res, next) {

  let statusCode = 500;
  let message = 'An unexpected error occurred';
  let data = null;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Invalid request data';
    data = Object.keys(err.errors).map(k => err.errors[k].message);
  } 
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } 
  else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate key error';
  } 
  else if (err.statusCode) { 
    statusCode = err.statusCode;
    message = err.message || message;
    data = err.data || null;
  }

  res.status(statusCode).json({
    message,
    data
  });
}
