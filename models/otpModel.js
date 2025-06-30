const mongoose = require("mongoose")


const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // Automatically delete documents after 10 minutes (600 seconds)
    },
    username: { type: String, required: true},
    firstname: { type: String, required: true},
    lastname: { type: String, required: true},
    password: { type: String },
});

module.exports = mongoose.model("Otp", otpSchema);
