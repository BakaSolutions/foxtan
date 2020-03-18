const PostModel = require('../../models/mongo/post.js');
const PostLogic = require('../../logic/post.js');

const Tools = require('../../helpers/tools.js');
const Controller = require('../../helpers/ws.js')();

module.exports = [
  {
    request: 'posts',
    middleware: async (params, ws) => {
      let { boardName, threadId, count, page } = params;
      ['boardName', 'threadId', 'count'].forEach(param => {
        if (!params[param]) {
          throw {
            message: "MISSING_PARAM",
            description: `${param} is missing`,
            code: 400
          };
        }
      });

      if (page && !Tools.isNumber(page) && page.toLowerCase() === "tail") {
        let postArray = await PostLogic.readAll({
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
        let out = await Tools.sequence(postArray, PostLogic.processPost);
        return Controller.success(ws, params, out);
      }

      let postArray = await PostModel.readPage({
        boardName,
        threadNumber: threadId,
        page,
        limit: count
      });
      let out = await Tools.sequence(postArray, PostLogic.processPost);
      return Controller.success(ws, params, out);
    }
  }, {
    request: 'post',
    middleware: async (params, ws) => {
      let { boardName, postId } = params;
      ['boardName', 'postId',].forEach(param => {
        if (!params[param]) {
          throw {
            message: "MISSING_PARAM",
            description: `${param} is missing`,
            code: 400
          };
        }
      });
      let post = await PostModel.readOne({boardName, postNumber: postId});
      let out = PostLogic.processPost(post);
      return Controller.success(ws, params, out);
    }
  }
];
