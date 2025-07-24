import { Link } from 'react-router-dom';
import { useEffect, useContext } from 'react';
import './sidebar.css';
import ChatbotContext from '../chatbotPage/chatbotContext';

import logoutIcon from '../../assets/icons/logout.png';

const Sidebar = ({ user, signout, activeTab, setActiveTab, selectedChatbot, setSelectedChatbot }) => {

    // const [chatBots, setChatBots] = useState([]);
    const { chatBots, fetchChatBots } = useContext(ChatbotContext);

    // Handle chatbot selection
    const handleChatbotSelect = (chatbot) => {
        setSelectedChatbot(chatbot);
        setActiveTab('chatbot');
    };

    useEffect(() => {
        fetchChatBots();
        const intervalId = setInterval(fetchChatBots, 10000);
        return () => clearInterval(intervalId);
    }, [fetchChatBots]);

    return (
    <div className="sidebar">
        <div className="user-info">
        <h2 className="user-name">{user?.name}</h2>
        <p className="user-email">{user?.email}</p>
        </div>

        <nav>
        <ul className="nav-list">
            <li className="nav-item">
            <Link 
                to="#" 
                onClick={() => {
                setActiveTab('dashboard');
                setSelectedChatbot(null);
                }}
                className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
                Dashboard
            </Link>
            </li>

            <hr></hr>

            <li className='navSectionHeader'>
                <span className='sectionTitle'>Your Chatbots</span>
            </li>

            <div className="chatbots-container">
                {chatBots.map(chatbot => (
                    <li key={chatbot.chat_bot_id} className='nav-item'>
                        <Link 
                            to="#" 
                            onClick={() => {
                                setActiveTab('chatbot');
                                handleChatbotSelect(chatbot);
                            }}
                            className={`nav-link ${activeTab === 'chatbot' && selectedChatbot?.chat_bot_id === chatbot.chat_bot_id ? 'active' : ''}`}
                        >
                            {chatbot.name || `Chatbot ${chatbot.chat_bot_id}`}
                        </Link>
                    </li>
                ))}
            </div>

            <hr></hr>
            
        </ul>
        </nav>

        <div className="signout-container">
        <button onClick={signout} className="signout-button">
            Sign Out
            <img className='logout-icon' src={logoutIcon} alt="" height="20" />
        </button>
        </div>
    </div>
    );
};

export default Sidebar;