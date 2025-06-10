import React from 'react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './Sidebar.css';

const Sidebar = ({ user, signout, activeTab, setActiveTab, setSelectedChatbot }) => {

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

    // Handle chatbot selection
    const handleChatbotSelect = (chatbot) => {
        setSelectedChatbot(chatbot);
        setActiveTab('chatbot');
    };

    useEffect(() => {
        fetchChatBots();
    }, []);

    const handleCreateChatbot = async (e) => {
        e.preventDefault();
        if (!newChatbotName) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(
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

    return (
    <div className="sidebar">
        <div className="user-info">
        <h2 className="user-name">{user?.name}</h2>
        <p className="user-email">{user?.email}</p>
        </div>

        <nav>
        <ul className="nav-list">
            <li className="nav-item">
            <Link 
                to="#" 
                onClick={() => {
                setActiveTab('dashboard');
                setSelectedChatbot(null);
                }}
                className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
                Dashboard
            </Link>
            </li>

            <hr></hr>

            <li className='navSectionHeader'>
                <span className='sectionTitle'>Your Chatbots</span>
            </li>

            {chatBots.map(chatbot => (
                <li key={chatbot.chat_bot_id} className='nav-item'>
                <Link 
                    to="#" 
                    onClick={() => handleChatbotSelect(chatbot)}
                    className='nav-link'
                >
                    {chatbot.name || `Chatbot ${chatbot.chat_bot_id}`}
                </Link>
                </li>
            ))}

            <li className='nav-item-newchatbot'>
              <Link 
                to="#" 
                onClick={() => setShowNewChatbotModal(true)}
                className='nav-link nav-link-newchatbot'
              >
                + New Chatbot
              </Link>
            </li>

            <hr></hr>
            
        </ul>
        </nav>

        <div className="signout-container">
        <button onClick={signout} className="signout-button">
            Sign Out
        </button>
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
                <div className='notification' style={{
                    backgroundColor: message.includes('failed') ? '#e74c3c' : '#2ecc71'
                }}>
                    {message}
                </div>
        )}

        
    </div>
    );
};

export default Sidebar;