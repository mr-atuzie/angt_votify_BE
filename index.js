const dotenv = require("dotenv").config();
const express = require("express");
const colors = require("colors");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const xlsx = require("xlsx");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { errorHandler, notFound } = require("./middlewares/errorMiddleware");
const connectDB = require("./config/db");

const userRoutes = require("./routes/user");
const electionRoutes = require("./routes/election");
const ballotRoutes = require("./routes/ballot");
const voterRoutes = require("./routes/voter");

const app = express();

app.use(
  cors({
    origin: [
      "https://2ruevote.com",
      "https://2ruevote.netlify.app",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/election", electionRoutes);
app.use("/api/v1/ballot", ballotRoutes);
app.use("/api/v1/voter", voterRoutes);

app.get("/", (req, res) => {
  res.send("Hello world :)");
});

app.use(errorHandler);
app.use(notFound);

const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {
  connectDB();
  console.log(`Server running on port ${PORT}`.magenta.bold);
});
