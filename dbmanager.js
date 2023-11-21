const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database( process.env.SQLITE_DB_FILE || "credentials.db");

function insertFile(file) {
  return new Promise((resolve, reject) => {
    if(file.isFolder){
        console.error("insertFile() can't be used for folders! (File.isFolder)", file.id)
        reject(file)
        return
    }
    db.run(
        "INSERT INTO files (id, filename, parent, owner) VALUES (?, ?, ?, ?)",
        [file.id, file.filename, file.parent, file.owner],
        (err) => {
          if (err) {
            console.error("Error while inserting file into db", file.id, err.message);
            reject(file);
          } else {
            console.log("Inserted file into db", file.id)
            resolve(file);
          }
        }
      );
  });
}

module.exports = { db, insertFile };
