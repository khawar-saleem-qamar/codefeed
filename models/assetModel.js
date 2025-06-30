const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  uploadTime: {
    type: Date,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  usedWith: {
    type: String,
    enum: ["article", "socialmedia", "none"],
    default: "none"
  },
  usedModelId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
});

module.exports = mongoose.model("Asset", assetSchema);