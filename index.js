const express = require("express");
const path = require("path");
const multer = require("multer");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const auth = require("./authentication.js");

const app = express();
const port = process.env.PORT || 8080;

const upload = multer();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later."
});

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: "Too many login attempts, please try again later."
});


app.use(generalLimiter);
app.use("/login", loginLimiter);



app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "./view/index.html"));
});

app.get("/dashboard", function (req, res) {
  res.sendFile(path.join(__dirname, "./view/dashboard.html"));
});

app.get('/login', (req, res) => {
    res.redirect(301, '/', 'Assuming you want to see the loin page. For authentication use POST on this endpoint.');
});

app.post("/login", (req, res) => {
  const { username, password, extendedExpire } = req.body;

  res.set('Content-Type', 'application/json');
  
  auth.login(username, password, extendedExpire).then((response) => {
    res.status(response[0]).send(response[1])
  }).catch((message) => {
    res.status(500).send(message)
  })
});

app.post("/upload", upload.single("file"), (req, res) => {
  const token = req.body.token;
  const file = req.file;

  res.status(501)
});

app.use(express.static("view/assets"));

app.listen(port);
console.log("Server started at http://localhost:" + port);
