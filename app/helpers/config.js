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
    threadLimit: 1000, // posts

    defaultUserName: "",
    lastPostsNumber: 3,
    threadsPerPage: 20
  },
  captcha: {
    ttl: 300, // seconds
    postsPerCaptcha: 24,

    width: 192,
    height: 64,
    //size: 6,
    latin: false,
    cyrillic: false,
    numbers: true,
    smallLetters: false,
    syllable: false,
    complexity: 66,
    fontPerks: false,
    noise: true,
    color: ['#f60', '#6a6', '#9de', '#6bc'],
    //color: ['#ff6ec7', '#8a2be2', '#daa520', '#ffd700', 'red', '#f5fffa'],
    background: '#233'
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
    },
    redis: {
      url: 'redis://localhost:6379/0',
      options: {},

      nodes: null,
      enableReadyCheck: false,
      maxRedirections: 16,
      scaleReads: 'master',
      retryDelayOnFailover: 100,
      retryDelayOnClusterDown: 100,
      retryDelayOnTryAgain: 100
    }
  },
  files: {
    maxWidth: 10000,
    maxHeight: 10000,
    thumbnail: {
      extension: 'jpg',
      width: 256,
      height: 256,
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
