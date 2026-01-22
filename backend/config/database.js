require('dotenv').config();

module.exports = {
  development: {
    username: process.env.PGUSER || 'ticket_user',
    password: process.env.PGPASSWORD || '88888888888888888888',
    database: process.env.PGDATABASE || 'ticket_db_fglu',
    host: process.env.PGHOST || 'dpg-d5nss0uid0rc73f7bp20-a',
    port: process.env.PGPORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },
  production: {
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};