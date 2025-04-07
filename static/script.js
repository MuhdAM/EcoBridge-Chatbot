// Add event listener for the send button
document.addEventListener('DOMContentLoaded', () => {
    // Check if the "Send" button exists and has an ID
    const sendButton = document.querySelector('button'); // Adjust selector based on your HTML
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    } else {
        console.warn('Send button not found. Ensure the button has the correct ID or selector.');
    }

    // Optional: Add Enter key support for sending messages
    const userInput = document.getElementById('user-input');
    if (userInput) {
        userInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                sendMessage();
            }
        });
    } else {
        console.warn('User input field not found');
    }
});


// Function to send a message to the server and handle the response
function sendMessage() {
	let inputField = document.getElementById("user-input");
    const userInput = document.getElementById('user-input').value.trim(); // Adjust based on your input field ID
    if (!userInput) {
        console.warn('Empty message, skipping send');
        return;
    }

    // Display user message in the chat box
    const chatBox = document.getElementById('chat-box'); // Adjust based on your chat box ID
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'user-message';
    userMessageDiv.innerHTML = `<div class="message-content">${userInput}</div>`;
    chatBox.appendChild(userMessageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom

    inputField.value = "";

    // Send message to the server
    fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Display bot response
        const botMessageDiv = document.createElement('div');
        botMessageDiv.className = 'bot-message';
        botMessageDiv.innerHTML = `<div class="message-content">${data.response}</div>`;
        chatBox.appendChild(botMessageDiv);
        chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
        

        // Play audio and sync animations
        if (data.audioUrl) {
            console.log('Playing audio from URL:', data.audioUrl);
            syncAvatarLipSync(data.audioUrl);
        } else {
            console.warn('No audio URL provided in response');
        }
    })
    .catch(error => {
        console.error('Error sending message:', error);
        const errorMessageDiv = document.createElement('div');
        errorMessageDiv.className = 'error-message';
        errorMessageDiv.textContent = 'Server is down!!.';
        chatBox.appendChild(errorMessageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    // Clear the input field
    document.getElementById('user-input').value = '';
}

// Function to sync avatar animations and lip-sync with audio
function syncAvatarLipSync(audioUrl) {
    const audio = new Audio(audioUrl);
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audio);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    // Play the audio
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
    });

    // Find the mesh with morph targets
    let morphMesh = null;
    if (window.model) {
        window.model.traverse(child => {
            if (child.isSkinnedMesh && child.morphTargetInfluences) {
                morphMesh = child;
            }
        });
    }

    // Log available morph targets
    if (morphMesh) {
        console.log('Morph targets:', morphMesh.morphTargetDictionary);
    } else {
        console.warn('No mesh with morph targets found.');
    }

    // Play animations
    if (window.talkingAction1) {
        window.talkingAction1.reset().play();
        console.log('Playing talkingAction1 (Armature|mixamo.com|Layer0)');
    } else {
        console.warn('talkingAction1 not available.');
    }

    if (window.talkingAction2) {
        setTimeout(() => {
            window.talkingAction2.reset().play();
            console.log('Playing talkingAction2 (Wolf3D_HeadAction)');
        }, (window.talkingAction1._clip.duration * 500));
    } else {
        console.warn('talkingAction2 not available.');
    }

    // Simulate lip-sync by analyzing audio volume
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function updateLipSync() {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        const intensity = average / 255; // Normalize to 0-1

        // Adjust morph targets based on intensity
        if (morphMesh) {
            const mouthOpenIndex = morphMesh.morphTargetDictionary['mouthOpen'];
            if (mouthOpenIndex !== undefined) {
                morphMesh.morphTargetInfluences[mouthOpenIndex] = intensity;
                console.log('Mouth open intensity:', intensity);
            } else {
                console.warn('mouthOpen morph target not found.');
            }
        }

        if (audio.paused || audio.ended) {
            if (morphMesh) {
                const mouthOpenIndex = morphMesh.morphTargetDictionary['mouthOpen'];
                if (mouthOpenIndex !== undefined) {
                    morphMesh.morphTargetInfluences[mouthOpenIndex] = 0;
                }
            }
            if (window.talkingAction1) {
                window.talkingAction1.fadeOut(0.5);
                console.log('Fading out talkingAction1');
            }
            if (window.talkingAction2) {
                window.talkingAction2.fadeOut(0.5);
                console.log('Fading out talkingAction2');
            }
        } else {
            requestAnimationFrame(updateLipSync);
        }
    }

    audio.addEventListener('play', () => {
        audioContext.resume().then(() => {
            console.log('Audio context resumed, starting lip-sync');
            updateLipSync();
        });
    });

    audio.addEventListener('ended', () => {
        console.log('Audio ended');
        if (morphMesh) {
            const mouthOpenIndex = morphMesh.morphTargetDictionary['mouthOpen'];
            if (mouthOpenIndex !== undefined) {
                morphMesh.morphTargetInfluences[mouthOpenIndex] = 0;
            }
        }
        if (window.talkingAction1) {
            window.talkingAction1.fadeOut(0.5);
            console.log('Fading out talkingAction1');
        }
        if (window.talkingAction2) {
            window.talkingAction2.fadeOut(0.5);
            console.log('Fading out talkingAction2');
        }
    });
}

