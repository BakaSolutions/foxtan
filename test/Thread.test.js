const { describe, it, beforeEach } = require('zunit');
const assert = require('assert');

const ThreadModelMock = require('./mocks/ThreadModel.js');
const ThreadService = require('../app/Application/Service/ThreadService.js');
const ThreadDTO = require('../app/Domain/DTO/ThreadDTO.js');

const validThread = {
  boardName: 'test',
  pinned: null,
  modifiers: []
};

describe('ThreadService', async () => {

  let threadModel = new ThreadModelMock();
  let threadService = new ThreadService(threadModel);

  beforeEach(async () => {
    await threadModel.flush();
  });

  describe('create()', async () => {

    it('creates a thread with a right values', async () => {
      let input = ThreadDTO.from(validThread);

      let threadId = await threadService.create(input);

      assert.strictEqual(threadId, 1);
    });

    it('does not create a thread without a board name', async () => {
      let input = ThreadDTO.from({
        pinned: null,
        modifiers: []
      });

      let promise = threadService.create(input);

      await assert.rejects(promise, /Board name is not present/);
    });
  });

  describe('readOneById()', async () => {

    it('reads a thread by valid id', async () => {
      let input = ThreadDTO.from(validThread);

      let threadId = await threadService.create(input);
      let thread = await threadService.readOneById(threadId);

      assert(thread instanceof ThreadDTO);
      assert.strictEqual(thread.boardName, input.boardName);
    });

    it('does not read a thread by invalid name (undefined)', async () => {
      let promise = threadService.readOneById();

      await assert.rejects(promise, /TypeError/);
    });

    it('does not read a thread by invalid id (number)', async () => {
      let promise = threadService.readOneById(-24);

      await assert.rejects(promise, /TypeError/);
    });

  });

});

