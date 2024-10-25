const express = require("express");
const next = require("next");

const pool = require("././utils/dbconnect");

const globalError = require("./mildlewares/globalError");
const AppError = require("./mildlewares/appError");
const userRoute = require("./routes/userRoute");
const contactRoute = require("./routes/contactsRoute");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

pool
  .connect()
  .then(() => {
    console.log("Database connection successful");
  })
  .catch((err) => {
    console.error(err.message);
  });

app.prepare().then(() => {
  const server = express();

  // Middleware for JSON parsing, security, etc.
  server.use(express.json());

  // Define your custom API routes, e.g.:

  server.use("/admitspot/assignment", userRoute);
  server.use("/admitspot/assignment/contacts", contactRoute);

  // Catch-all for Next.js pages
  server.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`), 404);
  });
  server.use(globalError);

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`Server running on http://localhost:${port}`);
  });
});
