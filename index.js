const express = require("express");
const path = require("path");
const multer = require("multer");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const auth = require("./authentication.js");
const expressuseragent = require("express-useragent");

const app = express();
const port = process.env.PORT || 8080;

const upload = multer();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(expressuseragent.express());

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

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "./view/index.html"));
});

app.get("/dashboard", function (req, res) {
  res.sendFile(path.join(__dirname, "./view/dashboard.html"));
});

app.get("/login", (req, res) => {
  res.redirect(
    301,
    "/",
    "Assuming you want to see the loin page. For authentication use POST on this endpoint."
  );
});

app.post("/login", (req, res) => {
  const { username, password, extendedExpire } = req.body;
  const useragent = req.useragent;

  res.set("Content-Type", "application/json");

  auth
    .login(username, password, extendedExpire, useragent)
    .then((response) => {
      res.status(response[0]).send(response[1]);
      console.log(`Username ${username} logged in ` + (extendedExpire) ? "with extended expire." : "without extended expire.")
    })
    .catch((message) => {
      res.status(500).send(message);
    });
});

app.post("/token", (req, res) => {
  const { username, token } = req.body;
  const useragent = req.useragent;

  res.set("Content-Type", "application/json");

  auth.isTokenValidForUser(username, token, useragent).then((response) => {
    if(response){
      res.status(200).send({ message: "valid" });
      console.log(`Token for username ${username} is valid.`)
    }else{
      res.status(401).send({ message: "invalid" });
      console.log(`Token for username ${username} is invalid.`)
    }
  }).catch((message) => {
    res.status(500).send(message);
  })
});

app.post("/upload", upload.single("file"), (req, res) => {
  const token = req.body.token;
  const file = req.file;

  res.status(501);
});

app.use(express.static("view/assets"));

app.listen(port);
console.log("Server started at http://localhost:" + port);
