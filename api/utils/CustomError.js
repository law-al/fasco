class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // This is important for error handling

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = CustomError;
