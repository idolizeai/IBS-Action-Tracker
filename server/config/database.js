const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mssql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 30000,
    },
    dialectOptions: {
      options: {
        port: parseInt(process.env.DB_PORT || '1433', 10),
        trustServerCertificate: true,
        encrypt: process.env.DB_ENCRYPT === 'true',
      },
    },
  }
)

module.exports = sequelize;
