import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ChatbotPage.css';

const ChatbotPage = ({ selectedChatbot}) => {
    const [activeTab, setActiveTab] = useState('chatbot-knowledge');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [file, setFile] = useState(null);
    const [link, setLink] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');
    const [settings, setSettings] = useState({
    persistent: false,
    api_key: '',
    llm_model: 'gpt-3.5-turbo'
    });
    const [isEditing, setIsEditing] = useState(false);
    const validFileTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
    ];
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
        const formData = new FormData();
        formData.append('file', file);
        formData.append('chatbotId', selectedChatbot.chat_bot_id);
        
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:8080/api/upload/file', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        }
        });
        
        setMessage(`Document processed successfully! ${response.data.chunks} chunks created.`);
        setShowUploadModal(false);
        setFile(null);
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
        'http://localhost:8080/api/upload/url', 
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
        `http://localhost:8080/api/chatbots/${selectedChatbot.chat_bot_id}/settings`,
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

        {activeTab === 'chatbot-knowledge' && (
        <div className="knowledge-section">
            <div className="section-header">
            <h2>Knowledge Base</h2>
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
                <option value="gpt-3.5-turbo">OpenAI (GPT-3.5 Turbo)</option>
                <option value="gpt-4">OpenAI (GPT-4)</option>
                <option value="deepseek-chat">DeepSeek Chat</option>
                <option value="gemini-pro">Google Gemini Pro</option>
                </select>
            </div>

            <div className="form-group">
                <label>API Key:</label>
                {isEditing ? (
                <input
                    type="text"
                    name="api_key"
                    value={settings.api_key}
                    onChange={handleSettingsChange}
                    placeholder="Enter your API key"
                />
                ) : (
                <div className="api-key-display">
                    {settings.api_key 
                    ? settings.api_key 
                    : 'No API key configured'}
                </div>
                )}
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
            backgroundColor: message.includes('failed') ? '#e74c3c' : '#2ecc71'
        }}>
            {message}
        </div>
        )}
    </div>
    );
};

export default ChatbotPage;