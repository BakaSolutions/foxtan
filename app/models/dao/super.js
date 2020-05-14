const config = require('../../helpers/config.js');

class DAO {

  constructor(connection, schema) {
    this._connection = connection;
    this._schema = schema;
  }

  async _executeQuery(template, values, {raw = false} = {}) {
    const start = +new Date;
    const query = await this._connection.query(template, values);

    const ms = +new Date - start;
    template = template
      .replace(/\$([0-9])/g, (_, i) => values[--i]) // substitute all $1 with values
      .replace(/\n/g, ' '); // remove `-template line breaks

    if (config('debug.enable') && config('debug.log.database')) {
      console.log(`[SQL] [${('' + ms).padStart(3)} ms] "${template}"`);
    }
    return raw ? query : query.rows;
  }

  _limitOffset(template, values, { count, page } = {}) {
    if (count) {
      let i = values.length;
      template += ` LIMIT $${++i}`;
      values.push(+count);
      if (page) {
        template += ` OFFSET $${++i}`;
        values.push(+(page * count));
      }
    }
    return [ template, values ];
  }

  _orderBy(template, values, { orderBy, order } = {}) {
    if (orderBy) {
      template += ` ORDER BY ${orderBy}`;
      if (typeof order === "string" && order.toUpperCase() === "DESC") {
        template += ` DESC`;
      }
    }
    return [ template, values ];
  }

}

module.exports = DAO;
