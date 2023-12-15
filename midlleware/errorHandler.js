const { logEvents } = require("./logger");

const errorHandler = (err, req, res, next) => {
  logEvents(
    `${err.name}\t${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
    "errLog.log"
  );
  const status = err.statusCode ? err.statusCode : 500; // server error
  res.status(status);
  res.json({ message: err.message, isError: true });
  console.log(`${err.stack} ---------`);
};

module.exports = errorHandler;
