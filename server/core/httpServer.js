// Server Core Module: Static HTTP Server, REST Character/Room Endpoints & WebSocket Server
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const GameData = global.GameData || require('../../public/shared/gameData.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const THREE_DIR = path.join(__dirname, '..', '..', 'node_modules', 'three');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav'
};

const rooms = new Map();

const httpServer = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const urlPath = decodeURIComponent(parsedUrl.pathname);

  if (urlPath === '/api/characters' && req.method === 'GET') {
    const accountId = (parsedUrl.searchParams.get('accountId') || 'global').slice(0, 64);
    try {
      const rows = stmtListCharacters.all(accountId).map(r => {
        let eqCount = 0;
        try {
          const eq = JSON.parse(r.equipment_json || '{}');
          eqCount = Object.values(eq).filter(Boolean).length;
        } catch {}
        return {
          id: r.id,
          name: r.name,
          classId: r.class_id,
          level: r.level,
          xp: r.xp,
          xpNext: r.xp_next,
          passivePoints: r.passive_points,
          equippedCount: eqCount,
          gold: r.gold,
          updatedAt: r.updated_at
        };
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ characters: rows }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message, characters: [] }));
    }
    return;
  }

  if (urlPath === '/api/characters' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      if (body.length < 8192) body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const accountId = String(payload.accountId || 'global').slice(0, 64);
        const name = String(payload.name || '').trim().slice(0, 18);
        const classId = GameData.CLASSES[payload.classId] ? payload.classId : 'Marauder';

        if (!name || name.length < 2) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Character name must be at least 2 characters.' }));
          return;
        }

        const existingRows = stmtListCharacters.all(accountId);
        if (existingRows.some(r => String(r.name || '').toLowerCase() === name.toLowerCase())) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: `An Exile named "${name}" already exists on your roster.` }));
          return;
        }

        const cls = GameData.CLASSES[classId];
        const starter = createStarterLoadout(classId);
        const charId = uid('char');
        const now = Date.now();

        stmtUpsertCharacter.run(
          charId,
          accountId,
          name,
          classId,
          1,
          0,
          320,
          2,
          JSON.stringify([cls.startNode]),
          JSON.stringify(starter.equipment || {}),
          JSON.stringify(starter.inventory || []),
          JSON.stringify(starter.currencies || {}),
          JSON.stringify(starter.gemLinks || []),
          JSON.stringify(starter.supportReserve || []),
          100,
          now
        );

        const eqCount = Object.values(starter.equipment || {}).filter(Boolean).length;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          character: {
            id: charId,
            name,
            classId,
            level: 1,
            xp: 0,
            xpNext: 120,
            passivePoints: 2,
            equippedCount: eqCount,
            gold: 100,
            updatedAt: now
          }
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  if (urlPath === '/api/characters' && req.method === 'DELETE') {
    const accountId = (parsedUrl.searchParams.get('accountId') || 'global').slice(0, 64);
    const charId = (parsedUrl.searchParams.get('id') || '').slice(0, 64);
    try {
      stmtDeleteCharacter.run(charId, accountId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  if (urlPath === '/api/rooms') {
    const list = [];
    for (const room of rooms.values()) {
      const playersArr = Array.from(room.players.values());
      list.push({
        code: room.code,
        roomName: room.roomName || `${room.code} Party`,
        hostName: playersArr[0] ? playersArr[0].name : 'Oriath Host',
        state: room.state,
        mapId: room.selectedMapId,
        playerCount: room.players.size,
        maxPlayers: room.code === 'ORIATH' ? 999 : 6,
        isTown: room.code === 'ORIATH',
        wave: room.wave,
        players: playersArr.map(p => ({
          name: p.name,
          classId: p.classId,
          level: p.level,
          ready: p.ready
        }))
      });
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ rooms: list }));
    return;
  }

  if (urlPath.startsWith('/vendor/three/')) {
    const rel = urlPath.slice('/vendor/three/'.length);
    const threeFile = path.join(THREE_DIR, rel);
    if (!threeFile.startsWith(THREE_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    fs.stat(threeFile, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(threeFile);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(threeFile).pipe(res);
    });
    return;
  }

  let filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  });
});

const wss = new WebSocketServer({ server: httpServer });

const exportsObj = { PORT, PUBLIC_DIR, THREE_DIR, MIME_TYPES, rooms, httpServer, wss };
Object.assign(global, exportsObj);
module.exports = exportsObj;
