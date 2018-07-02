const Figurecon = require('figurecon');
const packageJSON = require('../../package.json');
const path = require('path');
const os = require('os');

const ANONYMOUS = 0;
const USER = 12;
const MODER = 24;
const ADMIN = 42;

let config = {
  board: {
    boardLimit: 200, // threads
    bumpLimit: 500, // posts in a thread
    defaultUserName: "",
    lastPostsNumber: 3,
    threadLimit: 1000, // posts
    threadsPerPage: 20
  },
  debug: {
    enable: false,
    log: {
      requests: true,
      tokens: true,
      files: true
    }
  },
  db: {
    type: 'mongo', // only 'mongo' now, sorry!
    mongo: {
      url: 'mongodb://localhost:27017/foxtantest'
    }
  },
  files: {
    maxWidth: 10000,
    maxHeight: 10000,
    thumbnail: {
      extension: 'jpg',
      width: 200,
      height: 200,
      options: {
        quality: 67,
        progressive: true
      }
    },
  },
  server: {
    host: '0.0.0.0', // or 'localhost',
    output: 'port', // or 'socket'
    port: 1337,
    socket: '/tmp/sock',
    static: {
      external: false
    },
    version: packageJSON.version,
    allowedOverchans: [
      '0.0.0.0',
      'localhost'
    ]
  },
  directories: {
    root: path.resolve(__dirname, '../..') + path.sep,
    temporary: path.resolve(os.tmpdir(), 'foxtan') + path.sep,

    public: path.resolve(__dirname, '../../public') + path.sep,
    upload: path.resolve(__dirname, '../../public/res') + path.sep,
    thumb: path.resolve(__dirname, '../../public/res/thumb') + path.sep
  },
  paths: { // with forward slashes!
    public: 'http://127.0.0.1:1337/',
    upload: 'http://127.0.0.1:1337/res/',
    thumb: 'http://127.0.0.1:1337/res/thumb/'
  },
  token: {
    expires: { // d    h    m    s
      access:              12 * 60,
      refresh:  120 * 24 * 60 * 60
    },
    secret: '0n1y64k45d0n7ch4ng3p455w0rd5'
  },
  cookie: {
    signed: false,
    secret: 'p13453ch4ng3m364k4'
  },
  groups: {
    ANONYMOUS,
    USER,
    MODER,
    ADMIN
  },
  permissions: { // interactions without a password
    boards: {
      manage: ADMIN
    },
    threads: {
  //  lock: ADMIN,
  //  pin: ADMIN
    },
    posts: {
      delete: MODER
    },
  //files: {
  //  delete: MODER,
  //},
    users: {
  //  ban: MODER,
      delete: ADMIN,
      manage: ADMIN
    }
  }
};

module.exports = new Figurecon(__dirname + "/../../config.js", config);
