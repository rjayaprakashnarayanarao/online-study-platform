const { DataTypes } = require("sequelize");
const {sequelize} = require("../config/database"); // Ensure you have a Sequelize instance
const { all } = require("axios");

const File = sequelize.define("File", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    socket_id:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    FileName:{
        type: DataTypes.STRING,
        allowNull: true
    },
    FileSize:{
        type: DataTypes.STRING,
        allowNull: true
    },
    path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING
    },
    
    uploader: {
        type: DataTypes.STRING // You can link this to a user table if needed
    },
    roomCode: {
        type: DataTypes.STRING
    }
});

module.exports = File;
