import { useState } from 'react';
import axios from 'axios';

const SettingsPanel = ({ settings, setSettings, selectedChatbot, setMessage }) => {
    const [isEditing, setIsEditing] = useState(false);

    const handleSettingsChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const saveSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:8080/api/chatbots/${selectedChatbot.chat_bot_id}/settings/change`,
                settings,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            setMessage('Settings saved successfully!');
            setIsEditing(false);
        } catch (error) {
            setMessage(error.response?.data?.error || 'Failed to save settings');
        }
    };

    return (
        <div>
            <div className="settings-section">
                <h3>API Key</h3>
                <div className="api-key-display" onClick={() => {
                        navigator.clipboard.writeText(settings.api_key); 
                        setMessage("Copied");
                    }}>
                    <span className="api-key-text">
                        {settings.api_key 
                        ? settings.api_key 
                        : 'No API key configured'}
                    </span>
                    <img className='copy-icon' src="/icons/copy.png" alt="copy" height="20" /> 
                </div>
            </div>
            
            <div className="settings-section">
                <h2>Chatbot Settings</h2>
                
                <div className="settings-form">
                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                name="persistent"
                                checked={settings.persistent}
                                onChange={handleSettingsChange}
                                disabled={!isEditing}
                            />
                            Persistent Chat (maintains conversation history)
                        </label>
                    </div>

                    <div className="form-group">
                        <label>LLM Model:</label>
                        <select
                            name="llm_model"
                            value={settings.llm_model}
                            onChange={handleSettingsChange}
                            disabled={!isEditing}
                        >
                            <option value="deepseek-chat">DeepSeek Chat</option>
                            <option value="gpt-4o">OpenAI (GPT-4o)</option>
                            <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                            <option value="gemini-2.0-flash">Google Gemini 2.0 Flash</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Specifications:</label>
                        <input
                            type="text"
                            name="specifications"
                            value={settings.specifications}
                            onChange={handleSettingsChange}
                            disabled={!isEditing}
                            placeholder="Enter specifications"
                            className="text-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Rejection Message:</label>
                        <input
                            type="text"
                            name="rejectionmsg"
                            value={settings.rejectionmsg}
                            onChange={handleSettingsChange}
                            disabled={!isEditing}
                            placeholder="Enter rejection message"
                            className="text-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Temperature:</label>
                        <input
                            type="number"
                            name="temperature"
                            value={settings.temperature}
                            onChange={handleSettingsChange}
                            disabled={!isEditing}
                            step="0.1"
                            min="0"
                            max="1"
                            className="text-input"
                        />
                    </div>

                    <div className="settings-actions">
                        {isEditing ? (
                            <>
                                <button 
                                    type="button" 
                                    className="cancel-button"
                                    onClick={() => setIsEditing(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="save-button"
                                    onClick={saveSettings}
                                >
                                    Save Settings
                                </button>
                            </>
                        ) : (
                            <button 
                                type="button" 
                                className="edit-button"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Settings
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;