const config = require('../helpers/config');

let Index = module.exports = {};

Index.index = () => {
  return {
    engine: 'Foxtan/' + config('server.version'),
    res: config('paths.upload'),
    thumb: config('paths.thumb'),
    ws: config('paths.ws')
  };
};
