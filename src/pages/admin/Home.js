import React, { useState } from 'react';
import { useAuth } from '../../pages/auth/AuthContext';
import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import ChatbotPage from './components/ChatbotPage/ChatbotPage';
import './Home.css';

const Home = () => {
  const { user, signout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedChatbot, setSelectedChatbot] = useState(null);

  return (
    <div className="admin-container">
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
    </div>
  );
};

export default Home;