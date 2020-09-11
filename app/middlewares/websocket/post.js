const PostLogic = require('../../logic/post.js');

const Controller = require('../../helpers/ws.js')();

module.exports = [
  {
    request: 'posts',
    middleware: async (params, ws) => {
      let { boardName, threadId, count, page } = params;

      let postArray = [];

      switch (true) {
        case !!(threadId && page && page.toLowerCase() === 'tail'):
          // tail (last posts in the thread)
          postArray = await PostLogic.readAllByThreadId(threadId, {count, order: 'desc'});
          postArray = postArray.reverse();
          break;
        case !!(threadId && !boardName):
          // just posts in a thread
          postArray = await PostLogic.readAllByThreadId(threadId, {count, page});
          break;
        case !!(!threadId && boardName):
          // feed (last posts on the board)
          postArray = await PostLogic.readAllByBoardName(boardName, {count, page, order: 'desc'});
          break;
        default:
          throw {
            message: "MISSING_PARAM",
            description: "threadId or boardName is missing",
            code: 400
          };
      }

      if (!postArray.length) {
        throw {
          code: 404
        }
      }
      return Controller.success(ws, params, postArray);
    }
  }, {
    request: 'post',
    middleware: async (params, ws) => {
      let { boardName, postId, number } = params;
      let post;

      switch (true) {
        case !!(postId):
          post = await PostLogic.readOneById(postId);
          break;
        case !!(boardName && number):
          post = await PostLogic.readOneByBoardAndPost(boardName, number);
          break;
        default:
          throw {
            message: "MISSING_PARAM",
            description: `postId or boardName/number is missing`,
            code: 400
          };
      }
      return Controller.success(ws, params, post);
    }
  }
];
