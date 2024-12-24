const devErrors = (res, error) => {
  res.status(error.statusCode).json({
    statusCode: error.statusCode,
    success: error.success,
    message: error.message,
    stackTrace: error.stack,
    error: error,
  });
};

const prodErrors = (res, error) => {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      statusCode: error.statusCode,
      message: error.message,
    });
  } else {
    res.status(500).json({
      statusCode: '500',
      message: 'Something went wrong! Please try again later.',
    });
  }
};

//middleware handles all the express errors
const errorHandler = (error, _, res, _2) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'production') {
    //add uncaught errors handling
    //mongodb duplicate key error handler
    //mongodb validation error handler
    prodErrors(res, error);
  } else {
    devErrors(res, error);
  }
};

export default errorHandler;
