// models/Message.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust according to your setup

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sender: {
        type: DataTypes.STRING,
        allowNull: false
    },
    messageType: {
        type: DataTypes.STRING, // 'Q' for Question, 'A' for Answer
        allowNull: false
    },
    text: {
        type: DataTypes.TEXT
    },
    audioUrl: {
        type: DataTypes.STRING
    },
    likes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    dislikes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

module.exports = Message;
