const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");

const db = new sqlite3.Database("credentials.db");

function login(username, password, extendedExpire) {
  return new Promise((resolve, reject) => {
    checkCredentials(username, password)
      .then((isValid) => {
        if (isValid) {
          if (extendedExpire) {
            resolve([200, { token: "Kiaraaaaaa", expiresIn: 30 }]);
          } else {
            resolve([200, { token: "Kiaraaaaaa", expiresIn: 1 }]);
          }
        } else {
          resolve([401, { message: "authentication failure" }]);
        }
        
      })
      .catch((message) => {
        reject(message);
      });
  });
}

function checkCredentials(username, password) {
  return new Promise((resolve, reject) => {
    db.get("SELECT salt FROM users WHERE username = ?", [username], (err, row) => {
      if (err) {
        console.error(err.message);
        reject({ message: "server error, check logs" });
      }

      if (row) {
        const salt = row.salt;
        const hashedPassword = hash(password + salt);

        // check if the hashed password matches the one in the database
        db.get(
          "SELECT * FROM users WHERE username = ? AND password = ?",
          [username, hashedPassword],
          (err, row) => {
            if (err) {
              console.error(err.message);
              reject({ message: "server error, check logs" });
            }

            if (row) {
              // authentication successful
              resolve(true);
            } else {
              // authentication failed
              resolve(false);
            }
          }
        );
      } else {
        // user not found
        resolve(false);
      }
    });
  });
}

function generateSalt(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

function register(username, password) {
  const stmt = db.prepare("INSERT INTO users (username, password, salt) VALUES (?, ?, ?)");

  const salt = generateSalt(5)

  stmt.run(username, hash(password + salt), salt, function (err) {
    if (err) {
      console.log("Error registering user:", err.message);
      return;
    }
    console.log(`User '${username}' registered`);
  });
}

function hash(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

module.exports = { login };
