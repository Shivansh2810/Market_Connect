const Chat = require("../models/Chat");

/**
 * POST /api/chats
 * Create a new chat conversation or add messages to existing chat
 */
exports.createOrUpdateChat = async (req, res) => {
  try {
    const { sessionId, messages } = req.body;
    const userId = req.user._id;

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: "sessionId and messages array are required",
      });
    }

    // Find existing chat or create new one
    let chat = await Chat.findOne({ userId, sessionId });

    if (chat) {
      // Update existing chat with new messages
      chat.messages = messages;
      chat.updatedAt = Date.now();
      await chat.save();
    } else {
      // Create new chat
      chat = await Chat.create({
        userId,
        sessionId,
        messages,
      });
    }

    res.status(200).json({
      success: true,
      message: "Chat saved successfully",
      data: chat,
    });
  } catch (error) {
    console.error("Error saving chat:", error);
    res.status(500).json({
      success: false,
      message: "Error saving chat",
      error: error.message,
    });
  }
};

/**
 * GET /api/chats
 * Get all chat conversations for the authenticated user
 */
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({ userId })
      .sort({ updatedAt: -1 })
      .select("sessionId messages createdAt updatedAt")
      .lean();

    // Format response to include summary info
    const formattedChats = chats.map((chat) => {
      const hasMessages = chat.messages && chat.messages.length > 0;

      // Find the first meaningful message (user or bot) to use as the title
      let firstTextMsg = "";
      if (hasMessages) {
        const firstAny = chat.messages.find(
          (m) => m && typeof m.text === "string" && m.text.trim().length > 0
        );
        firstTextMsg = firstAny ? firstAny.text : "";
      }

      const lastMsg = hasMessages
        ? chat.messages[chat.messages.length - 1].text || ""
        : "";

      const truncate = (text, len = 50) => {
        if (!text) return "";
        return text.length > len ? text.substring(0, len) + "..." : text;
      };

      const computedFirst = truncate(firstTextMsg, 80);

      return {
        _id: chat._id,
        sessionId: chat.sessionId,
        messageCount: chat.messages.length,
        firstMessage: computedFirst || "New conversation",
        lastMessage: hasMessages ? truncate(lastMsg, 50) : "No messages",
        lastMessageTime: hasMessages
          ? chat.messages[chat.messages.length - 1].timestamp
          : chat.createdAt,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedChats,
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching chats",
      error: error.message,
    });
  }
};

/**
 * GET /api/chats/:sessionId
 * Get a specific chat conversation by sessionId
 */
exports.getChatBySessionId = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findOne({ userId, sessionId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching chat",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/chats/:sessionId
 * Delete a specific chat conversation
 */
exports.deleteChat = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findOneAndDelete({ userId, sessionId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting chat",
      error: error.message,
    });
  }
};

