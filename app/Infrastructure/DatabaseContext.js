class DatabaseContext {

  constructor(dbType) {
    if (!['pg'].includes(dbType)) {
      throw {
        message: 'MISCONFIG',
        description: `There are no adapters for "${dbType}" database`
      }
    }

    this.type = dbType;
  }

  async connect() {
    const Connection = require(`./${this.type}/Connection.js`);
    try {
      this.connection = await new Connection();
    } catch (e) {
      throw new Error('Can not connect to database: ' + e.message);
    }
  }

  get context() {
    if (this._context) {
      return this._context;
    }

    let out = {
      board: require(`./${this.type}/BoardModel.js`),
      thread: require(`./${this.type}/ThreadModel.js`),
      post: require(`./${this.type}/PostModel.js`)
    };

    Object.entries(out).forEach(([key, Model]) => {
      out[key] = new Model(this.connection);
    });

    return this._context = out;
  }

}

module.exports = DatabaseContext;
