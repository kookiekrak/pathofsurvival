// Server Module: SQLite Persistence, Static File Server, REST API & Core Utilities
const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { WebSocketServer } = require('ws');
const GameData = require('../public/shared/gameData.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const THREE_DIR = path.join(__dirname, '..', 'node_modules', 'three');
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_PATH = path.join(DATA_DIR, 'wraeclast.sqlite');
const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    class_id TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    xp_next INTEGER NOT NULL DEFAULT 320,
    passive_points INTEGER NOT NULL DEFAULT 2,
    passives_json TEXT NOT NULL,
    equipment_json TEXT NOT NULL,
    inventory_json TEXT NOT NULL,
    currencies_json TEXT NOT NULL,
    gem_links_json TEXT NOT NULL,
    support_reserve_json TEXT NOT NULL,
    gold INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_characters_account ON characters(account_id, updated_at DESC);
  DROP INDEX IF EXISTS idx_characters_account_name;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_characters_account_name_class ON characters(account_id, lower(name), class_id);
`);

const stmtListCharacters = db.prepare(`
  SELECT id, account_id, name, class_id, level, xp, xp_next, passive_points, equipment_json, inventory_json, currencies_json, gold, updated_at
  FROM characters
  WHERE account_id = ?
  ORDER BY updated_at DESC
  LIMIT 16
`);
const stmtGetCharacterById = db.prepare(`SELECT * FROM characters WHERE id = ?`);
const stmtGetCharacterByName = db.prepare(`SELECT * FROM characters WHERE account_id = ? AND lower(name) = lower(?) AND class_id = ?`);
const stmtUpsertCharacter = db.prepare(`
  INSERT INTO characters (
    id, account_id, name, class_id, level, xp, xp_next, passive_points,
    passives_json, equipment_json, inventory_json, currencies_json,
    gem_links_json, support_reserve_json, gold, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    level = excluded.level,
    xp = excluded.xp,
    xp_next = excluded.xp_next,
    passive_points = excluded.passive_points,
    passives_json = excluded.passives_json,
    equipment_json = excluded.equipment_json,
    inventory_json = excluded.inventory_json,
    currencies_json = excluded.currencies_json,
    gem_links_json = excluded.gem_links_json,
    support_reserve_json = excluded.support_reserve_json,
    gold = excluded.gold,
    updated_at = excluded.updated_at
`);
const stmtDeleteCharacter = db.prepare(`DELETE FROM characters WHERE id = ? AND account_id = ?`);

function saveCharacterToDb(player) {
  if (!player || !player.characterId) return;
  try {
    stmtUpsertCharacter.run(
      player.characterId,
      player.accountId || 'global',
      player.name,
      player.classId,
      Math.max(1, Math.floor(player.level || 1)),
      Math.max(0, Math.floor(player.xp || 0)),
      Math.max(100, Math.floor(player.xpNext || 320)),
      Math.max(0, Math.floor(player.passivePoints || 0)),
      JSON.stringify(player.passives || []),
      JSON.stringify(player.equipment || {}),
      JSON.stringify(player.inventory || []),
      JSON.stringify(player.currencies || {}),
      JSON.stringify(player.gemLinks || []),
      JSON.stringify(player.supportReserve || []),
      Math.max(0, Math.floor(player.gold || 0)),
      Date.now()
    );
  } catch (err) {
    console.error('SQLite saveCharacterToDb error:', err.message);
  }
}

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
        maxPlayers: 4,
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

// Helper utilities
let nextEntityId = 1000;
function uid(prefix = 'id') {
  return `${prefix}_${++nextEntityId}_${Math.random().toString(36).slice(2, 6)}`;
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

const ARENA_HALF = 3000;
const HIDEOUT_HALF = 550;
const exportsObj = { PORT, db, stmtListCharacters, stmtGetCharacterById, stmtGetCharacterByName, stmtUpsertCharacter, stmtDeleteCharacter, saveCharacterToDb, rooms, httpServer, wss, uid, randInt, pick, dist, ARENA_HALF, HIDEOUT_HALF };
Object.assign(global, exportsObj);
module.exports = exportsObj;
