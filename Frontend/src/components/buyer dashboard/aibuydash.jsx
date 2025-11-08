import React, { useState, useEffect, useRef } from 'react';
import './aiChatbotDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faRobot,
    faPaperPlane,
    faSpinner,
    faRedo,
    faHeadset,
    faComments,
    faQuestionCircle,
    faArrowLeft,
    faTimes
} from '@fortawesome/free-solid-svg-icons';

// Chatbot API endpoints
const CHATBOT_API_URL = 'http://localhost:5000/api/chatbot';
const FAQ_API_URL = 'http://localhost:8080/api/faqs';

const AIChatbotDashboard = ({ onBack }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const [faqs, setFaqs] = useState([]);
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Fetch FAQs
        const fetchFaqs = async () => {
            try {
                const res = await fetch(FAQ_API_URL);
                if (!res.ok) throw new Error('Failed to load FAQs');
                const data = await res.json();
                setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
            } catch (e) {
                console.error('Failed to fetch FAQs:', e);
                setFaqs([]);
            }
        };
        fetchFaqs();
    }, []);

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

    const quickQuestions = [
        'I need help with my order',
        'I want to return a product',
        'I have a payment issue',
        'I need to track my shipment',
        'What is your return policy?',
        'How do I contact customer support?'
    ];

    if (isMinimized) {
        return (
            <div className="ai-chatbot-minimized">
                <button 
                    className="chatbot-toggle-btn"
                    onClick={() => setIsMinimized(false)}
                    title="Open Chat"
                >
                    <FontAwesomeIcon icon={faComments} />
                    <span>AI Assistant</span>
                </button>
            </div>
        );
    }

    return (
        <div className="ai-chatbot-dashboard">
            <div className="chatbot-container">
                {/* Header */}
                <div className="chatbot-header">
                    <div className="chatbot-header-left">
                        <button className="back-btn" onClick={onBack}>
                            <FontAwesomeIcon icon={faArrowLeft} />
                            Back to Dashboard
                        </button>
                    </div>
                    <div className="chatbot-header-center">
                        <FontAwesomeIcon icon={faRobot} className="header-icon" />
                        <h1>AI Customer Service Assistant</h1>
                    </div>
                    <div className="chatbot-header-right">
                        <button 
                            className="minimize-btn"
                            onClick={() => setIsMinimized(true)}
                            title="Minimize"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>

                <div className="chatbot-content">
                    {/* Main Chat Area */}
                    <div className="chatbot-main">
                        <div className="chatbot-messages-container">
                            <div className="chatbot-messages" ref={messagesEndRef}>
                                {messages.length === 0 ? (
                                    <div className="welcome-section">
                                        <div className="welcome-header">
                                            <FontAwesomeIcon icon={faHeadset} className="welcome-icon" />
                                            <h2>How can I help you today?</h2>
                                            <p>I'm your AI assistant here to help with any questions about orders, returns, payments, and more.</p>
                                        </div>
                                        
                                        <div className="quick-questions-grid">
                                            {quickQuestions.map((question, index) => (
                                                <button
                                                    key={index}
                                                    className="quick-question-card"
                                                    onClick={() => handleQuickQuestion(question)}
                                                >
                                                    <FontAwesomeIcon icon={faQuestionCircle} />
                                                    {question}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="messages-list">
                                        {messages.map(message => (
                                            <div 
                                                key={message.id} 
                                                className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'} ${message.isError ? 'error-message' : ''}`}
                                            >
                                                <div className="message-avatar">
                                                    {message.sender === 'bot' ? (
                                                        <FontAwesomeIcon icon={faRobot} />
                                                    ) : (
                                                        <FontAwesomeIcon icon={faHeadset} />
                                                    )}
                                                </div>
                                                <div className="message-content">
                                                    <p>{message.text}</p>
                                                    <span className="message-time">
                                                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {isLoading && (
                                            <div className="message bot-message typing">
                                                <div className="message-avatar">
                                                    <FontAwesomeIcon icon={faRobot} />
                                                </div>
                                                <div className="message-content">
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
                            </div>

                            {/* Input Area */}
                            <form className="chatbot-input-container" onSubmit={handleSendMessage}>
                                <div className="input-wrapper">
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
                                        className="send-message-btn"
                                        disabled={!inputMessage.trim() || isLoading}
                                    >
                                        {isLoading ? (
                                            <FontAwesomeIcon icon={faSpinner} className="spinning" />
                                        ) : (
                                            <FontAwesomeIcon icon={faPaperPlane} />
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Actions Bar */}
                        {messages.length > 0 && (
                            <div className="chatbot-actions">
                                <button 
                                    className="action-btn reset-btn"
                                    onClick={handleResetConversation}
                                >
                                    <FontAwesomeIcon icon={faRedo} />
                                    Start New Conversation
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar with FAQ and Info */}
                    <div className="chatbot-sidebar">
                        {/* Contact Info */}
                        <div className="info-card">
                            <h3>
                                <FontAwesomeIcon icon={faHeadset} />
                                Contact Support
                            </h3>
                            <div className="contact-info">
                                <p><strong>Email:</strong> support@marketconnect.com</p>
                                <p><strong>Phone:</strong> +91 1800-123-4567</p>
                                <p><strong>Hours:</strong> 24/7 Available</p>
                            </div>
                        </div>

                        {/* FAQ Section */}
                        <div className="info-card">
                            <h3>
                                <FontAwesomeIcon icon={faComments} />
                                Frequently Asked Questions
                            </h3>
                            <div className="faq-section">
                                {faqs.length === 0 ? (
                                    <p className="no-faqs">Loading FAQs...</p>
                                ) : (
                                    <div className="faq-list">
                                        {faqs.map((faq, index) => (
                                            <div key={faq._id || index} className={`faq-item ${openFaqIndex === index ? 'open' : ''}`}>
                                                <button 
                                                    className="faq-question"
                                                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                                >
                                                    {faq.question}
                                                </button>
                                                {openFaqIndex === index && (
                                                    <div className="faq-answer">
                                                        <p>{faq.answer}</p>
                                                        <button 
                                                            className="ask-faq-btn"
                                                            onClick={() => handleQuickQuestion(faq.question)}
                                                        >
                                                            Ask about this
                                                        </button>
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

                {/* Error Banner */}
                {error && (
                    <div className="error-banner">
                        <p>{error}</p>
                        <button onClick={() => setError(null)}>×</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIChatbotDashboard;