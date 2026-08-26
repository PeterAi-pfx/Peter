const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const newChatBtn = document.getElementById("new-chat-btn");
const historyBtn = document.getElementById("history-btn");
const menuBtn = document.getElementById("menu-btn");
const sidebar = document.querySelector(".sidebar");
const themeBtn = document.getElementById("theme-btn");
const voiceBtn = document.getElementById("voice-btn");


// ==========================
// SEND MESSAGE
// ==========================

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        input.value = "";
    }
});


async function sendMessage() {

    const text = input.value.trim();

    if (text === "") return;

    addMessage(text, "user");

    input.value = "";

    showTyping();

    try {

        const reply = await getAIReply(text);

        removeTyping();

        addMessage(reply, "ai");

    } catch (error) {

        console.error("AI Error:", error);

        removeTyping();

        addMessage(
            "⚠️ Sorry, I couldn't connect to PFX AI.",
            "ai"
        );

    }
}


// ==========================
// TALK TO BACKEND
// ==========================

async function getAIReply(message) {

    const response = await fetch("http://localhost:3000/chat", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            message: message
        })

    });

    if (!response.ok) {

        throw new Error(
            `Server returned ${response.status}`
        );

    }

    const data = await response.json();

    if (!data.reply) {

        throw new Error("No reply received from server.");

    }

    return data.reply;
}


// ==========================
// ADD MESSAGE
// ==========================

function addMessage(message, sender) {

    const now = new Date();

    const time = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    const messageDiv = document.createElement("div");

    messageDiv.className = `message ${sender}`;

    const bubble = document.createElement("div");

    bubble.className = "bubble";

    bubble.textContent = message;

    const timeDiv = document.createElement("div");

    timeDiv.className = "time";

    timeDiv.textContent = time;

    bubble.appendChild(timeDiv);

    messageDiv.appendChild(bubble);

    chatBox.appendChild(messageDiv);

    chatBox.scrollTop = chatBox.scrollHeight;

    saveChat();
}


// ==========================
// TYPING ANIMATION
// ==========================

function showTyping() {

    const typing = document.createElement("div");

    typing.className = "message ai";

    typing.id = "typing";

    typing.innerHTML = `
        <div class="bubble">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div>
    `;

    chatBox.appendChild(typing);

    chatBox.scrollTop = chatBox.scrollHeight;
}


function removeTyping() {

    const typing = document.getElementById("typing");

    if (typing) {
        typing.remove();
    }

}


// ==========================
// NEW CHAT
// ==========================

newChatBtn.addEventListener("click", () => {

    localStorage.removeItem("pfxChat");

    chatBox.innerHTML = `
        <div class="message ai">
            <div class="bubble">
                👋 Welcome back! I'm <strong>PFX AI</strong>.<br>
                Built by Peter. Ask me anything!
            </div>
        </div>
    `;

    saveChat();

});


// ==========================
// HISTORY
// ==========================

historyBtn.addEventListener("click", () => {

    alert("🚧 Chat History is coming soon!");

});


// ==========================
// SIDEBAR
// ==========================

menuBtn.addEventListener("click", () => {

    sidebar.classList.toggle("hide-sidebar");

});


// ==========================
// SAVE CHAT
// ==========================

function saveChat() {

    localStorage.setItem(
        "pfxChat",
        chatBox.innerHTML
    );

}


// ==========================
// LOAD SAVED DATA
// ==========================

window.addEventListener("load", () => {

    const savedChat = localStorage.getItem("pfxChat");

    if (savedChat) {
        chatBox.innerHTML = savedChat;
    }

    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {

        document.body.classList.add("light-mode");

        themeBtn.textContent = "☀️ Light";

    } else {

        themeBtn.textContent = "🌙 Dark";

    }

});


// ==========================
// THEME
// ==========================

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("light-mode");

    if (document.body.classList.contains("light-mode")) {

        themeBtn.textContent = "☀️ Light";

        localStorage.setItem("theme", "light");

    } else {

        themeBtn.textContent = "🌙 Dark";

        localStorage.setItem("theme", "dark");

    }

});


// ==========================
// VOICE INPUT
// ==========================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition && voiceBtn) {

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";

    recognition.onresult = function (event) {

        const speech =
            event.results[0][0].transcript;

        input.value = speech;

        sendMessage();

    };

    recognition.onerror = function (event) {

        console.log(
            "Speech Error:",
            event.error
        );

    };

    voiceBtn.addEventListener("click", () => {

        recognition.start();

    });

}