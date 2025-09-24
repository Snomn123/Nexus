/**
 * Standardized API Response Utility
 * Provides consistent response format across all API endpoints
 */

/**
 * Success response format
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Formatted success response
 */
function success(data = null, message = 'Success', statusCode = 200) {
    return {
        success: true,
        message,
        data,
        statusCode,
        timestamp: new Date().toISOString()
    };
}

/**
 * Error response format
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {*} errors - Detailed error information
 * @returns {Object} Formatted error response
 */
function error(message = 'An error occurred', statusCode = 400, errors = null) {
    return {
        success: false,
        message,
        errors,
        statusCode,
        timestamp: new Date().toISOString()
    };
}

/**
 * Validation error response format
 * @param {Array} validationErrors - Array of validation errors
 * @param {string} message - General validation message
 * @returns {Object} Formatted validation error response
 */
function validationError(validationErrors, message = 'Validation failed') {
    return error(message, 422, validationErrors);
}

/**
 * Unauthorized error response
 * @param {string} message - Error message
 * @returns {Object} Formatted unauthorized response
 */
function unauthorized(message = 'Unauthorized access') {
    return error(message, 401);
}

/**
 * Forbidden error response
 * @param {string} message - Error message
 * @returns {Object} Formatted forbidden response
 */
function forbidden(message = 'Access forbidden') {
    return error(message, 403);
}

/**
 * Not found error response
 * @param {string} message - Error message
 * @returns {Object} Formatted not found response
 */
function notFound(message = 'Resource not found') {
    return error(message, 404);
}

/**
 * Internal server error response
 * @param {string} message - Error message
 * @returns {Object} Formatted server error response
 */
function serverError(message = 'Internal server error') {
    return error(message, 500);
}

/**
 * Paginated response format
 * @param {Array} data - Array of data items
 * @param {Object} pagination - Pagination metadata
 * @param {string} message - Success message
 * @returns {Object} Formatted paginated response
 */
function paginated(data, pagination, message = 'Success') {
    return {
        success: true,
        message,
        data,
        pagination: {
            currentPage: pagination.currentPage || 1,
            totalPages: pagination.totalPages || 1,
            totalItems: pagination.totalItems || data.length,
            itemsPerPage: pagination.itemsPerPage || data.length,
            hasNext: pagination.hasNext || false,
            hasPrev: pagination.hasPrev || false
        },
        statusCode: 200,
        timestamp: new Date().toISOString()
    };
}

/**
 * Express middleware to send standardized responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function middleware(req, res, next) {
    // Add helper methods to response object
    res.apiSuccess = (data, message, statusCode = 200) => {
        const response = success(data, message, statusCode);
        return res.status(statusCode).json(response);
    };

    res.apiError = (message, statusCode = 400, errors = null) => {
        const response = error(message, statusCode, errors);
        return res.status(statusCode).json(response);
    };

    res.apiValidationError = (validationErrors, message) => {
        const response = validationError(validationErrors, message);
        return res.status(422).json(response);
    };

    res.apiUnauthorized = (message) => {
        const response = unauthorized(message);
        return res.status(401).json(response);
    };

    res.apiForbidden = (message) => {
        const response = forbidden(message);
        return res.status(403).json(response);
    };

    res.apiNotFound = (message) => {
        const response = notFound(message);
        return res.status(404).json(response);
    };

    res.apiServerError = (message) => {
        const response = serverError(message);
        return res.status(500).json(response);
    };

    res.apiPaginated = (data, pagination, message) => {
        const response = paginated(data, pagination, message);
        return res.status(200).json(response);
    };

    next();
}

module.exports = {
    success,
    error,
    validationError,
    unauthorized,
    forbidden,
    notFound,
    serverError,
    paginated,
    middleware
};