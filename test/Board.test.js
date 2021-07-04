const { describe, it, beforeEach } = require('zunit');
const assert = require('assert');

const BoardModelMock = require('./mocks/BoardModel.js');
const BoardService = require('../app/Application/Service/BoardService.js');
const BoardDTO = require('../app/Domain/DTO/BoardDTO.js');

const validBoard = {
  name: 'test',
  title: 'Test board'
};

describe('BoardService', async () => {

  let boardModel = new BoardModelMock();
  let boardService = new BoardService(boardModel);

  beforeEach(async () => {
    await boardModel.flush();
  });

  describe('create()', async () => {

    it('creates a board with a right values', async () => {
      let input = BoardDTO.from(validBoard);

      let boardName = await boardService.create(input);

      assert.strictEqual(boardName, input.name);
    });

    it('does not create a board without a title', async () => {
      let input = BoardDTO.from({
        name: 'test'
      });

      let promise = boardService.create(input);

      await assert.rejects(promise, /Board title is not present/);
    });
  });

  describe('readOneById()', async () => {

    it('reads a board by valid id', async () => {
      let input = BoardDTO.from(validBoard);

      let boardName = await boardService.create(input);
      let board = await boardService.readOneByName(boardName);

      assert.strictEqual(boardName, input.name);
      assert(board instanceof BoardDTO);
      assert.strictEqual(board.title, input.title);
    });

    it('does not read a board by invalid name (undefined)', async () => {
      let promise = boardService.readOneByName();

      await assert.rejects(promise, /TypeError/);
    });

    it('does not read a board by invalid id (number)', async () => {
      let promise = boardService.readOneByName(-24);

      await assert.rejects(promise, /TypeError/);
    });

  });

});
