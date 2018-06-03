const SuperModel = require('./super');

class AttachmentModel extends SuperModel {

  constructor() {
    super('attachment');
  }

  async read({limit, clear = true} = {}) {
    return await super.read(...arguments).then(async out => {
      if (!out || !clear) {
        return out;
      }

      if (!Array.isArray(out)) {
        out = [ out ];
      }

      out = out.map(entry => this.clearEntry(entry));

      return limit !== 1
          ? out
          : out[0];
    });
  }

  async readOne({_id, clear}) {
    return await this.read({
      query: { _id },
      limit: 1,
      clear
    });
  }

  clearEntry(entry) {
    super.clearEntry(entry, true);
    delete entry.posts;
    delete entry.createdAt;
    delete entry.updatedAt;
    return entry;
  }

}

module.exports = new AttachmentModel();
