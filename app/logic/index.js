const config = require('../helpers/config');

let Index = module.exports = {};

Index.index = () => {
  return {
    engine: 'Foxtan/' + config('server.version'),
    paths: {
      public: config('paths.public'),
      upload: config('paths.upload'),
      thumb: config('paths.thumb')
    }
  };
};
