const { Client } = require('pg');

const config = require('../../../app/helpers/config.js');

class Connection {

  constructor(credentials = {}) {
    return (async () => {
      credentials = Object.assign({
        connectionString: config('db.pg.url')
      }, credentials);

      const client = new Client(credentials);
      await client.connect();

      return client;
    })();
  }
}

module.exports = Connection;
