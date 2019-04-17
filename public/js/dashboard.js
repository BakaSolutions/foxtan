if (document.readyState === "complete") {
  onload();
} else {
  window.addEventListener("DOMContentLoaded", onload, false);
}

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
    var wip = 'Раздел всё ещё в разработке!';
    switch (pageUri) {
      case "":
      case "#home":
        pageUri = "#home";
        page.innerHTML = Render.render('hello', {text: 42});
        break;
      case "#boards":
        resquer('/boards.json', {parse: true}, function (error, out) {
          if (error || out.error) {
            page.innerHTML = Render.render('error', out || error);
          }
          page.innerHTML = Render.render('boards', {boards: out});
        });
        break;
      case "#users":
        resquer('/api/v1/user.readAll', {parse: true}, function (error, out) {
          if (error || out.error) {
            page.innerHTML = Render.render('error', out || error);
          }
          page.innerHTML = Render.render('users', out);
        });
        break;
      case "#bans":
        page.innerHTML = Render.render('bans', {text: wip});
        break;
      case "#reports":
        page.innerHTML = Render.render('reports', {text: wip});
        break;
      case "#settings":
        page.innerHTML = Render.render('settings', {text: wip});
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
  var templates = document.querySelectorAll('template[type="text/template"]');
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

function resquer(url, options, callback) {
  var xhr = new XMLHttpRequest();
  if (!options) options = {};
  var method = options.method || 'GET';
  var parse = options.parse || false;
  xhr.open(method, url, true);
  xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  xhr.send(options.body);

  return new Promise(function (resolve, reject) {
    xhr.onload = function () {
      var response = parse ? JSON.parse(xhr.response) : xhr.response;
      callback(null, response);
      resolve(response);
    };
    xhr.onerror = function (e) {
      callback(e);
      reject(e);
    };
  });
}