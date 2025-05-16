const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'public', 'index.html');
  fs.readFile(filePath, (err, content) => {
    if (err) return res.end('Error');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
  });
});

const wss = new WebSocket.Server({ server });
let clients = [];

let lastMessage = null;

wss.on('connection', ws => {
  clients.push(ws);
  console.log('[WS] Новый клиент подключён');

  // При новом подключении сразу отправляем последнее сообщение (offer/answer)
  if (lastMessage) {
    console.log('[WS] Отправка кэшированного сообщения:', lastMessage);
    ws.send(lastMessage);
  }

  ws.on('message', msg => {
    console.log('[WS] Получено сообщение:', msg);
    lastMessage = msg; // сохраняем последнее сообщение
    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
        console.log('[WS] Переслано сообщение другому клиенту');
      }
    });
  });

  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
    console.log('[WS] Клиент отключён');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
