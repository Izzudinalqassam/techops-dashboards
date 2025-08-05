// Security event logging utility
const logSecurityEvent = (eventType, details) => {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY EVENT] ${timestamp} - ${eventType}: ${JSON.stringify(details)}`);
};

// General logging utility
const logger = {
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp} - ${message}`, meta);
  },
  
  error: (message, error = null, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} - ${message}`, { error: error?.message || error, stack: error?.stack, ...meta });
  },
  
  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] ${timestamp} - ${message}`, meta);
  },
  
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.debug(`[DEBUG] ${timestamp} - ${message}`, meta);
    }
  },
  
  security: logSecurityEvent
};

module.exports = {
  logger,
  logSecurityEvent
};