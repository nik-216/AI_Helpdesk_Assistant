import React, { useState } from 'react';
import axios from 'axios';
import './ChatbotPage.css';

const ChatbotPage = ({ selectedChatbot, setActiveTab }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const validFileTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const extension = selectedFile.name.split('.').pop().toLowerCase();
    const isValidType = validFileTypes.includes(selectedFile.type) || 
                      ['.pdf', '.docx', '.txt'].includes(`.${extension}`);

    if (!isValidType) {
      setMessage(`Unsupported file type. Please upload PDF, DOCX, or TXT files.`);
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
    setMessage('');
  };

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
      // You might want to refresh knowledge items here
    } catch (error) {
      setMessage(error.response?.data?.error || 'File upload failed');
    } finally {
      setIsProcessing(false);
    }
  };

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
      // You might want to refresh knowledge items here
    } catch (error) {
      setMessage(error.response?.data?.error || 'URL processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="chatbot-page">
      <h1 className="chatbot-title">
        {selectedChatbot.name || `Chatbot ${selectedChatbot.chat_bot_id}`}
      </h1>
      
      <div className="tab-container">
        <button
          className="tab-button"
          onClick={() => setActiveTab('chatbot-chats')}
        >
          Chats
        </button>
        <button
          className="tab-button active"
          onClick={() => setActiveTab('chatbot-knowledge')}
        >
          Knowledge Base
        </button>
      </div>

      <div className="knowledge-section">
        <div className="section-header">
          <h2>Knowledge Base</h2>
          <div className="action-buttons">
            <button 
              className="primary-button"
              onClick={() => setShowUploadModal(true)}
            >
              Upload Document
            </button>
            <button 
              className="primary-button"
              onClick={() => setShowLinkModal(true)}
            >
              Add Link
            </button>
          </div>
        </div>
        
        {/* Knowledge items list would go here */}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Upload Document</h2>
            <p className="file-types">Supported formats: PDF, DOCX, TXT</p>
            <input 
              type="file" 
              onChange={handleFileChange}
              className="file-input"
              accept=".pdf,.docx,.txt"
            />
            {file && (
              <p className="selected-file">Selected: {file.name}</p>
            )}
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowUploadModal(false);
                  setFile(null);
                }}
                className="cancel-button"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                onClick={handleFileUpload}
                className="upload-button"
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
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add Link</h2>
            <form onSubmit={handleLinkSubmit}>
              <div className="form-group">
                <label className="input-label">Link URL:</label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="text-input"
                  required
                  placeholder="https://example.com"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="cancel-button"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="upload-button"
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
        <div className="notification" style={{
          backgroundColor: message.includes('failed') ? '#e74c3c' : '#2ecc71'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ChatbotPage;