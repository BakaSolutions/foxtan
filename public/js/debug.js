function onload() {
  let textarea = document.getElementsByTagName('textarea')[0];
  let input = document.getElementsByTagName('input')[0];

  let websocket = new WebSocket("ws://localhost:6749/ws");
  function display(message, type = '', {ln = true} = {}) {
    let json = message;
    try {
      json = JSON.stringify(JSON.parse(message), null, "  ").replace(/\n/g, '\n  ');
    } catch {
      //
    }
    switch (type) {
      case "incoming":
        type = "> ";
        break;
      case "outcoming":
        type = "< ";
        break;
    }
    if (ln) textarea.value += "\n";
    textarea.value += type + json;
    textarea.scrollTop = textarea.scrollHeight;
    return message;
  }
  websocket.onopen = async () => {
    display("Connection established: " + websocket.url + ".", "", {ln: false});
    let sequence = async (items, func) => {
      let out = [];
      for (const promise of items) {
        out.push(await func(promise));
      }
      return out;
    };
    let delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    let waitForResponse = ms => new Promise((resolve, reject) => {
      let timeout = setTimeout(reject, ms);
      let func = () => {
        clearTimeout(timeout);
        window.removeEventListener('message', func);
        resolve();
      };
      websocket.addEventListener('message', func);
    });

    let arr = [
        /* 400 */ '{"request": "sync"}',
        /* OK  */ '{"request": "sync", "type": "board"}',
        /* 400 */ '{"request": "sync", "type": "thread"}',
        /* OK  */ '{"request": "sync", "type": "thread", "boardName":"test"}',
        /* OK  */ '{"request": "boards"}',
        /* 400 */ '{"request": "board"}',
        /* OK  */ '{"request": "board", "name": "test"}',
        /* 400 */ '{"request": "threads"}',
        /* 400 */ '{"request": "threads", "boardName": "test"}',
        /* OK  */ '{"request": "threads", "boardName": "test", "page": 0}',
        /* OK  */ '{"request": "threads", "boardName": "test", "count": 3, "page": 0}',
        /* 400 */ '{"request": "thread"}',
        /* 400 */ '{"request": "thread", "boardName": "test"}',
/* API MISMATCH */ '{"request": "thread", "boardName": "test", "id": 1}',
    ];
    await sequence(arr, async cmd => {
      websocket.send(display(cmd, "outcoming"));
      await waitForResponse(1000).catch(() => display("\n\n^^^ POSSIBLE PROBLEM ^^^\n\n"));
    })
  };
  websocket.onmessage = (e) => {
    try {
      display(e.data, "incoming");
    } catch (e) {
      display(e.data, "[ERR] ");
    }
  };
  websocket.onclose = e => {
    display("Connection closed with code " + e.code + ".");
  };
  window.onunload = () => websocket.close();

  input.addEventListener("keyup", event => {
    if (event.key !== "Enter") {
      return;
    }

    display(input.value, "outcoming");
    websocket.send(input.value);
    input.value = '';
  });
}

if (document.readyState === "complete")
  onload();
else
  window.addEventListener("load", onload, false);
