const UploadModal = ({ show, onClose, file, setFile, handleFileChange, handleFileUpload, isProcessing }) => {
    if (!show) return null;

    return (
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
                            onClose();
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
    );
};

export default UploadModal;