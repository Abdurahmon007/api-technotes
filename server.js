require("dotenv").config();
require("express-async-errors");
const express = require("express");
const app = express();

// built-in or 3rd party middlewares
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");

// connect to the database
const connectDB = require("./config/dbConnect");
const mongoose = require("mongoose");

// custom middlewares
const { logger, logEvents } = require("./midlleware/logger");
const errorHandler = require("./midlleware/errorHandler");
const corsOptions = require("./config/corsOptions");

const PORT = process.env.PORT || 3001;
app.use(morgan("dev"));
app.use(logger);
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

connectDB();

app.use("/", express.static(path.join(__dirname, "public")));

app.use("/", require("./routes/root.js"));
app.use("/auth", require("./routes/authRoutes.js"));
app.use("/users", require("./routes/userRoutes.js"));
app.use("/notes", require("./routes/notesRoutes.js"));

app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

app.use(errorHandler);

mongoose.connection.once("open", () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

mongoose.connection.on("error", (err) => {
  console.log(err);
  logEvents(
    `${err.errno}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrorLog.log"
  );
  // throw new Error("Could not connect to the database");
});
