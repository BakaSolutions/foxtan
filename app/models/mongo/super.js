const mongoFactory = require('../mongo');
const mongo = mongoFactory();
const ObjectID = require('mongodb').ObjectID;

module.exports =
class SuperModel {

  constructor(type) {
    this.collection = type;
  }

  async create(fields) {
    let Model = await mongo.collection(this.collection);

    return await Model[!Array.isArray(fields) ? 'insertOne' : 'insertMany'](fields);
  }

  async count({whereKey, whereValue} = {}) {
    let Model = await mongo.collection(this.collection);

    let query = SuperModel.prepareQuery(whereKey, whereValue);

    return await Model.count(query);
  }

  async last({whereKey = null, whereValue = {}, limit = 1} = {}) {
    let Model = await mongo.collection(this.collection);

    let query = SuperModel.prepareQuery(whereKey, whereValue);

    let options = {
      limit: limit,
      sort: {
        createdAt: -1
      }
    };
    let out = await Model.findOne(query, options);
    return (out === null)
      ? 0
      : out.number;
  }

  async read({whereKey = null, whereValue, order = null, orderBy, limit = null, offset = null} = {}) {
    let Model = await mongo.collection(this.collection);

    let query = SuperModel.prepareQuery(whereKey, whereValue);

    let sortObject = null;

    if (order) {
      sortObject = {};
      sortObject[order] = (orderBy.toUpperCase() === 'ASC')
          ? 1
          : -1;
    }

    let options = {
      limit: limit,
      skip: offset,
      sort: sortObject
    };

    let out = await Model[limit === 1 ? 'findOne' : 'find'](query, options);

    let Cursor = require('mongodb/lib/cursor');
    if (out instanceof Cursor) {
      out = await out.toArray();
      // but forEach is better than toArray
      // because we can process documents as they come in
      // until we reach the end.

      out = out.map(entry => SuperModel.clearEntry(entry));
    } else if (out !== null) {
      out = SuperModel.clearEntry(out);
    }

    return out;
  }

  async update({whereKey = null, whereValue, fields} = {}) {
    let Model = await mongo.collection(this.collection);

    let query = SuperModel.prepareQuery(whereKey, whereValue);

    let type = ((query === null)
      ? fields.length
      : Object.keys(query).length) === 1
        ? 'updateOne'
        : 'updateMany';

    return await Model[type === 1 ? 'updateOne' : 'updateMany'](query, {$set: fields}, {upsert: true});
  }

  static clearEntry(entry) {
    if (ObjectID.isValid(entry['_id'])) {
      delete entry['_id'];
    }
    delete entry['password'];
    return entry;
  }

  static prepareQuery(whereKey, whereValue) {
    if (typeof whereKey === 'undefined' || whereKey === null) {
      return null;
    }
    if (!Array.isArray(whereKey)) {
      whereKey = [ whereKey ];

      if (!Array.isArray(whereValue)) {
        whereValue = [ whereValue ];
      }
    }
    let query = {};
    for (let i = 0; i < whereKey.length; i++) {
      query[whereKey[i]] = whereValue[i];
    }
    return query;
  }

};