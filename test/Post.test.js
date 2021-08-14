const { describe, it, beforeEach } = require('zunit');
const assert = require('assert');

const PostModelMock = require('./mocks/PostModel.js');
const PostService = require('../app/Application/Service/PostService.js');
const PostDTO = require('../app/Domain/DTO/PostDTO.js');

const validPost = {
  subject: "Fox",
  text: "tan",
  threadId: 1
};

describe('PostService', async () => {

  let postModel = new PostModelMock();
  let postService = new PostService(postModel);

  beforeEach(async () => {
    await postModel.flush();
  });

  describe('create()', async () => {

    it('creates a post with a right values', async () => {
      let input = PostDTO.from(validPost);

      let post = await postService.create(input);

      assert.strictEqual(post.id, 1);
    });

    it('does not create a post without any text', async () => {
      let input = PostDTO.from({
        subject: "Fox"
      });

      let promise = postService.create(input);

      await assert.rejects(promise, /Neither text nor file is present/);
    });
  });

  describe('readOneById()', async () => {

    it('reads a post by valid id', async () => {
      let input = PostDTO.from(validPost);

      let post0 = await postService.create(input);
      let post = await postService.readOneById(post0.id);

      assert.strictEqual(post0.id, 1);
      assert(post instanceof PostDTO);
      assert.strictEqual(post.subject, input.subject);
      assert.strictEqual(post.text, input.text);
    });

    it('does not read a post by invalid id (not a number)', async () => {
      let promise = postService.readOneById('fox');

      await assert.rejects(promise, /id must be a Number/);
    });

    it('does not read a post by invalid id (number)', async () => {
      let promise = postService.readOneById(-24);

      await assert.rejects(promise, /id must be more than 0/);
    });

  });

});
