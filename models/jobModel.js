const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["socialmedia", "article"],
    default: "article"
  },
  amount: {
    type: Number,
    required: true
  },
  deadlineTime: {
    type: Date,
    required: true
  },
  assignTime: {
    type: Date,
    required: true
  },
  assignedTo: {
    type: String,
    enum: ["all", "specific"],
    required: true
  },
  specificAssignedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
});

module.exports = mongoose.model("Job", jobSchema);