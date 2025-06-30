const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    default: "" 
  },
  email: { 
    type: String, 
    default: "" 
  },
  phone: { 
    type: String, 
    default: "" 
  },
  password: { 
    type: String, 
    default: "" 
  },
  passwordChangedAt:Date,
  bio: { 
    type: String, 
    default: "" 
  },
  walletid: {
    type: mongoose.Schema.Types.ObjectId
  },
  role: {
    type: String,
    enum: ["employee", "admin", "main-admin"], 
    default: "employee" 
  },
  profilePic: {
    type: String, 
    default: "uploads/profilePictures/default/default-avatar.jpg"
  },
  profileDescription: { 
    type: String, 
    default: "" 
  }
});

module.exports = mongoose.model("User", userSchema);
