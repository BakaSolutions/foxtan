const { Client } = require('pg');

const config = require('../../helpers/config.js');

module.exports = async (credentials = {}) => {
  credentials = Object.assign({
    connectionString: config('db.pg.url')
  }, credentials);

  const client = new Client(credentials);
  await client.connect();

  return client;
};
