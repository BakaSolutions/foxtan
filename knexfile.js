const config = require('./app/Infrastructure/Config.js');

const dbType = config.get('db.type');
const { url } = config.get(`db.${dbType}`);

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
