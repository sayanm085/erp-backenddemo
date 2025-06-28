/**
 * Current Date and Time (UTC): 2025-06-28 11:49:32
 * Current User's Login: sayanm085
 */

function ApiError(statusCode, message = "Something went wrong", errors = [], stack = "") {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.data = null;
    error.message = message;
    error.success = false;
    error.errors = errors;

    if (stack) {
        error.stack = stack;
    } else {
        Error.captureStackTrace(error, ApiError); // Changed from createApiError to ApiError
    }

    return error;
}

export { ApiError };