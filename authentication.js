const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");
const path = require("path");

const db = require("./dbmanager.js").db;

function login(username, password, extendedExpire, useragent) {
  return new Promise((resolve, reject) => {
    checkCredentials(username, password)
      .then((isValid) => {
        if (isValid) {
          let maxAgeD;
          let maxAgeS;
          
          if(extendedExpire){
            maxAgeD = 30
            maxAgeS = maxAgeD*24*60*60
          }else{
            maxAgeD = 1
            maxAgeS = undefined
          }

          createToken(username, maxAgeD, useragent).then((token) => {
            resolve([token, maxAgeS]);
          });
        } else {
          resolve(null);
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
        return;
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
              return;
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
  return new Promise((resolve, reject) => {
    if (!username || !token || !useragent) {
      resolve(false);
      return;
    }

    getTokenInfo(token)
      .then((tokenInfo) => {
        if (!tokenInfo) {
          resolve(false);
          return;
        }

        if (
          useragent.browser !== tokenInfo[3].browser ||
          useragent.os !== tokenInfo[3].os ||
          useragent.platform !== tokenInfo[3].platform ||
          !tokenInfo[0] ||
          tokenInfo[1] !== username
        ) {
          invalidateToken(token);
          resolve(false);
        } else {
          resolve(true);
        }
      })
      .catch((message) => {
        reject(message);
      });
  });
}

function getTokenInfo(token) {
  if (!token) {
    resolve(false); //token does not exist
    return;
  }

  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM tokens WHERE token = ?", [token], (err, row) => {
      if (err) {
        console.error(err.message);
        reject({ message: "server error, check logs" });
        return;
      }

      if (row) {
        resolve([new Date(row.expire) > new Date(), row.user, row.expire, JSON.parse(row.useragent)]);
      } else {
        resolve(false); //token does not exist
      }
    });
  });
}

function createToken(user, expiresIn, useragent) {
  return new Promise(async (resolve, reject) => {
    let expire = new Date();
    expire.setDate(new Date().getDate() + expiresIn);
    expire = expire.toISOString();

    let token = crypto.randomBytes(25).toString("hex");
    while (await getTokenInfo(token).catch((message) => reject(message)))
      token = crypto.randomBytes(25).toString("hex");

    db.run(
      "INSERT INTO tokens (user, token, expire, useragent) VALUES (?, ?, ?, ?)",
      [user, token, expire, JSON.stringify(useragent)],
      (err) => {
        if (err) {
          console.error(err.message);
          reject({ message: "server error, check logs" });
        } else {
          resolve(token);
        }
      }
    );
  });
}

function invalidateToken(token) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM tokens WHERE token = ?", [token], (err) => {
      if (err) {
        console.error(err.message);
        reject({ message: "server error, check logs" });
      } else {
        resolve({ message: "done" });
      }
    });
  });
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
      console.error("Error registering user:", err.message);
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

function authMcookies(req, res, next) {
  const { token, user } = req.cookies;
  const useragent = req.useragent;

  isTokenValidForUser(user, token, useragent)
    .then((isValid) => {
      if (isValid) {
        next();
      } else {
        res.set("Content-Type", "text/html");
        res.cookie("token", undefined, { maxAge: -1, sameSite: "strict" });
        res.cookie("user", undefined, { maxAge: -1, sameSite: "strict" });
        res.status(401).sendFile(path.join(__dirname, "./view/401.html"));
      }
    })
    .catch((message) => {
      res.set("Content-Type", "text/html");
      res.status(500).sendFile(path.join(__dirname, "./view/500.html"));
    });
}

module.exports = { login, isTokenValidForUser, invalidateToken, authMcookies, register };
