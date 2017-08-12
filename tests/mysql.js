var assert = require('assert');
var pool = require('../models/sql');
var config = require('../helpers/config');
var Post = require('../models/mysql/post');
var Board = require('../models/mysql/board');
var Thread = require('../models/mysql/thread');
var User = require('../models/mysql/user');

if (config('db.type') === 'mysql') {
  testMySQL();
} else {
  console.log('Skipping MySQL tests...');
  this.skip();
}

var triggers = {};

function testMySQL() {
  describe('[MySQL] MySQL-адаптер', function () {

    it('производит подключение по адресу, указанному в конфиге', function (done) {
      pool.getConnection(function (err,connection) {
        if (err) done(err);

        connection.query("SHOW TABLES LIKE 'boards'", function (err) {
          connection.release();
          if(err) done(err);
          triggers.connected = true;
          done();
        });

        connection.on('error', function(err) {
          done(err);
        });
      });
    });

  });

  describe('[MySQL] Board-модель [1/2]', function () {

    before(function () {
      if(!triggers.connected) this.skip();
    });

    var fields = {
      correct: {
        uri: 'test_u',
        title: 'Unit-testing',
        subtitle: 'This board is just for testing purposes!!1'
      }
    };
    fields.incorrect = {
      __proto__: fields.correct,
      uri: undefined
    };

    it('создаёт тестовую доску', function () {
      return Board.create(fields.correct).catch(function (err) {
        assert(err.code === 'ER_DUP_ENTRY')
      }).then(function (board) {
        assert(board.constructor.name === 'OkPacket');
        triggers.createTestBoard = true;
      });
    });

    it('не создаёт дубликат тестовой доски', async function () {
      return Board.create(fields.correct).catch(function (err) {
        assert(err.code === 'ER_DUP_ENTRY')
      });
    });

    it('отдаёт тестовую доску', async function () {
      return Board.read(fields.correct.uri).then(function (board) {
        assert(board);
      });
    });

    it('не отдаёт несуществующую тестовую доску', async function () {
      return Board.read(fields.incorrect.uri).then(function (board) {
        assert(!board);
      });
    });

  });

  describe('[MySQL] Thread-модель', function () {

    before(function () {
      if(!triggers.connected || !triggers.createTestBoard) this.skip();
    });

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


    var threadId;

    it('создаёт тред на доске', function () {
      return Thread.create(fields.correct).then(function (thread) {
        threadId = thread.insertId;
        assert(thread.affectedRows === 1);
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
      return Thread.read(fields.correct.boardName, threadId).then(function (thread) {
        assert(thread && Array.isArray(thread) && thread.length > 0);
      });
    });

    it('не удаляет тред с неверным паролем', async function () {
      return Thread.delete(fields.correct.boardName, threadId, fields.incorrect.password).then(function(thread) {
        assert.equal(thread.ok, false);
      });
    });

    it('удаляет тред с верным паролем', async function () {
      return Thread.delete(fields.correct.boardName, threadId, fields.correct.password).then(function(thread) {
        assert.equal(thread.ok, true);
      });
    });

    it('не удаляет тред с верным паролем, так как его нет', async function () {
      return Thread.delete(fields.correct.boardName, threadId, fields.correct.password).then(function(thread) {
        assert.equal(thread.ok, false);
      });
    });

  });

  describe('[MySQL] Post-модель', function () {

    before(function () {
      if(!triggers.createTestBoard) this.skip();
    });

    var fields = {
      correct: {
        boardName: 'test_u',
        threadNumber: 1,
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

    var postId;

    it('создаёт пост на доске', function () {
      return Post.create(fields.correct).then(function (post) {
        postId = post.insertId;
        assert(post.affectedRows === 1);
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

  describe('[MySQL] Board-модель [2/2]', function () {

    before(function () {
      if(!triggers.createTestBoard) this.skip();
    });

    var fields = {
      correct: 'test_u',
      incorrect: 'test__'
    };

    it('удаляет тестовую доску', async function () {
      let query = await Board.delete(fields.correct);
      assert(query.constructor.name === 'OkPacket', '(не существует?)');
    });

    it('не удаляет несуществующую тестовую доску', async function () {
      let query = await Board.delete(fields.incorrect);
      assert(query.affectedRows === 0);
    });

  });

  describe('[MySQL] User-модель', function () {

    before(function () {
      if(!triggers.connected) this.skip();
    });

    var fields = {
      correct: {
        login: 'adminium_testo',
        password: 'futureGadgetLab',
        role: 30
      }
    };
    fields.incorrect = {
      __proto__: fields.correct,
      password: 'tuft'
    };

    it('регистрирует тестового юзера', async function () {
      let query = await User.create(fields.correct).catch(function (err) {
        assert(err.code === 'ER_DUP_ENTRY')
      });
      assert(query.constructor.name === 'OkPacket');
    });

    it('не регистрирует дубликат тестового юзера', async function () {
      await User.create(fields.incorrect).catch(function (err) {
        assert(err.code === 'ER_DUP_ENTRY')
      });
    });

    it('читает тестового юзера', async function () {
      let query = await User.read(fields.correct.login);
      assert(query.role === fields.correct.role);
    });

    it('удаляет тестового юзера', async function () {
      let query = await User.delete(fields.correct.login);
      assert(query.ok, '(не существует?)');
    });

    it('не удаляет несуществующего тестового юзера', async function () {
      let query = await User.delete(fields.incorrect.login);
      assert(!query.ok);
    });

  });

}
