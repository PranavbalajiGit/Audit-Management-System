/**
 * Formats a successful API response
 * @param {string} message - User-friendly message
 * @param {object|array} data - Response payload
 * @param {object} [pagination] - Optional pagination metadata
 */
const successResponse = (message, data = {}, pagination = null) => {
  const response = {
    success: true,
    message,
    data,
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  return response;
};

/**
 * Formats an error API response
 * @param {string} message - User-friendly error message
 * @param {array} [errors] - Optional detailed field-level errors
 */
const errorResponse = (message, errors = []) => {
  return {
    success: false,
    message,
    errors,
  };
};

module.exports = {
  successResponse,
  errorResponse,
};
