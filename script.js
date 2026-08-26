// ==========================
// ELEMENTS
// ==========================

const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const newChatBtn = document.getElementById("new-chat-btn");
const historyBtn = document.getElementById("history-btn");
const menuBtn = document.getElementById("menu-btn");
const sidebar = document.querySelector(".sidebar");
const themeBtn = document.getElementById("theme-btn");
const voiceBtn = document.getElementById("voice-btn");
const voiceSidebarBtn = document.getElementById("voice-sidebar-btn");


// ==========================
// SEND MESSAGE
// ==========================

sendBtn.addEventListener("click", sendMessage);


input.addEventListener("keypress", function (e) {

    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }

});


input.addEventListener("keydown", function (e) {

    if (e.key === "Escape") {
        input.value = "";
    }

});


// ==========================
// SEND MESSAGE FUNCTION
// ==========================

async function sendMessage() {

    const text = input.value.trim();

    if (text === "") return;

    // Stop Peter speaking if a new message is sent
    stopSpeaking();

    addMessage(text, "user");

    input.value = "";

    showTyping();

    try {

        const reply = await getAIReply(text);

        removeTyping();

        addMessage(reply, "ai");

        // Peter speaks the response
        speakReply(reply);

    }

    catch (error) {

        console.error("AI Error:", error);

        removeTyping();

        const errorMessage =
            "⚠️ Sorry, I couldn't connect to Peter AI.";

        addMessage(errorMessage, "ai");

    }

}


// ==========================
// TALK TO BACKEND
// ==========================

async function getAIReply(message) {

    const response = await fetch("/chat", {

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

        throw new Error(
            "No reply received from server."
        );

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


    const messageDiv =
        document.createElement("div");


    messageDiv.className =
        `message ${sender}`;


    const bubble =
        document.createElement("div");


    bubble.className =
        "bubble";


    bubble.textContent =
        message;


    const timeDiv =
        document.createElement("div");


    timeDiv.className =
        "time";


    timeDiv.textContent =
        time;


    bubble.appendChild(timeDiv);


    messageDiv.appendChild(bubble);


    chatBox.appendChild(messageDiv);


    chatBox.scrollTop =
        chatBox.scrollHeight;


    saveChat();

}


// ==========================
// TYPING ANIMATION
// ==========================

function showTyping() {

    const typing =
        document.createElement("div");


    typing.className =
        "message ai";


    typing.id =
        "typing";


    typing.innerHTML = `

        <div class="bubble">

            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>

        </div>

    `;


    chatBox.appendChild(typing);


    chatBox.scrollTop =
        chatBox.scrollHeight;

}


function removeTyping() {

    const typing =
        document.getElementById("typing");


    if (typing) {

        typing.remove();

    }

}


// ==========================
// NEW CHAT
// ==========================

if (newChatBtn) {

    newChatBtn.addEventListener("click", function () {

        console.log("🆕 New Chat clicked");

        // Stop Peter speaking
        stopSpeaking();
 
        // Clear saved conversation
        localStorage.removeItem("pfxChat");

        // Clear chat
        chatBox.innerHTML = "";

        // Add fresh welcome message
        const welcomeMessage =
            document.createElement("div");

        welcomeMessage.className =
            "message ai";

        welcomeMessage.innerHTML = `
            <div class="bubble">
                👋 Welcome! I'm <strong>Peter</strong>.<br>
                Ask me anything!
            </div>
        `;

        chatBox.appendChild(welcomeMessage);

        // Save the fresh chat
        saveChat();

        // Close sidebar after creating new chat
        if (sidebar) {
            sidebar.classList.add("hide-sidebar");
        }

        // Put cursor back in input
        if (input) {
            input.focus();
        }

    });

}

// ==========================
// HISTORY
// ==========================

historyBtn.addEventListener("click", () => {

    alert(
        "🚧 Chat History is coming soon!"
    );

});


// ==========================
// SIDEBAR
// ==========================

menuBtn.addEventListener("click", () => {

    sidebar.classList.toggle(
        "hide-sidebar"
    );

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
    // Keep sidebar closed when Peter opens
sidebar.classList.add("hide-sidebar");

    const savedChat =
        localStorage.getItem("pfxChat");


    if (savedChat) {

        chatBox.innerHTML =
            savedChat;

    }


    const savedTheme =
        localStorage.getItem("theme");


    if (savedTheme === "light") {

        document.body.classList.add(
            "light-mode"
        );


        themeBtn.innerHTML =
            '<i class="fa-solid fa-sun"></i>';

    }

    else {

        themeBtn.innerHTML =
            '<i class="fa-solid fa-moon"></i>';

    }

});


// ==========================
// THEME
// ==========================

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle(
        "light-mode"
    );


    if (
        document.body.classList.contains(
            "light-mode"
        )
    ) {

        themeBtn.innerHTML =
            '<i class="fa-solid fa-sun"></i>';


        localStorage.setItem(
            "theme",
            "light"
        );

    }

    else {

        themeBtn.innerHTML =
            '<i class="fa-solid fa-moon"></i>';


        localStorage.setItem(
            "theme",
            "dark"
        );

    }

});


// ==========================
// VOICE SYSTEM
// ==========================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;
let isListening = false;
let isSpeaking = false;


// ==========================
// VOICE INPUT
// ==========================

if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;


    recognition.onstart = function () {

        isListening = true;

        console.log("🎤 Peter is listening...");

        if (voiceBtn) {
            voiceBtn.innerHTML =
                '<i class="fa-solid fa-stop"></i>';
        }

    };


    recognition.onresult = function (event) {

        console.log("🎤 Speech result received!");

        const speech =
            event.results[0][0].transcript.trim();

        console.log("🗣️ You said:", speech);

        if (!speech) return;

        input.value = speech;

        // Give the browser a moment
        setTimeout(() => {

            sendMessage();

        }, 300);

    };


    recognition.onerror = function (event) {

        console.error(
            "🎤 Speech recognition error:",
            event.error
        );

    };


    recognition.onend = function () {

        isListening = false;

        console.log("🎤 Listening stopped.");

        if (voiceBtn) {
            voiceBtn.innerHTML =
                '<i class="fa-solid fa-microphone"></i>';
        }

    };

}


// ==========================
// START / STOP LISTENING
// ==========================

function startListening() {

    if (!recognition) {

        alert(
            "Your browser does not support voice recognition."
        );

        return;

    }

    if (isListening) {

        recognition.stop();

        return;

    }

    // Stop Peter talking
    stopSpeaking();

    try {

        recognition.start();

    } catch (error) {

        console.error(
            "🎤 Microphone error:",
            error
        );

    }

}


// ==========================
// MAIN VOICE BUTTON
// ==========================

if (voiceBtn) {

    voiceBtn.addEventListener("click", function () {

        if (isSpeaking) {

            stopSpeaking();

        } else {

            startListening();

        }

    });

}


// ==========================
// SIDEBAR VOICE BUTTON
// ==========================

if (voiceSidebarBtn) {

    voiceSidebarBtn.addEventListener(
        "click",
        startListening
    );

}


// ==========================
// PETER SPEAKS
// ==========================

function speakReply(text) {

    if (!("speechSynthesis" in window)) {

        console.log(
            "🔊 Speech synthesis is not supported."
        );

        return;

    }

    window.speechSynthesis.cancel();

    const cleanText = text
        .replace(/[*_#`]/g, "")
        .trim();

    if (!cleanText) return;

    const utterance =
        new SpeechSynthesisUtterance(
            cleanText
        );

    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;


    utterance.onstart = function () {

        isSpeaking = true;

        console.log(
            "🔊 Peter is speaking..."
        );

    };


    utterance.onend = function () {

        isSpeaking = false;

        console.log(
            "🔊 Peter finished speaking."
        );

    };


    utterance.onerror = function (event) {

        isSpeaking = false;

        console.error(
            "🔊 Speech error:",
            event.error
        );

    };


    window.speechSynthesis.speak(
        utterance
    );

}

// ==========================
// STOP PETER SPEAKING
// ==========================

function stopSpeaking() {

    if ("speechSynthesis" in window) {

        window.speechSynthesis.cancel();

        isSpeaking = false;

        console.log("🔇 Peter stopped speaking.");

    }

}


// ==========================
// ESCAPE KEY
// ==========================

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            stopSpeaking();

            if (
                recognition &&
                isListening
            ) {

                recognition.stop();

            }

        }

    }
);