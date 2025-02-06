const axios = require("axios");
require("dotenv").config();

async function getGeminiTutorResponse(topic, level) {
    try {
        console.log("📤 Sending request to Gemini AI:", { topic, level });

        const response = await axios.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=GEMINI_API_KEY",  // Replace with actual Gemini API endpoint
            { topic, level },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("📥 Gemini Response:", response.data);
        return response.data.response || "No response from tutor.";
    } catch (error) {
        console.error("❌ Gemini API Error:", error.response ? error.response.data : error.message);
        return `Gemini API failed: ${error.response ? JSON.stringify(error.response.data) : error.message}`;
    }
}

module.exports = { getGeminiTutorResponse };
