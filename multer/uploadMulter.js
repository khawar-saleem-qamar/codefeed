// middleware/multer.js
const multer = require('multer');

const storage = multer.memoryStorage();

const tempUpload = multer({ storage });
module.exports =  {tempUpload}
