if (document.readyState === "complete")
  onload();
else
  window.addEventListener("DOMContentLoaded", onload, false);
window.addEventListener("hashchange", onhashchange, false);

function onload() {
  Render.prerender();
  loadPage(location.hash);
}

function onhashchange() {
  loadPage(location.hash);
}

function loadPage(pageUri) {
  try {
    var page = document.querySelector('.page');
    switch (pageUri) {
      case "":
      case "#home":
        pageUri = "#home";
        page.innerHTML = Render.render('hello', {text: 42});
        break;
      case "#boards":
        page.innerHTML = Render.render('boards', {boards: {"test":{"title":"Тестовый раздел","bumpLimit":500,"fileLimit":2,"createdAt":"2019-01-04T12:34:34.472Z","hidden":false,"closed":false,"subtitle":"","defaultUsername":""}}});
        break;
      case "#users":
        page.innerHTML = Render.render('users');
        break;
      case "#bans":
        page.innerHTML = Render.render('bans');
        break;
      default:
        location.hash = '';
    }
  } catch (e) {
    page.innerHTML = Render.render('error', e);
  } finally {
    document.querySelector('.menu.vertical a.selected').classList.remove('selected', 'bold');
    document.querySelector('.menu.vertical a[href$="' + pageUri + '"]').classList.add('selected', 'bold');
  }
}

var Render = Render || {};
Render.templateFunctions = {};
Render.prerender = function () {
  var templates = document.querySelectorAll('script[type="text/template"]');
  templates.forEach(function (node) {
    Render.templateFunctions[node.id.replace('template-','')] = doT.template(node.innerHTML, null, Render.templateFunctions);
  });
};
Render.render = function (templateName, model) {
  if (!this.templateFunctions[templateName]) {
    throw new Error('No such template: ' + templateName);
  }
  return this.templateFunctions[templateName](model || {});
};
