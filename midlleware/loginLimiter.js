const { logEvents } = require("./logger");

const rateLimit = require("express-rate-limit");
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1minute
  max: 5,
  message: {
    message:
      "Too many login attempts from this IP, please try again after 60 second pause",
  },
  handler: (req, res, next, options) => {
    console.log("salom");
    logEvents(
      `Too Many Requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
      "errLog.log"
    );
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = loginLimiter;
