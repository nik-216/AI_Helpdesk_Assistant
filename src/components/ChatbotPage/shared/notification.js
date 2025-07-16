import { useEffect, useState } from 'react';

const Notification = ({ message, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);
    const isError = message.includes('Failed') || message.includes('Error');
    
    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => onDismiss(), 300);
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [message, onDismiss]);

    if (!message || !isVisible) return null;

    return (
        <div className="notification" style={{
            backgroundColor: isError ? '#e74c3c' : '#2ecc71',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
        }}>
            {message}
        </div>
    );
};

export default Notification;