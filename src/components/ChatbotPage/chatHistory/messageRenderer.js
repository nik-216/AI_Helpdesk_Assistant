import MarkdownRenderer from '../shared/markdownRenderer';

const MessageRenderer = ({ message }) => {
    return (
        <div className={`message ${message.role}`}>
            <div className="message-header">
                <span className="message-role">
                    {message.role === 'user' ? 'User' : 'Assistant'}
                </span>
                <span className="message-time">
                    {new Date(message.created_at).toLocaleTimeString()}
                </span>
            </div>
            <MarkdownRenderer content={message.content} />
        </div>
    );
};

export default MessageRenderer;