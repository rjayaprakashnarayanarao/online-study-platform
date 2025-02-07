const axios = require("axios");
require("dotenv").config();

async function getGeminiTutorResponse(topic, level) {
    try {
        console.log("📤 Sending request to Gemini AI:", { topic, level });

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,  
            {
                contents: [
                    {
                        parts: [
                            { text: `Explain ${topic} for a ${level} learner.` }
                        ]
                    }
                ]
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        // Extract the text content from the response
        const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";

        console.log("📥 Gemini Response:", reply);
        return reply;
    } catch (error) {
        console.error("❌ Gemini API Error:", error.response ? error.response.data : error.message);
        return `Gemini API failed: ${error.response ? JSON.stringify(error.response.data) : error.message}`;
    }
}


module.exports = { getGeminiTutorResponse };
