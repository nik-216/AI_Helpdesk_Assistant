import React, { useState } from 'react';
import './UploadFile.css';

const UploadModal = ({ onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setIsProcessing(true);
    try {
      await onUpload(file);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Upload Document</h2>
        <p className="file-types">Supported formats: PDF, DOCX, TXT</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="file"
              onChange={handleFileChange}
              className="file-input"
              accept=".pdf,.docx,.txt"
              required
            />
          </div>
          
          {file && (
            <p className="selected-file">Selected: {file.name}</p>
          )}
          
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="upload-button"
              disabled={!file || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;