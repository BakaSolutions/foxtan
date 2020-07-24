const config = require('../helpers/config.js');
const Tools = require('../helpers/tools.js');

const Database = {
  DAOs: {},
  connections: {}
};

Database.connect = async (type = config('db.type')) => {
  if (Database[type]) {
    return;
  }
  const connect = require(`./connections/${type}.js`);
  try {
    Database.connections[type] = await connect();
    console.log(`Connected with "${type}" database adapter.`);
  } catch (e) {
    console.log('Failed to connect')
  }
  return Database.connections[type];
};

Database.connection = (type = config('db.type')) => Database.connections[type];

Database.DAO = (table, type = config('db.type')) => {
  if (!Database.DAOs[table]) {
    return Database.createConnection(table, type);
  }
  return Database.DAOs[table];
};

Database.createConnection = (table, type = config('db.type')) => {
  if (!Database.connections[type]) {
    console.error('No connection to database. Check your config and/or DB instance.');
    process.exit(0);
  }
  try {
    const DAO = require(`./dao/${Tools.capitalize(table)}.js`);
    const connection = Database.connection(type);
    return Database.DAOs[table] = new DAO(connection, config('db.schema'));
  } catch (e) {
    //console.log(e);
  }
};

module.exports = Database;
