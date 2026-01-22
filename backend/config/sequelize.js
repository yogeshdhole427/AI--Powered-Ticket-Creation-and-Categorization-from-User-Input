const { Sequelize } = require('sequelize');
const config = require('./database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    dialectOptions: dbConfig.dialectOptions,
    pool: {
      max: 10,
      min: 0,
      acquire: 40000,
      idle: 10000
    }
  }
);

// Test connection
sequelize.authenticate()
  .then(() => console.log('✅ PostgreSQL connected successfully'))
  .catch(err => {
    console.error('❌ PostgreSQL connection error:', err.message);
    console.error('Please check your .env configuration and database credentials.');
  });

module.exports = sequelize;