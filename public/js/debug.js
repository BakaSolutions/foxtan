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
        '{"request": "sync", "type": "board"}',
        '{"request": "sync", "type": "thread", "boardName":"test"}',
        '{"request": "boards"}',
        '{"request": "board", "name": "test"}',
        '{"request": "threads", "boardName": "test", "count": 3, "page": 0}',
        '{"request": "thread", "boardName": "test", "id": 1}',
        '{"request": "posts", "boardName": "test", "threadId": 1, "count": 3, "page": 0}',
        '{"request": "posts", "boardName": "test", "threadId": 1, "count": 3, "page": "tail"}',
        '{"request": "post", "boardName": "test", "postId": 1}',
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
