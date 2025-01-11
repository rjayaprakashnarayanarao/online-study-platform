const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: false
});

// Sync Models
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Synchronize all models
    await sequelize.sync({ alter: true }); // `alter: true` updates tables without dropping them
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, syncDatabase };