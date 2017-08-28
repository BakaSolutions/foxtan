module.exports = [
  {
    command: 'IDENT',
    handler: onSync
  },
  {
    command: 'SYNC',
    handler: onSync
  }
];

function onSync(command, message, ws) {
  ws.send(command);
  if (message) ws.send(message);
}