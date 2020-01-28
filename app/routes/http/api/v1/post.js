const router = require('koa-router')({ prefix: '/api/v1/post.' });

const config = require('../../../../helpers/config');

const Controller = require('../../index');
const PostLogic = require('../../../../logic/post');
const UserLogic = require('../../../../logic/user');

router.post('create', async ctx => {
  try {
    let { body: query, token } = ctx.request;

    if (!token || typeof token.trustedPostCount === 'undefined' || !token.trustedPostCount) {
      if (Controller.isAJAXRequested(ctx)) {
        let out = {
          status: 400,
          message: 'No more posts without captcha!',
          url: '/captcha.html'
        };
        return Controller.fail(ctx, out);
      }
      return ctx.redirect('/captcha.html', 303);
    }
    query.threadNumber = +query.threadNumber;
    let {boardName, threadNumber, number} = await PostLogic.create(query, token);
    token.trustedPostCount--;
    let newToken = UserLogic.createToken(token);
    UserLogic.setToken(ctx, newToken);

    if (!Controller.isAJAXRequested(ctx) && Controller.isRedirect(query)) {
      let map = {
        ':board': boardName,
        ':thread': threadNumber,
        ':post': number
      };
      return redirect(ctx, query, /:(?:board|thread|post)/g, map);
    }

    return Controller.success(ctx, {
      boardName,
      threadNumber,
      number,
      message: 'Post was successfully created!',
      trustedPostCount: token.trustedPostCount
    });
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

['get', 'post'].forEach(method => {
  router[method]('read', async ctx => {
    try {
      if (method === 'post') {
        ctx.request.query = ctx.request.body;
      }
      let {board: boardName, post: postNumber} = ctx.request.query;
      postNumber = +postNumber;
      let out = await PostLogic.readOne({ boardName, postNumber });
      return Controller.success(ctx, out);
    } catch (e) {
      return Controller.fail(ctx, e);
    }
  });
});


router.post('delete', async ctx => {
  try {
    let { body: query, token } = ctx.request;

    let grantedUser = UserLogic.hasPermission(token, config('permissions.posts.delete'));

    let out = await PostLogic.delete(query, !grantedUser);

    if (Controller.isRedirect(query)) {
      return await redirect(ctx, query);
    }

    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

async function redirect(ctx, query, regexp, map) {
  if (!Controller.isRedirect(query)) {
    return false;
  }
  return new Promise(resolve => {
    if (typeof map !== 'undefined') {
      query.redirect = query.redirect.replace(regexp, m => map[m]);
    }
    return resolve(ctx.redirect(query.redirect));
  })
}

module.exports = router;
