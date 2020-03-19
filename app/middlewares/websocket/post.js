const PostModel = require('../../models/mongo/post.js');
const PostLogic = require('../../logic/post.js');

const Tools = require('../../helpers/tools.js');
const Controller = require('../../helpers/ws.js')();

module.exports = [
  {
    request: 'posts',
    middleware: async (params, ws) => {
      let { boardName, threadId, count, page } = params;
      ['boardName', 'count'].forEach(param => {
        if (!params[param]) {
          throw {
            message: "MISSING_PARAM",
            description: `${param} is missing`,
            code: 400
          };
        }
      });

      let postArray = [];

      if (!threadId) {
        // feed (last posts on the board)
        postArray = await PostLogic.readAll({
          boardName,
          order: 'createdAt',
          orderBy: 'DESC',
          limit: count
        });
      } else if (page && !Tools.isNumber(page) && page.toLowerCase() === "tail") {
        // last posts in the thread ("tail")
        postArray = await PostLogic.readAll({
          boardName,
          threadNumber: threadId,
          order: 'createdAt',
          orderBy: 'DESC',
          limit: count
        });
        /* Uncomment it for cutting OP form array!
          let lastPost = postArray[postArray.length - 1];
          if (lastPost.number === lastPost.threadNumber) {
            postArray.pop();
          }
        */
        postArray.reverse();
      } else {
        // just posts in a thread
        postArray = await PostModel.readPage({
          boardName,
          threadNumber: threadId,
          page,
          limit: count
        });
      }
      if (!postArray.length) {
        throw {
          code: 404
        }
      }
      let out = await Tools.sequence(postArray, PostLogic.processPost);
      return Controller.success(ws, params, out);
    }
  }, {
    request: 'post',
    middleware: async (params, ws) => {
      let { boardName, postId, postNumber } = params;
      let post;

      if (postId) {
        post = await PostModel.read({
          query:{
            _id: postId
          },
          limit: 1
        });
      } else {
        ['boardName', 'postNumber'].forEach(param => {
          if (!params[param]) {
            throw {
              message: "MISSING_PARAM",
              description: `${param} is missing`,
              code: 400
            };
          }
        });
        post = await PostModel.readOne({boardName, postNumber});
      }
      if (!post) {
        throw {
          code: 404
        }
      }
      let out = PostLogic.processPost(post);
      return Controller.success(ws, params, out);
    }
  }
];
