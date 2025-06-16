import React, { useState, useEffect } from 'react';
import { useAuth } from '../../pages/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import ChatbotPage from './components/ChatbotPage/ChatbotPage';
import { ChatbotProvider } from './components/ChatbotPage/ChatbotContext';
import './Home.css';

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
          setSelectedChatbot={setSelectedChatbot}
        />
        
        <div className="admin-main-content">
          {activeTab === 'dashboard' && (
            <Dashboard 
              setActiveTab={setActiveTab}
              setSelectedChatbot={setSelectedChatbot}
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