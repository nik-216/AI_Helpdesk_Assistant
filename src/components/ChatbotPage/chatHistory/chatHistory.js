import ChatModal from './chatModal';

const ChatHistory = ({ chats, selectedChat, setSelectedChat }) => {
    return (
        <div className="chats-section">
            <h2>Chat History</h2>
            <div className="chats-list">
                {chats.length > 0 ? (
                    chats.map(chat => (
                        <div 
                            key={chat.chat_id} 
                            className="chat-item"
                            onClick={() => setSelectedChat(chat)}
                        >
                            <div className="chat-content">
                                <div className="chat-header">
                                    <h4>Chat #{chat.chat_id}</h4>
                                    <span className="chat-date">
                                        {new Date(chat.created_at).toLocaleString()}
                                    </span>
                                </div>
                                {chat.history?.length > 0 && (
                                    <div className="message-preview">
                                        <p className="preview-text">
                                            {chat.history[0].content.substring(0, 80)}...
                                        </p>
                                        <span className="preview-info">
                                            {chat.history.length} messages
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-chats">No chats available for this chatbot.</p>
                )}
            </div>

            {selectedChat && (
                <ChatModal 
                    selectedChat={selectedChat} 
                    setSelectedChat={setSelectedChat} 
                />
            )}
        </div>
    );
};

export default ChatHistory;