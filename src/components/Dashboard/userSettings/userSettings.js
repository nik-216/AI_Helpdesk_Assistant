import React, { useState } from 'react';
import axios from 'axios';
import './userSettings.css';

const UserSettings = ({ onClose, signout }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            setMessage("Failed: New passwords don't match");
            return;
        }

        if (currentPassword === '' || newPassword === '' || confirmPassword === '') {
            setMessage('Failed: Please fill in all fields');
            return;
        }

        if (currentPassword === newPassword) {
            setMessage('Failed: New password cannot be the same as current password');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                'http://localhost:8080/api/user/changePassword',
                { currentPassword, newPassword },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            setMessage('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            await delay(1000);
            onClose();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Failed to change password');
        }
    };

    const deleteUserAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(
                    'http://localhost:8080/api/user/deleteAccount',
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );
                setMessage('Account deleted successfully!');
                await delay(2000);
                signout();
            } catch (error) {
                setMessage(error.response?.data?.error || 'Failed to delete account');
            }
        }
    };

    return (
        <div className='modal-overlay'>
            <div className='modal-content'>
                <h2>User Settings</h2>
                <form onSubmit={handlePasswordChange}>
                    <div className='form-group'>
                        <label className='input-label'>Current Password:</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className='text-input'
                            required
                        />
                    </div>
                    <div className='form-group'>
                        <label className='input-label'>New Password:</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className='text-input'
                            required
                        />
                    </div>
                    <div className='form-group'>
                        <label className='input-label'>Confirm New Password:</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className='text-input'
                            required
                        />
                    </div>
                    {message && (
                        <div className='message' style={{
                            color: message.includes('Failed') ? '#e74c3c' : '#2ecc71'
                        }}>
                            {message}
                        </div>
                    )}
                    <div className='modal-buttons'>
                       <div className='delete-account-container'>
                            <button 
                                type="button"
                                onClick={deleteUserAccount}
                                className='delete-account-button'
                                aria-label="Delete account"
                            >
                                <img className='delete-account-icon' src="/icons/userTrash.png" alt="" height="20" />
                                <span className='delete-account-tooltip'>Delete Account</span>
                            </button>
                        </div>
                        <div className='right-buttons'>
                            <button 
                                type="button"
                                onClick={onClose}
                                className='cancel-button'
                            >
                                Close
                            </button>
                            <button 
                                type="submit"
                                className='upload-button'
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserSettings;