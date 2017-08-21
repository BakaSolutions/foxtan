const Figurecon = require('figurecon');

let config = {
  board: {
    archiveLimit: 100, // threads
    boardLimit: 200, // threads
    bumpLimit: 500, // posts in a thread
    captchaEnabled: true,
    captchaQuota: 24, // + 1 captchas
    defaultUserName: "",
    launchDate: +new Date("2015-12-31T17:00:00Z") / 1000,
    lastPostsNumber: 3,
    maxFileCount: 0, // files
    maxFileSize: 1024 * 1024 * 20, // 20 Mb
    postQuota: 1, // post in `postTimeQuota`
    postTimeQuota: 1000 * 60, // 1 minute
    threadLimit: 1000, // posts
    threadQuota: 1, // threads in `threadTimeQuota`
    threadTimeQuota: 1000 * 60 * 60, // 1 hour
    threadsPerPage: 20
  },
  boards: {},
  db: {
    type: 'mysql', // 'mysql'
    mysql: {
      username: 'root',
      password: '',
      hostname: 'localhost',
      database: 'sobaka'
    }
  },
  fs: {
    cache: {
      exists: {
        enabled: true,
        interval: 1000 * 60 * 5 // 5 minutes
      },
      json: true
    }
  },
  log: {
    logger: console.log,
    db: {
      noerr: /ER_(NO_SUCH_TABLE|DUP_ENTRY)/
    }
  },
  markup: {
    patterns: [],
    tags: []
  },
  permissions: {},
  roles: {

  },
  server: {
    host: 'localhost',
    output: 'port',
    port: 1337,
    socket: '/tmp/sock'
  }
};

/*  ['markup.patterns',
    [
      [/h3sot/gi, '<b>H<sub>3</sub>S&Ouml;T</b>'],
      [/\(c\)/gi, '&copy;'],
      [/\(r\)/gi, '&reg;'],
      [/\(tm\)/gi, '&trade;'],
      [/&quot;(.+?)&quot;/g, '«$1»']
    ]
  ],
  ['markup.tags',
    [
      ['b'], ['i'], ['u'], ['s'], ['sup'], ['sub'],
      ['\\*\\*\\*', ['<s>','</s>']],
      ['\\*\\*', ['<b>','</b>']],
      ['\\*', ['<i>','</i>']],
      ['___', ['<u>','</u>']],
      ['__', ['<b>','</b>']],
      ['_', ['<i>','</i>']],
      ['%%', ['<span class="spoiler">', '</span>']],
      [['\\[spoiler]','\\[\\/spoiler]'], ['<span class="spoiler">', '</span>']],
    ]
  ]*/

module.exports = new Figurecon(__dirname + "/../config.js", config);
