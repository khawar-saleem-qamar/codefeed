const express = require('express');
const router = express.Router();
const { uploadImage, demoImage } = require("../controllers/assetController");
const { protectedRoutes } = require('../controllers/authController');
const { uploadSingleFile } = require('../multer/multer');
const { tempUpload } = require('../multer/uploadMulter');


router.post("/uploadImage", protectedRoutes, tempUpload.single('image'),  uploadImage);
router.get("/demoImage",  demoImage);

module.exports = router;