let currentId = null;

function getCSRFToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return value;
        }
    }
    return null;
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messages-list');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function getMessages(id) {
    currentId = id;

    let new_messages = false;

    const url = `/messages/get_messages/${id}/`;
    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }
        return response.json();
    })
    .then(data => {
        for (const tab of document.querySelectorAll('.member')) {
            tab.classList.remove('active');
        };
        document.getElementById(id).classList.add('active');
        const messagesContainer = document.getElementById('messages-list');
        messagesContainer.innerHTML = '';

        if (data.error) {
            messagesContainer.textContent = data.error;
            return;
        }

        document.getElementById('message-name').textContent = data.fullname;

        data.messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message-item';
            if (message.is_sender) {
                messageElement.classList.add('sender');
            } else {
                messageElement.classList.add('receiver');
            }
            messageElement.innerHTML = `
                <pre>${message.content}</pre>
                <small>${message.timestamp}</small>
                <small>${message.read ? message.is_sender ?  '<i class="fa-solid fa-check"></i>' : '' : ''}</small>
            `;

            if (message.read == false && message.is_sender == false && new_messages == false) {
                new_messages = true;
                const new_messages_element = document.createElement('div');
                new_messages_element.innerHTML = `<hr style="height:2px;border-width:0;color:red;background-color:red"><p class="new-messages-text">New messages</p>`;
                new_messages_element.className = 'new-messages';
                messagesContainer.appendChild(new_messages_element);
            }

            messagesContainer.appendChild(messageElement);
        });

        document.getElementById('group-members').classList.remove('mobile');
        document.getElementById('toggleMobileButton').classList.remove('mobile-button');

        // Scroll to the bottom after messages are loaded
        scrollToBottom();

    })
    .catch(error => console.error('Error fetching messages:', error));
}


function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const messageContent = messageInput.value.trim();
    if (!messageContent) {
        return;
    }

    const url = `/messages/send_message/`;
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({ content: messageContent, member_id: currentId }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to send message');
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            console.error('Error sending message:', data.error);
            return;
        }
        // Clear the input field
        messageInput.value = '';
        // Optionally, you can refresh the messages after sending
        getMessages(currentId);
    })
    .catch(error => console.error('Error sending message:', error));
}

function toggleMobile() {
    document.getElementById('group-members').classList.toggle('mobile');
    document.getElementById('toggleMobileButton').classList.toggle('mobile-button');
}