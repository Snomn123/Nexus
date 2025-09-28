const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Create a DOMPurify instance for server-side use
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Security utility functions for input sanitization and validation
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} input - Raw HTML/text input
 * @returns {string} - Sanitized content
 */
function sanitizeHtml(input) {
    if (typeof input !== 'string') {
        return '';
    }
    
    // Configure DOMPurify for chat messages
    const config = {
        ALLOWED_TAGS: ['b', 'i', 'u', 'em', 'strong', 'code', 'pre', 'br'],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
        ALLOW_DATA_ATTR: false
    };
    
    return purify.sanitize(input, config);
}

/**
 * Sanitize plain text (removes all HTML)
 * @param {string} input - Raw text input
 * @returns {string} - Plain text only
 */
function sanitizeText(input) {
    if (typeof input !== 'string') {
        return '';
    }
    
    // Strip all HTML tags
    return purify.sanitize(input, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
}

/**
 * Validate and sanitize username
 * @param {string} username - Raw username input
 * @returns {string} - Sanitized username
 */
function sanitizeUsername(username) {
    if (typeof username !== 'string') {
        return '';
    }
    
    // Remove HTML and limit to alphanumeric, spaces, underscores, hyphens
    const cleaned = sanitizeText(username);
    return cleaned.replace(/[^a-zA-Z0-9\s_-]/g, '').trim();
}

/**
 * Validate and sanitize email
 * @param {string} email - Raw email input
 * @returns {string} - Sanitized email
 */
function sanitizeEmail(email) {
    if (typeof email !== 'string') {
        return '';
    }
    
    return sanitizeText(email).toLowerCase().trim();
}

/**
 * Rate limiting helper - check if IP is making too many requests
 * @param {string} ip - Client IP address
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Promise<boolean>} - True if rate limit exceeded
 */
async function checkRateLimit(ip, maxRequests = 100, windowMs = 15 * 60 * 1000) {
    // This would typically use Redis to track request counts
    // For now, return false (not rate limited)
    return false;
}

/**
 * Validate JWT token format (additional layer)
 * @param {string} token - JWT token
 * @returns {boolean} - True if token format is valid
 */
function isValidJWTFormat(token) {
    if (typeof token !== 'string') {
        return false;
    }
    
    // JWT should have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
        return false;
    }
    
    // Each part should be base64url encoded
    const base64urlRegex = /^[A-Za-z0-9_-]+$/;
    return parts.every(part => part.length > 0 && base64urlRegex.test(part));
}

/**
 * Sanitize server/channel names
 * @param {string} name - Raw name input
 * @returns {string} - Sanitized name
 */
function sanitizeServerName(name) {
    if (typeof name !== 'string') {
        return '';
    }
    
    // Allow alphanumeric, spaces, some special characters
    const cleaned = sanitizeText(name);
    return cleaned.replace(/[^a-zA-Z0-9\s\-_#&()[\]{}]/g, '').trim();
}

/**
 * Content length validation
 * @param {string} content - Content to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} - True if content is within limits
 */
function validateContentLength(content, maxLength = 2000) {
    if (typeof content !== 'string') {
        return false;
    }
    
    return content.length <= maxLength;
}

/**
 * Security middleware for message content
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function sanitizeMessageMiddleware(req, res, next) {
    if (req.body && req.body.content) {
        // Sanitize message content
        req.body.content = sanitizeHtml(req.body.content);
        
        // Validate length
        if (!validateContentLength(req.body.content)) {
            return res.status(400).json({ error: 'Message content too long' });
        }
    }
    
    next();
}

module.exports = {
    sanitizeHtml,
    sanitizeText,
    sanitizeUsername,
    sanitizeEmail,
    sanitizeServerName,
    validateContentLength,
    isValidJWTFormat,
    checkRateLimit,
    sanitizeMessageMiddleware
};