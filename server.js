require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const os = require("os");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const XLSX = require("xlsx");

const app = express();

const PORT = process.env.PORT || 3000;


// ==========================
// MIDDLEWARE
// ==========================

app.use(cors());

app.use(express.json({
    limit: "2mb"
}));


// ==========================
// FILE UPLOAD CONFIG
// ==========================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = [
    ".pdf",
    ".docx",
    ".csv",
    ".xlsx",
    ".xls"
];

const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/csv",
    "application/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel"
];


// Store uploaded files temporarily in the system temp folder
const upload = multer({
    dest: path.join(os.tmpdir(), "peter-ai-uploads"),

    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    },

    fileFilter: (req, file, cb) => {

        const extension =
            path.extname(file.originalname).toLowerCase();

        if (!ALLOWED_EXTENSIONS.includes(extension)) {

            return cb(
                new Error(
                    "Unsupported file type. Peter currently supports PDF, DOCX, CSV, XLS, and XLSX files."
                )
            );

        }

        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {

            return cb(
                new Error(
                    "The uploaded file type is not allowed."
                )
            );

        }

        cb(null, true);
    }
});


// ==========================
// SERVE FRONTEND
// ==========================

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


// ==========================
// OPENROUTER HELPER
// ==========================

async function askPeter(message) {

    if (!process.env.OPENROUTER_API_KEY) {

        throw new Error(
            "OPENROUTER_API_KEY is missing."
        );

    }


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
                    process.env.APP_URL ||
                    "http://localhost:3000",

                "X-Title":
                    "Peter AI"

            },

            body: JSON.stringify({

                model:
                    "openai/gpt-4o-mini",

                messages: [

                    {
                        role: "system",

                        content:
                            `You are Peter AI, a friendly and intelligent AI assistant built by Peter.

Be helpful, clear, intelligent, accurate, and conversational.

When a user provides information from a file, carefully analyze that information and answer questions using the file contents.

Do not claim that you can see information that is not present in the provided content.`
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


    const data =
        await response.json();


    if (!response.ok) {

        console.error(
            "❌ OpenRouter Error:",
            data
        );

        throw new Error(
            "OpenRouter returned an error."
        );

    }


    const reply =
        data?.choices?.[0]?.message?.content;


    if (!reply) {

        throw new Error(
            "Invalid AI response."
        );

    }


    return reply;

}


// ==========================
// CHAT ENDPOINT
// ==========================

app.post("/chat", async (req, res) => {

    const { message } = req.body;


    if (
        typeof message !== "string" ||
        !message.trim()
    ) {

        return res.status(400).json({

            reply:
                "Please enter a message."

        });

    }


    try {

        console.log(
            "📩 User:",
            message
        );


        const reply =
            await askPeter(
                message
            );


        console.log(
            "🤖 Peter:",
            reply
        );


        res.json({

            reply:
                reply

        });

    }

    catch (error) {

        console.error(
            "❌ Chat Error:",
            error
        );


        res.status(500).json({

            reply:
                "⚠️ Sorry, something went wrong while contacting Peter AI."

        });

    }

});


// ==========================
// FILE TEXT EXTRACTION
// ==========================

async function extractFileText(file) {

    const extension =
        path.extname(
            file.originalname
        ).toLowerCase();


    // ==========================
    // PDF
    // ==========================

    if (extension === ".pdf") {

        const buffer =
            fs.readFileSync(
                file.path
            );


        const data =
            await pdfParse(buffer);


        return data.text;

    }


    // ==========================
    // DOCX
    // ==========================

    if (extension === ".docx") {

        const result =
            await mammoth.extractRawText({
                path: file.path
            });


        return result.value;

    }


    // ==========================
    // CSV / XLS / XLSX
    // ==========================

    if (
        extension === ".csv" ||
        extension === ".xls" ||
        extension === ".xlsx"
    ) {

        const workbook =
            XLSX.readFile(
                file.path
            );


        let output = "";


        for (
            const sheetName
            of workbook.SheetNames
        ) {

            const sheet =
                workbook.Sheets[
                    sheetName
                ];


            const rows =
                XLSX.utils.sheet_to_json(
                    sheet,
                    {
                        header: 1,
                        defval: ""
                    }
                );


            output +=
                `\n\n=== SHEET: ${sheetName} ===\n`;


            for (const row of rows) {

                output +=
                    row.join(" | ") +
                    "\n";

            }

        }


        return output;

    }


    throw new Error(
        "Unsupported file type."
    );

}


// ==========================
// UPLOAD ENDPOINT
// ==========================

app.post(
    "/upload",
    upload.single("file"),
    async (req, res) => {

        let uploadedPath = null;


        try {

            // ==========================
            // CHECK FILE
            // ==========================

            if (!req.file) {

                return res.status(400).json({

                    success: false,

                    reply:
                        "Please select a file to upload."

                });

            }


            uploadedPath =
                req.file.path;


            console.log(
                "📎 File received:",
                req.file.originalname
            );


            // ==========================
            // EXTRACT CONTENT
            // ==========================

            const extractedText =
                await extractFileText(
                    req.file
                );


            if (
                !extractedText ||
                !extractedText.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    reply:
                        "Peter couldn't find readable text or data inside that file."

                });

            }


            // ==========================
            // PROTECT AI REQUEST SIZE
            // ==========================

            const MAX_TEXT_LENGTH = 50000;

            const limitedText =
                extractedText.slice(
                    0,
                    MAX_TEXT_LENGTH
                );


            // ==========================
            // USER QUESTION
            // ==========================

            const userQuestion =
                typeof req.body.message === "string" &&
                req.body.message.trim()
                    ? req.body.message.trim()
                    : "Analyze this file and give me a useful summary of its contents.";


            // ==========================
            // SEND FILE TO PETER
            // ==========================

            const prompt = `The user uploaded a file named "${req.file.originalname}".

File contents:

---------------- BEGIN FILE ----------------

${limitedText}

----------------- END FILE -----------------

User request:

${userQuestion}

Analyze the file carefully and answer the user's request.

If the file was truncated because it was too large, clearly mention that only part of the file was analyzed.`;


            const reply =
                await askPeter(
                    prompt
                );


            console.log(
                "🤖 Peter analyzed:",
                req.file.originalname
            );


            // ==========================
            // RESPONSE
            // ==========================

            return res.json({

                success: true,

                filename:
                    req.file.originalname,

                fileType:
                    path.extname(
                        req.file.originalname
                    ).toLowerCase(),

                reply:
                    reply

            });

        }

        catch (error) {

            console.error(
                "❌ Upload Error:",
                error
            );


            if (
                error instanceof multer.MulterError
            ) {

                if (
                    error.code ===
                    "LIMIT_FILE_SIZE"
                ) {

                    return res.status(413).json({

                        success: false,

                        reply:
                            "⚠️ File is too large. Peter currently accepts files up to 10 MB."

                    });

                }

            }


            return res.status(500).json({

                success: false,

                reply:
                    error.message ||
                    "⚠️ Peter couldn't process that file."

            });

        }

        finally {

            // ==========================
            // DELETE TEMP FILE
            // ==========================

            if (
                uploadedPath &&
                fs.existsSync(uploadedPath)
            ) {

                try {

                    fs.unlinkSync(
                        uploadedPath
                    );

                    console.log(
                        "🗑️ Temporary file deleted."
                    );

                }

                catch (cleanupError) {

                    console.error(
                        "⚠️ Could not delete temporary file:",
                        cleanupError
                    );

                }

            }

        }

    }
);


// ==========================
// MULTER / UPLOAD ERROR HANDLER
// ==========================

app.use(
    (error, req, res, next) => {

        if (
            error instanceof multer.MulterError ||
            error
        ) {

            console.error(
                "❌ Upload middleware error:",
                error.message
            );


            return res.status(400).json({

                success: false,

                reply:
                    error.message ||
                    "⚠️ File upload failed."

            });

        }


        next(error);

    }
);


// ==========================
// START SERVER
// ==========================

app.listen(
    PORT,
    () => {

        console.log("");

        console.log(
            "🚀 Peter AI Server Running!"
        );

        console.log(
            `🌐 http://localhost:${PORT}`
        );

        console.log(
            "💬 Chat endpoint: POST /chat"
        );

        console.log(
            "📎 Upload endpoint: POST /upload"
        );

        console.log("");

    }
);