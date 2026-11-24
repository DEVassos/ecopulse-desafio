// Servidor do jogo: entrega os arquivos do jogo e repassa /api/* para o backend do EcoPulse.
//
// Como o navegador só fala com este servidor (mesma origem), o CORS do backend não entra em jogo:
// não é preciso mexer no CORS_ORIGIN do Render nem do backend local.
//
// Uso (Node 18+, sem instalar nada):
//   node servidor.js                               → backend online (Render)
//   node servidor.js http://localhost:3000         → backend local, no mesmo PC
//   node servidor.js http://192.168.0.10:3001      → backend local em outro notebook
// Porta do jogo: 5174 (ou PORTA=8080 node servidor.js).

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BACKEND_ONLINE = 'https://ecopulse-backend-lxtx.onrender.com';
const alvo = new URL((process.argv[2] || process.env.ECOPULSE_BACKEND || BACKEND_ONLINE).replace(/\/api\/?$/, ''));
const PORTA = Number(process.env.PORTA) || 5174;
const PASTA = __dirname;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/** Repassa a requisição para o backend, sem Origin nem Referer (é um servidor falando com outro). */
function repassar(req, res) {
  const cliente = alvo.protocol === 'https:' ? https : http;
  const cabecalhos = { ...req.headers, host: alvo.host };
  delete cabecalhos.origin;
  delete cabecalhos.referer;
  const pedido = cliente.request(
    {
      protocol: alvo.protocol,
      hostname: alvo.hostname,
      port: alvo.port || undefined,
      method: req.method,
      path: req.url,
      headers: cabecalhos,
      timeout: 60000, // o Render gratuito pode levar uns 50 s para acordar
    },
    (resposta) => {
      res.writeHead(resposta.statusCode || 502, resposta.headers);
      resposta.pipe(res);
    },
  );
  pedido.on('timeout', () => pedido.destroy(new Error('tempo esgotado')));
  pedido.on('error', (erro) => {
    console.error(`[api] ${req.method} ${req.url} → falhou: ${erro.message}`);
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: { code: 'BAD_GATEWAY', message: `Sem resposta do backend ${alvo.origin}.` } }));
  });
  req.pipe(pedido);
}

/** Entrega um arquivo da pasta do jogo (index.html para "/"). Nada fora da pasta. */
function entregar(req, res) {
  let caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (caminho.endsWith('/')) caminho += 'index.html';
  const arquivo = path.join(PASTA, path.normalize(caminho));
  if (!arquivo.startsWith(PASTA + path.sep) || path.basename(arquivo) === 'servidor.js') {
    res.writeHead(404).end('Não encontrado');
    return;
  }
  fs.readFile(arquivo, (erro, conteudo) => {
    if (erro) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado');
      return;
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(conteudo);
  });
}

http
  .createServer((req, res) => (req.url === '/api' || req.url.startsWith('/api/') ? repassar(req, res) : entregar(req, res)))
  .listen(PORTA, () => {
    console.log(`Jogo:    http://localhost:${PORTA}`);
    console.log(`Backend: ${alvo.origin}  (pedidos de /api vão para lá)`);
    console.log('Deixe esta janela aberta. Ctrl+C para parar.');
  });

// O Render gratuito dorme depois de ~15 min sem pedidos. Um ping a cada 5 min mantém o backend acordado na feira.
function ping() {
  const cliente = alvo.protocol === 'https:' ? https : http;
  cliente
    .get(new URL('/health', alvo), (r) => {
      r.resume();
      if (r.statusCode !== 200) console.warn(`[ping] backend respondeu HTTP ${r.statusCode}`);
    })
    .on('error', (e) => console.warn(`[ping] backend sem resposta: ${e.message}`));
}
ping();
setInterval(ping, 5 * 60 * 1000);
