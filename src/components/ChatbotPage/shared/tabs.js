const Tabs = ({ activeTab, setActiveTab }) => {
    return (
        <div className="tab-container">
            <button
                className={`tab-button ${activeTab === 'chatbot-chats' ? 'active' : ''}`}
                onClick={() => setActiveTab('chatbot-chats')}
            >
                Chats
            </button>
            <button
                className={`tab-button ${activeTab === 'chatbot-knowledge' ? 'active' : ''}`}
                onClick={() => setActiveTab('chatbot-knowledge')}
            >
                Knowledge Base
            </button>
            <button
                className={`tab-button ${activeTab === 'chatbot-settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('chatbot-settings')}
            >
                Settings
            </button>
        </div>
    );
};

export default Tabs;