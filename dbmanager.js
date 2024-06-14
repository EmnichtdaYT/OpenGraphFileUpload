const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(process.env.SQLITE_DB_FILE || "credentials.db");

db.get("PRAGMA foreign_keys = ON");

function insertFile(file) {
  return new Promise((resolve, reject) => {
    if (file.isFolder) {
      console.error("insertFile() can't be used for folders! (File.isFolder)", file.id);
      reject(file);
      return;
    }
    db.run(
      "INSERT INTO files (id, filename, parent, owner) VALUES (?, ?, ?, ?)",
      [file.id, file.filename, file.parent, file.owner],
      (err) => {
        if (err) {
          console.error("Error while inserting file into db", file.id, err.message);
          reject(file);
        } else {
          console.log("Inserted file into db", file.id);
          resolve(file);
        }
      }
    );
  });
}

function insertFolder(name, parent, owner) {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO folders (name, parent, owner) VALUES (?, ?, ?)", [name, parent, owner], (err) => {
      if (err) {
        console.error("Error while inserting new folder into db", name, err.message);
        reject({ message: "failed" });
      } else {
        resolve()
      }
    });
  });
}

module.exports = { db, insertFile, insertFolder };
