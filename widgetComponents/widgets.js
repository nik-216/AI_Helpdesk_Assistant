(function () {
  // Configuration
  const config = {
    apiKey: '4306db0899',
    apiUrl: 'http://localhost:8080/api/widget/chat',
    historyUrl: 'http://localhost:8080/api/widget/history',
    botName: 'Support Bot',
    primaryColor: '#780000', //3a345b 122b1d
    secondaryColor: '#74b9c7', //b9d8e1 90b7bf 669bbc
    accentColor: '#003049', //dec1db 9cc97f
    chatbackground: '#fdf0d5', //d8e7ee e5d7c4
    userText: '#fdf0d5', // cddecb
    botText: '#fdf0d5', // 122b1d,
    textColor: ''
  };

  const messages = [];

  // Get client IP (using a free IP API)
  async function getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Couldn't get IP:", error);
      return 'unknown-ip';
    }
  }

  // === Modified message handling ===
  let clientIP = 'unknown-ip';

  // Initialize widget and get IP
  async function initWidget() {
    clientIP = await getClientIP();
    loadChatHistory();
  }

  // Load previous chat history
  async function loadChatHistory() {
    try {
      const response = await fetch(config.historyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({ 
          ip: clientIP 
        }),
      });
      
      if (response.ok) {
        const history = await response.json();
        if (history.messages && history.messages.length > 0) {
          // Add a system message about continuing conversation
          messages.push(...history.messages);
          
          // Display previous messages
          history.messages.forEach(msg => {
            addMessage(msg.content, msg.role === 'user' ? 'user' : 'bot');
          });
        } else {
          // Initial greeting for new users
          setTimeout(() => {
            addMessage("Hello! I'm your support assistant. How can I help you today?", 'bot');
          }, 1000);
        }
      }
    } catch (err) {
      console.error("Error loading history:", err);
      // Fallback greeting if history fails
      setTimeout(() => {
        addMessage("Hello! How can I help you today?", 'bot');
      }, 1000);
    }
  }

  // === Create SVG Icon ===
  function createIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "currentColor");
    svg.style.width = "24px";
    svg.style.height = "24px";
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z");
    path.setAttribute("fill-rule", "evenodd");
    path.setAttribute("clip-rule", "evenodd");
    
    svg.appendChild(path);
    return svg;
  }

  // === Floating Button ===
  const button = document.createElement('button');
  button.innerHTML = `
    <span style="display: flex; align-items: center; gap: 8px;">
      ${createIcon().outerHTML}
      <span>Chat with us</span>
    </span>
  `;
  Object.assign(button.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 20px',
    backgroundColor: config.primaryColor,
    color: config.chatbackground,
    border: 'none',
    borderRadius: '999px',
    cursor: 'pointer',
    zIndex: '9999',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  });

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
  });

  // === Chat Popup ===
  const popup = document.createElement('div');
  Object.assign(popup.style, {
    position: 'fixed',
    bottom: '80px',
    right: '20px',
    width: '350px',
    height: '500px',
    backgroundColor: config.chatbackground,
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    display: 'none',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: '9998',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    opacity: '0',
    transform: 'translateY(10px)',
    transition: 'all 0.3s ease',
  });

  // === Chat Header ===
  const chatHeader = document.createElement('div');
  chatHeader.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="width: 32px; height: 32px; background-color: ${config.primaryColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
        ${createIcon().outerHTML}
      </div>
      <span>${config.botName}</span>
    </div>
    <button id="close-chat" style="background: none; border: none; cursor: pointer; color: ${config.textColor};">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `;
  Object.assign(chatHeader.style, {
    padding: '16px',
    backgroundColor: config.secondaryColor,
    color: '#111827',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #e5e7eb'
  });
  popup.appendChild(chatHeader);

  // Close button functionality
  const closeButton = chatHeader.querySelector('#close-chat');
  closeButton.addEventListener('click', () => {
    popup.style.display = 'none';
  });

  // === Chat Messages Container ===
  const chatBody = document.createElement('div');
  Object.assign(chatBody.style, {
    flex: '1',
    padding: '16px',
    overflowY: 'auto',
    fontSize: '14px',
    backgroundColor: config.chatbackground,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  });
  popup.appendChild(chatBody);

  // === Chat Input Area ===
  const inputArea = document.createElement('div');
  Object.assign(inputArea.style, {
    padding: '12px 16px',
    backgroundColor: config.secondaryColor,
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '8px',
  });

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Type your message...';
  Object.assign(input.style, {
    flex: '1',
    padding: '10px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  });

  input.addEventListener('focus', () => {
    input.style.borderColor = config.primaryColor;
  });

  input.addEventListener('blur', () => {
    input.style.borderColor = '#e5e7eb';
  });

  const sendBtn = document.createElement('button');
  sendBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  Object.assign(sendBtn.style, {
    width: '40px',
    height: '40px',
    backgroundColor: config.primaryColor,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  });

  sendBtn.addEventListener('mouseenter', () => {
    sendBtn.style.backgroundColor = '#4b1535'; // Darker shade#3b008e
  });

  sendBtn.addEventListener('mouseleave', () => {
    sendBtn.style.backgroundColor = config.primaryColor;
  });

  inputArea.appendChild(input);
  inputArea.appendChild(sendBtn);
  popup.appendChild(inputArea);

  // === Toggle popup visibility with animation ===
  button.onclick = () => {
    if (popup.style.display === 'none' || !popup.style.display) {
      popup.style.display = 'flex';
      setTimeout(() => {
        popup.style.opacity = '1';
        popup.style.transform = 'translateY(0)';
      }, 10);
      input.focus();
    } else {
      popup.style.opacity = '0';
      popup.style.transform = 'translateY(10px)';
      setTimeout(() => {
        popup.style.display = 'none';
      }, 300);
    }
  };

  // === Add messages to chat ===
  function addMessage(text, sender = 'user') {
    const messageContainer = document.createElement('div');
    messageContainer.style.display = 'flex';
    messageContainer.style.flexDirection = sender === 'user' ? 'row-reverse' : 'row';
    messageContainer.style.gap = '8px';
    messageContainer.style.maxWidth = '100%';

    const avatar = document.createElement('div');
    avatar.style.width = '32px';
    avatar.style.height = '32px';
    avatar.style.borderRadius = '50%';
    avatar.style.backgroundColor = sender === 'user' ? config.primaryColor : config.accentColor;
    avatar.style.color = '#fff';
    avatar.style.display = 'flex';
    avatar.style.alignItems = 'center';
    avatar.style.justifyContent = 'center';
    avatar.style.flexShrink = '0';
    avatar.innerHTML = sender === 'user' ? 
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" fill="currentColor"/></svg>' :
      createIcon().outerHTML;

    const messageContent = document.createElement('div');
    messageContent.style.maxWidth = 'calc(100% - 40px)';

    const name = document.createElement('div');
    name.textContent = sender === 'user' ? 'You' : config.botName;
    name.style.fontWeight = '600';
    name.style.fontSize = '12px';
    name.style.color = config.textColor; // #6b7280
    name.style.marginBottom = '4px';

    const messageBubble = document.createElement('div');
    messageBubble.textContent = text;
    messageBubble.style.padding = '10px 14px';
    messageBubble.style.borderRadius = sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0';
    messageBubble.style.backgroundColor = sender === 'user' ? config.primaryColor : config.accentColor;
    messageBubble.style.color = sender === 'user' ? config.userText : config.botText;
    messageBubble.style.wordBreak = 'break-word';
    messageBubble.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';

    messageContent.appendChild(name);
    messageContent.appendChild(messageBubble);
    messageContainer.appendChild(avatar);
    messageContainer.appendChild(messageContent);

    chatBody.appendChild(messageContainer);
    chatBody.scrollTop = chatBody.scrollHeight;

  }

  // === Typing indicator ===
  function showTypingIndicator() {
    const typingContainer = document.createElement('div');
    typingContainer.style.display = 'flex';
    typingContainer.style.gap = '8px';
    typingContainer.style.alignItems = 'center';
    typingContainer.id = 'typing-indicator';

    const avatar = document.createElement('div');
    avatar.style.width = '32px';
    avatar.style.height = '32px';
    avatar.style.borderRadius = '50%';
    avatar.style.backgroundColor = config.accentColor;
    avatar.style.color = '#fff';
    avatar.style.display = 'flex';
    avatar.style.alignItems = 'center';
    avatar.style.justifyContent = 'center';
    avatar.style.flexShrink = '0';
    avatar.innerHTML = createIcon().outerHTML;

    const typingBubble = document.createElement('div');
    typingBubble.style.padding = '8px 12px';
    typingBubble.style.borderRadius = '12px 12px 12px 0';
    typingBubble.style.backgroundColor = config.accentColor;
    typingBubble.style.display = 'flex';
    typingBubble.style.gap = '4px';

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.style.width = '8px';
      dot.style.height = '8px';
      dot.style.borderRadius = '50%';
      dot.style.backgroundColor = '#6b7280';
      dot.style.animation = `typing 1.4s infinite ${i * 0.2}s`;
      typingBubble.appendChild(dot);
    }

    typingContainer.appendChild(avatar);
    typingContainer.appendChild(typingBubble);
    chatBody.appendChild(typingContainer);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes typing {
        0% { transform: translateY(0); }
        25% { transform: translateY(-3px); }
        50% { transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // === Handle sending ===
  function handleSend() {
    const text = input.value.trim();
    if (!text) return;
    
    addMessage(text, 'user');
    messages.push({ role: 'user', content: text });

    input.value = '';
    input.focus();

    showTypingIndicator();

    // Call backend API
    fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({ 
        messages: messages,
        ip: clientIP,
        timestamp: new Date().toISOString()
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        hideTypingIndicator();
        addMessage(data.reply || 'Hi! How can I help you today?', 'bot');
        messages.push({ role: 'assistant', content: data.reply });
      })
      .catch((err) => {
        hideTypingIndicator();
        console.error("Error:", err);
        addMessage("Sorry, something went wrong. Please try again later.", 'bot');
      });
  }

  sendBtn.onclick = handleSend;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  // === Attach to page ===
  document.body.appendChild(button);
  document.body.appendChild(popup);

  // Add Inter font if not already present
  if (!document.querySelector('link[href*="inter"]')) {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
  }

  if (document.readyState === 'complete') {
    initWidget();
  } else {
    window.addEventListener('DOMContentLoaded', initWidget);
  }
})();