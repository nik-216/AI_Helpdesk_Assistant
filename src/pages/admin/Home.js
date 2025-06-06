import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useEffect } from 'react';

const Home = () => {
  const { user, signout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  const validFileTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check both extension and MIME type
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    const isValidType = validFileTypes.includes(selectedFile.type) || 
                      ['.pdf', '.docx', '.txt'].includes(`.${extension}`);

    if (!isValidType) {
      setMessage(`Unsupported file type. Please upload PDF, DOCX, or TXT files.`);
      e.target.value = ''; // Clear the file input
      return;
    }

    setFile(selectedFile);
    setMessage('');
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setIsProcessing(true);
    setMessage('Processing document...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('http://localhost:8080/api/upload/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setMessage(`Document processed successfully! ${response.data.chunks} chunks created.`);
      setRecentActivity(prev => [
        { type: 'file', name: file.name, date: new Date(), chunks: response.data.chunks },
        ...prev.slice(0, 4)
      ]);
      setShowUploadModal(false);
      setFile(null);
    } catch (error) {
      setMessage(error.response?.data?.error || 'File upload failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!link) return;
    
    setIsProcessing(true);
    setMessage('Processing link...');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8080/api/upload/url', 
        { url: link },
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
    } catch (error) {
      setMessage(error.response?.data?.error || 'URL processing failed');
      console.error('Error details:', error.response?.data);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Current JWT Token:', token);
    
    // Optional: Decode and print the token payload
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Decoded Token Payload:', payload);
      } catch (e) {
        console.log('Could not decode token:', e);
      }
    }
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
                onClick={() => setActiveTab('dashboard')}
                style={{
                  ...styles.navLink,
                  color: activeTab === 'dashboard' ? '#3498db' : '#ecf0f1',
                  backgroundColor: activeTab === 'dashboard' ? '#34495e' : 'transparent',
                }}
              >
                Dashboard
              </Link>
            </li>
            <li style={styles.navItem}>
              <Link 
                to="#" 
                onClick={() => setShowUploadModal(true)}
                style={styles.navLink}
              >
                Upload Document
              </Link>
            </li>
            <li style={styles.navItem}>
              <Link 
                to="#" 
                onClick={() => setShowLinkModal(true)}
                style={styles.navLink}
              >
                Add Link
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
        <h1 style={styles.welcomeHeader}>Welcome, {user?.name}</h1>
        <p style={styles.welcomeSubtext}>What would you like to do today?</p>

        {activeTab === 'dashboard' && (
          <div style={styles.dashboardContent}>
            <h2>Recent Activity</h2>
            {recentActivity.length > 0 ? (
              <ul style={styles.activityList}>
                {recentActivity.map((activity, index) => (
                  <li key={index} style={styles.activityItem}>
                    <div style={styles.activityHeader}>
                      <span style={styles.activityType}>
                        {activity.type === 'file' ? '📄 Document' : '🔗 Link'}
                      </span>
                      <span style={styles.activityDate}>
                        {formatDate(activity.date)}
                      </span>
                    </div>
                    <div style={styles.activityContent}>
                      {activity.type === 'file' ? activity.name : activity.url}
                    </div>
                    <div style={styles.activityFooter}>
                      {activity.chunks} chunks processed
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={styles.noActivity}>No recent activity</p>
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

// Styles
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
    margin: 0
  },
  navItem: {
    marginBottom: '15px'
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
    backgroundColor: 'white'
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
  activityList: {
    listStyle: 'none',
    padding: 0
  },
  activityItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    border: '1px solid #eee'
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  activityType: {
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  activityDate: {
    color: '#7f8c8d',
    fontSize: '0.9em'
  },
  activityContent: {
    marginBottom: '10px',
    color: '#34495e'
  },
  activityFooter: {
    fontSize: '0.8em',
    color: '#7f8c8d'
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