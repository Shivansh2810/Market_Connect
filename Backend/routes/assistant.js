const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');

//Process user message and return assistant response
router.post('/chat', assistantController.processMessage);

//Get available product categories
router.get('/categories', assistantController.getCategories);

//Get conversation history
router.get('/sessions/:session_id', assistantController.getConversationHistory);

//Clear conversation history
router.delete('/sessions/:session_id', assistantController.clearConversation);

module.exports = router;