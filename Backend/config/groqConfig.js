const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'gsk_your_api_key_here'
});

// Helper function to create chat completion
// Default model can be overridden via GROQ_MODEL env var
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const createChatCompletion = async (messages, options = {}) => {
  try {
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: options.model || DEFAULT_GROQ_MODEL,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1024,
      top_p: options.top_p || 1,
      stream: false
    });

    return completion;
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
};

module.exports = {
  createChatCompletion,
  groq
};