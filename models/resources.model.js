const { DataTypes } = require("sequelize");
const {sequelize} = require("../config/database");

const Resource = sequelize.define("Resource", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    socket_id:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    link:{
        type: DataTypes.STRING,
        allowNull: true
    },
    description:{
        type: DataTypes.STRING,
        allowNull: true
    },
    uploader: {
        type: DataTypes.STRING // You can link this to a user table if needed
    },
    roomCode: {
        type: DataTypes.STRING
    }
});

module.exports = Resource;
