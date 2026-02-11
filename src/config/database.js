const knex = require('knex');
require('dotenv').config();

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'auth_microservice',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
  migrations: {
    directory: './database/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './database/seeds',
  },
  // Add connection handling
  acquireConnectionTimeout: 60000,
  afterCreate: (conn, done) => {
    conn.query('SET timezone = "UTC";', (err) => {
      done(err, conn);
    });
  },
});

// Handle connection errors
db.on('query-error', (error, builder) => {
  console.error('Database query error:', error);
  if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
    console.error('Connection lost, attempting to reconnect...');
  }
});

module.exports = db;
