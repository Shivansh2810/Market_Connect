const groq = require('../config/groqConfig'); // Change from openaiConfig
const Product = require('../models/product');

class QueryUnderstanding {
  async analyzeQuery(userQuery, conversationHistory = []) {
    const systemPrompt = `You are a shopping query understanding system. Analyze the user's query and extract shopping intent. Return a JSON object with these fields:
    - categories: array of relevant product categories
    - attributes: array of key attributes like "gift", "for_her", "eco_friendly"
    - price_range: object with min and max numbers
    - occasion: string like "birthday", "anniversary", "personal use"
    - style: string like "modern", "vintage", "minimalist"
    - use_case: string describing the primary use
    
    User Query: "${userQuery}"
    
    Return ONLY valid JSON, no other text. Example: {"categories": ["electronics"], "price_range": {"min": 0, "max": 100}}`;

    try {
      const response = await groq.createChatCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: "Extract the shopping intent as JSON." }
      ], {
        temperature: 0.1,
        max_tokens: 500
      });

      const responseText = response.choices[0].message.content;
      
      // groq might return text with JSON, so we need to extract it
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const intentData = JSON.parse(jsonMatch[0]);
        console.log('Extracted intent:', intentData);
        return intentData;
      } else {
        throw new Error('No JSON found in response');
      }
      
    } catch (error) {
      console.error('Query understanding error:', error);
      // Return default intent if analysis fails
      return {
        categories: [],
        attributes: [],
        price_range: { min: 0, max: 1000 },
        occasion: '',
        style: '',
        use_case: ''
      };
    }
  }
}

class ResponseGenerator {
  async generateResponse(userQuery, products, conversationHistory) {
    const assistantPersona = `You are a friendly, knowledgeable shopping assistant for MarketConnect. 
    Be helpful, enthusiastic but not pushy. Highlight key features and benefits. 
    Mention price, rating, and specific advantages. Be concise but warm.
    If no products match, suggest alternative search terms or categories.`;
    
    // Format product information for the AI
    const productContext = products.length > 0 ? 
      products.map((product, index) => `
        Product ${index + 1}:
        - Name: ${product.name}
        - Price: $${product.price}
        - Rating: ${product.rating}/5 stars (${product.reviewCount || 0} reviews)
        - Category: ${product.category}
        - Description: ${product.description}
        - Key Features: ${product.features ? product.features.join(', ') : 'None specified'}
      `).join('\n') : 
      "No products match the user's criteria. Suggest alternative search terms or broader categories.";
    
    const prompt = `
      User's current request: "${userQuery}"
      
      Available products that match their needs:
      ${productContext}
      
      Please provide a helpful response that:
      1. Acknowledges their request naturally
      2. Recommends the best options with specific reasons
      3. Mentions price, rating, and key features
      4. Ends with an open question to continue the conversation
      
      Keep it conversational and under 150 words.
    `;

    try {
      const response = await groq.createChatCompletion([
        { role: "system", content: assistantPersona },
        { role: "user", content: prompt }
      ], {
        temperature: 0.7,
        max_tokens: 300
      });

      return {
        text: response.choices[0].message.content,
        products: this.formatProductsForResponse(products)
      };
    } catch (error) {
      console.error('Response generation error:', error);
      // Fallback response
      return {
        text: products.length > 0 
          ? `I found ${products.length} products that might interest you!` 
          : "I couldn't find any products matching your criteria. Try broadening your search.",
        products: this.formatProductsForResponse(products)
      };
    }
  }

  formatProductsForResponse(products) {
    return products.map(product => ({
      id: product._id,
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      rating: product.rating,
      reviewCount: product.reviewCount,
      image_url: product.images && product.images.length > 0 ? product.images[0].url : '/images/placeholder.jpg',
      features: product.features || [],
      tags: product.tags || []
    }));
  }
}

class ProductSearchService {
  async searchProducts(intentData) {
    try {
      const query = { isDeleted: { $ne: true } };

      if (intentData && Array.isArray(intentData.categories) && intentData.categories.length > 0) {
        query["category"] = { $in: intentData.categories };
      }

      if (intentData && intentData.price_range) {
        const { min, max } = intentData.price_range;
        query["price"] = {};
        if (typeof min === "number") {
          query["price"].$gte = min;
        }
        if (typeof max === "number") {
          query["price"].$lte = max;
        }
        if (Object.keys(query["price"]).length === 0) {
          delete query["price"];
        }
      }

      const products = await Product.find(query).limit(20).exec();
      return products;
    } catch (error) {
      console.error("Product search error:", error);
      return [];
    }
  }
}

// ... rest of the controller remains the same
const conversationSessions = new Map();

const assistantController = {
  processMessage: async (req, res) => {
    try {
      const { message, session_id } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Message is required',
          session_id: session_id 
        });
      }

      if (!session_id) {
        return res.status(400).json({ error: 'Session ID is required' });
      }
      
      if (!conversationSessions.has(session_id)) {
        conversationSessions.set(session_id, []);
      }
      const conversationHistory = conversationSessions.get(session_id);
      
      const queryUnderstanding = new QueryUnderstanding();
      const productSearch = new ProductSearchService();
      const responseGenerator = new ResponseGenerator();
      
      console.log(`Processing message for session ${session_id}: "${message}"`);
      
      const intentData = await queryUnderstanding.analyzeQuery(message, conversationHistory);
      const products = await productSearch.searchProducts(intentData);
      const response = await responseGenerator.generateResponse(message, products, conversationHistory);
      
      conversationHistory.push({ 
        role: 'user', 
        content: message,
        timestamp: new Date().toISOString()
      });
      conversationHistory.push({ 
        role: 'assistant', 
        content: response.text,
        products: response.products,
        timestamp: new Date().toISOString()
      });
      
      if (conversationHistory.length > 20) {
        conversationSessions.set(session_id, conversationHistory.slice(-20));
      }
      
      res.json({
        response: response.text,
        products: response.products,
        session_id: session_id,
        timestamp: new Date().toISOString(),
        product_count: response.products.length
      });
      
    } catch (error) {
      console.error('Shopping assistant error:', error);
      res.status(500).json({ 
        error: 'Sorry, I encountered an error while processing your request. Please try again.',
        session_id: req.body.session_id 
      });
    }
  },

  getCategories: async (req, res) => {
    try {
      const categories = await Product.distinct('category', { isActive: true });
      res.json({ categories });
    } catch (error) {
      console.error('Categories error:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  },

  getConversationHistory: (req, res) => {
    const { session_id } = req.params;
    const history = conversationSessions.get(session_id) || [];
    res.json({
      session_id: session_id,
      messages: history,
      count: history.length
    });
  },

  clearConversation: (req, res) => {
    const { session_id } = req.params;
    conversationSessions.delete(session_id);
    res.json({ 
      message: 'Conversation cleared successfully',
      session_id: session_id 
    });
  }
};

module.exports = assistantController;