import { useState, useCallback } from 'react';
import axios from 'axios';

import UploadModal from './uploadModal';
import LinkModal from './linkModal';

const KnowledgeBase = ({ selectedChatbot, knowledgeItems, setKnowledgeItems, setMessage }) => {
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [file, setFile] = useState(null);
    const [link, setLink] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const validFileTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];

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
    }, [selectedChatbot, setKnowledgeItems]);

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
            const token = localStorage.getItem('token');
            const response = await axios.post(`http://localhost:8080/api/upload/file`, 
                {
                    file: file,
                    chatbotId: selectedChatbot.chat_bot_id
                }, 
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
            });
            
            setMessage(`Document processed successfully! ${response.data.chunks} chunks created.`);
            setShowUploadModal(false);
            setFile(null);
            fetchKnowledgeItems();
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
                `http://localhost:8080/api/upload/url`, 
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
            fetchKnowledgeItems();
        } catch (error) {
            setMessage(error.response?.data?.error || 'URL processing failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const deleteKnowledgeItem = async (fileId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `http://localhost:8080/api/chatbots/${selectedChatbot.chat_bot_id}/knowledge/delete`,
                {
                    data: {
                        file_id: fileId
                    },
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            setMessage('Knowledge item deleted successfully!');
            fetchKnowledgeItems();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Failed to delete knowledge item');
        }
    };

    return (
        <div className="knowledge-section">
            <div className="section-header">
                <h2>Add To Knowledge Base</h2>
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
            <div className="knowledge-section">
                <hr></hr>
                <h2>Items Present In Knowledge Base</h2>
                <div className="knowledge-list">
                    {knowledgeItems.length > 0 ? (
                        knowledgeItems.map(item => (
                            <div key={item.file_id} className="knowledge-item">
                                <div className="item-content">
                                    <h4>{item.source}</h4>
                                </div>
                                <button
                                    className="delete-button"
                                    onClick={() => deleteKnowledgeItem(item.file_id)}
                                >
                                    Delete
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="no-knowledge-items">You don't have any knowledge items yet.</p>
                    )}
                </div>
            </div>

            <UploadModal 
                show={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                file={file}
                setFile={setFile}
                handleFileChange={handleFileChange}
                handleFileUpload={handleFileUpload}
                isProcessing={isProcessing}
            />

            <LinkModal 
                show={showLinkModal}
                onClose={() => setShowLinkModal(false)}
                link={link}
                setLink={setLink}
                handleLinkSubmit={handleLinkSubmit}
                isProcessing={isProcessing}
            />
        </div>
    );
};

export default KnowledgeBase;