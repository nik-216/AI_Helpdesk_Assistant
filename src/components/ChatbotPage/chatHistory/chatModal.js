import MessageRenderer from './messageRenderer';

const ChatModal = ({ selectedChat, setSelectedChat }) => {
    return (
        <div className="chat-modal-overlay" onClick={() => setSelectedChat(null)}>
            <div className="chat-modal-content" onClick={e => e.stopPropagation()}>
                <div className="chat-modal-header">
                    <h3>Chat #{selectedChat.chat_id}</h3>
                    <button 
                        className="close-modal"
                        onClick={() => setSelectedChat(null)}
                    >
                        &times;
                    </button>
                </div>
                <div className="chat-meta">
                    <span>Started: {new Date(selectedChat.created_at).toLocaleString()}</span>
                    {selectedChat.ip_address && (
                        <span>IP: {selectedChat.ip_address}</span>
                    )}
                </div>
                <div className="chat-history">
                    {selectedChat.history?.length > 0 ? (
                        selectedChat.history.map((message, index) => (
                            <MessageRenderer 
                                key={index} 
                                message={message} 
                            />
                        ))
                    ) : (
                        <p className="no-messages">No messages in this conversation</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatModal;