const ThreadModelInterface = require('../../app/Adapter/Interface/ThreadModelInterface.js');
const ThreadDTO = require('../../app/Domain/DTO/ThreadDTO.js');

class ThreadModelMock extends ThreadModelInterface {

  constructor() {
    super();
    this.flush();
  }

  async create(thread) {
    let id = thread.id = this.storage.length + 1;
    this.storage.push(thread);
    return {
      id
    };
  }

  async readOneById(id) {
    let thread = this.storage.filter(thread => thread.id);
    return Array.isArray(thread)
      ? ThreadDTO.from(thread[0])
      : ThreadDTO.from(thread);
  }

  flush() {
    this.storage = [];
  }

}

module.exports = ThreadModelMock;
