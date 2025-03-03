const ffmpeg = require("fluent-ffmpeg");
const whisper = require("whisper-node");
const Filter = require("bad-words");
const nsfw = require("nsfwjs");
const tf = require("@tensorflow/tfjs-node");
const fs = require("fs");

// Initialize Profanity Filter
const filter = new Filter();

// Extract Audio from Video
const extractAudio = (videoPath, audioPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .output(audioPath)
            .noVideo()
            .audioCodec("aac")
            .on("end", () => resolve(audioPath))
            .on("error", reject)
            .run();
    });
};

// Transcribe Audio to Text
const transcribeAudio = async (audioPath) => {
    const result = await whisper.transcribe(audioPath);
    return result.text;
};

// Check for Offensive Words
const containsBannedWords = (text) => filter.isProfane(text);

// Extract Frames from Video
const extractFrames = (videoPath, outputFolder) => {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .output(`${outputFolder}/frame-%03d.jpg`)
            .fps(1)
            .on("end", () => resolve())
            .on("error", reject)
            .run();
    });
};

// Check Frames for NSFW Content
const checkFramesForNSFW = async (folderPath) => {
    const model = await nsfw.load();
    const files = fs.readdirSync(folderPath);

    for (let file of files) {
        const image = fs.readFileSync(`${folderPath}/${file}`);
        const tensor = tf.node.decodeImage(image);
        const predictions = await model.classify(tensor);
        
        const nsfwScore = predictions.find((p) => p.className === "Porn")?.probability || 0;
        if (nsfwScore > 0.7) return true; // NSFW content detected
    }

    return false;
};

// Check if Image is NSFW
const isNSFWImage = async (imagePath) => {
    const model = await nsfw.load();
    const image = fs.readFileSync(imagePath);
    const tensor = tf.node.decodeImage(image);
    const predictions = await model.classify(tensor);
    
    const nsfwScore = predictions.find((p) => p.className === "Porn")?.probability || 0;
    return nsfwScore > 0.7;
};

module.exports = { extractAudio, transcribeAudio, containsBannedWords, extractFrames, checkFramesForNSFW, isNSFWImage };
