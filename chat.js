// chat.js
let chatOpen = false;

window.addEventListener('keydown', (e) => {
    const chatInput = document.getElementById('chatInput');

    // 1. Handle "t" (Open empty)
    if (e.key === 't' && !chatOpen) {
        e.preventDefault(); 
        chatOpen = true;
        chatInput.style.display = 'block';
        chatInput.focus();
    }

    // 2. Handle "/" (Open with slash)
    if (e.key === '/' && !chatOpen) {
        // We do NOT e.preventDefault() here so the '/' character 
        // actually gets typed into the input once focused.
        chatOpen = true;
        chatInput.style.display = 'block';
        chatInput.focus();
    }

    // 3. Handle Enter (Execute)
    if (e.key === 'Enter' && chatOpen) {
        const input = chatInput.value.trim();
        
        if (input.startsWith('/')) {
            const parts = input.split(' ');
            const cmd = parts[0];
            const args = parts.slice(1);
            
            if (window.commands && window.commands[cmd]) {
                const message = window.commands[cmd](args);
                console.log(message);
            } else {
                console.log("Unknown command: " + cmd);
            }
        }
        
        chatInput.value = '';
        chatInput.style.display = 'none';
        chatOpen = false;
    }

    // 4. Handle Escape (Cancel)
    if (e.key === 'Escape' && chatOpen) {
        chatInput.value = '';
        chatInput.style.display = 'none';
        chatOpen = false;
    }
});
