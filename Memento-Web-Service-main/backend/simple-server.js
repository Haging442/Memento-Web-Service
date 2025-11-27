// simple-server.js
// HTML 파일을 서빙하는 간단한 HTTP 서버

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const server = http.createServer((req, res) => {
  // auth-test.html 파일 서빙
  const filePath = path.join(__dirname, 'auth-test.html');
  
  if (req.url === '/' || req.url === '/auth-test.html') {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`🌐 HTML 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📝 브라우저에서 http://localhost:${PORT} 로 접속하세요`);
  console.log(`\n⚠️  주의: backend 서버(포트 4000)도 함께 실행되어야 합니다!`);
});