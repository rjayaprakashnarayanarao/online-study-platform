const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database')

const User = sequelize.define('Users', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    certificateName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Quizdom:{
        type: DataTypes.INTEGER
    },
    Analytix:{
        type: DataTypes.INTEGER
    },
    Rebuff:{
        type: DataTypes.INTEGER
    },
    otp:{
        type: DataTypes.INTEGER,
        allowNull:true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'Users',
    timestamps: false
});


module.exports = User;