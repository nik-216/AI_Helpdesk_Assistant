import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = ({ setActiveTab, setSelectedChatbot }) => {
    const [chatBots, setChatBots] = useState([]);
    const [showNewChatbotModal, setShowNewChatbotModal] = useState(false);
    const [newChatbotName, setNewChatbotName] = useState('');
    const [message, setMessage] = useState('');

    const fetchChatBots = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/chatbots', {
            headers: { 'Authorization': `Bearer ${token}` }
            });
            setChatBots(response.data);
        } catch (error) {
            console.error('Error fetching chat bots:', error);
        }
    };

    useEffect(() => {
        fetchChatBots();
    }, []);

    const handleChatbotSelect = (chatbot) => {
    setSelectedChatbot(chatbot);
    setActiveTab('chatbot');
    };

    const handleCreateChatbot = async (e) => {
        e.preventDefault();
        if (!newChatbotName) return;

        try {
            const token = localStorage.getItem('token');
            const req = await axios.post(
            'http://localhost:8080/api/chatbots',
            { name: newChatbotName },
            {
                headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
                }
            }
            );
            
            setMessage(`Chatbot "${newChatbotName}" created successfully!`);
            setNewChatbotName('');
            setShowNewChatbotModal(false);
            fetchChatBots();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Failed to create chatbot');
        }
    };

    const deleteChatbot = async (e, chatbot) => {
        e.stopPropagation(); // Prevent triggering the card click
        if (window.confirm(`Are you sure you want to delete "${chatbot.name}"?`)) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(
                    `http://localhost:8080/api/chatbots/delete/${chatbot.chat_bot_id}`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );
                setMessage(`Chatbot "${chatbot.name}" deleted successfully!`);
            } catch (error) {
                setMessage(error.response?.data?.error || 'Failed to delete chatbot');
            }
        }
    };

    return (
    <div className="dashboard">
        <h1 className="dashboard-title">Your Chatbots</h1>

        <div className='edit-chatbot'>
            <Link 
                to="#" 
                onClick={() => setShowNewChatbotModal(true)}
                className='item-newchatbot'
              >
                {/* <img src="/images/plus.png" alt="Add" height="20" />  */}
                + New Chatbot
              </Link>
        </div>
        
        <div className="chatbot-grid">
        {chatBots.length > 0 ? (
            chatBots.map(chatbot => (
            <div 
                key={chatbot.chat_bot_id} 
                className="chatbot-card"
                onClick={() => handleChatbotSelect(chatbot)}>
                <div className="chatbot-card-header">
                    <h3>{chatbot.name || `Chatbot ${chatbot.chat_bot_id}`}</h3>
                    <button 
                        className="delete-chatbot-button"
                        onClick={(e) => deleteChatbot(e, chatbot)}
                    >
                        Delete
                    </button>
                </div>
                <p>Created: {new Date(chatbot.created_at).toLocaleString()}</p>
                <p>API Key: {chatbot.api_key}</p>
            </div>
            ))
        ) : (
            <p className="no-chatbots">You don't have any chatbots yet.</p>
        )}
        </div>

        {showNewChatbotModal && (
            <div className='modal-overlay'>
                <div className='modal-content'>
                <h2>Create New Chatbot</h2>
                <form onSubmit={handleCreateChatbot}>
                    <div className='form-group'>
                    <label className='input-label'>Chatbot Name:</label>
                    <input
                        type="text"
                        value={newChatbotName}
                        onChange={(e) => setNewChatbotName(e.target.value)}
                        className='text-input'
                        required
                        placeholder="My Awesome Chatbot"
                    />
                    </div>
                    <div className='modal-buttons'>
                    <button 
                        type="button"
                        onClick={() => setShowNewChatbotModal(false)}
                        className='cancel-button'
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        className='upload-button'
                    >
                        Create
                    </button>
                    </div>
                </form>
                </div>
            </div>
        )}

        {message && (
                <div className='notificationsidebar' style={{
                    backgroundColor: message.includes('failed') ? '#e74c3c' : '#2ecc71'
                }}>
                    {message}
                </div>
        )}

    </div>
    );
};

export default Dashboard;