import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ChatbotPage.css';

const ChatbotPage = ({ selectedChatbot, setActiveTab }) => {
  const [activeSubTab, setActiveSubTab] = useState('chats');
  const [chats, setChats] = useState([]);
  const [knowledgeItems, setKnowledgeItems] = useState([]);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8080/api/chatbots/${selectedChatbot.chat_bot_id}/chats`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchKnowledgeItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8080/api/chatbots/${selectedChatbot.chat_bot_id}/knowledge`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setKnowledgeItems(response.data);
    } catch (error) {
      console.error('Error fetching knowledge items:', error);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'chats') {
      fetchChats();
    } else {
      fetchKnowledgeItems();
    }
  }, [activeSubTab, selectedChatbot]);

  return (
    <div className="chatbot-page">
      <h1 className="chatbot-title">
        {selectedChatbot.name || `Chatbot ${selectedChatbot.chat_bot_id}`}
      </h1>
      
      <div className="tab-container">
        <button
          onClick={() => setActiveSubTab('chats')}
          className={`tab-button ${activeSubTab === 'chats' ? 'active' : ''}`}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveSubTab('knowledge')}
          className={`tab-button ${activeSubTab === 'knowledge' ? 'active' : ''}`}
        >
          Knowledge Base
        </button>
      </div>

      {activeSubTab === 'chats' && (
        <div className="chats-section">
          <h2>Chat History</h2>
          {chats.length > 0 ? (
            <ul className="chat-list">
              {chats.map(chat => (
                <li key={chat.chat_id} className="chat-item">
                  <div className="chat-header">
                    <span className="chat-date">
                      {new Date(chat.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="chat-actions">
                    <button className="action-button">View</button>
                    <button className="action-button delete">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No chats yet for this chatbot</p>
          )}
        </div>
      )}

      {activeSubTab === 'knowledge' && (
        <div className="knowledge-section">
          <div className="section-header">
            <h2>Knowledge Base</h2>
            <div className="action-buttons">
              <button className="primary-button">Upload Document</button>
              <button className="primary-button">Add Link</button>
            </div>
          </div>
          
          {knowledgeItems.length > 0 ? (
            <ul className="knowledge-list">
              {knowledgeItems.map(item => (
                <li key={item.kb_id} className="knowledge-item">
                  <div className="item-header">
                    <span className="item-type">
                      {item.url ? '🔗 Link' : '📄 Document'}
                    </span>
                    <span className="item-date">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="item-content">
                    {item.url || 'Document content'}
                  </div>
                  <div className="item-actions">
                    <button className="action-button">View</button>
                    <button className="action-button delete">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No knowledge items yet</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatbotPage;