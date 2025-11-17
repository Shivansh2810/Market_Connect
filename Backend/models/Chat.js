const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    sender: { type: String, enum: ["user", "bot"], required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: String, required: true },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

chatSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model("Chat", chatSchema);
