const Sequelize = require('sequelize'),
  config = require('../helpers/config');
let db = config('db');

const sequelize = module.exports = new Sequelize(
  config(`db.${db}.database`),
  config(`db.${db}.username`),
  config(`db.${db}.password`),
  {
    host: config(`db.mysql.hostname`),
    dialect: db,

    /*pool: {
      max: 5,
      min: 0,
      idle: 10000
    },*/
  }
);
