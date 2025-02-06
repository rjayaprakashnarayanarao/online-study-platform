const axios = require("axios");

async function searchWikipedia(topic) {
    try {
        console.log("🔎 Searching Wikipedia for:", topic);

        // First, find the best-matching Wikipedia article
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=${encodeURIComponent(topic)}`;
        const searchResponse = await axios.get(searchUrl);

        if (searchResponse.data.query.search.length === 0) {
            return `No Wikipedia summary found for "${topic}".`;
        }

        // Get the top result's title
        const bestMatchTitle = searchResponse.data.query.search[0].title;

        // Now fetch the summary for that title
        const summaryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&titles=${encodeURIComponent(bestMatchTitle)}`;
        const summaryResponse = await axios.get(summaryUrl);

        const pages = summaryResponse.data.query.pages;
        const page = Object.values(pages)[0]; // Get the first page result

        if (page.missing) {
            return `No Wikipedia summary found for "${topic}".`;
        }

        return page.extract || `No Wikipedia summary found for "${topic}".`;

    } catch (error) {
        console.error("❌ Error fetching Wikipedia data:", error);
        return "An error occurred while fetching Wikipedia content.";
    }
}

module.exports = { searchWikipedia };