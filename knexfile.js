const config = require('./app/helpers/config.js');

const dbType = config('db.type');
const { url } = config(`db.${dbType}`);

module.exports = {

  development: {
    client: dbType || 'pg',
    connection: url,
    migrations: {
      directory: './db/migrations',
      tableName: 'migrations'
    },
    seeds: {
      directory: './db/seeds'
    }
  },

  production: {
    client: dbType || 'pg',
    connection: url,
    migrations: {
      directory: './db/migrations',
      tableName: 'migrations'
    }
  }

};
