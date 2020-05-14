const config = require('./app/helpers/config.js');

const dbType = config('db.type');
const { connection } = config(`db.${dbType}`);

module.exports = {

  development: {
    client: dbType || 'pg',
    connection: {
      host: connection.host || '127.0.0.1',
      user: connection.user || 'postgres',
      password: connection.password || '',
      database: connection.database || 'foxtantest'
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'migrations'
    },
    seeds: {
      directory: './db/seeds/dev'
    }
  },

  production: {
    client: dbType || 'pg',
    connection: {
      host: connection.host || '127.0.0.1',
      user: connection.user || 'postgres',
      password: connection.password || '',
      database: connection.database || 'foxtan'
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'migrations'
    }
  }

};
