import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ user, signout, activeTab, setActiveTab, setSelectedChatbot }) => {
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
          
          {/* Other sidebar items would go here */}
        </ul>
      </nav>

      <div className="signout-container">
        <button onClick={signout} className="signout-button">
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;