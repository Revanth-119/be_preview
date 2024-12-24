import winston from 'winston';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const formatLogMessage = (message, metadata) => {
  const timestamp = new Date().toISOString();
  const requestId = metadata?.requestId || 'N/A';
  const tenantId = metadata?.tenantId || 'N/A';

  let formattedMessage = `[${timestamp}] [${requestId}] [Tenant: ${tenantId}] ${message}`;

  if (metadata) {
    const metadataString = JSON.stringify(metadata, null, 2);
    formattedMessage += `\nMetadata: ${metadataString}`;
  }

  return formattedMessage;
};

const createLogger = (config) => {
  const transports = [];

  if (config.enableConsole) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, ...metadata }) => {
            return formatLogMessage(`[${level}] ${message}`, metadata);
          })
        ),
      })
    );
  }

  return winston.createLogger({
    level: config.level,
    levels: LOG_LEVELS,
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports,
    exceptionHandlers: transports,
    rejectionHandlers: transports,
    exitOnError: false,
  });
};

const defaultConfig = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableConsole: process.env.NODE_ENV !== 'production',
};

const logger = createLogger(defaultConfig);

export default Object.assign(logger, {
  security: (message, metadata) => {
    logger.warn(`[SECURITY] ${message}`, { ...metadata, securityEvent: true });
  },

  metric: (name, value, metadata) => {
    logger.info(`[METRIC] ${name}: ${value}`, {
      ...metadata,
      metricName: name,
      metricValue: value,
    });
  },

  audit: (action, metadata) => {
    logger.info(`[AUDIT] ${action}`, { ...metadata, auditEvent: true });
  },

  tenant: (tenantId, message, metadata) => {
    logger.info(message, { ...metadata, tenantId });
  },
});
