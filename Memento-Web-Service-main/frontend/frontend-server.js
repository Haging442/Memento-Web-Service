// frontend-server.js
// frontend 폴더에서 실행하는 간단한 HTTP 서버

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const server = http.createServer((req, res) => {
  console.log(`📥 요청: ${req.url}`);
  
  let filePath = '';
  
  // 경로 매핑
  if (req.url === '/' || req.url === '/index.html') {
    filePath = path.join(__dirname, 'daily-question-test.html');
  } 
  else if (req.url === '/daily-question-test.html') {
    filePath = path.join(__dirname, 'daily-question-test.html');
  } 
  else if (req.url === '/auth-test.html') {
    filePath = path.join(__dirname, 'auth-test.html');
  } 
  else if (req.url === '/timecapsule-test.html') {
    filePath = path.join(__dirname, 'timecapsule-test.html');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <title>404</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          h1 { color: #e74c3c; }
          a { color: #3498db; text-decoration: none; }
          a:hover { text-decoration: underline; }
          code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>❌ 404 - 페이지를 찾을 수 없습니다</h1>
        <p><strong>요청한 페이지:</strong> <code>${req.url}</code></p>
        
        <h2>📄 사용 가능한 페이지:</h2>
        <ul>
          <li><a href="/daily-question-test.html">🌟 오늘의 질문 테스트</a></li>
          <li><a href="/auth-test.html">🔐 기본 로그인 테스트</a></li>
          <li><a href="/timecapsule-test.html">🕰️ 타임캡슐 테스트</a></li>
        </ul>
        
        <hr>
        <p><small>현재 폴더: ${__dirname}</small></p>
      </body>
      </html>
    `);
    return;
  }
  
  // 파일 읽기
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`❌ 파일 읽기 실패: ${filePath}`);
      console.error(`   에러: ${err.message}`);
      
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <title>오류</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            h1 { color: #e74c3c; }
            code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
            .error-box { background: #fee; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>⚠️ 파일을 읽을 수 없습니다</h1>
          
          <div class="error-box">
            <p><strong>파일:</strong> <code>${path.basename(filePath)}</code></p>
            <p><strong>경로:</strong> <code>${filePath}</code></p>
            <p><strong>오류:</strong> ${err.message}</p>
          </div>
          
          <h2>🔧 해결 방법:</h2>
          <ol>
            <li>파일이 이 폴더에 있는지 확인하세요:<br>
                <code>${__dirname}</code></li>
            <li>파일명이 정확한지 확인하세요 (대소문자 구분)</li>
            <li>파일이 없다면 다운로드한 파일을 이 폴더에 복사하세요</li>
          </ol>
          
          <p><a href="/">← 홈으로 돌아가기</a></p>
        </body>
        </html>
      `);
      return;
    }
    
    console.log(`✅ 파일 전송 성공: ${path.basename(filePath)}`);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('\n========================================');
  console.log('🌐 Memento Frontend 서버');
  console.log('========================================');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📁 폴더: ${__dirname}`);
  console.log('');
  console.log('📄 사용 가능한 페이지:');
  console.log(`   • http://localhost:${PORT}/`);
  console.log(`   • http://localhost:${PORT}/daily-question-test.html`);
  console.log(`   • http://localhost:${PORT}/timecapsule-tset.html`);
  console.log('');
  console.log('⚠️  Backend API 서버도 함께 실행해야 합니다!');
  console.log('   → backend 폴더에서: npm run dev');
  console.log('========================================\n');
  
  // 파일 존재 확인
  console.log('📂 파일 확인:');
  const files = [
  'daily-question-test.html',
  'auth-test.html',
  'timecapsule-test.html'
];

  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - 파일이 없습니다!`);
    }
  });
  console.log('');
});

// 에러 핸들링
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ 포트 ${PORT}이 이미 사용 중입니다!`);
    console.error('   다른 프로그램을 종료하거나 다른 포트를 사용하세요.\n');
  } else {
    console.error('\n❌ 서버 오류:', err.message, '\n');
  }
  process.exit(1);
});