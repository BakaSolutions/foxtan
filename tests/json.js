var assert = require('assert');
var Post = require('../models/json/post');
//var Board = require('../models/json/board');
var Thread = require('../models/json/thread');

var triggers = {};

describe('[JSON] Thread-модель [1/2]', function () {

  var fields = {
    correct: {
      boardName: 'test_u',
      text: 'Суть такова...',
      name: 'Nomad',
      email: 'nomad@ag.ru',
      password: 'izlodeiizlodei'
    }
  };
  fields.incorrect = {
    __proto__: fields.correct,
    boardName: 'test__',
    password: 'wrongPASS'
  };


  it('создаёт тред на доске', function () {
    return Thread.create(fields.correct).then(function (thread) {
      triggers.threadId = thread.thread;
      assert(thread && thread.board === fields.correct.boardName);
    });
  });

  it('не создаёт тред на несуществующей доске', function () {
    return Thread.create(fields.incorrect).catch(function (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        return assert(true);
      }
      assert(false);
    });
  });

  it('отдаёт тред', async function () {
    return Thread.read(fields.correct.boardName, triggers.threadId).then(function (thread) {
      assert(thread && Array.isArray(thread) && thread.length > 0);
    });
  });

});

describe('[JSON] Post-модель', function () {

  var fields, postId;

  before(function() {
    if (typeof triggers.threadId === 'undefined') {
      this.skip();
    }

    fields = {
      correct: {
        boardName: 'test_u',
        threadNumber: triggers.threadId,
        text: 'Post',
        name: 'Nomad',
        email: 'nomad@ag.ru',
        password: 'izlodeiizlodei'
      }
    };
    fields.halfcorrect = {
      __proto__: fields.correct,
      threadNumber: undefined
    };
    fields.incorrect = {
      __proto__: fields.correct,
      boardName: 'test__',
      password: 'wrongPASS'
    };
  });

  it('создаёт пост на доске', function () {
    return Post.create(fields.correct).then(function (post) {
      postId = post['posts_id'];
      assert(post.constructor.name === 'RowDataPacket');
    });
  });

  it('не создаёт пост на доске без указания номера треда', function () {
    return Post.create(fields.halfcorrect).then(function (post) {
      assert(post.constructor.name !== 'RowDataPacket');
    });
  });

  it('не создаёт пост на несуществующей доске', function () {
    return Post.create(fields.incorrect).catch(function (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        assert(true);
      }
    });
  });

  it('отдаёт пост', async function () {
    return Post.read(fields.correct.boardName, postId).then(function (post) {
      assert(post.constructor.name === 'RowDataPacket');
    });
  });

  it('не удаляет пост с неверным паролем', async function () {
    return Post.delete(fields.correct.boardName, postId, fields.incorrect.password).then(function(post) {
      assert.equal(post.ok, false);
    });
  });

  it('удаляет пост с верным паролем', async function () {
    return Post.delete(fields.correct.boardName, postId, fields.correct.password).then(function(post) {
      assert.equal(post.ok, true);
    });
  });

  it('не удаляет пост с верным паролем, так как его нет', async function () {
    return Post.delete(fields.correct.boardName, postId, fields.correct.password).then(function(post) {
      assert.equal(post.ok, false);
    });
  });

});


describe('[JSON] Thread-модель [2/2]', function () {

  var fields = {
    correct: {
      boardName: 'test_u',
      password: 'izlodeiizlodei'
    }
  };
  fields.incorrect = {
    __proto__: fields.correct,
    password: 'wrongPASS'
  };

  it('не удаляет тред с неверным паролем', async function () {
    return Thread.delete(fields.correct.boardName, triggers.threadId, fields.incorrect.password).then(function(thread) {
      assert.equal(thread.ok, false);
    });
  });

  it('удаляет тред с верным паролем', async function () {
    return Thread.delete(fields.correct.boardName, triggers.threadId, fields.correct.password).then(function(thread) {
      assert.equal(thread.ok, true);
    });
  });

  it('не удаляет тред с верным паролем, так как его нет', async function () {
    return Thread.delete(fields.correct.boardName, triggers.threadId, fields.correct.password).then(function(thread) {
      assert.equal(thread.ok, false);
    });
  });

});
