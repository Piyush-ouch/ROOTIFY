require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000; // Using port 3000 as per your .env configuration

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in environment variables.");
    console.error("Please create a .env file in the 'server' directory with GEMINI_API_KEY=YOUR_API_KEY.");
    // Do not exit process. Instead, send an error response if API key is missing.
    // process.exit(1); // Removed: Let the app start, but API calls will fail.
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Helper function to prepare image for Gemini
function fileToGenerativePart(base64EncodedImage, mimeType) {
    return {
        inlineData: {
            data: base64EncodedImage,
            mimeType
        }
    };
}

// Define the API endpoint for Gemini requests (now supports multimodal)
app.post('/ask-gemini', async (req, res) => {
    console.log("\n--- Incoming /ask-gemini Request ---");
    console.log("Request Headers:", req.headers);
    console.log("Request Body (after express.json parsing):", JSON.stringify(req.body, null, 2)); // Stringify for better readability
    console.log("Is req.body empty?", Object.keys(req.body).length === 0);

    // NEW: Deeper inspection of contents and parts
    if (req.body.contents && Array.isArray(req.body.contents) && req.body.contents.length > 0) {
        console.log("req.body.contents[0]:", JSON.stringify(req.body.contents[0], null, 2));
        if (req.body.contents[0].parts && Array.isArray(req.body.contents[0].parts)) {
            console.log("req.body.contents[0].parts:", JSON.stringify(req.body.contents[0].parts, null, 2));
            console.log("Number of parts:", req.body.contents[0].parts.length);
        } else {
            console.log("req.body.contents[0].parts is missing or not an array.");
        }
    } else {
        console.log("req.body.contents is missing or not an array, or is empty.");
    }
    console.log("------------------------------------\n");


    // Ensure API key is available before proceeding
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Gemini API Key is not set.' });
    }

    // FIX: Correctly extract prompt, imageData, and imageMimeType from the nested structure
    let prompt = '';
    let imageData = null;
    let imageMimeType = null;

    if (req.body.contents && req.body.contents.length > 0 && req.body.contents[0].parts) {
        const parts = req.body.contents[0].parts;
        for (const part of parts) {
            if (part.text) {
                prompt = part.text; // This will capture the text prompt
            }
            if (part.inlineData) {
                imageData = part.inlineData.data;
                imageMimeType = part.inlineData.mimeType;
            }
        }
    }

    // This validation check is what's returning the 400 error.
    // It indicates that 'prompt' or 'imageData' are not being correctly received by the backend.
    if (!prompt && !imageData) {
        console.error("Backend received request with no prompt or image data. Prompt:", prompt, "ImageData:", imageData ? "present" : "missing");
        return res.status(400).json({ error: 'Either a text prompt or image data is required.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        // Reconstruct contents array for the Gemini API call based on extracted data
        let contents = [];
        // The formatting instructions are now part of the prompt text sent from the frontend
        // so we don't need to re-add them here unless you want to append more backend-specific instructions.
        // For now, we'll assume the frontend sends the full prompt with instructions.

        if (imageData && imageMimeType) {
            contents.push(fileToGenerativePart(imageData, imageMimeType));
        }
        // Always push the text part if it exists, even if there's an image.
        // The frontend is already combining the user question and formatting instructions into 'prompt'.
        if (prompt) {
            contents.push({ text: prompt });
        }


        const result = await model.generateContent(contents);
        const response = await result.response;
        const text = response.text();
        res.json({ response: text });

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Provide more specific error details from the API if available
        if (error.response && error.response.text) {
            const apiErrorDetails = await error.response.text();
            console.error("Gemini API detailed error:", apiErrorDetails);
            // Check for 403 specifically to give a more helpful message
            if (error.response.status === 403) {
                res.status(403).json({ error: 'Authentication failed: Invalid or missing Gemini API Key, or insufficient permissions.', details: apiErrorDetails });
            } else {
                res.status(500).json({ error: 'Failed to get a response from the AI model.', details: apiErrorDetails });
            }
        } else {
            res.status(500).json({ error: 'Failed to get a response from the AI model.', details: error.message });
        }
    }
});

// Serve static files from the 'public' directory
// Assuming your HTML, CSS, JS are in a 'public' folder relative to app.js
app.use(express.static('../public'));

// Start the server
app.listen(port, () => {
    console.log(`Gemini proxy server listening at http://localhost:${port}`);
});
