(function (so) {
  if (so.baka) return;
  so.baka = {
    config: {
      popupTimeout: 5000
    },
    settings: {
      base: '/',
      fetchAPI: typeof fetch === 'function', // we'd like to use fetch but it's too raw
      useHeader: true
    },
    tmp: {}
  };

  /* AJAX module */
  so.baka.AJAX = {
    request: function (method, url, data) {
      if (!method) {
        method = "GET";
      }
      url = new URL(url);
      let promise;
      if (so.baka.settings.fetchAPI) {
        new baka.popup('Ni-paa~! We don\'t support fetch() yet!\nBut we can use XHR...','info');
        so.baka.settings.fetchAPI = !1;
        return this.request(method, url, data);
      } else {
        promise = new Promise(function (resolve, reject) {
          let xhr = new XMLHttpRequest();
          xhr.timeout = 4200;
          if (method.toUpperCase() === "GET") {
            for(const pair of data.entries()) {
              url.searchParams.append(pair[0], pair[1]);
            }
          }
          xhr.open(method, url);
          if (so.baka.settings.useHeader) {
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
          }
          xhr.onload = () => resolve(xhr);
          xhr.onerror = xhr.ontimeout = () => reject(xhr);
          xhr.send(data);
        })
      }
      return promise.then(function(xhr){
        let isJSON = /json/.test(xhr.getResponseHeader('Content-Type')),
            ok = xhr.status >= 200 && xhr.status < 300;
        if (!ok)
          Promise.reject(xhr);
        return {
          ok: ok,
          response: isJSON? JSON.parse(xhr.response) : xhr.response,
          status: xhr.status,
          statusText: xhr.statusText
        };
      }).catch(function (e) {
        let out = ['( o_o)?', e];
        if(e instanceof XMLHttpRequest) {
          console.log(e);
          out = !e.status? ['Network error!', e.statusText] : e.status+' &mdash; '+e.statusText;
        }
        return Promise.reject(new baka.popup(out, 'error'));
      });
    }
  };
})(typeof so !== 'undefined' ? so : window);

(function (so) {
  /* DOM module */
  so.baka.dom = {
    add: function (el, parent) {
      parent = parent || document.body;
      parent.appendChild(el);
    },
    create: function (tag, cl, text, id) {
      let el = document.createElement(tag);
      if (cl !== null) {
        if (!Array.isArray(cl)) cl = [ cl ];
        cl.forEach(function(c) {
          el.classList.add(c || '');
        });
      }
      if (id) el.id = id;
      if (text) el.innerText = text;
      return el;
    },
    id: function(id) {
      return document.getElementById(id);
    },
    block: function(cl) {
      return document.querySelector('.'+cl);
    },
    blocks: function(cl) {
      return document.querySelectorAll('.'+cl);
    }
  };

  /* popup module */
  so.baka.popups = [];
  so.baka.popup = function (text, type, timeout) {
    if (!Array.isArray(text))
      text = [ null, text ];
    this.hideTimer = null;
    this.timeout = timeout || so.baka.config.popupTimeout;
    this.text = so.baka.dom.create('div', ['popups__popup', 'popups__popup_'+type]);
    let textEl = so.baka.dom.create('div', 'popups__text', '');
    if (text[0])
      so.baka.dom.add(so.baka.dom.create('div','popups__bold',text[0]), textEl);
    so.baka.dom.add(so.baka.dom.create('pre', null, text[1]), textEl);
    so.baka.dom.add(textEl, this.text);
    this.show();
    this.text.ondblclick = () => this.hide();
    this.text.onmousemove = () => this.resetTimeout();
  };
  so.baka.popup.prototype.show = function () {
    if (this.hideTimer) return;
    so.baka.popups.push(this);
    so.baka.dom.block('popups').appendChild(this.text);
    setTimeout(() => this.text.classList.add('popups__popup_visible'), 10);
    this.hideTimer = setTimeout(this.hide.bind(this), this.timeout);
  };
  so.baka.popup.prototype.hide = function () {
    if (!this.hideTimer) return;
    clearTimeout(this.hideTimer);
    this.hideTimer = null;
    this.text.classList.remove('popups__popup_visible');
    setTimeout(() => so.baka.dom.block('popups').removeChild(this.text), 500);
    let i = so.baka.popups.indexOf(this);
    so.baka.popups.splice(i, 1);
  };
  so.baka.popup.prototype.resetTimeout = function (timeout) {
    if (!this.hideTimer) return;
    clearTimeout(this.hideTimer);
    this.timeout = timeout || so.baka.config.popupTimeout;
    this.hideTimer = setTimeout(this.hide.bind(this), this.timeout);
  };
})(typeof so !== 'undefined' ? so : window);

baka.tmp.onload = function () {
  window.removeEventListener('load', baka.tmp.onload, false);
  let popups = baka.dom.create('div','popups');
  baka.dom.add(popups);
  new baka.popup('Hello, dev! :3','info');

  /* form submitting begins an AJAX request */
  baka.dom.blocks('create-form').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      baka.AJAX.request(this.method, this.action, new FormData(this)).then(function(data) {
        let type = (!data.ok || (typeof data.response.ok !== 'undefined' && !data.response.ok) || typeof data.response.error !== 'undefined') ? 'error': 'ok';
        new baka.popup(JSON.stringify(data.response, null, '  '), type, 1e4);
      });
      return false;
    });
  });

  let checkbox = baka.dom.id('x-requested-with');

  checkbox.onchange = function() {
    baka.settings.useHeader = checkbox.checked;
  }
};

if (document.readyState === "complete")
  baka.tmp.onload();
else
  window.addEventListener("load", baka.tmp.onload, false);
