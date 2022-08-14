const EventEmitter = require('eventemitter3');

class EventBus extends EventEmitter {

  constructor(...args) {
    super(...args);
  }

  /**
    * Emits events for all of the keys, e.g. 'foo.bar.baz' emits 3 times:
    * 'foo', 'foo.bar' and 'foo.bar.baz'
    * @param {String} event
    * @param {*} args
    */
  emitDeep(event, ...args) {
    let eventMap = event.split('.');
    let currentEvent = '';
    let result = eventMap.map((value, index) => {
      if (index) {
        value = '.' + value;
      }
      currentEvent += value;
      return this.emit(currentEvent, ...args, event);
    });
    return result.some(r => r === true);
  };

}

module.exports = new EventBus();
