const multer = require("multer");
const fs = require("fs");
const { promisify } = require("util");

dbmanager = require("./dbmanager.js");
db = dbmanager.db;

const unlinkAsync = promisify(fs.unlink);

const upload = multer({
  dest: process.env.MULTER_FILE_UPLOAD_DIR || "uploads/",
  limits: { fileSize: process.env.MULTER_FILE_SIZE_LIMIT || 10485760 },
});

class File {
  constructor(id, filename, parent, owner, isFolder) {
    this.id = id;
    this.filename = filename;
    this.parent = parent;
    this.owner = owner;
    this.isFolder = isFolder;
  }
}

async function handleFileUpload(req, res) {
  const files = req.files;
  const user = req.cookies.user;
  const parent = 0; //TODO

  let success = [];
  let failed = [];

  for (index in files) {
    let ofile = files[index];
    let returnFile = await dbmanager
      .insertFile(new File(ofile.filename, ofile.originalname, parent, user, false))
      .catch((file) => {
        unlinkAsync(ofile.path);
      });
    if (returnFile) {
      success.push(returnFile.filename);
    } else {
      failed.push(ofile.originalname);
    }
  }

  res.set("Content-Type", "application/json");
  res.status(200).send({ success: success, failed: failed });
}

function handleCreateFolder(req, res) {
  const user = req.cookies.user;
  const parent = 0;
  const name = req.body.name;

  dbmanager
    .insertFolder(name, parent, user)
    .then(() => {
      res.status(200).send();
    })
    .catch((message) => {
      res.status(500).send(message);
    });
}

function handleFileLs(req, res){
  res.set("Content-Type", "text/plain");
  res.status(200).send("" + req.path.split("/").slice(2))
}

module.exports = { upload, handleFileUpload, handleCreateFolder, handleFileLs, File };
