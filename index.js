const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const auth = require("./authentication.js");
const userfiles = require("./userfiles.js");
const expressuseragent = require("express-useragent");
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(expressuseragent.express());

app.use(cookieParser());

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: "Too many login attempts, please try again later.",
});

app.use(generalLimiter);
app.use("/login", loginLimiter);
app.use("/token", loginLimiter);
app.use("/logout", loginLimiter);

app.get("/", (req, res) => {
  res.set("Content-Type", "text/html");
  res.sendFile(path.join(__dirname, "./view/index.html"));
});

app.get("/files", auth.authMcookies, (req, res) => {
  res.set("Content-Type", "text/html");
  res.sendFile(path.join(__dirname, "./view/dashboard.html"));
});

app.get("/concept", auth.authMcookies, (req, res) => {
  res.set("Content-Type", "text/html");
  res.sendFile(path.join(__dirname, "./view/folder_design_concept.html"));
});

app.get("/login", (req, res) => {
  res.redirect(301, "/");
});

app.post("/login", (req, res) => {
  const { username, password, extendedExpire } = req.body;
  const useragent = req.useragent;

  res.set("Content-Type", "application/json");

  auth
    .login(username, password, extendedExpire, useragent)
    .then((response) => {
      if (response !== null) {
        res.cookie("token", response[0], { httpOnly: true, sameSite: "strict", maxAge: response[1] });
        res.cookie("user", username, { httpOnly: true, sameSite: "strict", maxAge: response[1] });
        res.redirect(303, "/files");
      } else {
        res.status(200).send({ success: false });
      }
    })
    .catch((message) => {
      res.status(500).send(message);
    });
});

app.post("/token", auth.authMcookies, (req, res) => {
  res.redirect(303, "/files");
});

app.get("/upload", auth.authMcookies, (req, res) => {
  res.set("Content-Type", "text/html");
  res.sendFile(path.join(__dirname, "./view/upload.html"));
});

app.get("/logout", (req, res) => {
  res.set("Content-Type", "application/json");

  const { token } = req.cookies;

  auth
    .invalidateToken(token)
    .then((message) => {
      res.cookie("token", undefined, { maxAge: -1 });
      res.cookie("user", undefined, { maxAge: -1 });
      res.redirect(303, "/");
    })
    .catch((message) => {
      res.set("Content-Type", "text/html");
      res.status(500).sendFile(path.join(__dirname, "./view/500.html"));
    });
});

app.use(express.static("view/assets"));

app.all("*", (req, res) => {
  res.status(404).sendFile(path.join(__dirname, "./view/404.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, "./view/500.html"));
});

app.listen(port);
console.log("Server started at http://localhost:" + port);
