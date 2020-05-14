const router = require('koa-router')();

const HTTP = require('../index');
const PostLogic = require('../../../logic/post');
const UserLogic = require('../../../logic/user');

router.post('/api/createPost', async ctx => {
  try {
    let { body: query, token } = ctx.request;

    if (!token || typeof token.trustedPostCount === 'undefined' || !token.trustedPostCount) {
      if (HTTP.isAJAXRequested(ctx)) {
        let error = {
          status: 400,
          message: 'No more posts without captcha!',
          url: '/captcha.html'
        };
        return HTTP.fail(ctx, { error });
      }
      return ctx.redirect('/captcha.html', 303);
    }

    query.threadNumber = +query.threadNumber;
    let {boardName, threadNumber, number} = await PostLogic.create(query, token);
    token.trustedPostCount--;
    let newToken = UserLogic.createToken(token);
    UserLogic.setToken(ctx, newToken);

    if (!HTTP.isAJAXRequested(ctx)) {
      let map = {
        ':board': boardName,
        ':thread': threadNumber,
        ':post': number
      };
      return HTTP.redirect(ctx, query, /:(?:board|thread|post)/g, map);
    }

    const out = {
      boardName,
      threadNumber,
      number,
      message: 'Post was successfully created!',
      trustedPostCount: token.trustedPostCount
    };
    return HTTP.success(ctx, out);
  } catch (e) {
    return HTTP.fail(ctx, e);
  }
});

module.exports = router;
