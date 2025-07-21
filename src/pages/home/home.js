import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/authContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/sidebar/sidebar';
import Dashboard from '../../components/dashboard/dashboard';
// import ChatbotPage from '../../components/chatbotPage/chatbotPage';
import ChatbotPage from '../chatbotpage/chatbotPage';
import { ChatbotProvider } from '../../components/chatbotPage/chatbotContext';
import './home.css';

const Home = () => {
  const { user, signout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedChatbot, setSelectedChatbot] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="admin-container">
      <ChatbotProvider>
        <Sidebar
          user={user}
          signout={signout}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedChatbot={selectedChatbot}
          setSelectedChatbot={setSelectedChatbot}
        />
        
        <div className="admin-main-content">
          {activeTab === 'dashboard' && (
            <Dashboard 
              setActiveTab={setActiveTab}
              setSelectedChatbot={setSelectedChatbot}
              signout={signout}
            />
          )}
          
          {activeTab === 'chatbot' && selectedChatbot && (
            <ChatbotPage 
              selectedChatbot={selectedChatbot}
              setActiveTab={setActiveTab}
            />
          )}
        </div>
      </ChatbotProvider>
    </div>
  );
};

export default Home;