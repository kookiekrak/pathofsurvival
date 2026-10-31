// Server World Module: Room Creation, Player Lifecycle, Stat Recalculation & Profile Sync
const GameData = global.GameData || require('../../public/shared/gameData.js');

function createRoom(code, roomName) {
  const room = {
    code, roomName: roomName || `${code} Instance`, state: 'HIDEOUT', selectedMapId: 'strand',
    isPrivate: false,
    craftedMap: { mapId: 'strand', rarity: 'normal', mods: [], scoured: false },
    mapModStats: null,
    players: new Map(), enemies: new Map(), projectiles: [], groundDrops: [], hazards: [],
    interactables: [], upgradeChests: [], activeBreaches: [], fxEvents: [],
    chatLog: [{ sender: 'System', text: `Welcome to ${code}. Prepare your build and click READY to open Atlas Portals!`, color: '#f2c76e' }],
    wave: 1, waveProgress: 0, runTimer: 0, runDuration: 240, spawnAccumulator: 0, bossSpawned: false, portalsOpen: false
  };
  rooms.set(code, room);
  return room;
}

createRoom('ORIATH', 'Oriath Public Sanctuary');

function createPlayer(ws, name, classId, accountId = 'global', characterId = null) {
  const cleanAccountId = String(accountId || 'global').slice(0, 64);
  const requestedName = String(name || '').trim().slice(0, 18);

  let savedRow = null;
  if (characterId) {
    try {
      savedRow = stmtGetCharacterById.get(String(characterId));
    } catch {}
  }
  const validRequestedClass = GameData.CLASSES[classId] ? classId : 'Marauder';
  if (!savedRow && requestedName) {
    try {
      savedRow = stmtGetCharacterByName.get(cleanAccountId, requestedName, validRequestedClass);
    } catch {}
  }

  // Character is permanently tied to its created classId in SQLite!
  const lockedClassId = (savedRow && GameData.CLASSES[savedRow.class_id])
    ? savedRow.class_id
    : validRequestedClass;
  const cls = GameData.CLASSES[lockedClassId];
  const starter = createStarterLoadout(lockedClassId);

  const flaskCharges = {
    life: 15,
    quicksilver: 0,
    granite: 0,
    diamond: 0,
    quartz: 0,
    silver: 0,
    amethyst: 0
  };
  let unlockedFlasks = ['life'];
  let flaskBelt = ['life', null, null, null, null];

  let passives = [cls.startNode];
  let equipment = starter.equipment;
  let inventory = starter.inventory;
  let currencies = starter.currencies;
  let league = 'Standard';
  let deadHardcore = false;
  let bestTier = 1;
  let bossKills = 0;
  let slainInZone = '';
  let level = 1;
  let xp = 0;
  let xpNext = getCharXpForLevel(1);
  let passivePoints = 2 + (cls.extraPassivePoints || 0);
  let gold = 100;
  const resolvedCharId = savedRow ? savedRow.id : uid('char');
  const resolvedName = savedRow ? savedRow.name : (requestedName || cls.name).slice(0, 18);

  if (savedRow) {
    level = Math.max(1, Math.min(100, savedRow.level || 1));
    xpNext = getCharXpForLevel(level);
    xp = Math.max(0, Math.min(xpNext - 1, savedRow.xp || 0));
    passivePoints = Math.max(0, savedRow.passive_points ?? 2);
    gold = Math.max(0, savedRow.gold ?? 100);
    try {
      const parsedPassives = JSON.parse(savedRow.passives_json || '[]');
      if (Array.isArray(parsedPassives) && parsedPassives.length > 0) {
        passives = parsedPassives;
      }
    } catch {}
    try {
      const parsedEq = JSON.parse(savedRow.equipment_json || '{}');
      if (parsedEq && typeof parsedEq === 'object') {
        equipment = { ...starter.equipment, ...parsedEq };
        for (const sl of Object.keys(equipment)) {
          if (equipment[sl]) {
            if (equipment[sl].rarity === 'unique') {
              equipment[sl] = normalizeUniqueItem(equipment[sl]);
            }
            equipment[sl] = normalizeItemAffixRanges(equipment[sl]);
          }
        }
      }
    } catch {}
    try {
      const parsedInv = JSON.parse(savedRow.inventory_json || '[]');
      if (Array.isArray(parsedInv)) {
        inventory = parsedInv.slice(0, 50).map(it => {
          if (!it) return it;
          if (it.rarity === 'unique') it = normalizeUniqueItem(it);
          return normalizeItemAffixRanges(it);
        });
      }
    } catch {}
    try {
      const parsedCur = JSON.parse(savedRow.currencies_json || '{}');
      if (parsedCur && typeof parsedCur === 'object') {
        if (Array.isArray(parsedCur._unlockedFlasks) && parsedCur._unlockedFlasks.length > 0) {
          unlockedFlasks = Array.from(new Set(['life', ...parsedCur._unlockedFlasks]));
        }
        if (Array.isArray(parsedCur._flaskBelt) && parsedCur._flaskBelt.length === 5) {
          flaskBelt = parsedCur._flaskBelt.map(fId => (fId && GameData.FLASKS.some(f => f.id === fId) ? fId : null));
        } else if (unlockedFlasks.length > 1) {
          flaskBelt = [0, 1, 2, 3, 4].map(idx => unlockedFlasks[idx] || null);
        }
        currencies = { ...starter.currencies, ...parsedCur };
        league = parsedCur._league === 'Hardcore' ? 'Hardcore' : 'Standard';
        deadHardcore = !!parsedCur._deadHardcore;
        bestTier = Math.max(1, Math.floor(parsedCur._bestTier || 1));
        bossKills = Math.max(0, Math.floor(parsedCur._bossKills || 0));
        slainInZone = parsedCur._slainInZone || '';
      }
    } catch {}

    // Normalize Skill Tree points so characters only have points earned from Character Level + Bonus/Tomes (fixes old in-run level point inflation!)
    const bonusPts = Math.max(0, Number(currencies._bonusTreePts) || 0);
    const expectedTotalPts = Math.min(45, (level - 1) + 2 + (cls.extraPassivePoints || 0) + bonusPts);
    const allocatedNonStart = Math.max(0, passives.length - 1);
    if (allocatedNonStart + passivePoints !== expectedTotalPts) {
      if (allocatedNonStart > expectedTotalPts) {
        passives = [cls.startNode];
        passivePoints = expectedTotalPts;
      } else {
        passivePoints = Math.max(0, expectedTotalPts - allocatedNonStart);
      }
    }
  }

  const flaskSlotCharges = flaskBelt.map((fId, idx) => {
    const fDef = fId ? GameData.FLASKS.find(f => f.id === fId) : null;
    const meta = Array.isArray(currencies._flaskBeltItems) ? currencies._flaskBeltItems[idx] : null;
    return (meta && meta.maxCharges) || (fDef ? fDef.maxCharges : 0);
  });
  const flaskBeltItems = Array.isArray(currencies._flaskBeltItems) && currencies._flaskBeltItems.length === 5
    ? currencies._flaskBeltItems
    : [null, null, null, null, null];
  const flaskSlotTimers = [0, 0, 0, 0, 0];

  for (const f of GameData.FLASKS) {
    flaskCharges[f.id] = (unlockedFlasks.includes(f.id) || flaskBelt.includes(f.id)) ? f.maxCharges : 0;
  }
  if (!currencies._shards || typeof currencies._shards !== 'object') {
    currencies._shards = { transmute: 0, alteration: 0, alchemy: 0, chaos: 0, exalted: 0, divine: 0 };
  }
  currencies._unlockedFlasks = unlockedFlasks;
  currencies._flaskBelt = flaskBelt;
  currencies._flaskBeltItems = flaskBeltItems;
  currencies._league = league;
  currencies._deadHardcore = deadHardcore;

  const accountStash = getAccountStash(cleanAccountId).map(it => {
    if (!it) return it;
    if (it.rarity === 'unique') it = normalizeUniqueItem(it);
    return normalizeItemAffixRanges(it);
  });

  const player = {
    id: uid('p'), characterId: resolvedCharId, accountId: cleanAccountId, ws, name: resolvedName,
    classId: lockedClassId, league, deadHardcore, bestTier, bossKills, slainInZone, ready: false,
    level, xp, xpNext, runLevel: 1, runXp: 0, runXpNext: 180, passivePoints, passives,
    unlockedFlasks, flaskBelt, flaskBeltItems, flaskSlotCharges, flaskSlotTimers,
    equipment, gemLinks: starter.gemLinks, supportReserve: starter.supportReserve,
    skillRings: [], runUpgrades: {}, gold, runGold: 0, startingRunGold: 0, earnedRunGold: 0,
    draftRerolls: 0, currentMapId: 'strand', chestsOpened: 0, nextChestCost: 50, targetChestId: null,
    pendingDrafts: [], inventory, accountStash, buybackItems: [],
    vendorStock: Array.isArray(currencies._vendorStock) && currencies._vendorStock.length === 6 ? currencies._vendorStock : [],
    currencies, x: randInt(-90, 90), y: randInt(50, 150), vx: 0, vy: 0, aimX: 0, aimY: -1,
    input: { up: false, down: false, left: false, right: false, firing: false },
    hp: 130, maxHp: 130, es: 0, maxEs: 0, esDelayTimer: 0, flaskCharges,
    activeFlasks: { quicksilver: 0, granite: 0, diamond: 0, quartz: 0 },
    shrineBuffType: null, shrineBuffTimer: 0, dashCooldown: 0, dashTimer: 0, dashDirX: 0, dashDirY: 0,
    skillTimers: {}, vaalSouls: 0, maxVaalSouls: 60, vaalLockTimer: 0, hhStacks: 0, hhTimer: 0,
    afkAnchorX: 0, afkAnchorY: 0, afkTimer: 0, targetDropId: null, kills: 0, dead: false,
    reviveProgress: 0, atkSeq: 0, lastAtkAngle: 0, stats: null
  };

  if (!Array.isArray(player.vendorStock) || player.vendorStock.length === 0) {
    generatePlayerVendorStock(player, player.bestTier || 1);
  }
  syncSkillRingsFromGemLinks(player);
  recalcPlayer(player, true);
  saveCharacterToDb(player);
  return player;
}

function recalcPlayer(player, healFull = false) {
  const s = GameData.computePlayerStats(player);

  player.stats = s;
  player.maxHp = s.maxLife;
  player.maxEs = s.maxEs;
  if (healFull) {
    player.hp = player.maxHp;
    player.es = player.maxEs;
  } else {
    player.hp = Math.min(player.hp, player.maxHp);
    player.es = Math.min(player.es, player.maxEs);
  }
}

function sendPrivateProfile(player) {
  if (!Array.isArray(player.flaskBelt) || player.flaskBelt.length !== 5) {
    player.flaskBelt = ['life', null, null, null, null];
  }
  if (!Array.isArray(player.flaskSlotCharges) || player.flaskSlotCharges.length !== 5) {
    player.flaskSlotCharges = player.flaskBelt.map(fId => {
      const fDef = fId ? GameData.FLASKS.find(f => f.id === fId) : null;
      return fDef ? fDef.maxCharges : 0;
    });
  }
  if (!Array.isArray(player.flaskSlotTimers) || player.flaskSlotTimers.length !== 5) {
    player.flaskSlotTimers = [0, 0, 0, 0, 0];
  }
  if (!Array.isArray(player.flaskBeltItems) || player.flaskBeltItems.length !== 5) {
    player.flaskBeltItems = [null, null, null, null, null];
  }
  if (!Array.isArray(player.vendorStock) || player.vendorStock.length === 0) {
    generatePlayerVendorStock(player, player.bestTier || 1);
  }
  if (player.currencies) {
    player.currencies._unlockedFlasks = player.unlockedFlasks || ['life'];
    player.currencies._flaskBelt = player.flaskBelt;
    player.currencies._flaskBeltItems = player.flaskBeltItems;
    player.currencies._vendorStock = player.vendorStock;
  }
  const nowMs = Date.now();
  if (!player._lastDbSaveMs || nowMs - player._lastDbSaveMs >= 2500) {
    player._lastDbSaveMs = nowMs;
    player._dbDirty = false;
    saveCharacterToDb(player);
  } else if (!player._dbSaveTimer) {
    player._dbDirty = true;
    player._dbSaveTimer = setTimeout(() => {
      player._dbSaveTimer = null;
      if (player._dbDirty) {
        player._lastDbSaveMs = Date.now();
        player._dbDirty = false;
        saveCharacterToDb(player);
      }
    }, 2500);
  }
  if (player.ws.readyState !== 1) return;
  const cls = GameData.CLASSES[player.classId] || GameData.CLASSES.Marauder;
  player.nextChestCost = getNextChestCost(player);
  player.ws.send(JSON.stringify({
    type: 'profile',
    playerId: player.id,
    characterId: player.characterId,
    accountId: player.accountId,
    classId: player.classId,
    league: player.league || 'Standard',
    deadHardcore: !!player.deadHardcore,
    bestTier: Math.max(1, player.bestTier || 1),
    name: player.name,
    ready: player.ready,
    level: player.level,
    xp: player.xp,
    xpNext: player.xpNext,
    runLevel: player.runLevel || 1,
    runXp: player.runXp || 0,
    runXpNext: player.runXpNext || 180,
    passivePoints: player.passivePoints,
    passives: player.passives,
    unlockedFlasks: player.unlockedFlasks || ['life'],
    flaskBelt: player.flaskBelt,
    flaskBeltItems: player.flaskBeltItems,
    flaskSlotCharges: player.flaskSlotCharges,
    flaskSlotTimers: player.flaskSlotTimers,
    equipment: player.equipment,
    gemLinks: player.gemLinks,
    skillRings: player.skillRings || [],
    runUpgrades: player.runUpgrades || {},
    gold: Math.floor(player.gold || 0),
    stashGold: Math.floor(player.gold || 0),
    runGold: Math.floor(player.runGold || 0),
    chestsOpened: player.chestsOpened || 0,
    nextChestCost: player.nextChestCost,
    rerollCost: getDraftRerollCost(player),
    tomeCost: getSkillTomeCost(player),
    gambleCosts: getGambleCosts(null, player),
    vendorStock: player.vendorStock || [],
    shards: (player.currencies && player.currencies._shards) || {},
    supportReserve: player.supportReserve,
    pendingDrafts: player.pendingDrafts,
    inventory: player.inventory,
    accountStash: player.accountStash || [],
    buybackItems: player.buybackItems || [],
    currencies: player.currencies,
    flaskCharges: player.flaskCharges,
    activeFlasks: player.activeFlasks,
    vaalSouls: player.vaalSouls || 0,
    maxVaalSouls: 60,
    vaalMaxSouls: 60,
    vaalLockTimer: +(player.vaalLockTimer || 0).toFixed(1),
    vaalSkill: cls.vaalSkill || 'vaal_cyclone',
    stats: player.stats,
    skillSetups: GameData.getPlayerGemSetups(player.gemLinks)
  }));
}

function broadcastRoomEvent(room, payload) {
  const msg = JSON.stringify(payload);
  for (const p of room.players.values()) {
    if (p.ws.readyState === 1) {
      p.ws.send(msg);
    }
  }
}

function addRoomChat(room, sender, text, color = '#e6dfd5') {
  const entry = { sender, text, color, time: Date.now() };
  room.chatLog.push(entry);
  if (room.chatLog.length > 30) room.chatLog.shift();
  broadcastRoomEvent(room, { type: 'chat_msg', entry });
}

const exportsObj = {
  createRoom,
  createPlayer,
  recalcPlayer,
  sendPrivateProfile,
  broadcastRoomEvent,
  addRoomChat
};
Object.assign(global, exportsObj);
module.exports = exportsObj;
