/**
 * Standardized response handler for API responses
 */

const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
    ...(data && { data })
  };

  return res.status(statusCode).json(response);
};

const sendError = (res, message, statusCode = 500) => {
  const response = {
    success: false,
    error: message
  };

  return res.status(statusCode).json(response);
};

const sendPaginatedSuccess = (res, message, data, pagination, statusCode = 200) => {
  const response = {
    success: true,
    message,
    data,
    pagination
  };

  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginatedSuccess
};