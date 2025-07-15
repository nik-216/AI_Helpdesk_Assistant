import { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ChatbotContext = createContext();

export const ChatbotProvider = ({ children }) => {
    const [chatBots, setChatBots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchChatBots = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const response = await axios.get('http://localhost:8080/api/chatbots', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setChatBots(response.data);
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to fetch chatbots');
            console.error('Error fetching chat bots:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch and when refreshTrigger changes
    useEffect(() => {
        fetchChatBots();
    }, [fetchChatBots]);

    // Add a refresh function to trigger updates
    // const refreshChatBots = useCallback(() => {
    //     setRefreshTrigger(prev => prev + 1);
    // }, []);

    return (
        <ChatbotContext.Provider value={{ 
            chatBots, 
            fetchChatBots,
            // refreshChatBots,
            loading,
            error
        }}>
            {children}
        </ChatbotContext.Provider>
    );
};

export default ChatbotContext;