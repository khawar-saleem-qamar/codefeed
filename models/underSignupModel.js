const mongoose = require("mongoose");

const underSignupSchema = new mongoose.Schema({
  username: { type: String, default: "" },
  email: { type: String, default: "" },
  password: { type: String, default: "" },
  averageTyping: {type:Number, default: 0},
  otp: {type: Number, required: true}
});

module.exports = mongoose.model("UnderSingup", underSignupSchema);
