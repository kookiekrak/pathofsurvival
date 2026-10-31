// Server Core Module: SQLite Persistence, Prepared Statements & Core Math/ID Utilities
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
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
  CREATE TABLE IF NOT EXISTS account_stash (
    account_id TEXT PRIMARY KEY,
    stash_json TEXT NOT NULL DEFAULT '[]',
    updated_at INTEGER NOT NULL DEFAULT 0
  );
`);

const stmtGetAccountStash = db.prepare(`SELECT stash_json FROM account_stash WHERE account_id = ?`);
const stmtUpsertAccountStash = db.prepare(`
  INSERT INTO account_stash (account_id, stash_json, updated_at)
  VALUES (?, ?, ?)
  ON CONFLICT(account_id) DO UPDATE SET
    stash_json = excluded.stash_json,
    updated_at = excluded.updated_at
`);

function getAccountStash(accountId) {
  const cleanId = String(accountId || 'global').slice(0, 64);
  try {
    const row = stmtGetAccountStash.get(cleanId);
    if (row && row.stash_json) {
      const parsed = JSON.parse(row.stash_json);
      if (Array.isArray(parsed)) return parsed.slice(0, 80);
    }
  } catch (err) {
    console.error('SQLite getAccountStash error:', err.message);
  }
  return [];
}

function saveAccountStash(accountId, items) {
  const cleanId = String(accountId || 'global').slice(0, 64);
  const safeArr = Array.isArray(items) ? items.slice(0, 80) : [];
  try {
    stmtUpsertAccountStash.run(cleanId, JSON.stringify(safeArr), Date.now());
  } catch (err) {
    console.error('SQLite saveAccountStash error:', err.message);
  }
}

const stmtListCharacters = db.prepare(`
  SELECT id, account_id, name, class_id, level, xp, xp_next, passive_points, equipment_json, inventory_json, currencies_json, gold, updated_at
  FROM characters
  WHERE account_id = ?
  ORDER BY updated_at DESC
  LIMIT 16
`);
const stmtListLeaderboard = db.prepare(`
  SELECT id, name, class_id, level, xp, xp_next, equipment_json, currencies_json, updated_at
  FROM characters
  ORDER BY level DESC, xp DESC, updated_at ASC
  LIMIT 120
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
    if (!player.currencies || typeof player.currencies !== 'object') {
      player.currencies = {};
    }
    player.currencies._unlockedFlasks = Array.isArray(player.unlockedFlasks) ? player.unlockedFlasks : ['life'];
    player.currencies._flaskBelt = Array.isArray(player.flaskBelt) && player.flaskBelt.length === 5
      ? player.flaskBelt
      : ['life', null, null, null, null];
    player.currencies._league = player.league === 'Hardcore' ? 'Hardcore' : 'Standard';
    player.currencies._deadHardcore = !!player.deadHardcore;
    player.currencies._bestTier = Math.max(1, Math.floor(player.bestTier || player.currencies._bestTier || 1));
    player.currencies._bossKills = Math.max(0, Math.floor(player.bossKills || player.currencies._bossKills || 0));
    if (player.slainInZone || player.currencies._slainInZone) {
      player.currencies._slainInZone = player.slainInZone || player.currencies._slainInZone;
    }

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
    if (Array.isArray(player.accountStash)) {
      saveAccountStash(player.accountId || 'global', player.accountStash);
    }
  } catch (err) {
    console.error('SQLite saveCharacterToDb error:', err.message);
  }
}

function flushAllCharactersToDb() {
  try {
    if (global.rooms && typeof global.rooms.values === 'function') {
      for (const room of global.rooms.values()) {
        for (const p of room.players.values()) {
          saveCharacterToDb(p);
        }
      }
    }
    db.exec('PRAGMA wal_checkpoint(PASSIVE);');
  } catch (err) {
    console.error('SQLite flushAllCharactersToDb error:', err.message);
  }
}

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

const exportsObj = {
  DATA_DIR,
  DB_PATH,
  db,
  stmtListCharacters,
  stmtListLeaderboard,
  stmtGetCharacterById,
  stmtGetCharacterByName,
  stmtUpsertCharacter,
  stmtDeleteCharacter,
  getAccountStash,
  saveAccountStash,
  saveCharacterToDb,
  flushAllCharactersToDb,
  uid,
  randInt,
  pick,
  dist,
  ARENA_HALF,
  HIDEOUT_HALF
};
Object.assign(global, exportsObj);
module.exports = exportsObj;
