require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;


// ==========================
// MIDDLEWARE
// ==========================

app.use(cors());

app.use(express.json());


// ==========================
// SERVE FRONTEND
// ==========================

app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});


// ==========================
// CHAT ENDPOINT
// ==========================

app.post("/chat", async (req, res) => {

    const { message } = req.body;

    // Check message
    if (!message || !message.trim()) {

        return res.status(400).json({
            reply: "Please enter a message."
        });

    }

    // Check API key
    if (!process.env.OPENROUTER_API_KEY) {

        console.error(
            "❌ OPENROUTER_API_KEY is missing."
        );

        return res.status(500).json({
            reply:
                "⚠️ PFX AI is missing its OpenRouter API key."
        });

    }

    try {

        console.log("📩 User:", message);

        // ==========================
        // OPENROUTER REQUEST
        // ==========================

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {

                method: "POST",

                headers: {

                    "Authorization":
                        `Bearer ${process.env.OPENROUTER_API_KEY}`,

                    "Content-Type":
                        "application/json",

                    "HTTP-Referer":
                        process.env.APP_URL || "http://localhost:3000",

                    "X-Title":
                        "PFX AI"

                },

                body: JSON.stringify({

                    model:
                        "openai/gpt-4o-mini",

                    messages: [

                        {
                            role: "system",

                            content:
                                "You are PFX AI, a friendly AI assistant built by Peter. Be helpful, clear, intelligent, and conversational."
                        },

                        {
                            role: "user",

                            content:
                                message
                        }

                    ]

                })

            }
        );


        // ==========================
        // READ RESPONSE
        // ==========================

        const data =
            await response.json();

        console.log(
            "🤖 OpenRouter status:",
            response.status
        );


        // ==========================
        // HANDLE API ERROR
        // ==========================

        if (!response.ok) {

            console.error(
                "❌ OpenRouter Error:",
                data
            );

            return res
                .status(response.status)
                .json({

                    reply:
                        "⚠️ OpenRouter returned an error. Check the server terminal."

                });

        }


        // ==========================
        // GET AI RESPONSE
        // ==========================

        const reply =
            data?.choices?.[0]?.message?.content;


        if (!reply) {

            console.error(
                "❌ Unexpected response:",
                data
            );

            return res.status(500).json({

                reply:
                    "⚠️ PFX AI received an invalid response from the AI provider."

            });

        }


        // ==========================
        // SEND RESPONSE
        // ==========================

        console.log(
            "✅ PFX AI:",
            reply
        );

        res.json({
            reply: reply
        });

    }

    catch (error) {

        console.error(
            "❌ Server Error:",
            error
        );

        res.status(500).json({

            reply:
                "⚠️ Sorry, something went wrong while contacting PFX AI."

        });

    }

});


// ==========================
// START SERVER
// ==========================

app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "🚀 PFX AI Server Running!"
        );

        console.log(
            `🌐 http://localhost:${PORT}`
        );

        console.log(
            "💬 Chat endpoint: POST /chat"
        );

        console.log("");

    }
);