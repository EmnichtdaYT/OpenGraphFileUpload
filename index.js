const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");
const multer = require("multer");
const bodyParser = require("body-parser");

const db = new sqlite3.Database("credentials.db");

const app = express();
const port = process.env.PORT || 8080;

const upload = multer();

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "./view/index.html"));
});

app.get('/login', (req, res) => {
    res.redirect(301, '/', 'Assuming you want to see the loin page. For authentication use POST on this endpoint.');
});
  

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  console.log(username, password);

  res.set('Content-Type', 'application/json');
  res.status(401).send({message: "authentication failure"});
});

app.post("/upload", upload.single("file"), (req, res) => {
  const token = req.body.token;
  const file = req.file;

  console.log(token, file);

  return 401;
});

app.use(express.static("view/assets"));

app.listen(port);
console.log("Server started at http://localhost:" + port);

// Run a query
db.all("SELECT * FROM users", (err, rows) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log(rows);
  }
});

// Close the database connection
db.close();

const text = "Hello, world!";
const hash = crypto.createHash("sha256").update(text).digest("hex");

console.log(hash);
