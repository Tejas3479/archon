import pino from "pino";

// WHY: Structured logging is crucial for forensic auditing and error debugging.
// We configure pino for serverless environment compatibility.
export const logger = pino({
  level: "info",
  browser: {
    asObject: true
  }
});

export function logError(errorType: string, message: string, details?: any) {
  logger.error({
    event_type: "ERROR",
    error_type: errorType,
    message,
    details,
    timestamp: Date.now()
  });
}

export function logInfo(message: string, details?: any) {
  logger.info({
    event_type: "INFO",
    message,
    details,
    timestamp: Date.now()
  });
}

export function logWarn(message: string, details?: any) {
  logger.warn({
    event_type: "WARN",
    message,
    details,
    timestamp: Date.now()
  });
}

export function logSecurityEvent(action: string, details?: any) {
  logger.warn({
    event_type: "SECURITY_AUDIT",
    action,
    details,
    timestamp: Date.now()
  });
}
