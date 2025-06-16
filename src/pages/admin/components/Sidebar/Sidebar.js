import React from 'react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './Sidebar.css';

const Sidebar = ({ user, signout, activeTab, setActiveTab, setSelectedChatbot }) => {

    const [chatBots, setChatBots] = useState([]);

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
        setInterval(fetchChatBots, 1000)
    }, []);

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

            <hr></hr>
            
        </ul>
        </nav>

        <div className="signout-container">
        <button onClick={signout} className="signout-button">
            {/* <img src="/images/exit.png" alt="Sign Out" height="20" /> */}
            Sign Out
        </button>
        </div>
    </div>
    );
};

export default Sidebar;