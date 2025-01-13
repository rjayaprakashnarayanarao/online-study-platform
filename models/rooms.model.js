const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database')

const Rooms = sequelize.define('Rooms', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    admin_name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    creatorName:{
        type: DataTypes.STRING(50),
        allowNull: false
    },
    room_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    room_id:{
        type: DataTypes.STRING(20),
        allowNull: false
    },
    room_type: {
        type: DataTypes.STRING(20),
        allowNull: false
    }
}, {
    tableName: 'Rooms',
    timestamps: false
});


module.exports = Rooms;