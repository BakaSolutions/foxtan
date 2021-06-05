const { Client } = require('pg');

const config = require('../../Infrastructure/Config.js');

class Connection {

  constructor(credentials = {}) {
    return (async () => {
      credentials = Object.assign({
        connectionString: config.get('db.pg.url')
      }, credentials);

      const client = new Client(credentials);
      await client.connect();

      return client;
    })();
  }
}

module.exports = Connection;
