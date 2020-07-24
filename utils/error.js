/**
 * @extends Error
 */
class ExtendableError extends Error {
    constructor({ message, stack, status, meta }) {
        super(message);
        this.message = message;
        this.status = status;
        this.stack = stack;
        this.meta = meta
        // Error.captureStackTrace(this, this.constructor.name);
    }
}

/**
 * Class representing an API error.
 * @extends ExtendableError
 */
class APIError extends ExtendableError {
    /**
     * Creates an API error.
     * @param {string} message - Error message.
     * @param {number} status - HTTP status code of error.
     */
    constructor({ message, stack, status = 500, meta = {}, name = "APIError" }) {
        super({ message, stack, status, meta });
        this.name = name
    }

    toJSON() {
        return {
            name: this.name,
            meta: this.meta,
            stack: this.stack,
            status: this.status,
            message: this.message
        }
    }
}

module.exports = APIError;
