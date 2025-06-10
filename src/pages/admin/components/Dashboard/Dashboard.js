import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = ({ setActiveTab, setSelectedChatbot }) => {
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

    useEffect(() => {
    fetchChatBots();
    }, []);

    const handleChatbotSelect = (chatbot) => {
    setSelectedChatbot(chatbot);
    setActiveTab('chatbot');
    };

    return (
    <div className="dashboard">
        <h1 className="dashboard-title">Your Chatbots</h1>
        
        <div className="chatbot-grid">
        {chatBots.length > 0 ? (
            chatBots.map(chatbot => (
            <div 
                key={chatbot.chat_bot_id} 
                className="chatbot-card"
                onClick={() => handleChatbotSelect(chatbot)}
            >
                <h3>{chatbot.name || `Chatbot ${chatbot.chat_bot_id}`}</h3>
                <p>Created: {new Date(chatbot.created_at).toLocaleString()}</p>
            </div>
            ))
        ) : (
            <p className="no-chatbots">You don't have any chatbots yet.</p>
        )}
        </div>
    </div>
    );
};

export default Dashboard;