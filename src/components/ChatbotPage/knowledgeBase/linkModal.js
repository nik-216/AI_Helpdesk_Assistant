const LinkModal = ({ show, onClose, link, setLink, handleLinkSubmit, isProcessing }) => {
    if (!show) return null;

    return (
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
                            onClick={onClose}
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
    );
};

export default LinkModal;