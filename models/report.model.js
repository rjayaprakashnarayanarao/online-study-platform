const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database')

const report = sequelize.define('reports', {
    Email:{
        type:DataTypes.STRING,
        allowNull: true
    },
    Description: {
        type: DataTypes.STRING,
        allowNull: false,
    }
});

module.exports = report;