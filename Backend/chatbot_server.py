from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from difflib import SequenceMatcher


app = Flask(__name__)
CORS(app)  # allows frontend requests from localhost

FAQ_API_URL = "http://localhost:8080/api/faqs"
_faq_cache = []

def load_faqs():
    global _faq_cache
    try:
        resp = requests.get(FAQ_API_URL, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            _faq_cache = data.get("faqs", [])
        else:
            _faq_cache = []
    except Exception:
        _faq_cache = []

def find_best_faq_answer(user_text: str):
    if not _faq_cache:
        load_faqs()
    if not _faq_cache:
        return None

    user_l = user_text.lower()
    best = None
    best_score = 0.0

    for faq in _faq_cache:
        q = (faq.get("question") or "").lower()
        a = faq.get("answer") or ""
        keywords = [k.lower() for k in (faq.get("keywords") or [])]
        tags = [t.lower() for t in (faq.get("tags") or [])]

        # Heuristic score: substring hits + keyword overlap + fuzzy similarity
        score = 0.0
        if q and q in user_l:
            score += 1.0
        overlap = sum(1 for k in keywords + tags if k and k in user_l)
        score += min(2.0, overlap * 0.5)
        if q:
            score += SequenceMatcher(None, user_l, q).ratio() * 1.0

        if score > best_score:
            best_score = score
            best = a

    # Threshold to avoid irrelevant matches
    if best_score >= 1.4:
        return best
    return None

@app.route("/api/chatbot/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Chatbot API is running"})

@app.route("/api/chatbot/message", methods=["POST"])
def chat():
    """Handle chatbot messages - matches frontend expectations"""
    try:
        data = request.get_json()
        user_message = data.get("message", "").strip()
        session_id = data.get("sessionId", "default")
        
        if not user_message:
            return jsonify({"error": "Message is required"}), 400
        
        # Try FAQ-based answer first
        faq_answer = find_best_faq_answer(user_message)
        if faq_answer:
            reply = faq_answer
        else:
            # Simple rule-based responses (fallback)
            user_message_lower = user_message.lower()
            if "return" in user_message_lower:
                reply = "You can return your product within 7 days of delivery. Please visit the Return section in your account to initiate a return."
            elif "track" in user_message_lower or "order" in user_message_lower or "shipment" in user_message_lower:
                reply = "You can track your order from the Dashboard → Orders section. Enter your order number to see the current status and delivery updates."
            elif "address" in user_message_lower or "shipping" in user_message_lower:
                reply = "To change your shipping address, go to Profile → Edit Shipping Address. You can add, edit, or remove addresses from there."
            elif "payment" in user_message_lower or "pay" in user_message_lower:
                reply = "We accept UPI, Credit/Debit Cards, and Net Banking. All payments are secure and encrypted. You can save payment methods in your Profile settings."
            elif "help" in user_message_lower or "support" in user_message_lower:
                reply = "I'm here to help! You can ask me about orders, returns, shipping, payments, or account settings. How can I assist you today?"
            elif "hello" in user_message_lower or "hi" in user_message_lower or "hey" in user_message_lower:
                reply = "Hello! Welcome to Market Connect customer service. How can I help you today? You can ask me about orders, returns, shipping, or payments."
            else:
                reply = "Thank you for your message! I can help you with orders, returns, shipping addresses, payment methods, and more. What would you like to know?"

        # Return response in format expected by frontend
        return jsonify({
            "response": reply,
            "sessionId": session_id
        }), 200
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({
            "error": "An error occurred processing your message",
            "details": str(e)
        }), 500

@app.route("/api/chatbot/reset", methods=["POST"])
def reset_conversation():
    """Reset conversation history for a session"""
    try:
        data = request.get_json()
        session_id = data.get("sessionId", "default")
        
        # In a simple implementation, we don't store history, but this endpoint exists for compatibility
        return jsonify({
            "message": "Conversation reset successfully",
            "sessionId": session_id
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "An error occurred resetting conversation",
            "details": str(e)
        }), 500

if __name__ == "_main_":
    port = 5000
    print(f"Chatbot API server starting on port {port}")
    print("Welcome to the Market Connect customer service API!")
    print(f"Server will be available at: http://localhost:{port}")
    app.run(debug=True, port=port, host='0.0.0.0')
