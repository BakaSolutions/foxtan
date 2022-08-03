const config = require('../Config.js');
const DEBUG = config.get('debug.enable') && config.get('debug.log.database');

class DialectPostgre {

  constructor(connection) {
    this.connection = connection;
  }

  transactionBegin() {
    return this.connection.query('BEGIN');
  }

  transactionEnd() {
    return this.connection.query('COMMIT');
  }

  transactionRollback() {
    return this.connection.query('ROLLBACK');
  }

  async executeQuery(template, values, {raw = false} = {}) {
    template = template.trim().replace(/^ {4,}/gm, '').replace(/\n/g, ' ');
    if (DEBUG) {
      console.log(`[DB] Template: "${template}"`);
      console.log(`[DB] Values:   "${values.join(',') || '<empty>'}"`);
    }
    const query = await this.connection.query(template, values);
    return raw ? query : query.rows;
  }

  static in(template, values) {
    template += ` IN ($`;
    template += values.map((_, i) => ++i).join('. $');
    template += ')';
    return [ template, values ];
  }

  static limitOffset(template, values, { count, page } = {}) {
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

  static orderBy(template, values, { orderBy, order } = {}) {
    if (orderBy) {
      template += ` ORDER BY ${orderBy}`;
      if (typeof order === "string" && order.toUpperCase() === "DESC") {
        template += ` DESC`;
      }
    }
    return [ template, values ];
  }

}

module.exports = DialectPostgre;