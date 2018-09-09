const mongoFactory = require('../mongo');
const mongo = mongoFactory();
const ObjectID = require('mongodb').ObjectID;

module.exports =
class SuperModel {

  constructor(type) {
    this.collection = type;
    this.ObjectID = ObjectID;
  }

  async create(fields) {
    let Model = await mongo.collection(this.collection);

    return await Model[!Array.isArray(fields) ? 'insertOne' : 'insertMany'](fields);
  }

  async count({query} = {}) {
    let Model = await mongo.collection(this.collection);

    return await Model.count(query);
  }

  async last({query, limit = 1} = {}) {
    let Model = await mongo.collection(this.collection);

    let options = {
      limit,
      sort: {
        createdAt: -1
      }
    };
    let out = await Model.findOne(query, options);
    return (out === null)
      ? 0
      : out.number;
  }

  async read({query, order = null, orderBy = 'ASC', limit = null, offset = null} = {}) {
    let Model = await mongo.collection(this.collection);

    let sortObject = null;

    if (order) {
      sortObject = {};
      if (!Array.isArray(order)) {
        order = [ order ];
      }
      if (!Array.isArray(orderBy)) {
        orderBy = [ orderBy ];
      }
      for (let i = 0; i < order.length; i++) {
        let param = orderBy[i] || orderBy[0];
        sortObject[order[i]] = (param.toUpperCase() === 'ASC')
          ? 1
          : -1;
      }
    }

    let options = {
      limit,
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
    }

    return out;
  }

  async update({query, fields} = {}) {
    let Model = await mongo.collection(this.collection);

    let type = ((query === null)
      ? fields.length
      : Object.keys(query).length) === 1
        ? 'updateOne'
        : 'updateMany';

    return await Model[type === 1 ? 'updateOne' : 'updateMany'](query, {$set: fields}, {upsert: true});
  }

  async deleteOne(fields = {}) {
    let Model = await mongo.collection(this.collection);
    return await Model.deleteOne(fields);
  }

  async deleteMany(fields = {}) {
    let Model = await mongo.collection(this.collection);
    return await Model.deleteMany(fields);
  }

  clearEntry(entry, forceDelete) {
    if (forceDelete || this.ObjectID.isValid(entry._id)) {
      delete entry._id;
    }
    return entry;
  }

};
