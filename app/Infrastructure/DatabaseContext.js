const Tools = require('./Tools.js');

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
      await this.initContext();
    } catch (e) {
      throw new Error('Can not connect to database: ' + e.message);
    }
  }

  async initContext() {
    let modelFiles = await Tools.requireRecursive(`app/Infrastructure/${this.type}`, {
      mask: /.+Model\.js/i
    });
    let models = {};
    modelFiles.map(Model => {
      let modelName = Model.name.replace(/Model.*/, '').toLocaleLowerCase();
      models[modelName] = new Model(this.connection);
    });
    return this.context = models;
  }

}

module.exports = DatabaseContext;
