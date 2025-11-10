import React, { useState, useEffect, useRef } from 'react';
import './customerService.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faArrowLeft,
    faHeadset,
    faComments,
    faQuestionCircle,
    faPaperPlane,
    faRobot,
    faSpinner,
    faRedo
} from '@fortawesome/free-solid-svg-icons';

// Chatbot API endpoint - adjust this to match your Flask server URL
const CHATBOT_API_URL = 'http://localhost:5000/api/chatbot';
const FAQ_API_URL = 'http://localhost:8080/api/faqs';

const CustomerService = ({ onBack }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (inputMessage.trim() && !isLoading) {
            const userMessage = inputMessage.trim();
            setInputMessage('');
            setError(null);
            
            // Add user message immediately
            const userMessageObj = {
                id: Date.now(),
                text: userMessage,
                sender: 'user',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, userMessageObj]);
            setIsLoading(true);

            try {
                // Send message to Python chatbot API
                const response = await fetch(`${CHATBOT_API_URL}/message`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: userMessage,
                        sessionId: sessionId
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                // Add bot response
                const botMessage = {
                    id: Date.now() + 1,
                    text: data.response || 'Sorry, I could not process your request.',
                    sender: 'bot',
                    timestamp: new Date().toISOString()
                };
                
                setMessages(prev => [...prev, botMessage]);
            } catch (err) {
                console.error('Error sending message to chatbot:', err);
                setError('Failed to connect to chatbot. Please ensure the chatbot server is running.');
                
                // Add error message
                const errorMessage = {
                    id: Date.now() + 1,
                    text: 'Sorry, I\'m having trouble connecting right now. Please try again later or contact support at support@marketconnect.com',
                    sender: 'bot',
                    timestamp: new Date().toISOString(),
                    isError: true
                };
                
                setMessages(prev => [...prev, errorMessage]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleQuickQuestion = async (question) => {
        if (isLoading) return;
        
        setInputMessage('');
        setError(null);
        
        // Add user message immediately
        const userMessageObj = {
            id: Date.now(),
            text: question,
            sender: 'user',
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessageObj]);
        setIsLoading(true);

        try {
            // Send message to Python chatbot API
            const response = await fetch(`${CHATBOT_API_URL}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: question,
                    sessionId: sessionId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Add bot response
            const botMessage = {
                id: Date.now() + 1,
                text: data.response || 'Sorry, I could not process your request.',
                sender: 'bot',
                timestamp: new Date().toISOString()
            };
            
            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            console.error('Error sending message to chatbot:', err);
            setError('Failed to connect to chatbot. Please ensure the chatbot server is running.');
            
            // Add error message
            const errorMessage = {
                id: Date.now() + 1,
                text: 'Sorry, I\'m having trouble connecting right now. Please try again later or contact support at support@marketconnect.com',
                sender: 'bot',
                timestamp: new Date().toISOString(),
                isError: true
            };
            
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetConversation = async () => {
        try {
            await fetch(`${CHATBOT_API_URL}/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: sessionId
                })
            });
            setMessages([]);
            setError(null);
        } catch (err) {
            console.error('Error resetting conversation:', err);
            // Still clear messages locally even if API call fails
            setMessages([]);
        }
    };

    return (
        <div className="customer-service-page">
            <div className="customer-service-container">
                <div className="customer-service-header-bar">
                    <button className="back-btn" onClick={onBack}>
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Back to Dashboard
                    </button>
                    <h1>Customer Service</h1>
                </div>

                <div className="customer-service-content">
                    <div className="chatbot-wrapper">
                        <div className="chatbot-header">
                            <div className="chatbot-header-info">
                                <FontAwesomeIcon icon={faHeadset} className="chatbot-header-icon" />
                                <div>
                                    <h2>Need Help?</h2>
                                    <p>Our customer service team is here to assist you</p>
                                </div>
                            </div>
                            {messages.length > 0 && (
                                <button 
                                    className="reset-conversation-btn"
                                    onClick={handleResetConversation}
                                    title="Reset Conversation"
                                >
                                    <FontAwesomeIcon icon={faRedo} />
                                    Reset
                                </button>
                            )}
                        </div>

                        <div className="chatbot-messages" ref={messagesContainerRef}>
                            {messages.length === 0 ? (
                                <div className="welcome-message">
                                    <FontAwesomeIcon icon={faRobot} className="welcome-icon" />
                                    <h3>Welcome to Customer Service</h3>
                                    <p>How can we help you today?</p>
                                    <div className="quick-questions">
                                        <button 
                                            className="quick-question-btn"
                                            onClick={() => handleQuickQuestion('I need help with my order')}
                                        >
                                            <FontAwesomeIcon icon={faQuestionCircle} />
                                            Order Help
                                        </button>
                                        <button 
                                            className="quick-question-btn"
                                            onClick={() => handleQuickQuestion('I want to return a product')}
                                        >
                                            <FontAwesomeIcon icon={faQuestionCircle} />
                                            Returns
                                        </button>
                                        <button 
                                            className="quick-question-btn"
                                            onClick={() => handleQuickQuestion('I have a payment issue')}
                                        >
                                            <FontAwesomeIcon icon={faQuestionCircle} />
                                            Payment Issue
                                        </button>
                                        <button 
                                            className="quick-question-btn"
                                            onClick={() => handleQuickQuestion('I need to track my shipment')}
                                        >
                                            <FontAwesomeIcon icon={faQuestionCircle} />
                                            Track Order
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="messages-list">
                                    {messages.map(message => (
                                        <div 
                                            key={message.id} 
                                            className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'} ${message.isError ? 'error-message' : ''}`}
                                        >
                                            <div className="message-content">
                                                {message.sender === 'bot' && (
                                                    <FontAwesomeIcon icon={faRobot} className="message-icon" />
                                                )}
                                                <p>{message.text}</p>
                                            </div>
                                            <span className="message-time">
                                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="message bot-message">
                                            <div className="message-content">
                                                <FontAwesomeIcon icon={faRobot} className="message-icon" />
                                                <div className="typing-indicator">
                                                    <span></span>
                                                    <span></span>
                                                    <span></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                            {error && messages.length === 0 && (
                                <div className="error-banner">
                                    <p>{error}</p>
                                </div>
                            )}
                        </div>

                        <form className="chatbot-input-form" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                className="chatbot-input"
                                placeholder="Type your message here..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                disabled={isLoading}
                            />
                            <button 
                                type="submit" 
                                className="send-btn" 
                                disabled={!inputMessage.trim() || isLoading}
                            >
                                {isLoading ? (
                                    <FontAwesomeIcon icon={faSpinner} className="spinning" />
                                ) : (
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="customer-service-info">
                        <div className="info-card">
                            <h3>
                                <FontAwesomeIcon icon={faHeadset} />
                                Contact Information
                            </h3>
                            <p><strong>Email:</strong> support@marketconnect.com</p>
                            <p><strong>Phone:</strong> +91 1800-123-4567</p>
                            <p><strong>Hours:</strong> 24/7 Customer Support</p>
                        </div>

                        <div className="info-card">
                            <h3>
                                <FontAwesomeIcon icon={faComments} />
                                FAQ
                            </h3>
                            {faqs.length === 0 ? (
                                <p>No FAQs available right now.</p>
                            ) : (
                                <div className="faq-list">
                                    {faqs.map((f, idx) => (
                                        <div key={f._id || idx} className={`faq-item ${openFaqIndex === idx ? 'open' : ''}`}>
                                            <button 
                                                className="faq-question"
                                                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                                                title="Toggle answer"
                                            >
                                                {f.question}
                                            </button>
                                            {openFaqIndex === idx && (
                                                <div className="faq-answer">
                                                    <p>{f.answer}</p>
                                                    <div className="faq-actions">
                                                        <button 
                                                            className="quick-question-btn"
                                                            onClick={() => handleQuickQuestion(f.question)}
                                                        >
                                                            <FontAwesomeIcon icon={faQuestionCircle} /> Ask this
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerService;

