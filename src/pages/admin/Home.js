import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const { user, signout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showNewChatbotModal, setShowNewChatbotModal] = useState(false);
  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
  const [newChatbotName, setNewChatbotName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [chatBots, setChatBots] = useState([]);
  const [selectedChatbot, setSelectedChatbot] = useState(null);
  const [chats, setChats] = useState([]);
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const validFileTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  // File type validation function
  const isValidFileType = (file) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    const extension = file.name.split('.').pop().toLowerCase();
    return validTypes.includes(file.type) || 
           ['.pdf', '.docx', '.txt'].includes(`.${extension}`);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!isValidFileType(selectedFile)) {
      setMessage(`Unsupported file type. Please upload PDF, DOCX, or TXT files.`);
      e.target.value = ''; // Clear the file input
      return;
    }

    setFile(selectedFile);
    setMessage('');
  };

  // Fetch all chat bots for the user
  const fetchChatBots = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/chatbots', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setChatBots(response.data);
    } catch (error) {
      console.error('Error fetching chat bots:', error);
    }
  };

  // Fetch chats for a specific chatbot
  const fetchChats = async (chatbotId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/chatbots/${chatbotId}/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  // Fetch knowledge items for a specific chatbot
  const fetchKnowledgeItems = async (chatbotId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/chatbots/${chatbotId}/knowledge`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setKnowledgeItems(response.data);
    } catch (error) {
      console.error('Error fetching knowledge items:', error);
    }
  };

  // Handle chatbot selection
  const handleChatbotSelect = (chatbot) => {
    setSelectedChatbot(chatbot);
    setActiveTab('chatbot');
    fetchChats(chatbot.chat_bot_id);
    fetchKnowledgeItems(chatbot.chat_bot_id);
  };

  // Create a new chatbot
  const handleCreateChatbot = async (e) => {
    e.preventDefault();
    if (!newChatbotName) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
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
      fetchChatBots(); // Refresh the list
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to create chatbot');
    }
  };

  // Handle file upload for the selected chatbot
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file || !selectedChatbot) return;
    
    setIsProcessing(true);
    setMessage('Processing document...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatbotId', selectedChatbot.chat_bot_id);
      
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/api/upload/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      setMessage(`Document processed successfully! ${response.data.chunks} chunks created.`);
      setShowUploadModal(false);
      setFile(null);
      fetchKnowledgeItems(selectedChatbot.chat_bot_id); // Refresh knowledge items
    } catch (error) {
      setMessage(error.response?.data?.error || 'File upload failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle link submission for the selected chatbot
  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!link || !selectedChatbot) return;
    
    setIsProcessing(true);
    setMessage('Processing link...');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8080/api/upload/url', 
        { 
          url: link,
          chatbotId: selectedChatbot.chat_bot_id 
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setMessage(`Processed successfully! ${response.data.chunks} chunks created.`);
      setShowLinkModal(false);
      setLink('');
      fetchKnowledgeItems(selectedChatbot.chat_bot_id); // Refresh knowledge items
    } catch (error) {
      setMessage(error.response?.data?.error || 'URL processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date helper function
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  // Initialize component
  useEffect(() => {
    fetchChatBots();
  }, []);

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.userInfo}>
          <h2 style={styles.userName}>{user?.name}</h2>
          <p style={styles.userEmail}>{user?.email}</p>
        </div>

        <nav>
          <ul style={styles.navList}>
            <li style={styles.navItem}>
              <Link 
                to="#" 
                onClick={() => {
                  setActiveTab('dashboard');
                  setSelectedChatbot(null);
                }}
                style={{
                  ...styles.navLink,
                  color: activeTab === 'dashboard' ? '#3498db' : '#ecf0f1',
                  backgroundColor: activeTab === 'dashboard' ? '#34495e' : 'transparent',
                }}
              >
                Dashboard
              </Link>
            </li>
            
            {/* Chatbots section */}
            <li style={styles.navSectionHeader}>
              <span style={styles.sectionTitle}>Your Chatbots</span>
            </li>
            {chatBots.map(chatbot => (
              <li key={chatbot.chat_bot_id} style={styles.navItem}>
                <Link 
                  to="#" 
                  onClick={() => handleChatbotSelect(chatbot)}
                  style={{
                    ...styles.navLink,
                    color: selectedChatbot?.chat_bot_id === chatbot.chat_bot_id ? '#3498db' : '#ecf0f1',
                    backgroundColor: selectedChatbot?.chat_bot_id === chatbot.chat_bot_id ? '#34495e' : 'transparent',
                  }}
                >
                  {chatbot.name || `Chatbot ${chatbot.chat_bot_id}`}
                </Link>
              </li>
            ))}
            
            {/* Add new chatbot button */}
            <li style={styles.navItem}>
              <Link 
                to="#" 
                onClick={() => setShowNewChatbotModal(true)}
                style={styles.navLink}
              >
                + New Chatbot
              </Link>
            </li>
          </ul>
        </nav>

        <div style={styles.signoutContainer}>
          <button 
            onClick={signout}
            style={styles.signoutButton}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {activeTab === 'dashboard' && (
          <>
            <h1 style={styles.welcomeHeader}>Welcome, {user?.name}</h1>
            <p style={styles.welcomeSubtext}>What would you like to do today?</p>
            <div style={styles.dashboardContent}>
              <h2>Your Chatbots</h2>
              {chatBots.length > 0 ? (
                <div style={styles.chatbotGrid}>
                  {chatBots.map(chatbot => (
                    <div 
                      key={chatbot.chat_bot_id} 
                      style={styles.chatbotCard}
                      onClick={() => handleChatbotSelect(chatbot)}
                    >
                      <h3>{chatbot.name || `Chatbot ${chatbot.chat_bot_id}`}</h3>
                      <p>Created: {formatDate(chatbot.created_at)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.noActivity}>You don't have any chatbots yet. Create one to get started!</p>
              )}
            </div>
          </>
        )}

        {activeTab === 'chatbot' && selectedChatbot && (
          <div>
            <h1 style={styles.welcomeHeader}>
              {selectedChatbot.name || `Chatbot ${selectedChatbot.chat_bot_id}`}
            </h1>
            
            <div style={styles.tabContainer}>
              <button 
                onClick={() => setActiveTab('chatbot-chats')}
                style={{
                  ...styles.tabButton,
                  backgroundColor: activeTab === 'chatbot-chats' ? '#3498db' : '#ecf0f1',
                  color: activeTab === 'chatbot-chats' ? 'white' : '#2c3e50',
                }}
              >
                Chats
              </button>
              <button 
                onClick={() => setActiveTab('chatbot-knowledge')}
                style={{
                  ...styles.tabButton,
                  backgroundColor: activeTab === 'chatbot-knowledge' ? '#3498db' : '#ecf0f1',
                  color: activeTab === 'chatbot-knowledge' ? 'white' : '#2c3e50',
                }}
              >
                Knowledge Base
              </button>
            </div>

            {activeTab === 'chatbot-chats' && (
              <div style={styles.chatbotContent}>
                <h2>Chats</h2>
                {chats.length > 0 ? (
                  <ul style={styles.chatList}>
                    {chats.map(chat => (
                      <li key={chat.chat_id} style={styles.chatItem}>
                        <div style={styles.chatHeader}>
                          <span style={styles.chatDate}>{formatDate(chat.created_at)}</span>
                        </div>
                        <div style={styles.chatActions}>
                          <button style={styles.chatButton}>View</button>
                          <button style={styles.chatButton}>Delete</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={styles.noActivity}>No chats yet for this chatbot</p>
                )}
              </div>
            )}

            {activeTab === 'chatbot-knowledge' && (
              <div style={styles.chatbotContent}>
                <div style={styles.knowledgeHeader}>
                  <h2>Knowledge Base</h2>
                  <div>
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      style={styles.smallButton}
                    >
                      Upload Document
                    </button>
                    <button 
                      onClick={() => setShowLinkModal(true)}
                      style={styles.smallButton}
                    >
                      Add Link
                    </button>
                  </div>
                </div>
                
                {knowledgeItems.length > 0 ? (
                  <ul style={styles.knowledgeList}>
                    {knowledgeItems.map(item => (
                      <li key={item.kb_id} style={styles.knowledgeItem}>
                        <div style={styles.knowledgeHeader}>
                          <span style={styles.knowledgeType}>
                            {item.url ? '🔗 Link' : '📄 Document'}
                          </span>
                          <span style={styles.knowledgeDate}>
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                        <div style={styles.knowledgeContent}>
                          {item.url || 'Document content'}
                        </div>
                        <div style={styles.knowledgeFooter}>
                          <button style={styles.smallButton}>View</button>
                          <button style={styles.smallButton}>Delete</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={styles.noActivity}>No knowledge items yet. Add some to train your chatbot!</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2>Upload Document</h2>
            <p style={styles.fileTypesInfo}>Supported formats: PDF, DOCX, TXT</p>
            <input 
              type="file" 
              onChange={handleFileChange}
              style={styles.fileInput}
              accept=".pdf,.docx,.txt"
            />
            {file && (
              <p style={styles.selectedFile}>Selected: {file.name}</p>
            )}
            <div style={styles.modalButtons}>
              <button 
                onClick={() => {
                  setShowUploadModal(false);
                  setFile(null);
                }}
                style={styles.cancelButton}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                onClick={handleFileUpload}
                style={styles.uploadButton}
                disabled={!file || isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Link Modal */}
      {showLinkModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2>Add Link</h2>
            <form onSubmit={handleLinkSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Link URL:</label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  style={styles.textInput}
                  required
                  placeholder="https://example.com"
                />
              </div>
              <div style={styles.modalButtons}>
                <button 
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  style={styles.cancelButton}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={styles.uploadButton}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Chatbot Modal */}
      {showNewChatbotModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2>Create New Chatbot</h2>
            <form onSubmit={handleCreateChatbot}>
              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Chatbot Name:</label>
                <input
                  type="text"
                  value={newChatbotName}
                  onChange={(e) => setNewChatbotName(e.target.value)}
                  style={styles.textInput}
                  required
                  placeholder="My Awesome Chatbot"
                />
              </div>
              <div style={styles.modalButtons}>
                <button 
                  type="button"
                  onClick={() => setShowNewChatbotModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={styles.uploadButton}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message notification */}
      {message && (
        <div style={{
          ...styles.notification,
          backgroundColor: message.includes('failed') ? '#e74c3c' : '#2ecc71'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

// Updated Styles
const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column'
  },
  userInfo: {
    marginBottom: '30px',
    paddingBottom: '10px',
    borderBottom: '1px solid #34495e'
  },
  userName: {
    color: '#ecf0f1',
    margin: '0 0 5px 0'
  },
  userEmail: {
    color: '#bdc3c7',
    fontSize: '14px',
    margin: 0
  },
  navList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    overflowY: 'auto',
    flexGrow: 1
  },
  navSectionHeader: {
    margin: '20px 0 10px 0',
    padding: '0 8px'
  },
  sectionTitle: {
    color: '#bdc3c7',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  navItem: {
    marginBottom: '8px'
  },
  navLink: {
    color: '#ecf0f1',
    textDecoration: 'none',
    display: 'block',
    padding: '8px',
    borderRadius: '4px',
    transition: 'all 0.3s',
    ':hover': {
      backgroundColor: '#34495e'
    }
  },
  signoutContainer: {
    marginTop: 'auto',
    padding: '20px 0'
  },
  signoutButton: {
    padding: '8px 15px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    ':hover': {
      backgroundColor: '#c0392b'
    }
  },
  mainContent: {
    flex: 1,
    padding: '30px',
    backgroundColor: 'white',
    overflowY: 'auto'
  },
  welcomeHeader: {
    color: '#2c3e50',
    marginBottom: '10px'
  },
  welcomeSubtext: {
    color: '#7f8c8d',
    marginBottom: '30px'
  },
  dashboardContent: {
    marginTop: '20px'
  },
  chatbotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  chatbotCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #eee',
    cursor: 'pointer',
    transition: 'all 0.3s',
    ':hover': {
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      transform: 'translateY(-2px)'
    }
  },
  tabContainer: {
    display: 'flex',
    marginBottom: '20px',
    borderBottom: '1px solid #eee'
  },
  tabButton: {
    padding: '10px 20px',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '4px 4px 0 0',
    marginRight: '5px',
    transition: 'all 0.3s'
  },
  chatbotContent: {
    marginTop: '20px'
  },
  chatList: {
    listStyle: 'none',
    padding: 0
  },
  chatItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    border: '1px solid #eee'
  },
  chatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  chatDate: {
    color: '#7f8c8d',
    fontSize: '0.9em'
  },
  chatActions: {
    display: 'flex',
    gap: '10px'
  },
  knowledgeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  knowledgeList: {
    listStyle: 'none',
    padding: 0
  },
  knowledgeItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    border: '1px solid #eee'
  },
  knowledgeType: {
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  knowledgeDate: {
    color: '#7f8c8d',
    fontSize: '0.9em'
  },
  knowledgeContent: {
    margin: '10px 0',
    color: '#34495e'
  },
  knowledgeFooter: {
    display: 'flex',
    gap: '10px'
  },
  smallButton: {
    padding: '5px 10px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    ':hover': {
      backgroundColor: '#2980b9'
    }
  },
  noActivity: {
    color: '#7f8c8d',
    fontStyle: 'italic'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    width: '450px',
    maxWidth: '90%'
  },
  fileTypesInfo: {
    color: '#7f8c8d',
    fontSize: '0.9em',
    marginBottom: '15px'
  },
  fileInput: {
    margin: '15px 0',
    width: '100%'
  },
  selectedFile: {
    margin: '10px 0',
    padding: '8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px'
  },
  formGroup: {
    margin: '20px 0'
  },
  inputLabel: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500'
  },
  textInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px'
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#7f8c8d'
    }
  },
  uploadButton: {
    padding: '10px 20px',
    backgroundColor: '#2ecc71',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#27ae60'
    }
  },
  notification: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 24px',
    color: 'white',
    borderRadius: '4px',
    zIndex: 1000,
    animation: 'fadeIn 0.3s'
  }
};

export default Home;