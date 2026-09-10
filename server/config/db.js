require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.MYSQL_DB || 'jobportal',
    process.env.MYSQL_USER || 'root',
    process.env.MYSQL_PASSWORD || '',
    {
        host: process.env.MYSQL_HOST || 'localhost',
        dialect: 'mysql',
        logging: false,
    }
);

async function connectDB() {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });
        console.log('DB Connected (MySQL via Sequelize)');
    } catch (err) {
        console.error('DB Connection Error', err);
        process.exit(1);
    }
}

module.exports = { connectDB, sequelize };