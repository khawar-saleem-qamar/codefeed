const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, required: true },
    otheruserid: { type: mongoose.Schema.Types.ObjectId},
    text: { type: String, default: "" },
    campaignid: { type: mongoose.Schema.Types.ObjectId },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
