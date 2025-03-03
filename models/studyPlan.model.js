const { DataTypes } = require("sequelize");
const {sequelize} = require("../config/database");

const StudyPlan = sequelize.define("StudyPlan", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    socket_id:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    unitName:{
        type: DataTypes.STRING,
        allowNull: true
    },
    studyTime:{
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

module.exports = StudyPlan;
