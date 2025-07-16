import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './chatbotPage.css';
import Tabs from '../../components/chatbotPage/shared/tabs';
import ChatHistory from '../../components/chatbotPage/chatHistory/chatHistory';
import KnowledgeBase from '../../components/chatbotPage/knowledgeBase/knowledgeBase';
import SettingsPanel from '../../components/chatbotPage/settings/settingsPanel';
import Notification from '../../components/chatbotPage/shared/notification';

const ChatbotPage = ({ selectedChatbot }) => {
    const [activeTab, setActiveTab] = useState('chatbot-chats');
    const [message, setMessage] = useState('');
    const [settings, setSettings] = useState({
        persistent: false,
        api_key: '',
        llm_model: 'deepseek-chat',
        specifications: '',
        rejectionmsg: '',
        temperature: 0.7
    });
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

    const fetchChats = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8080/api/chatbots/${selectedChatbot.chat_bot_id}/chats`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            setChats(response.data);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setChats([]);
            } else {
                console.error('Error fetching chats:', error);
                setMessage('Failed to load chat history');
            }
        }
    }, [selectedChatbot]);

    useEffect(() => {
        fetchChats();
        const interval = setInterval(fetchChats, 10000);
        return () => clearInterval(interval);
    }, [selectedChatbot, fetchChats]);

    const handleDismissNotification = () => {
        setMessage('');
    };

    return (
        <div className="chatbot-page">
            <h1 className="chatbot-title">
                {selectedChatbot.name || `Chatbot ${selectedChatbot.chat_bot_id}`}
            </h1>
            
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            
            {activeTab === 'chatbot-chats' && (
                <ChatHistory 
                    chats={chats} 
                    selectedChat={selectedChat} 
                    setSelectedChat={setSelectedChat} 
                />
            )}

            {activeTab === 'chatbot-knowledge' && (
                <KnowledgeBase 
                    selectedChatbot={selectedChatbot}
                    knowledgeItems={knowledgeItems}
                    setKnowledgeItems={setKnowledgeItems}
                    setMessage={setMessage}
                />
            )}

            {activeTab === 'chatbot-settings' && (
                <SettingsPanel 
                    settings={settings} 
                    setSettings={setSettings}
                    selectedChatbot={selectedChatbot}
                    setMessage={setMessage}
                />
            )}

            {message && (
                <Notification 
                    message={message} 
                    onDismiss={handleDismissNotification} 
                />
            )}
        </div>
    );
};

export default ChatbotPage;