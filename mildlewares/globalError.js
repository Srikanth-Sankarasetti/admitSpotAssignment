const globalerr = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorMessage =
    process.env.NODE_ENV === "production"
      ? "Something went wrong, please try again later." // Generic message for production
      : err.message; // Detailed error for development or testing

  res.status(statusCode).send({
    message: errorMessage,
    stack:
      process.env.NODE_ENV === "production" ? undefined : err.stack.message,
  });
};

module.exports = globalerr;
