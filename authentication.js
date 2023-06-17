const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");

const db = new sqlite3.Database("credentials.db");

function login(username, password, extendedExpire, useragent) {
  return new Promise((resolve, reject) => {
    checkCredentials(username, password)
      .then((isValid) => {
        if (isValid) {
          if (extendedExpire) {
            createToken(username, 30, useragent);
            resolve([200, { token: "Kiaraaaaaa", expiresIn: 30 }]);
          } else {
            createToken(username, 1, useragent);
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
        const hashedPassword = hash(password, salt);

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

function isTokenValidForUser(username, token, useragent) {
  //TODO implement
  const tokenInfo = getTokenInfo(token);
  if (useragent.browser !== tokenInfo[3].browser || useragent.os !== tokenInfo[3].os || useragent.platform !== tokenInfo[3].platform) {
    invalidateToken(token);
    return false;
  }
  return tokenInfo[0] && tokenInfo[1] === username;
}

function getTokenInfo(token) {
  //TODO implement
  return [
    true,
    "zoe",
    "hier kommt dann eine datetime hin.",
    {
      browser: "Firefox",
      version: "114.0",
      os: "Linux 64",
      platform: "Linux",
      source: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/114.0",
    },
  ];
}

function createToken(username, expiresIn, useragent) {
  //TODO implement
}

function invalidateToken(token) {
  //TODO implement
}

function generateSalt(length) {
  let buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return buffer;
}

function register(username, password) {
  const stmt = db.prepare("INSERT INTO users (username, password, salt) VALUES (?, ?, ?)");

  const salt = generateSalt(5);

  stmt.run(username, hash(password, salt), salt, function (err) {
    if (err) {
      console.log("Error registering user:", err.message);
      return;
    }
    console.log(`User '${username}' registered`);
  });
}

function hash(input, salt) {
  return crypto
    .createHash("sha256")
    .update(input)
    .update(crypto.createHash("sha256").update(salt).digest())
    .digest("hex");
}

module.exports = { login, isTokenValidForUser };
