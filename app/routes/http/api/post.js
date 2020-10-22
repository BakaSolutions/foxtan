const config = require('../../../helpers/config.js');
const Tools = require('../../../helpers/tools.js');

const router = require('koa-router')({
  prefix: config('server.pathPrefix')
});

const HTTP = require('../index.js');
const PostLogic = require('../../../logic/post.js');
const UserLogic = require('../../../logic/user.js');
const CommonLogic = require('../../../logic/common.js');

router.post('api/createPost', async ctx => {
  try {
    let { body: query, token } = ctx.request;
    let isCaptchaEnabled = config('board.captcha', config(`board.${query.boardName}.captcha`, false));

    if (isCaptchaEnabled && (CommonLogic.isEmpty(token.trustedPostCount) || token.trustedPostCount < 1)) {
      if (HTTP.isAJAXRequested(ctx)) {
        throw {
          status: 400,
          message: 'No more posts without captcha!',
          url: '/captcha.html'
        };
      }
      return ctx.redirect('/captcha.html', 303);
    }

    let [boardName, threadId, number] = await PostLogic.create(query, token);
    token.trustedPostCount--;
    let newToken = UserLogic.createToken(token);
    UserLogic.setToken(ctx, newToken);

    if (HTTP.isAJAXRequested(ctx)) {
      const out = {
        boardName,
        threadId,
        number,
        message: 'Post was successfully created!',
        trustedPostCount: token.trustedPostCount
      };
      return HTTP.success(ctx, out);
    }

    let map = {
      ':board': boardName,
      ':thread': threadId,
      ':post': number
    };
    if (!HTTP.redirect(ctx, query, /:(?:board|thread|post)/g, map)) {
      return HTTP.success(ctx, 'OK');
    }
  } catch (e) {
    return HTTP.fail(ctx, e);
  }
});

router.post('api/deletePost', async ctx => {
  try {
    let { body: query, originalBody, token } = ctx.request;

    if (!query || !query.selectedPost) {
      throw {
        status: 400,
        message: `No posts to delete!`
      };
    }
    let values = Object.keys(originalBody).reduce((posts, key) => {
      let postId, boardName, postNumber;
      let [_0, _1, _2] = key.split(':');
      if (_1 && _2) {
        boardName = _1;
        postNumber = +_2;
      } else {
        postId = +_1;
      }
      posts.push({
        postId,
        boardName,
        postNumber
      });
      return posts;
    }, []);
    let results = await Tools.parallel(PostLogic.delete, values, token);
    let deleted = results.reduce((a, b) => a + b, 0);

    if (HTTP.isAJAXRequested(ctx)) {
      const out = {
        deleted,
      };
      return HTTP.success(ctx, out);
    }
    return HTTP.success(ctx, 'OK');
  } catch (e) {
    return HTTP.fail(ctx, e);
  }
});

module.exports = router;
