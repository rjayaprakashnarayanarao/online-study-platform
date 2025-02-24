const { DataTypes } = require("sequelize");
const {sequelize} = require("../config/database"); // Ensure you have a Sequelize instance

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
