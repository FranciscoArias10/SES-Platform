const { Pool } = require('pg');
require('dotenv').config();

const isInternal = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('.internal');

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ...(isInternal ? {} : { ssl: { rejectUnauthorized: false } })
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'ses',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

module.exports = pool;
