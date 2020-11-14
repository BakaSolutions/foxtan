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
    this.connection = await new Connection();
  }

  get context() {
    if (this._context) {
      return this._context;
    }

    let out = {
      post: require(`./${this.type}/PostModel.js`)
    };

    Object.entries(out).forEach(([key, Model]) => {
      out[key] = new Model(this.connection);
    });

    return this._context = out;
  }

}

module.exports = DatabaseContext;
