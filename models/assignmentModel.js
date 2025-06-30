const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },
  status: {
    type: String,
    enum: ["assigned", "saved", "underreview", "revised", "completed"],
    default: "assigned"
  },
  content: {
    type: String,
    default: ""
  },
  revisionDescription: {
    type: String,
    default: null
  },
  submittedAt: {
    type: Date
  },
  revisedAt: {
    type: Date
  },
  assignedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  paid: {
    type: Boolean,
    default: false
  }
},
{
  timestamps: true
});

module.exports = mongoose.model("Assignment", assignmentSchema);