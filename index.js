const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const auth = require("./authentication.js");
const userfiles = require("./userfiles.js")
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

app.get("/", function (req, res) {
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
      console.log(`Username ${username} logged in ` + ((extendedExpire) ? "with extended expire." : "without extended expire."))
    })
    .catch((message) => {
      res.status(500).send(message);
    });
});

app.post("/token", auth.authMbody, (req, res) => {
  res.set("Content-Type", "application/json");

      res.status(200).send({ message: "valid" });
});

app.get("/upload", auth.authMcookies, (req, res) => {
  res.set("Content-Type", "text/html");
  res.sendFile(path.join(__dirname, "./view/upload.html"));
});

/*app.post("/upload", userfiles.upload.single("file"), (req, res) => {
  const { username, token } = req.body;
  const useragent = req.useragent;

  auth
    .isTokenValidForUser(username, token, useragent)
    .then((response) => {})
    .catch((message) => {});
});*/

app.post("/logout", (req, res) => {
  const { username, token } = req.body;

  if(auth.invalidateToken(token)){
    res.status(200).send()
  } else {
    res.status(500).send()
  }

  console.log(`Username ${username} logged out.`)
})

app.use(express.static("view/assets"));

app.listen(port);
console.log("Server started at http://localhost:" + port);
