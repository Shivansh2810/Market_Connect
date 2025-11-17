const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chatController");
const { protect } = require("../middlewares/auth");

// Save or update a chat conversation
router.post("/", protect, chatController.createOrUpdateChat);

// Get all chats for the authenticated user
router.get("/", protect, chatController.getUserChats);

// Get a specific chat by sessionId
router.get("/:sessionId", protect, chatController.getChatBySessionId);

// Delete a specific chat by sessionId
router.delete("/:sessionId", protect, chatController.deleteChat);

module.exports = router;
