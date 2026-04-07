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
      min: 2,
      acquire: 60000, // Increased timeout
      idle: 10000,
    },
    dialectOptions: {
      options: {
        port: parseInt(process.env.DB_PORT || '1433', 10),
        trustServerCertificate: true,
        encrypt: process.env.DB_ENCRYPT === 'true',
        connectTimeout: 30000, // 30 second connection timeout
        requestTimeout: 30000, // 30 second request timeout
      },
    },
    // Retry connection on failure
    retry: {
      max: 3,
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /ECONNRESET/,
        /ETIMEOUT/,
      ],
    },
  }
);

// Test connection on startup with retry logic
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to SQL Server successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('⚠️  Retrying in 5 seconds...');
    setTimeout(testConnection, 5000);
  }
}

testConnection();

module.exports = sequelize;
