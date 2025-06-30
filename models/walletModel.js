const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
    userid: { type: mongoose.Schema.Types.ObjectId, required: true },
    history: {
        type: [{
            transactionType: {
                type: String,
                enum: ["assignment", "withdraw", "deposit"]
            },
            amount: Number,
            modelId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Assignment"
            },
            effect: {
                type: String,
                enum: ["credit", "debit"]
            },
            transactionEntity: {
                type: String,
                default: "wallet"
            },
            createdAt: { type: Date, default: Date.now }
        }],
        default: []
    },
    balance:{type:Number, default:0},
    pending:{type:Number, default:0}
})
module.exports = mongoose.model("Wallet", walletSchema);