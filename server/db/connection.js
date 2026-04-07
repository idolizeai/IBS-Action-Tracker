const sql = require('mssql');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const config = {
  server: process.env.DB_HOST || process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'IBSActionManager',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true' || true,
    enableArithAbort: true,
    encrypt: process.env.DB_ENCRYPT === 'true',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server');
  }
  return pool;
}

module.exports = { getPool, sql };
