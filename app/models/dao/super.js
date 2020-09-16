const config = require('../../helpers/config.js');

class DAO {

  constructor(connection, schema = "public.") {
    this._connection = connection;
    this._schema = schema;
  }

  transactionBegin(connection) {
    if (!connection) {
      connection = this._connection;
    }
    console.log(`[SQL] Transaction: begin`);
    return connection.query('BEGIN');
  }

  transactionEnd(connection) {
    if (!connection) {
      connection = this._connection;
    }
    console.log(`[SQL] Transaction: commit`);
    return connection.query('COMMIT');
  }

  transactionRollback(connection) {
    if (!connection) {
      connection = this._connection;
    }
    console.log(`[SQL] Transaction: rollback`);
    return connection.query('ROLLBACK');
  }

  async _executeQuery(template, values, {raw = false} = {}) {
    const start = +new Date;
    try {
      const query = await this._connection.query(template, values);
      return raw ? query : query.rows;
    } finally {
      if (config('debug.enable') && config('debug.log.database')) {
        const ms = +new Date - start;
        let t = template
          .replace(/\$([0-9]+)/g, (_, i) => values[--i]) // substitute all $1 with values
          .replace(/\n/g, ' '); // remove `-template line breaks
        console.log(`[SQL] [${('' + ms).padStart(3)} ms] "${t}"`);
      }
    }
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
