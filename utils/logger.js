const winston = require('winston');
const fs = require('fs');
const config = require("../config")
const logDir = 'logs';
const { combine, label, printf, simple, splat, colorize } = winston.format;
const winstonRotate = require('winston-daily-rotate-file');
const wcf = require('winston-console-formatter');
const { formatter, timestamp } = wcf({ types: false, colors: false });
/* Creating the log directory if it does not exist */

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const tsFormat = () => new Date().toLocaleTimeString();

const prettify = data => {
  return JSON.stringify(data, null, 2);
};
const alignedWithColorsAndTime = label =>
  winston.format.combine(
    winston.format.timestamp({ timestamp: timestamp }),
    winston.format.label({ label: label }),
    winston.format.printf(info => {
      info['meta'] = {
        ...info
      };
      delete info.meta.timestamp;
      delete info.meta.label;
      delete info.meta.level;
      return `[${timestamp()}] ${formatter(info)}`;
    })
  );
/*
EXAMPLES
logger.debug('Debugging info');
logger.debug('Verbose info');
logger.info('Hello world');
logger.warn('Warning message');
logger.error('Error info');
*/

let logger = winston.createLogger({
  format: alignedWithColorsAndTime('[MM-BOT]'),
  transports: [
    new winston.transports.Console({
      level: config.ENV === 'development' ? 'debug' : 'info'
    }),
    new winstonRotate({
      filename: `${logDir}/error.log`,
      timestamp: tsFormat,
      datePattern: 'D-MM-YYYY',
      prepend: true,
      level: 'error',
      maxFiles: '2'
    }),
    new winstonRotate({
      filename: `${logDir}/debug.log`,
      timestamp: tsFormat,
      datePattern: 'D-MM-YYYY',
      prepend: true,
      level: 'debug',
      maxFiles: '2'
    })
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      level: config.ENV === 'development' ? 'debug' : 'info'
    }),
    new winstonRotate({
      filename: `${logDir}/error.log`,
      timestamp: tsFormat,
      datePattern: 'D-MM-YYYY',
      prepend: true,
      level: 'error',
      maxFiles: '2'
    })
  ],
  exitOnError: true
});



logger.stream = {
  write: function(message, encoding) {
    logger.info(message);
  }
};


module.exports = { logger, prettify };
