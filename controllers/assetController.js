const Asset = require("../models/assetModel");
const { sendRes } = require("../helpers/otherHelpers");
const axios = require('axios');
const FormData = require('form-data');
const dotenv = require("dotenv")
dotenv.config();

const uploadImage = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return sendRes(res, 400, false, "Please provide file");
    }
    
    const formData = new FormData();
    formData.append('file', file.buffer, { filename: file.originalname });
    formData.append('upload_preset', process.env.CLOUDINARY_PRESET_NAME);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_NAME}/image/upload`;

    const response = await axios.post(cloudinaryUrl, formData, {
      headers: formData.getHeaders(),
    });
    
    await Asset.create({
      url:response.data.secure_url,
      uploadTime: new Date(),
      uploadedBy: req.user._id
    })
    
    res.status(200).json({
      success: 1,
      file: {
        url: response.data.secure_url
      }
    });
  } catch (error) {
    sendRes(res, 400, false, error.message);
  }
};

const demoImage = async (req, res) => {
  try {
    res.status(200).json({
      success: 1,
      file: {
        url: `http://localhost:4000/uploads/profilePictures/default/default-avatar.jpg`
      }
    });
  } catch (error) {
    sendRes(res, 400, false, error.message);
  }
};

module.exports = {
  uploadImage,
  demoImage
};