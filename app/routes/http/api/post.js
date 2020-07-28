const config = require('../../../helpers/config');
const router = require('koa-router')({
  prefix: config('server.pathPrefix')
});

const HTTP = require('../index');
const PostLogic = require('../../../logic/post');
const UserLogic = require('../../../logic/user');
const CommonLogic = require('../../../logic/common');

router.post('api/createPost', async ctx => {
  try {
    let { body: query, token } = ctx.request;
    let isCaptchaEnabled = config('board.captcha', config(`board.${query.boardName}.captcha`, false));

    if (isCaptchaEnabled && (CommonLogic.isEmpty(token.trustedPostCount) || !token.trustedPostCount)) {
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

    let [boardName, threadId, number] = await PostLogic.create(query, token);
    token.trustedPostCount--;
    let newToken = UserLogic.createToken(token);
    UserLogic.setToken(ctx, newToken);

    if (!HTTP.isAJAXRequested(ctx)) {
      let map = {
        ':board': boardName,
        ':thread': threadId,
        ':post': number
      };
      return HTTP.redirect(ctx, query, /:(?:board|thread|post)/g, map);
    }

    const out = {
      boardName,
      threadId,
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