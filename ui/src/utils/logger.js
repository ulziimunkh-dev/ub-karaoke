/**
 * Simple Logger Utility for UI
 * Wraps console methods to provide a consistent logging interface.
 * Can be extended to send logs to a remote server (e.g. backend /logs endpoint) in integration.
 */

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

// Set default level based on environment (could be 'production' vs 'development')
const CURRENT_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

const formatMessage = (level, message, context = '') => {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `[${timestamp}] ${level} ${contextStr} ${message}`;
};

const log = (level, methodName, message, error = null, context = '') => {
    if (LOG_LEVELS[level] < CURRENT_LEVEL) return;

    const formatted = formatMessage(level, message, context);

    if (error) {
        console[methodName](formatted, error);
    } else {
        console[methodName](formatted);
    }
};

export const logger = {
    debug: (message, context) => log('DEBUG', 'debug', message, null, context),
    info: (message, context) => log('INFO', 'log', message, null, context),
    warn: (message, context) => log('WARN', 'warn', message, null, context),
    error: (message, error, context) => log('ERROR', 'error', message, error, context),
};
