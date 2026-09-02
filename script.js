/* =========================================
   PETER AI
========================================= */


/* =========================================
   ELEMENTS
========================================= */

const input =
    document.getElementById(
        "message-input"
    );

const sendBtn =
    document.getElementById(
        "send-btn"
    );

const messages =
    document.getElementById(
        "messages"
    );

const welcome =
    document.getElementById(
        "welcome"
    );

const menuBtn =
    document.getElementById(
        "menu-btn"
    );

const sidebar =
    document.getElementById(
        "sidebar"
    );

const sidebarOverlay =
    document.getElementById(
        "sidebar-overlay"
    );

const newChatBtn =
    document.getElementById(
        "new-chat-btn"
    );

const clearBtn =
    document.getElementById(
        "clear-btn"
    );

const themeBtn =
    document.getElementById(
        "theme-btn"
    );

const attachBtn =
    document.getElementById(
        "attach-btn"
    );

const fileInput =
    document.getElementById(
        "file-input"
    );

const filePreview =
    document.getElementById(
        "file-preview"
    );

const voiceBtn =
    document.getElementById(
        "voice-btn"
    );

const composer =
    document.querySelector(
        ".composer"
    );

const composerWrapper =
    document.getElementById(
        "composer-wrapper"
    );

const voiceMode =
    document.getElementById(
        "voice-mode"
    );

const voiceStatusTitle =
    document.getElementById(
        "voice-status-title"
    );

const voiceStatusText =
    document.getElementById(
        "voice-status-text"
    );

const stopVoiceBtn =
    document.getElementById(
        "stop-voice-btn"
    );


/* =========================================
   STATE
========================================= */

let selectedFile = null;

let isSending = false;

let recognition = null;

let isListening = false;

let isSpeaking = false;


/* =========================================
   INITIALIZE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadChat();

        loadTheme();

        setupSuggestions();

        setupTextarea();

        setupVoice();

    }
);


/* =========================================
   SIDEBAR
========================================= */

menuBtn.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        toggleSidebar();

    }
);


sidebarOverlay.addEventListener(
    "click",
    closeSidebar
);


function toggleSidebar() {

    if (
        window.innerWidth <= 800
    ) {

        sidebar.classList.toggle(
            "open"
        );

        sidebarOverlay.classList.toggle(
            "active"
        );

    }
    else {

        sidebar.classList.toggle(
            "desktop-hidden"
        );

        if (
            sidebar.classList.contains(
                "desktop-hidden"
            )
        ) {

            sidebar.style.display =
                "none";

        }
        else {

            sidebar.style.display =
                "";

        }

    }

}


function closeSidebar() {

    sidebar.classList.remove(
        "open"
    );

    sidebarOverlay.classList.remove(
        "active"
    );

}


/* =========================================
   NEW CHAT
========================================= */

newChatBtn.addEventListener(
    "click",
    newChat
);


clearBtn.addEventListener(
    "click",
    newChat
);


function newChat() {

    if (isSending) return;


    messages.innerHTML =
        "";


    welcome.style.display =
        "flex";


    selectedFile =
        null;


    fileInput.value =
        "";


    updateFilePreview();


    localStorage.removeItem(
        "peter-chat"
    );


    input.value =
        "";


    input.style.height =
        "auto";


    input.focus();


    closeSidebar();

}


/* =========================================
   HOME
========================================= */

document
    .getElementById("home-btn")
    .addEventListener(
        "click",
        () => {

            newChat();

        }
    );


/* =========================================
   HISTORY
========================================= */

document
    .getElementById("history-btn")
    .addEventListener(
        "click",
        () => {

            const saved =
                localStorage.getItem(
                    "peter-chat"
                );


            if (!saved) {

                alert(
                    "No previous chat history yet."
                );

                return;

            }


            welcome.style.display =
                "none";


            messages.innerHTML =
                saved;


            closeSidebar();

            scrollToBottom();

        }
    );


/* =========================================
   THEME
========================================= */

themeBtn.addEventListener(
    "click",
    toggleTheme
);


function toggleTheme() {

    document.body.classList.toggle(
        "light"
    );


    const light =
        document.body.classList.contains(
            "light"
        );


    localStorage.setItem(
        "peter-theme",
        light
            ? "light"
            : "dark"
    );


    updateThemeButton();

}


function loadTheme() {

    if (
        localStorage.getItem(
            "peter-theme"
        ) === "light"
    ) {

        document.body.classList.add(
            "light"
        );

    }


    updateThemeButton();

}


function updateThemeButton() {

    const light =
        document.body.classList.contains(
            "light"
        );


    if (light) {

        themeBtn.innerHTML = `
            <i class="fa-solid fa-sun"></i>
            <span>Light mode</span>
        `;

    }
    else {

        themeBtn.innerHTML = `
            <i class="fa-solid fa-moon"></i>
            <span>Dark mode</span>
        `;

    }

}


/* =========================================
   TEXTAREA
========================================= */

function setupTextarea() {

    input.addEventListener(
        "input",
        () => {

            input.style.height =
                "auto";


            input.style.height =
                Math.min(
                    input.scrollHeight,
                    150
                ) + "px";

        }
    );


    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


/* =========================================
   SEND
========================================= */

sendBtn.addEventListener(
    "click",
    sendMessage
);


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {

    if (isSending) return;


    const text =
        input.value.trim();


    if (
        !text &&
        !selectedFile
    ) {

        return;

    }


    isSending =
        true;


    sendBtn.disabled =
        true;


    welcome.style.display =
        "none";


    if (text) {

        addMessage(
            "user",
            text
        );

    }


    const fileToSend =
        selectedFile;


    input.value =
        "";


    input.style.height =
        "auto";


    selectedFile =
        null;


    fileInput.value =
        "";


    updateFilePreview();


    const typingId =
        showTyping();


    try {

        let response;


        /* =====================================
           FILE
        ===================================== */

        if (fileToSend) {

            const formData =
                new FormData();


            formData.append(
                "file",
                fileToSend
            );


            formData.append(
                "message",
                text
            );


            response =
                await fetch(
                    "/upload",
                    {
                        method:
                            "POST",

                        body:
                            formData
                    }
                );

        }


        /* =====================================
           NORMAL CHAT
        ===================================== */

        else {

            response =
                await fetch(
                    "/chat",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                message:
                                    text
                            })
                    }
                );

        }


        removeTyping(
            typingId
        );


        if (!response.ok) {

            throw new Error(
                "Server error: " +
                response.status
            );

        }


        const data =
            await response.json();


        const reply =
            data.reply ||
            data.message ||
            data.response ||
            "Peter didn't return a response.";


        addMessage(
            "ai",
            reply
        );


        saveChat();


        /* VOICE RESPONSE */

        if (
            voiceMode.classList.contains(
                "active"
            )
        ) {

            speakText(
                reply
            );

        }

    }
    catch (error) {

        console.error(
            "Peter error:",
            error
        );


        removeTyping(
            typingId
        );


        addMessage(
            "ai",
            "Sorry, I couldn't connect to Peter's server. Please make sure your server is running."
        );


        if (
            voiceMode.classList.contains(
                "active"
            )
        ) {

            hideVoiceMode();

        }

    }
    finally {

        isSending =
            false;


        sendBtn.disabled =
            false;


        input.focus();

    }

}


/* =========================================
   ADD MESSAGE
========================================= */

function addMessage(
    role,
    text
) {

    const message =
        document.createElement(
            "div"
        );


    message.className =
        `message ${role}`;


    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "message-avatar";


    if (
        role === "ai"
    ) {

        avatar.textContent =
            "P";

    }
    else {

        avatar.innerHTML =
            '<i class="fa-solid fa-user"></i>';

    }


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "message-content";


    content.innerHTML =
        formatMessage(
            text
        );


    message.appendChild(
        avatar
    );


    message.appendChild(
        content
    );


    messages.appendChild(
        message
    );


    scrollToBottom();

}


/* =========================================
   FORMAT MESSAGE
========================================= */

function formatMessage(
    text
) {

    if (!text) {
        return "";
    }


    let escaped =
        escapeHtml(
            text
        );


    escaped =
        escaped.replace(
            /```([\s\S]*?)```/g,
            (match, code) => {

                return `
                    <div class="code-block">
                        <pre>${code.trim()}</pre>
                    </div>
                `;

            }
        );


    escaped =
        escaped.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    escaped =
        escaped.replace(
            /\*(.*?)\*/g,
            "<em>$1</em>"
        );


    escaped =
        escaped.replace(
            /\n/g,
            "<br>"
        );


    return escaped;

}


function escapeHtml(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}


/* =========================================
   TYPING
========================================= */

function showTyping() {

    const id =
        "typing-" +
        Date.now();


    const message =
        document.createElement(
            "div"
        );


    message.className =
        "message ai";


    message.id =
        id;


    message.innerHTML = `
        <div class="message-avatar">
            P
        </div>

        <div class="message-content">

            <div class="typing">

                <span></span>
                <span></span>
                <span></span>

            </div>

        </div>
    `;


    messages.appendChild(
        message
    );


    scrollToBottom();


    return id;

}


function removeTyping(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.remove();

    }

}


/* =========================================
   SCROLL
========================================= */

function scrollToBottom() {

    setTimeout(
        () => {

            const chatArea =
                document.getElementById(
                    "chat-area"
                );


            chatArea.scrollTo(
                {
                    top:
                        chatArea.scrollHeight,

                    behavior:
                        "smooth"
                }
            );

        },
        50
    );

}


/* =========================================
   SUGGESTIONS
========================================= */

function setupSuggestions() {

    document
        .querySelectorAll(
            ".suggestion"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        input.value =
                            button.dataset.prompt;


                        input.focus();


                        input.dispatchEvent(
                            new Event(
                                "input"
                            )
                        );

                    }
                );

            }
        );

}


/* =========================================
   FILE UPLOAD
========================================= */

attachBtn.addEventListener(
    "click",
    () => {

        fileInput.click();

    }
);


fileInput.addEventListener(
    "change",
    () => {

        const file =
            fileInput.files[0];


        if (!file) return;


        if (
            file.size >
            10 * 1024 * 1024
        ) {

            alert(
                "File is too large. Maximum size is 10 MB."
            );


            fileInput.value =
                "";


            return;

        }


        selectedFile =
            file;


        updateFilePreview();

    }
);


function updateFilePreview() {

    if (!selectedFile) {

        filePreview.innerHTML =
            "";

        return;

    }


    filePreview.innerHTML = `
        <div class="file-item">

            <i class="fa-solid fa-file"></i>

            <span>
                ${escapeHtml(
                    selectedFile.name
                )}
            </span>

            <button
                id="remove-file"
                title="Remove file"
            >

                <i class="fa-solid fa-xmark"></i>

            </button>

        </div>
    `;


    document
        .getElementById(
            "remove-file"
        )
        .addEventListener(
            "click",
            () => {

                selectedFile =
                    null;


                fileInput.value =
                    "";


                updateFilePreview();

            }
        );

}


/* =========================================
   SAVE CHAT
========================================= */

function saveChat() {

    localStorage.setItem(
        "peter-chat",
        messages.innerHTML
    );

}


function loadChat() {

    const saved =
        localStorage.getItem(
            "peter-chat"
        );


    if (saved) {

        messages.innerHTML =
            saved;


        welcome.style.display =
            "none";

    }

}


/* =========================================
   VOICE
========================================= */

function setupVoice() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        console.warn(
            "Speech recognition is not supported."
        );

        return;

    }


    recognition =
        new SpeechRecognition();


    recognition.continuous =
        false;


    recognition.interimResults =
        true;


    recognition.lang =
        "en-US";


    recognition.onstart =
        () => {

            isListening =
                true;


            showVoiceMode();


            setVoiceListening();

        };


    recognition.onresult =
        event => {

            let transcript =
                "";


            for (
                let i =
                    event.resultIndex;

                i <
                    event.results.length;

                i++
            ) {

                transcript +=
                    event.results[i][0]
                        .transcript;

            }


            input.value =
                transcript;


            input.dispatchEvent(
                new Event(
                    "input"
                )
            );

        };


    recognition.onerror =
        event => {

            console.error(
                "Voice error:",
                event.error
            );


            isListening =
                false;


            if (
                event.error ===
                "not-allowed"
            ) {

                setVoiceError(
                    "Microphone permission denied."
                );

            }
            else {

                setVoiceError(
                    "Voice input failed."
                );

            }


            setTimeout(
                () => {

                    if (!isSpeaking) {

                        hideVoiceMode();

                    }

                },
                1500
            );

        };


    recognition.onend =
        () => {

            isListening =
                false;


            if (
                input.value.trim()
            ) {

                setVoiceThinking();


                sendMessage();

            }
            else {

                hideVoiceMode();

            }

        };

}


/* =========================================
   START VOICE
========================================= */

voiceBtn.addEventListener(
    "click",
    startListening
);


function startListening() {

    if (!recognition) {

        alert(
            "Voice recognition is not supported by this browser. Try Chrome or Edge."
        );

        return;

    }


    if (isListening) {
        return;
    }


    if (
        "speechSynthesis"
        in window
    ) {

        speechSynthesis.cancel();

    }


    showVoiceMode();


    setVoiceListening();


    try {

        recognition.start();

    }
    catch (error) {

        console.log(
            "Recognition already active."
        );

    }

}


/* =========================================
   STOP VOICE
========================================= */

stopVoiceBtn.addEventListener(
    "click",
    stopListening
);


function stopListening() {

    isListening =
        false;


    if (recognition) {

        try {

            recognition.stop();

        }
        catch {}

    }


    if (
        "speechSynthesis"
        in window
    ) {

        speechSynthesis.cancel();

    }


    isSpeaking =
        false;


    hideVoiceMode();

}


/* =========================================
   SHOW VOICE
========================================= */

function showVoiceMode() {

    voiceMode.classList.add(
        "active"
    );


    if (composer) {

        composer.style.opacity =
            ".1";

    }


    if (composerWrapper) {

        composerWrapper.style.pointerEvents =
            "none";

    }

}


/* =========================================
   HIDE VOICE
========================================= */

function hideVoiceMode() {

    voiceMode.classList.remove(
        "active"
    );


    voiceMode.classList.remove(
        "ai-speaking"
    );


    if (composer) {

        composer.style.opacity =
            "";

    }


    if (composerWrapper) {

        composerWrapper.style.pointerEvents =
            "";

    }

}


/* =========================================
   VOICE STATES
========================================= */

function setVoiceListening() {

    voiceMode.classList.remove(
        "ai-speaking"
    );


    voiceStatusTitle.textContent =
        "Listening";


    voiceStatusText.textContent =
        "Speak to Peter...";

}


function setVoiceThinking() {

    voiceMode.classList.remove(
        "ai-speaking"
    );


    voiceStatusTitle.textContent =
        "Thinking";


    voiceStatusText.textContent =
        "Peter is processing your request...";

}


function setVoiceError(
    message
) {

    voiceMode.classList.remove(
        "ai-speaking"
    );


    voiceStatusTitle.textContent =
        "Oops";


    voiceStatusText.textContent =
        message;

}


/* =========================================
   PETER SPEAKING
========================================= */

function showSpeakingAnimation() {

    showVoiceMode();


    voiceMode.classList.add(
        "ai-speaking"
    );


    voiceStatusTitle.textContent =
        "Peter is speaking";


    voiceStatusText.textContent =
        "I'm listening if you want to talk...";

}


/* =========================================
   TEXT TO SPEECH
========================================= */

function speakText(
    text
) {

    if (
        !("speechSynthesis" in window)
    ) {

        hideVoiceMode();

        return;

    }


    speechSynthesis.cancel();


    const cleanText =
        text
            .replace(
                /```[\s\S]*?```/g,
                ""
            )
            .replace(
                /[*#`]/g,
                ""
            )
            .replace(
                /<[^>]*>/g,
                ""
            );


    if (
        !cleanText.trim()
    ) {

        hideVoiceMode();

        return;

    }


    const utterance =
        new SpeechSynthesisUtterance(
            cleanText
        );


    utterance.rate =
        1;


    utterance.pitch =
        1.03;


    utterance.volume =
        1;


    utterance.onstart =
        () => {

            isSpeaking =
                true;


            showSpeakingAnimation();

        };


    utterance.onend =
        () => {

            isSpeaking =
                false;


            voiceMode.classList.remove(
                "ai-speaking"
            );


            voiceStatusTitle.textContent =
                "Ready";


            voiceStatusText.textContent =
                "Tap the microphone to speak again.";


            setTimeout(
                () => {

                    if (
                        !isListening &&
                        !isSpeaking
                    ) {

                        hideVoiceMode();

                    }

                },
                1200
            );

        };


    utterance.onerror =
        () => {

            isSpeaking =
                false;


            hideVoiceMode();

        };


    speechSynthesis.speak(
        utterance
    );

}


/* =========================================
   WINDOW RESIZE
========================================= */

window.addEventListener(
    "resize",
    () => {

        if (
            window.innerWidth > 800
        ) {

            sidebar.classList.remove(
                "open"
            );

            sidebarOverlay.classList.remove(
                "active"
            );

            sidebar.style.display =
                "";

        }

    }
);