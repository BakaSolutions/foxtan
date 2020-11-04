const Tools = require('../../helpers/tools.js');

const ModelInterface = require('../../interfaces/model.js');

class PostgreStrategy extends ModelInterface {

  constructor(schema, connection) {
    super();
    if (schema) {
      this.withSchema(schema);
    }
    if (connection) {
      this.withConnection(connection);
    }
  }

  withSchema(schema) {
    this._schema = schema
      ? schema + '.'
      : '';
    return this;
  }

  withTable(table) {
    this._table = table;
    return this;
  }

  withConnection(connection) {
    if (!connection) {
      throw new Error('No connection to a database');
    }
    this._connection = connection;
  }

  async create(query) {
    let { keys, values } = PostgreStrategy._prepareQuery(query);
    let { placeholders } = PostgreStrategy._prepareInsertPlaceholders(query);
    const template = `INSERT INTO ${this._schema + this._table}(${keys}) VALUES(${placeholders})`;

    return await this._executeQuery(template, values);
  }

  async read({ what = "*", where, count, max } = {}, { limit, offset, groupBy } = {}) {
    what = Tools.arrayify(what);
    if (max) {
      what.push(`MAX(${max})`);
    }
    if (count) {
      what.push(`COUNT(${count})`);
    }

    let template = `SELECT ${what.join(', ')} FROM ${this._schema + this._table}`;

    let values;
    if (where) {
      template += ' WHERE ' + PostgreStrategy._prepareSelectPlaceholders(where);
      values = Object.values(where);
    }
    if (limit) {
      template += ` LIMIT ${limit}`;
      if (offset) {
        template += ` OFFSET ${offset}`;
      }
    }
    if (groupBy) {
      template += ` GROUP BY ${groupBy}`;
    }
    let { rows } = await this._executeQuery(template, values);
    return limit === 1
      ? rows[0]
      : rows;
  }

  static _prepareQuery(query) {
    let keys = Object.keys(query).join(', ');
    let values = Object.values(query);
    return { keys, values };
  }

  async _executeQuery(template, values) {
    console.log(`SQL template: ${template}\nValues: ${values || "<none>"}`);
    return this._connection.query(template, values);
  }

  static _prepareInsertPlaceholders(obj) {
    let count = Object.keys(obj).length;
    let out = [];
    for (let i = 1; i <= count; i++) {
      out.push('$' + i);
    }
    return out.join(', ');
  }

  static _prepareSelectPlaceholders(obj) {
    let keys = Object.keys(obj);
    let out = [];
    for (let i = 1; i <= keys.length; i++) {
      let key = keys[i-1];
      if (Array.isArray(obj[key])) {
        out.push(`${key} IN (${obj[key].join(', ')})`);
      } else {
        out.push(`${key} = $${i}`);
      }
    }
    return out.join(' AND ');
  }

}

module.exports = PostgreStrategy;
