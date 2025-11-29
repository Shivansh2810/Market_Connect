import React, { useState, useEffect, useRef } from 'react';
import './customerService.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import api from '../../../services/axios';

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
// const CHATBOT_API_URL = 'http://localhost:5000/services/chatbot';
// const FAQ_API_URL = 'http://localhost:8080/services/faqs'; 

//const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_URL;

// Using the assistant API instead of separate chatbot server
const FAQ_API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/faqs`;

const getDefaultFetch = () => {
    if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') {
        return globalThis.fetch.bind(globalThis);
    }
    return async () => {
        throw new Error('fetch is not available');
    };
};


const CustomerService = ({ onBack, apiClient = api, fetchFn = getDefaultFetch() }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sessionId, setSessionId] = useState(
        () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
    const [faqs, setFaqs] = useState([]);
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [savedChats, setSavedChats] = useState([]);
    const [isChatListOpen, setIsChatListOpen] = useState(false);
    const [isLoadingChats, setIsLoadingChats] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Fetch FAQs
        const fetchFaqs = async () => {
            try {
                const res = await fetchFn(FAQ_API_URL);
                if (!res.ok) throw new Error('Failed to load FAQs');
                const data = await res.json();
                setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
            } catch (e) {
                // silently ignore; UI will just not show FAQs
                setFaqs([]);
            }
        };
        fetchFaqs();
    }, []);

    const fetchSavedChats = async () => {
        try {
            setIsLoadingChats(true);
            const res = await apiClient.get('/chats');
            const data = res.data && res.data.data ? res.data.data : [];
            setSavedChats(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching saved chats:', err);
            setSavedChats([]);
        } finally {
            setIsLoadingChats(false);
        }
    };

    useEffect(() => {
        // Load initial chat history list for authenticated users
        fetchSavedChats();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleLoadChat = async (chatSummary) => {
        try {
            const res = await apiClient.get(`/chats/${chatSummary.sessionId}`);
            const chatData = res.data && res.data.data ? res.data.data : null;
            if (chatData && Array.isArray(chatData.messages)) {
                setSessionId(chatData.sessionId);
                const restoredMessages = chatData.messages.map((m, idx) => ({
                    id: `${chatData._id || 'chat'}_${idx}_${Date.now()}`,
                    text: m.text,
                    sender: m.sender,
                    timestamp: m.timestamp || new Date().toISOString(),
                }));
                setMessages(restoredMessages);
                setError(null);
                setIsChatListOpen(false);
            }
        } catch (err) {
            console.error('Error loading chat by sessionId:', err);
        }
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
                // Use assistant API for customer service
                /*Send message to Python chatbot API
                const response = await fetch(`${CHATBOT_API_URL}/message`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                */
                const response = await apiClient.post('/assistant/chat', {
                    message: userMessage,
                    session_id: sessionId
                });
                /*
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                */

                const data = response.data;
                
                // Add bot response
                const botMessage = {
                    id: Date.now() + 1,
                    text: data.response || 'Sorry, I could not process your request.',
                    sender: 'bot',
                    timestamp: new Date().toISOString()
                };
                const newMessages = [...messages, userMessageObj, botMessage];
                setMessages(newMessages);

                try {
                    /*            Send message to Python chatbot API
            const response = await fetch(`${CHATBOT_API_URL}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                */
                    await apiClient.post('/chats', {
                        sessionId,
                        messages: newMessages,
                    });
                    fetchSavedChats();
                } catch (saveErr) {
                }
            } catch (err) {
                console.error('Error sending message:', err);
                setError('Failed to send message. Please try again.');
                
                // Add error message
                const errorMessage = {
                    id: Date.now() + 1,
                    text: 'Sorry, I\'m having trouble connecting right now. Please try again later or contact support at hml72417@gmail.com',
                    sender: 'bot',
                    timestamp: new Date().toISOString(),
                    isError: true
                };
                const newMessages = [...messages, userMessageObj, errorMessage];
                setMessages(newMessages);

                try {
                    await apiClient.post('/chats', {
                        sessionId,
                        messages: newMessages,
                    });
                    fetchSavedChats();
                } catch (saveErr) {
                }
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
            // Use assistant API for customer service
            const response = await apiClient.post('/assistant/chat', {
                message: question,
                session_id: sessionId
            });

            const data = response.data;
            
            // Add bot response
            const botMessage = {
                id: Date.now() + 1,
                text: data.response || 'Sorry, I could not process your request.',
                sender: 'bot',
                timestamp: new Date().toISOString()
            };
            const newMessages = [...messages, userMessageObj, botMessage];
            setMessages(newMessages);

            try {
                await apiClient.post('/chats', {
                    sessionId,
                    messages: newMessages,
                });
                fetchSavedChats();
            } catch (saveErr) {
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message. Please try again.');
            
            // Add error message
            const errorMessage = {
                id: Date.now() + 1,
                text: 'Sorry, I\'m having trouble connecting right now. Please try again later or contact support at hml72417@gmail.com',
                sender: 'bot',
                timestamp: new Date().toISOString(),
                isError: true
            };
            const newMessages = [...messages, userMessageObj, errorMessage];
            setMessages(newMessages);

            try {
                await apiClient.post('/chats', {
                    sessionId,
                    messages: newMessages,
                });
                fetchSavedChats();
            } catch (saveErr) {
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetConversation = async () => {
        try {
            // Just clear messages locally - no need for API call
            setMessages([]);
            setError(null);
            // Generate new session ID
            setSessionId(`cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        } catch (err) {
            console.error('Error resetting conversation:', err);
            setMessages([]);
        }
    };

    const handleFaqToChat = (faq, idx, event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const botMessage = {
            id: Date.now(),
            text: faq.answer,
            sender: 'bot',
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, botMessage]);
        setOpenFaqIndex(idx);
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
                            <div className="chatbot-header-actions">
                                <div className="chat-history-wrapper">
                                    <button
                                        className="chat-history-toggle"
                                        onClick={() => {
                                            const next = !isChatListOpen;
                                            setIsChatListOpen(next);
                                            if (next) {
                                                fetchSavedChats();
                                            }
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faComments} />
                                        <span>Previous Conversations</span>
                                    </button>
                                    {isChatListOpen && (
                                        <div className="chat-history-dropdown">
                                            {isLoadingChats ? (
                                                <p className="chat-history-status">Loading conversations...</p>
                                            ) : savedChats.length === 0 ? (
                                                <p className="chat-history-status">No saved conversations yet.</p>
                                            ) : (
                                                <ul className="chat-history-list">
                                                    {savedChats.map((chat) => (
                                                        <li
                                                            key={chat._id}
                                                            className="chat-history-item"
                                                            onClick={() => handleLoadChat(chat)}
                                                        >
                                                            <div className="chat-history-title">
                                                                {chat.firstMessage || 'New conversation'}
                                                            </div>
                                                            <div className="chat-history-meta">
                                                                <span>{chat.messageCount} messages</span>
                                                                <span>
                                                                    {chat.lastMessageTime
                                                                        ? new Date(chat.lastMessageTime).toLocaleString([], {
                                                                              hour: '2-digit',
                                                                              minute: '2-digit',
                                                                              day: '2-digit',
                                                                              month: 'short',
                                                                          })
                                                                        : ''}
                                                                </span>
                                                            </div>
                                                            <div className="chat-history-preview">
                                                                {chat.lastMessage}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
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
                                aria-label="Send message"
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
                            <p><strong>Email:</strong> hml72417@gmail.com</p>
                            <p><strong>Phone:</strong> +91 9157927168</p>
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
                                                            onClick={(e) => handleFaqToChat(f, idx, e)}
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
