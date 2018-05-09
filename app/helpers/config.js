const Figurecon = require('figurecon');
const packageJSON = require('../../package.json');
const path = require('path');
const os = require('os');

let config = {
  board: {
    boardLimit: 200, // threads
    bumpLimit: 500, // posts in a thread
    defaultUserName: "",
    lastPostsNumber: 3,
    threadLimit: 1000, // posts
    threadsPerPage: 20
  },
  debug: true,
  debugOptions: {
    logRequests: true
  },
  db: {
    type: 'mongo', // only 'mongo' now, sorry!
    mongo: {
      url: 'mongodb://localhost:27017/foxtantest'
    }
  },
  server: {
    host: '0.0.0.0', // or 'localhost',
    output: 'port', // or 'socket'
    port: 1337,
    socket: '/tmp/sock',
    enableStatic: true,
    version: packageJSON.version
  },
  directories: {
    root: path.resolve(__dirname, '../..'),
    temporary: path.resolve(os.tmpdir(), 'foxtan'),

    public: path.resolve(__dirname, '../../public'),
    upload: path.resolve(__dirname, '../../public/res')
  },
  paths: { // with forward slashes!
    public: 'http://127.0.0.1:1337/',
    upload: 'http://127.0.0.1:1337/res/'
  }
};

module.exports = new Figurecon(__dirname + "/../../config.js", config);
