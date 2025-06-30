const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { AppError } = require("../utils/AppError");

const createMulterUploader = (folderName, type) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // console.log(file);
      cb(null, `uploads/${folderName}`);
    },
    filename: (req, file, cb) => {
      // console.log(file);
      cb(null, uuidv4() + " - " + file.originalname);
    },
  });

  function fileFilter(req, file, cb) {
    if (type == "all" || file.mimetype.startsWith(`${type}/`)) {
      // To accept the file pass `true`, like so:
      cb(null, true);
    } else {
      // To reject this file pass `false`, like so:
      cb(new AppError("Not supporting this mimetype", 401), false);
    }
  }

  const upload = multer({ storage, fileFilter });

  return upload;
};

//For Single upload
const uploadSingleFile = (fieldName, folderName, type="image") => {
  return createMulterUploader(folderName, type).single(fieldName);
};

//Fir Multiple fields upload
const uploadMultipleFiles = (arrayOfFields, folderName, type="image") => {
  return createMulterUploader(folderName, type).fields(arrayOfFields);
};

module.exports = {uploadSingleFile, uploadMultipleFiles}