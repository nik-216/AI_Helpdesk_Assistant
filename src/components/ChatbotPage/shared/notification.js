const Notification = ({ message }) => {
    const isError = message.includes('failed');
    
    return (
        <div className="notification" style={{
            backgroundColor: isError ? '#e74c3c' : '#2ecc71'
        }}>
            {message}
        </div>
    );
};

export default Notification;