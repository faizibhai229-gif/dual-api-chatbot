document.addEventListener('DOMContentLoaded', () => {
    const chatHistory = document.getElementById('chat-history');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const statusIndicator = document.getElementById('status');
    
    let conversationHistory = [];
    
    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    
    // Send message on button click
    sendBtn.addEventListener('click', sendMessage);
    
    // Send message on Enter (without Shift)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;
        
        // Add user message to UI
        appendMessage(message, 'user');
        conversationHistory.push({ role: 'user', content: message });
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        messageInput.focus();
        
        // Show loading state
        const loadingMessage = appendMessage('Thinking...', 'ai');
        
        // Send to backend
        fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message, 
                history: conversationHistory 
            })
        })
        .then(response => response.json())
        .then(data => {
            // Remove loading message
            chatHistory.removeChild(loadingMessage);
            
            // Add AI response
            const aiMessage = appendMessage(data.response, 'ai');
            conversationHistory.push({ role: 'assistant', content: data.response });
            
            // Highlight code blocks
            hljs.highlightAll();
            
            // Update status indicator
            statusIndicator.textContent = "Powered by DeepSeek V3";
        })
        .catch(error => {
            chatHistory.removeChild(loadingMessage);
            appendMessage('⚠️ Failed to get response. Please try again.', 'ai');
            statusIndicator.textContent = "⚠️ Service Disrupted";
            console.error('Error:', error);
        });
    }
    
    function appendMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        // Convert Markdown-like syntax for code blocks
        const formattedContent = content.replace(/