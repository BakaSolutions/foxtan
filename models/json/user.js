const crypto = require('crypto');
const config = require('../../helpers/config');
const db = require('../' + config('db.type') + '/user');

let User = module.exports = {};

/**
 * Appends a user to a JSON file
 * @param {Object} fields
 * @return {Object}
 */
User.create = async function(fields) {
  fields.password = crypto.createHmac('sha1', config(''))
      .update(fields.password)
      .digest('hex');
  let query = await db.create(fields);
  if (!query) {
    return false;
  }
  return post;
};

/**
 * Reads a user from DB
 * @param {String} login
 * @return {Object} query
 */
User.read = async function(login) {
  let queryData = await db.read(login);
  if (queryData === null || typeof queryData === 'undefined' || !queryData) {
    return [];
  }
  return queryData;
};

User.update = async function(login, fields) {
  // TODO: Create User.update
};

/**
 * Deletes a user from DB
 * @param {String} login
 * @return {Boolean}
 */
User.delete = async function(login) {
  let query = await db.delete(login);
  return query;
};
