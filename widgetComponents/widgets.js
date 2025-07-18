(function () {

  const widgetContainer = document.getElementById('chat-widget') || document.body;
  const apiKey = widgetContainer.dataset.apiKey;

  // Configurations
  const config = {
    apiKey: apiKey,
    rootUrl: 'http://localhost:8080/api/widget',
    botName: 'Support Bot',
    primaryColor: '#780000', //3a345b 122b1d
    secondaryColor: '#74b9c7', //b9d8e1 90b7bf 669bbc
    accentColor: '#003049', //dec1db 9cc97f
    chatbackground: '#fdf0d5', //d8e7ee e5d7c4
    userText: '#fdf0d5', // cddecb
    botText: '#fdf0d5', // 122b1d,
    textColor: ''
  };

  config.apiUrl = config.rootUrl + '/chat'
  config.historyUrl = config.rootUrl +  '/history'
  config.clearChatUrl = config.rootUrl + '/clearChat'

  const messages = [];
  let recognition; 
  let isListening = false;

  const style = document.createElement('style');
  style.textContent = `
      .related-question:hover {
          background: rgba(255, 255, 255, 0.1);
      }
      .related-question {
          transition: background 0.2s ease;
      }
  `;
  document.head.appendChild(style);

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

  let clientIP = 'unknown-ip';

  // Initialize widget and get IP
  async function initWidget() {
    clientIP = await getClientIP();
    loadChatHistory();
  }

  // Load chat history
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
            const messageContent = {
              text: msg.content,
              relatedQuestions: msg.related_questions || []
            };
            addMessage(messageContent, msg.role === 'user' ? 'user' : 'bot');
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
    <div style="display: flex; gap: 8px;">
      <button id="clear-chat" style="background: none; border: none; cursor: pointer; color: ${config.textColor};">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button id="close-chat" style="background: none; border: none; cursor: pointer; color: ${config.textColor};">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
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

  // Clear chat button functionality
  const clearButton = chatHeader.querySelector('#clear-chat');
  clearButton.addEventListener('click', () => {

  const confirmClear = confirm("Are you sure you want to clear the chat history?");
  if (confirmClear) {
      chatBody.innerHTML = '';
      messages.length = 0;
      
      fetch(config.clearChatUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({ ip: clientIP }),
      }).catch(err => console.error("Error clearing history:", err));
      
      setTimeout(() => {
        addMessage("Hello! I'm your support assistant. How can I help you today?", 'bot');
      }, 300);
  }
});

  // Add hover effects to clear button
  clearButton.addEventListener('mouseenter', () => {
    clearButton.style.color = '#ef4444'; // Red color on hover
  });

  clearButton.addEventListener('mouseleave', () => {
    clearButton.style.color = config.textColor || '#6b7280';
  });

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

  // Create audio button
  const audioBtn = document.createElement('button');
  audioBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" fill="currentColor"/>
      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  Object.assign(audioBtn.style, {
    width: '40px',
    height: '40px',
    backgroundColor: config.accentColor,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  });

  audioBtn.addEventListener('mouseenter', () => {
    audioBtn.style.backgroundColor = '#002233'; // Darker shade
  });

  audioBtn.addEventListener('mouseleave', () => {
    audioBtn.style.backgroundColor = isListening ? '#ff0000' : config.accentColor;
  });

  // Enhanced speech recognition initialization
  function initSpeechRecognition() {
    try {
      // Check for API support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn('Speech recognition not supported');
        audioBtn.style.display = 'none';
        return false;
      }

      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      let networkTimeout;

      recognition.onstart = () => {
        isListening = true;
        audioBtn.style.backgroundColor = '#ff0000';
        audioBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="5" width="12" height="14" rx="6" fill="currentColor"/>
          </svg>
        `;
        addMessage("Listening... Speak now", 'bot');
        
        // Set network timeout
        networkTimeout = setTimeout(() => {
          if (isListening) {
            recognition.stop();
            handleNetworkError();
          }
        }, 5000);
      };

      recognition.onresult = (event) => {
        clearTimeout(networkTimeout);
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          input.value = transcript;
          handleSend();
        }
      };

      recognition.onerror = (event) => {
        clearTimeout(networkTimeout);
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'network') {
          handleNetworkError();
        } else {
          handleRecognitionError(event.error);
        }
        
        stopListening();
      };

      recognition.onend = () => {
        clearTimeout(networkTimeout);
        if (isListening) {
          stopListening();
        }
      };

      return true;
    } catch (err) {
      console.error('Speech recognition initialization failed:', err);
      disableVoiceInput();
      return false;
    }
  }

  function handleNetworkError() {
    addMessage({
      text: "Network connection required for voice input",
      details: [
        "• Please check your internet connection",
        "• Try again when you have better network",
        "• You can still type your message below"
      ],
      type: 'warning'
    }, 'bot');
    
    // Show network status indicator
    showNetworkStatus(false);
  }

  function handleRecognitionError(errorCode) {
    const errors = {
      'not-allowed': "Microphone access was denied. Please allow microphone permissions in your browser settings.",
      'no-speech': "No speech was detected. Please try speaking louder or closer to your microphone.",
      'audio-capture': "Couldn't capture audio. Please check your microphone connection.",
      'service-not-allowed': "Speech recognition service is not available.",
      'language-not-supported': "English language is required for voice input."
    };
    
    addMessage({
      text: "Voice input error",
      details: [errors[errorCode] || "Voice input is currently unavailable. Please try typing instead."],
      type: 'error'
    }, 'bot');
  }

  function showNetworkStatus(online) {
    const existingStatus = document.getElementById('network-status-indicator');
    if (existingStatus) existingStatus.remove();
    
    if (!online) {
      const statusIndicator = document.createElement('div');
      statusIndicator.id = 'network-status-indicator';
      statusIndicator.innerHTML = `
        <div style="
          background: #fff3cd;
          color: #856404;
          padding: 8px 12px;
          border-radius: 4px;
          margin: 8px 16px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="#856404" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Voice input requires internet connection</span>
        </div>
      `;
      chatBody.appendChild(statusIndicator);
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }


  function startListening() {
    if (!recognition) {
      if (!initSpeechRecognition()) {
        addMessage("Voice input is not supported in your browser", 'bot');
        return;
      }
    }
    
    try {
      recognition.start();
    } catch (err) {
      console.error('Speech recognition start failed:', err);
      addMessage("Couldn't start voice input. Please try again.", 'bot');
      stopListening();
    }
  }

  function stopListening() {
    isListening = false;
    audioBtn.style.backgroundColor = config.accentColor;
    audioBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" fill="currentColor"/>
        <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  // Audio button click handler with permission check
  audioBtn.addEventListener('click', async () => {
    if (isListening) {
      recognition.stop();
      return;
    }

    // Check microphone permissions first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Immediately release
      startListening();
    } catch (err) {
      console.error('Microphone permission denied:', err);
      addMessage("Please enable microphone permissions to use voice input", 'bot');
    }
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
  inputArea.appendChild(audioBtn);
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

  function renderMarkdown(content) {
    // If content is an object with an 'answer' property, use that
    const text = typeof content === 'string' ? content : 
                (content.answer || content.text || JSON.stringify(content));
    
    // Simple markdown to HTML conversion
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // italic
      .replace(/\n/g, '<br>') // line breaks
      .replace(/^\d+\.\s+(.*?)(<br>|$)/gm, '<li>$1</li>'); // numbered lists
  }

  // === Add messages to chat ===
  // Enhanced message display function with read-aloud
  function addMessage(content, sender = 'user') {
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
    name.style.color = config.textColor || '#6b7280';
    name.style.marginBottom = '4px';

    const messageBubble = document.createElement('div');
    
    // Handle both string and object messages
    let messageText = '';
    let relatedQuestions = [];
    
    if (typeof content === 'string') {
      messageText = content;
      messageBubble.innerHTML = renderMarkdown(content);
    } else if (typeof content === 'object') {
      messageText = content.answer || content.text || '';
      relatedQuestions = content.related_questions || content.relatedQuestions || [];
      
      if (messageText) {
        messageBubble.innerHTML = renderMarkdown(messageText);
      }

      // Add related questions if they exist
      if (relatedQuestions.length > 0) {
        const questionsContainer = document.createElement('div');
        questionsContainer.style.marginTop = '12px';
        questionsContainer.style.paddingTop = '8px';
        questionsContainer.style.borderTop = `1px solid ${config.botText}20`;
        
        const questionsTitle = document.createElement('div');
        questionsTitle.textContent = 'Related questions:';
        questionsTitle.style.fontSize = '12px';
        questionsTitle.style.marginBottom = '6px';
        questionsTitle.style.color = config.botText;
        
        const questionsList = document.createElement('div');
        questionsList.style.display = 'flex';
        questionsList.style.flexDirection = 'column';
        questionsList.style.gap = '4px';
        
        relatedQuestions.forEach(question => {
          const questionItem = document.createElement('button');
          questionItem.textContent = question;
          questionItem.style.textAlign = 'left';
          questionItem.style.padding = '4px 8px';
          questionItem.style.borderRadius = '4px';
          questionItem.style.border = 'none';
          questionItem.style.background = 'transparent';
          questionItem.style.color = config.botText;
          questionItem.style.cursor = 'pointer';
          questionItem.style.fontSize = '12px';
          questionItem.style.transition = 'background 0.2s';
          
          questionItem.addEventListener('mouseenter', () => {
            questionItem.style.background = `${config.botText}20`;
          });
          
          questionItem.addEventListener('mouseleave', () => {
            questionItem.style.background = 'transparent';
          });
          
          questionItem.addEventListener('click', () => {
            input.value = question;
            input.focus();
          });
          
          questionsList.appendChild(questionItem);
        });
        
        questionsContainer.appendChild(questionsTitle);
        questionsContainer.appendChild(questionsList);
        messageBubble.appendChild(questionsContainer);
      }
    }

    messageBubble.style.padding = '10px 14px';
    messageBubble.style.borderRadius = sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0';
    messageBubble.style.backgroundColor = sender === 'user' ? config.primaryColor : config.accentColor;
    messageBubble.style.color = sender === 'user' ? config.userText : config.botText;
    messageBubble.style.wordBreak = 'break-word';
    messageBubble.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';

    // Add read aloud button for bot messages
    if (sender === 'bot') {
      const messageActions = document.createElement('div');
      messageActions.style.display = 'flex';
      messageActions.style.gap = '8px';
      messageActions.style.marginTop = '8px';
      messageActions.style.justifyContent = 'flex-end';
      
      const notificationArea = document.createElement('div');
      notificationArea.style.display = 'none';
      notificationArea.style.fontSize = '12px';
      notificationArea.style.padding = '6px 8px';
      notificationArea.style.borderRadius = '4px';
      notificationArea.style.marginTop = '8px';
      notificationArea.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      notificationArea.style.color = config.botText;
      notificationArea.style.transition = 'opacity 0.3s ease';
      
      const readAloudBtn = document.createElement('button');
      readAloudBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 18v-6a9 9 0 0118 0v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span style="margin-left: 4px;">Read aloud</span>
      `;
      Object.assign(readAloudBtn.style, {
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        backgroundColor: 'transparent',
        color: config.botText,
        border: `1px solid ${config.botText}`,
        borderRadius: '4px',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
      });
      
      readAloudBtn.addEventListener('mouseenter', () => {
        readAloudBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      });
      
      readAloudBtn.addEventListener('mouseleave', () => {
        readAloudBtn.style.backgroundColor = 'transparent';
      });
      
      readAloudBtn.addEventListener('click', () => {
        notificationArea.style.display = 'none';
        
        if (!window.speechSynthesis) {
          showNotification(notificationArea, 
            "Text-to-speech not supported in your browser", 
            'error');
          return;
        }

        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          showNotification(notificationArea, 
            "Loading voices... Please try again in a moment", 
            'warning');
          
          window.speechSynthesis.onvoiceschanged = function() {
            readMessageAloud(messageText, notificationArea);
          };
          return;
        }

        readMessageAloud(messageText, notificationArea);
      });
      
      messageActions.appendChild(readAloudBtn);
      messageBubble.appendChild(messageActions);
      messageBubble.appendChild(notificationArea);
    }

    messageContent.appendChild(name);
    messageContent.appendChild(messageBubble);
    messageContainer.appendChild(avatar);
    messageContainer.appendChild(messageContent);

    chatBody.appendChild(messageContainer);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Helper function to show notifications
  function showNotification(container, message, type = 'error') {
    container.textContent = message;
    container.style.display = 'block';
    
    // Style based on notification type
    if (type === 'error') {
      container.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
      container.style.color = '#ef4444';
    } else if (type === 'warning') {
      container.style.backgroundColor = 'rgba(234, 179, 8, 0.2)';
      container.style.color = '#eab308';
    } else {
      container.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      container.style.opacity = '0';
      setTimeout(() => {
        container.style.display = 'none';
        container.style.opacity = '1';
      }, 300);
    }, 5000);
  }

  // === Read Aloud Functionality ===
  function readMessageAloud(text, notificationArea) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Try to find a natural-sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = [
      'Google UK English Female',
      'Microsoft Zira - English (United States)',
      'Alex',
      'Samantha'
    ];
    
    for (const voiceName of preferredVoices) {
      const voice = voices.find(v => v.name === voiceName);
      if (voice) {
        utterance.voice = voice;
        break;
      }
    }
    
    // If no preferred voice, use the first available English voice
    if (!utterance.voice) {
      const englishVoice = voices.find(v => v.lang.startsWith('en-'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      } else {
        showNotification(notificationArea, 
          "No English voice available", 
          'error');
        return;
      }
    }

    // Speak the text
    window.speechSynthesis.speak(utterance);
    
    // Handle events for better UX
    utterance.onstart = () => {
      showNotification(notificationArea, 
        "Reading message...", 
        'info');
    };
    
    utterance.onend = () => {
      showNotification(notificationArea, 
        "Finished reading", 
        'info');
      setTimeout(() => {
        notificationArea.style.display = 'none';
      }, 2000);
    };
    
    utterance.onerror = (event) => {
      let errorMessage = "Error reading message";
      if (event.error === 'interrupted') {
        errorMessage = "Reading interrupted";
      } else if (event.error === 'canceled') {
        errorMessage = "Reading canceled";
      } else if (event.error === 'synthesis-failed') {
        errorMessage = "Failed to synthesize speech";
      }
      
      showNotification(notificationArea, 
        errorMessage, 
        'error');
    };
  }

  // Ensure voices are loaded 
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = function() {
      // Voices are now loaded
    };
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
        const botMessage = {
            text: data.reply || 'Hi! How can I help you today?',
            relatedQuestions: data.related_questions || []
        };
        addMessage(botMessage, 'bot');
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
    initSpeechRecognition();
  } else {
    window.addEventListener('DOMContentLoaded', initWidget);
  }
})();