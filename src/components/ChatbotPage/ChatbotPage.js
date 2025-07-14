import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ChatbotPage.css';

const ChatbotPage = ({ selectedChatbot}) => {
    const [activeTab, setActiveTab] = useState('chatbot-chats');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [file, setFile] = useState(null);
    const [link, setLink] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');

    const [settings, setSettings] = useState({
    persistent: false,
    api_key: '',
    llm_model: 'deepseek-chat',
    specifications: '',
    rejectionmsg: '',
    temperature: 0.7
    });

    const [isEditing, setIsEditing] = useState(false);
    const validFileTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
    ];
    const [knowledgeItems, setKnowledgeItems] = useState([]);
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);

    // Fetch settings when component mounts or chatbot changes
    useEffect(() => {
        const fetchSettings = async () => {
            try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8080/api/chatbots/${selectedChatbot.chat_bot_id}/settings`,
                {
                headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            setSettings(response.data);
            } catch (error) {
            console.error('Error fetching settings:', error);
            }
        };

        fetchSettings();
    }, [selectedChatbot]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const extension = selectedFile.name.split('.').pop().toLowerCase();
        const isValidType = validFileTypes.includes(selectedFile.type) || 
                            ['.pdf', '.docx', '.txt'].includes(`.${extension}`);

        if (!isValidType) {
            setMessage(`Unsupported file type. Please upload PDF, DOCX, or TXT files.`);
            e.target.value = '';
            return;
        }

        setFile(selectedFile);
        setMessage('');
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!file || !selectedChatbot) return;

        setIsProcessing(true);
        setMessage('Processing document...');

        try {
            
            const token = localStorage.getItem('token');
            const response = await axios.post(`http://localhost:8080/api/upload/file`, 
                {
                    file: file,
                    chatbotId: selectedChatbot.chat_bot_id
                }, 
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
            });
            
            setMessage(`Document processed successfully! ${response.data.chunks} chunks created.`);
            setShowUploadModal(false);
            setFile(null);
            fetchKnowledgeItems();
        } catch (error) {
            setMessage(error.response?.data?.error || 'File upload failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLinkSubmit = async (e) => {
        e.preventDefault();
        if (!link || !selectedChatbot) return;

        setIsProcessing(true);
        setMessage('Processing link...');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
            `http://localhost:8080/api/upload/url`, 
            { 
                url: link,
                chatbotId: selectedChatbot.chat_bot_id 
            },
            {
                headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
                }
            }
            );
            
            setMessage(`Processed successfully! ${response.data.chunks} chunks created.`);
            setShowLinkModal(false);
            setLink('');
            fetchKnowledgeItems();
        } catch (error) {
            setMessage(error.response?.data?.error || 'URL processing failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSettingsChange = (e) => {
        const { name, value, type, checked } = e.target;
            setSettings(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
        }));
    };

    const saveSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
            `http://localhost:8080/api/chatbots/${selectedChatbot.chat_bot_id}/settings/change`,
            settings,
            {
                headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
                }
            }
            );
            setMessage('Settings saved successfully!');
            setIsEditing(false);
        } catch (error) {
            setMessage(error.response?.data?.error || 'Failed to save settings');
        }
    };

    const fetchKnowledgeItems = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8080/api/chatbots/${selectedChatbot.chat_bot_id}/knowledge`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            setKnowledgeItems(response.data);
        } catch (error) {
            console.error('Error fetching knowledge items:', error);
        }
    }, [selectedChatbot]);

    useEffect(() => {
        fetchKnowledgeItems();
    }, [selectedChatbot, fetchKnowledgeItems]);

    const deleteKnowledgeItem = async (fileId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `http://localhost:8080/api/chatbots/${selectedChatbot.chat_bot_id}/knowledge/delete`,
                {
                    data: {
                        file_id: fileId
                    },
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            setMessage('Knowledge item deleted successfully!');
            fetchKnowledgeItems();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Failed to delete knowledge item');
        }
    }

    const fetchChats = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8080/api/chatbots/${selectedChatbot.chat_bot_id}/chats`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            // Will receive [] if no chats exist
            setChats(response.data);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                // Handle case where endpoint might still return 404
                setChats([]);
            } else {
                console.error('Error fetching chats:', error);
                setMessage('Failed to load chat history');
            }
        }
    }, [selectedChatbot]);

    useEffect(() => {
        fetchChats();
        setInterval(fetchChats, 10000)
    }, [selectedChatbot, fetchChats]);

    return (
    <div className="chatbot-page">
        <h1 className="chatbot-title">
        {selectedChatbot.name || `Chatbot ${selectedChatbot.chat_bot_id}`}
        </h1>
        
        <div className="tab-container">
            <button
                className={`tab-button ${activeTab === 'chatbot-chats' ? 'active' : ''}`}
                onClick={() => setActiveTab('chatbot-chats')}
            >
                Chats
            </button>
            <button
                className={`tab-button ${activeTab === 'chatbot-knowledge' ? 'active' : ''}`}
                onClick={() => setActiveTab('chatbot-knowledge')}
            >
                Knowledge Base
            </button>
            <button
                className={`tab-button ${activeTab === 'chatbot-settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('chatbot-settings')}
            >
                Settings
            </button>
        </div>

        {activeTab === 'chatbot-chats' && (
        <div className="chats-section">
            <h2>Chat History</h2>
            <div className="chats-list">
            {chats.length > 0 ? (
                chats.map(chat => (
                <div 
                    key={chat.chat_id} 
                    className="chat-item"
                    onClick={() => setSelectedChat(chat)}
                >
                    <div className="chat-content">
                    <div className="chat-header">
                        <h4>Chat #{chat.chat_id}</h4>
                        <span className="chat-date">
                        {new Date(chat.created_at).toLocaleString()}
                        </span>
                    </div>
                    {chat.history?.length > 0 && (
                        <div className="message-preview">
                        <p className="preview-text">
                            {chat.history[0].content.substring(0, 80)}...
                        </p>
                        <span className="preview-info">
                            {chat.history.length} messages
                        </span>
                        </div>
                    )}
                    </div>
                </div>
                ))
            ) : (
                <p className="no-chats">No chats available for this chatbot.</p>
            )}
            </div>

            {/* Chat History Modal */}
            {selectedChat && (
            <div className="chat-modal-overlay" onClick={() => setSelectedChat(null)}>
                <div className="chat-modal-content" onClick={e => e.stopPropagation()}>
                <div className="chat-modal-header">
                    <h3>Chat #{selectedChat.chat_id}</h3>
                    <button 
                    className="close-modal"
                    onClick={() => setSelectedChat(null)}
                    >
                    &times;
                    </button>
                </div>
                <div className="chat-meta">
                    <span>Started: {new Date(selectedChat.created_at).toLocaleString()}</span>
                    {selectedChat.ip_address && (
                    <span>IP: {selectedChat.ip_address}</span>
                    )}
                </div>
                <div className="chat-history">
                    {selectedChat.history?.length > 0 ? (
                    selectedChat.history.map((message, index) => (
                        <div 
                        key={index} 
                        className={`message ${message.role}`}
                        >
                        <div className="message-header">
                            <span className="message-role">
                            {message.role === 'user' ? 'User' : 'Assistant'}
                            </span>
                            <span className="message-time">
                            {new Date(message.created_at).toLocaleTimeString()}
                            </span>
                        </div>
                        <div className="message-text">
                            {message.content}
                        </div>
                        </div>
                    ))
                    ) : (
                    <p className="no-messages">No messages in this conversation</p>
                    )}
                </div>
                </div>
            </div>
            )}
        </div>
        )}

        {activeTab === 'chatbot-knowledge' && (
        <div className="knowledge-section">
            <div className="section-header">
                <h2>Add To Knowledge Base</h2>
                <div className="action-buttons">
                    <button 
                    className="primary-button"
                    onClick={() => setShowUploadModal(true)}
                    >
                    Upload Document
                    </button>
                    <button 
                    className="primary-button"
                    onClick={() => setShowLinkModal(true)}
                    >
                    Add Link
                    </button>
                </div>
            </div>
            <div className="knowledge-section">
                <hr></hr>
                <h2>Items Present In Knowledge Base</h2>
                <div className="knowledge-list">
                    {knowledgeItems.length > 0 ? (
                    knowledgeItems.map(item => (
                        <div key={item.file_id} className="knowledge-item">
                        <div className="item-content">
                            <h4>{item.source}</h4>
                        </div>
                        <button
                            className="delete-button"
                            onClick={() => deleteKnowledgeItem(item.file_id)}
                        >
                            Delete
                        </button>
                        </div>
                    ))
                    ) : (
                    <p className="no-knowledge-items">You don't have any knowledge items yet.</p>
                    )}
                </div>
            </div>
        </div>
        )}

        {activeTab === 'chatbot-settings' && (
        <div className="settings-section">
            <h2>Chatbot Settings</h2>
            
            <div className="settings-form">
            <div className="form-group">
                <label>
                <input
                    type="checkbox"
                    name="persistent"
                    checked={settings.persistent}
                    onChange={handleSettingsChange}
                    disabled={!isEditing}
                />
                Persistent Chat (maintains conversation history)
                </label>
            </div>

            <div className="form-group">
                <label>LLM Model:</label>
                <select
                name="llm_model"
                value={settings.llm_model}
                onChange={handleSettingsChange}
                disabled={!isEditing}
                >
                    <option value="deepseek-chat">DeepSeek Chat</option>
                    <option value="gpt-4o">OpenAI (GPT-4o)</option>
                    <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                    <option value="gemini-2.0-flash">Google Gemini 2.0 Flash</option>
                </select>
            </div>

            <div className="form-group">
                <label>API Key:</label>
                <div className="api-key-display">
                    {settings.api_key 
                    ? settings.api_key 
                    : 'No API key configured'}
                </div>
            </div>

            <div className="form-group">
                <label>Specifications:</label>
                <input
                type="text"
                name="specifications"
                value={settings.specifications}
                onChange={handleSettingsChange}
                disabled={!isEditing}
                placeholder="Enter specifications"
                className="text-input"
                />
            </div>

            <div className="form-group">
                <label>Rejection Message:</label>
                <input
                type="text"
                name="rejectionmsg"
                value={settings.rejectionmsg}
                onChange={handleSettingsChange}
                disabled={!isEditing}
                placeholder="Enter rejection message"
                className="text-input"
                />
            </div>

            <div className="form-group">
                <label>Temperature:</label>
                <input
                type="number"
                name="temperature"
                value={settings.temperature}
                onChange={handleSettingsChange}
                disabled={!isEditing}
                step="0.1"
                min="0"
                max="1"
                className="text-input"
                />
            </div>

            <div className="settings-actions">
                {isEditing ? (
                <>
                    <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => setIsEditing(false)}
                    >
                    Cancel
                    </button>
                    <button 
                    type="button" 
                    className="save-button"
                    onClick={saveSettings}
                    >
                    Save Settings
                    </button>
                </>
                ) : (
                <button 
                    type="button" 
                    className="edit-button"
                    onClick={() => setIsEditing(true)}
                >
                    Edit Settings
                </button>
                )}
            </div>
            </div>
        </div>
        )}

        {/* Upload Document Modal */}
        {showUploadModal && (
        <div className="modal-overlay">
            <div className="modal-content">
            <h2>Upload Document</h2>
            <p className="file-types">Supported formats: PDF, DOCX, TXT</p>
            <input 
                type="file" 
                onChange={handleFileChange}
                className="file-input"
                accept=".pdf,.docx,.txt"
            />
            {file && (
                <p className="selected-file">Selected: {file.name}</p>
            )}
            <div className="modal-actions">
                <button 
                onClick={() => {
                    setShowUploadModal(false);
                    setFile(null);
                }}
                className="cancel-button"
                disabled={isProcessing}
                >
                Cancel
                </button>
                <button 
                onClick={handleFileUpload}
                className="upload-button"
                disabled={!file || isProcessing}
                >
                {isProcessing ? 'Processing...' : 'Upload'}
                </button>
            </div>
            </div>
        </div>
        )}

        {/* Add Link Modal */}
        {showLinkModal && (
        <div className="modal-overlay">
            <div className="modal-content">
            <h2>Add Link</h2>
            <form onSubmit={handleLinkSubmit}>
                <div className="form-group">
                <label className="input-label">Link URL:</label>
                <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="text-input"
                    required
                    placeholder="https://example.com"
                />
                </div>
                <div className="modal-actions">
                <button 
                    type="button"
                    onClick={() => setShowLinkModal(false)}
                    className="cancel-button"
                    disabled={isProcessing}
                >
                    Cancel
                </button>
                <button 
                    type="submit"
                    className="upload-button"
                    disabled={isProcessing}
                >
                    {isProcessing ? 'Processing...' : 'Add Link'}
                </button>
                </div>
            </form>
            </div>
        </div>
        )}

        {/* Message notification */}
        {message && (
        <div className="notification" style={{
            backgroundColor:  message.includes('failed') ? '#e74c3c' : '#2ecc71'
        }}>
            {message}
        </div>
        )}
    </div>
    );
};

export default ChatbotPage;