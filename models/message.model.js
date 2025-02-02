const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database')

const Message = sequelize.define('Message', {
    text: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sender: {  // Ensure this exists
        type: DataTypes.STRING,
        allowNull: false,
    },
    roomId: {
        type: DataTypes.UUID,
        allowNull: false,
    }
});

module.exports = Message;