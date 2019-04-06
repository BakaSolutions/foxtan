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

    // Create a post and decrease post count
    let out = await PostLogic.create(query, token);
    token.trustedPostCount--;

    // Set updated token
    let newToken = UserLogic.createToken(token);
    UserLogic.setToken(ctx, newToken);

    // Redirect if the request was sent via AJAX
    if (!Controller.isAJAXRequested(ctx) && Controller.isRedirect(query)) {
      let map = {
        ':board': out.boardName,
        ':thread': out.threadNumber,
        ':post': out.number
      };
      return redirect(ctx, query, /:(?:board|thread|post)/g, map);
    }

    // if not, just sent JSON string
    Controller.success(ctx, {
      boardName: out.boardName,
      threadNumber: out.threadNumber,
      number: out.number,
      message: 'Post was successfully created!',
      trustedPostCount: token.trustedPostCount
    });
  } catch (e) {
    Controller.fail(ctx, e);
  }
});

['get', 'post'].forEach(method => {
  router[method]('read', async ctx => {
    try {
      if (method === 'post') {
        ctx.request.query = ctx.request.body;
      }
      let query = ctx.request.query;

      // advanced search trigger
      if (query.id) {
        let grantedUser = UserLogic.hasPermission(ctx.request.token, config('permissions.posts.advancedSearch'));
        if (!grantedUser) {
          delete query.id;
        }
      }

      // search some posts or just one
      let out;
      if (query.last) {
        let last = query.last;
        delete query.last;
        out = await PostLogic.readLast(query, last);
      } else {
        out = await PostLogic.readOne(query);
      }

      Controller.success(ctx, out);
    } catch (e) {
      Controller.fail(ctx, e);
    }
  });
});


router.post('delete', async ctx => {
  try {
    let query = ctx.request.body;

    let grantedUser = UserLogic.hasPermission(ctx.request.token, config('permissions.posts.delete'));

    let out = await PostLogic.delete(query, !grantedUser);
    if (Controller.isRedirect(query)) {
      return await redirect(ctx, ctx.request.body);
    }
    Controller.success(ctx, out);
  } catch (e) {
    Controller.fail(ctx, e);
  }
});

function redirect(ctx, query, regexp, map) {
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
