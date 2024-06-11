const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

let args = process.argv.slice(2);

if (args.length == 0) {
  console.error("No cleanup selected!\ntoken, files, purge-files, purge-token");
  return;
}

for (index in args) {
  switch (args[index].toLowerCase()) {
    case "token":
      cleanupToken();
      break;
    case "files":
      cleanupFiles();
      break;
    case "purge-files":
      purgeFiles();
      break;
    case "purge-token":
      purgeToken();
      break;
    default:
      console.error("Unknown cleanup", args[index]);
  }
}

function cleanupFiles() {
  console.error("Not Implemented Yet");
}

async function cleanupToken() {
  console.log("===token===");
  let db = new sqlite3.Database(process.env.SQLITE_DB_FILE || "credentials.db");

  db.all("SELECT token, expire FROM tokens", [], (err, rows) => {
    if (err) {
      throw err;
    }

    if (rows.length == 0) {
      console.log("===token done===");
      return;
    }

    rows.forEach((row, index, array) => {
      if (new Date(row.expire) <= new Date()) {
        db.run("DELETE FROM tokens WHERE token = ?", [row.token], (err) => {
          if (err) {
            throw err;
          }
          console.log("Deleted token", row.token);
          if (array.length - 1 === index) console.log("===token done===");
        });
      } else {
        if (array.length - 1 === index) console.log("===token done===");
      }
    });
  });

  db.close();
}

function purgeToken() {
  console.log("===purge-token===");
  let db = new sqlite3.Database(process.env.SQLITE_DB_FILE || "credentials.db");

  db.run("DELETE FROM tokens", [], (err) => {
    if (err) {
      throw err;
    }
    console.log("Purged tokens from db");
    console.log("===purge-token done===");
  });

  db.close();
}

async function purgeFiles() {
  console.log("===purge-files===");
  let path = process.env.MULTER_FILE_UPLOAD_DIR || "uploads/";
  await fs.rmSync(path, { recursive: true });

  console.log("Purged files");

  let db = new sqlite3.Database(process.env.SQLITE_DB_FILE || "credentials.db");

  db.run("DELETE FROM files", [], (err) => {
    if (err) {
      throw err;
    }
    console.log("Purged files from db");
    console.log("===purge-files done===");
  });

  db.close();
}
