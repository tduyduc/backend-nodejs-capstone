const pino = require('pino');

/** @type {import('pino').Logger} */
let logger;

if (process.env.NODE_ENV !== 'production') {
    // In non-production environments, log to the console
    logger = pino({
        level: 'debug',
        transport: {
            target: "pino-pretty",
        },
    });
} else {
    // production
    logger = pino();
}

module.exports = logger;
