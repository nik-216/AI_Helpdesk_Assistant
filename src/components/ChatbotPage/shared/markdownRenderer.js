const MarkdownRenderer = ({ content }) => {
    const renderMarkdown = (text) => {
        if (!text) return '';
        
        // Handle bold (**text**)
        let result = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Handle numbered lists (1., 2., etc.)
        result = result.replace(/^\d+\.\s+(.*$)/gm, '<li>$1</li>');
        // Handle line breaks
        result = result.replace(/\n/g, '<br>');
        // Handle headers
        result = result.replace(/^\*\*(.*)\*\*$/gm, '<h4>$1</h4>');
        return result;
    };

    return (
        <div 
            className="message-text"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
    );
};

export default MarkdownRenderer;