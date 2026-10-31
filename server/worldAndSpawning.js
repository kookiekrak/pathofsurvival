// Server Module: Rooms, Players, Map Runs, Hideout Extraction, Shrines, Breaches & Monster Spawning
const GameData = require('../public/shared/gameData.js');
function createRoom(code, roomName) {
  const room = {
    code,
    roomName: roomName || `${code} Instance`,
    state: 'HIDEOUT',
    selectedMapId: 'strand',
    players: new Map(),
    enemies: new Map(),
    projectiles: [],
    groundDrops: [],
    hazards: [],
    interactables: [],
    upgradeChests: [],
    activeBreaches: [],
    fxEvents: [],
    chatLog: [
      { sender: 'System', text: `Welcome to ${code}. Prepare your build and click READY to open Atlas Portals!`, color: '#f2c76e' }
    ],
    wave: 1,
    waveProgress: 0,
    runTimer: 0,
    runDuration: 240,
    spawnAccumulator: 0,
    bossSpawned: false,
    portalsOpen: false
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
  let level = 1;
  let xp = 0;
  let xpNext = getCharXpForLevel(1);
  let passivePoints = 2 + (cls.extraPassivePoints || 0);
  let gold = 100;
  const resolvedCharId = savedRow ? savedRow.id : uid('char');
  const resolvedName = savedRow ? savedRow.name : (requestedName || cls.name).slice(0, 18);

  if (savedRow) {
    level = Math.max(1, Math.min(45, savedRow.level || 1));
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
        inventory = parsedInv.slice(0, 32).map(it => {
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

  const flaskSlotCharges = flaskBelt.map(fId => {
    const fDef = fId ? GameData.FLASKS.find(f => f.id === fId) : null;
    return fDef ? fDef.maxCharges : 0;
  });
  const flaskSlotTimers = [0, 0, 0, 0, 0];

  for (const f of GameData.FLASKS) {
    flaskCharges[f.id] = (unlockedFlasks.includes(f.id) || flaskBelt.includes(f.id)) ? f.maxCharges : 0;
  }
  currencies._unlockedFlasks = unlockedFlasks;
  currencies._flaskBelt = flaskBelt;

  const player = {
    id: uid('p'),
    characterId: resolvedCharId,
    accountId: cleanAccountId,
    ws,
    name: resolvedName,
    classId: lockedClassId,
    ready: false,
    level,
    xp,
    xpNext,
    runLevel: 1,
    runXp: 0,
    runXpNext: 180,
    passivePoints,
    passives,
    unlockedFlasks,
    flaskBelt,
    flaskSlotCharges,
    flaskSlotTimers,
    equipment,
    gemLinks: starter.gemLinks,
    supportReserve: starter.supportReserve,
    skillRings: [],
    runUpgrades: {},
    gold,
    runGold: 0,
    startingRunGold: 0,
    earnedRunGold: 0,
    draftRerolls: 0,
    currentMapId: 'strand',
    chestsOpened: 0,
    nextChestCost: 50,
    targetChestId: null,
    pendingDrafts: [],
    inventory,
    buybackItems: [],
    currencies,
    x: randInt(-90, 90),
    y: randInt(50, 150),
    vx: 0,
    vy: 0,
    aimX: 0,
    aimY: -1,
    input: { up: false, down: false, left: false, right: false, firing: false },
    hp: 130,
    maxHp: 130,
    es: 0,
    maxEs: 0,
    esDelayTimer: 0,
    flaskCharges,
    activeFlasks: { quicksilver: 0, granite: 0, diamond: 0, quartz: 0 },
    shrineBuffType: null,
    shrineBuffTimer: 0,
    dashCooldown: 0,
    dashTimer: 0,
    dashDirX: 0,
    dashDirY: 0,
    skillTimers: {},
    vaalSouls: 0,
    maxVaalSouls: 45,
    hhStacks: 0,
    hhTimer: 0,
    afkAnchorX: 0,
    afkAnchorY: 0,
    afkTimer: 0,
    targetDropId: null,
    kills: 0,
    dead: false,
    reviveProgress: 0,
    atkSeq: 0,
    lastAtkAngle: 0,
    stats: null
  };

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
  if (player.currencies) {
    player.currencies._unlockedFlasks = player.unlockedFlasks || ['life'];
    player.currencies._flaskBelt = player.flaskBelt;
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
    supportReserve: player.supportReserve,
    pendingDrafts: player.pendingDrafts,
    inventory: player.inventory,
    buybackItems: player.buybackItems || [],
    currencies: player.currencies,
    flaskCharges: player.flaskCharges,
    activeFlasks: player.activeFlasks,
    vaalSouls: player.vaalSouls || 0,
    maxVaalSouls: 45,
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

function findShortestPassivePathToNode(allocatedPassives, targetNodeId) {
  if (typeof GameData.findShortestPassivePath === 'function') {
    const res = GameData.findShortestPassivePath(allocatedPassives, targetNodeId);
    if (Array.isArray(res)) return res;
  }
  if (!targetNodeId || !GameData.PASSIVE_NODES[targetNodeId]) return [];
  if (allocatedPassives.includes(targetNodeId)) return [];

  const visited = new Set(allocatedPassives);
  const parent = new Map();
  const queue = [...allocatedPassives];

  while (queue.length > 0) {
    const curr = queue.shift();
    const def = GameData.PASSIVE_NODES[curr];
    if (!def || !Array.isArray(def.neighbors)) continue;
    for (const nb of def.neighbors) {
      if (!GameData.PASSIVE_NODES[nb] || visited.has(nb)) continue;
      visited.add(nb);
      parent.set(nb, curr);
      if (nb === targetNodeId) {
        const path = [];
        let step = targetNodeId;
        while (step && !allocatedPassives.includes(step)) {
          path.unshift(step);
          step = parent.get(step);
        }
        return path;
      }
      queue.push(nb);
    }
  }
  return [];
}

function canRemovePassiveNode(passives, nodeToRemove, startNode) {
  if (nodeToRemove === startNode) return false;
  const remaining = new Set(passives.filter(n => n !== nodeToRemove));
  if (!remaining.has(startNode)) return false;

  const visited = new Set([startNode]);
  const queue = [startNode];
  while (queue.length > 0) {
    const curr = queue.shift();
    const def = GameData.PASSIVE_NODES[curr];
    if (!def) continue;
    for (const nb of def.neighbors) {
      if (remaining.has(nb) && !visited.has(nb)) {
        visited.add(nb);
        queue.push(nb);
      }
    }
  }
  return visited.size === remaining.size;
}


// =========================================================================
// MAP RUN INITIALIZATION, SHRINES, STRONGBOXES & BREACH ENCOUNTERS
// =========================================================================
function populateMapInteractables(room) {
  room.interactables = [];
  const shrineTypes = [
    { kind: 'shrine', sub: 'acceleration', label: 'Acceleration Shrine (+Speed & CDR)', color: '#69db7c' },
    { kind: 'shrine', sub: 'diamond', label: 'Diamond Shrine (Massive Crit)', color: '#3bc9db' },
    { kind: 'shrine', sub: 'brutal', label: 'Brutal Shrine (+40% More Damage & AoE)', color: '#ff6b6b' }
  ];

  // Spawn 4 Shrines across the map (spaced cleanly within tactical exploration range)
  for (let i = 0; i < 4; i++) {
    const ang = (Math.PI * 2 * i) / 4 + (Math.random() - 0.5) * 0.35;
    const d = randInt(380, 950);
    const st = pick(shrineTypes);
    room.interactables.push({
      id: uid('shr'),
      kind: 'shrine',
      sub: st.sub,
      label: st.label,
      color: st.color,
      x: Math.round(Math.cos(ang) * d),
      y: Math.round(Math.sin(ang) * d),
      used: false
    });
  }

  // Spawn 2 PoE Strongboxes (520 to 1050 units from center, evenly spaced)
  const boxTypes = [
    { sub: 'arcanist', label: "Arcanist's Strongbox (Ambush Pack)", color: '#ffd43b' },
    { sub: 'armourer', label: "Armourer's Strongbox (Ambush Pack)", color: '#ff922b' }
  ];
  for (let i = 0; i < 2; i++) {
    const ang = Math.PI * i + 0.45 + (Math.random() - 0.5) * 0.25;
    const d = Math.round(520 + Math.random() * 520);
    const bt = boxTypes[i % boxTypes.length];
    room.interactables.push({
      id: uid('box'),
      kind: 'strongbox',
      sub: bt.sub,
      label: bt.label,
      color: bt.color,
      x: Math.round(Math.cos(ang) * d),
      y: Math.round(Math.sin(ang) * d),
      used: false
    });
  }

  // Spawn 2 Breach Hands across the map
  for (let i = 0; i < 2; i++) {
    const ang = Math.PI * i + 0.35 + (Math.random() - 0.5) * 0.25;
    const d = randInt(420, 860);
    room.interactables.push({
      id: uid('brc'),
      kind: 'breach',
      sub: 'chayula',
      label: 'Breach Hand — Click or [E] to Rip Open Breach',
      color: '#cc5de8',
      x: Math.round(Math.cos(ang) * d),
      y: Math.round(Math.sin(ang) * d),
      used: false
    });
  }

  // Spawn 4 Golden Upgrade Chests across the map (ONLY in room.upgradeChests — never duplicated in room.interactables!)
  room.upgradeChests = [];
  for (let i = 0; i < 4; i++) {
    const ang = (Math.PI * 2 * i) / 4 + 0.78 + (Math.random() - 0.5) * 0.25;
    const d = Math.round(260 + Math.random() * 420);
    const chestId = `uchest_${uid('uc')}`;
    const cx = Math.round(Math.cos(ang) * d);
    const cy = Math.round(Math.sin(ang) * d);
    room.upgradeChests.push({
      id: chestId,
      x: cx,
      y: cy,
      opened: false
    });
  }
}

function tryBuyUpgradeChest(room, player, specificChestId = null) {
  if (!player || player.dead || !Array.isArray(room.upgradeChests)) return false;

  // Require an unopened Golden Upgrade Chest and enforce physical proximity (<= 115 units)
  let targetChest = null;
  if (specificChestId) {
    targetChest = room.upgradeChests.find(c => c.id === specificChestId && !c.opened) || null;
    if (!targetChest) return false;
    const d = dist(player.x, player.y, targetChest.x, targetChest.y);
    if (d > 115) {
      // Walk to the clicked chest first before opening it!
      player.targetChestId = targetChest.id;
      player.targetDropId = null;
      return false;
    }
  } else {
    let bestD = 115;
    for (const c of room.upgradeChests) {
      if (c.opened) continue;
      const d = dist(player.x, player.y, c.x, c.y);
      if (d <= bestD) {
        bestD = d;
        targetChest = c;
      }
    }
    if (!targetChest) {
      return false;
    }
  }

  player.targetChestId = null;
  const cost = getNextChestCost(player, room);
  if ((player.runGold || 0) < cost) {
    room.fxEvents.push({
      kind: 'dmg_num',
      x: Math.round(player.x),
      y: Math.round(player.y - 28),
      val: `NEED ${cost} RUN GOLD!`,
      text: `NEED ${cost} RUN GOLD!`,
      color: '#f87171',
      size: 18,
      crit: false,
      dtype: 'evade'
    });
    return false;
  }

  player.runGold -= cost;
  player.chestsOpened = (player.chestsOpened || 0) + 1;
  player.nextChestCost = getNextChestCost(player, room);
  targetChest.opened = true;

  // Heal 25% of Max Life & Energy Shield and refill +8 Flask Charges on opening a Golden Upgrade Chest!
  player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.25));
  if (player.maxEs > 0) {
    player.es = Math.min(player.maxEs, player.es + Math.round(player.maxEs * 0.25));
  }
  for (const f of GameData.FLASKS) {
    if ((player.unlockedFlasks || ['life']).includes(f.id)) {
      player.flaskCharges[f.id] = Math.min(f.maxCharges, (player.flaskCharges[f.id] || 0) + 8);
    }
  }

  // Respawn 1 new Golden Upgrade Chest far out if fewer than 3 unopened remain
  const unopened = room.upgradeChests.filter(c => !c.opened).length;
  if (unopened < 3) {
    const ang = Math.random() * Math.PI * 2;
    const d = Math.round(550 + Math.random() * 750);
    const chestId = `uchest_${uid('uc')}`;
    const cx = Math.round(Math.cos(ang) * d);
    const cy = Math.round(Math.sin(ang) * d);
    room.upgradeChests.push({ id: chestId, x: cx, y: cy, opened: false });
  }

  room.fxEvents.push({
    kind: 'nova',
    x: Math.round(targetChest.x),
    y: Math.round(targetChest.y),
    r: 68,
    color: '#facc15'
  });
  room.fxEvents.push({
    kind: 'dmg_num',
    x: Math.round(player.x),
    y: Math.round(player.y - 30),
    val: `CHEST OPENED! (-${cost}G)`,
    text: `UPGRADE CHEST! (-${cost}G • +25% HEAL)`,
    color: '#facc15',
    size: 20,
    crit: true,
    dtype: 'lightning'
  });

  queueGemDraft(player, `Golden Upgrade Chest #${player.chestsOpened} — Choose Gem or Run Boon`);
  sendPrivateProfile(player);
  return true;
}

function activateInteractable(room, player, it) {
  if (!it || it.used) return;
  if (it.kind === 'upgrade_chest') {
    tryBuyUpgradeChest(room, player, it.id);
    return;
  }
  it.used = true;
  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];

  if (it.kind === 'shrine') {
    for (const p of room.players.values()) {
      p.shrineBuffType = it.sub;
      p.shrineBuffTimer = 25;
      recalcPlayer(p, false);
      sendPrivateProfile(p);
    }
    room.fxEvents.push({
      kind: 'nova',
      x: it.x,
      y: it.y,
      r: 110,
      color: it.color || '#69db7c'
    });
    addRoomChat(room, 'Shrine', `${player.name} activated ${it.label} for 25s!`, it.color);
  } else if (it.kind === 'strongbox') {
    addRoomChat(room, 'Ambush', `${player.name} opened ${it.label} — Ambush Guard Pack approaching from afar!`, '#ffd43b');
    // Spawn ambush guards MUCH farther out (340 to 560 units away in a perimeter ring)
    const guardCount = 7;
    for (let k = 0; k < guardCount; k++) {
      const ang = (Math.PI * 2 * k) / guardCount + (Math.random() - 0.5) * 0.3;
      const ambushDist = 340 + Math.random() * 220;
      const gx = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(it.x + Math.cos(ang) * ambushDist)));
      const gy = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(it.y + Math.sin(ang) * ambushDist)));
      spawnMonster(room, false, { x: gx, y: gy, exact: true }, k === 0 ? 'rare' : k <= 2 ? 'magic' : 'normal');
    }
    // Scarce Strongbox completion drops: main reward comes from slaying the Ambush pack!
    const dropIlvl = (mapDef.tier - 1) * 3 + Math.ceil((room.wave || 1) / 2) + 1;
    if (Math.random() < 0.25) {
      spawnGroundDrop(room, it.x, it.y + 16, 'flask');
    } else if (it.sub === 'armourer' && Math.random() < 0.35) {
      spawnGroundDrop(room, it.x - 12, it.y, 'gear', null, dropIlvl);
    } else if (Math.random() < 0.45) {
      spawnGroundDrop(room, it.x + 12, it.y, 'currency');
    }
  } else if (it.kind === 'breach') {
    room.fxEvents.push({
      kind: 'nova',
      x: it.x,
      y: it.y,
      r: 140,
      color: '#cc5de8'
    });
    if (!Array.isArray(room.activeBreaches)) room.activeBreaches = [];
    const breachObj = {
      id: `breach_${it.id}`,
      x: it.x,
      y: it.y,
      radius: 95,
      maxRadius: 480,
      duration: 20,
      maxDuration: 26,
      elapsed: 0,
      spawnTimer: 1.1,
      wavesSpawned: 1,
      kills: 0
    };
    room.activeBreaches.push(breachObj);

    // Initial Breach ring burst: 12 Breach Swarmers + 2 Magic + 1 Rare along the opening ring edge
    for (let k = 0; k < 12; k++) {
      const ang = (Math.PI * 2 * k) / 12 + (Math.random() - 0.5) * 0.25;
      const bDist = randInt(105, 165);
      spawnMonster(
        room,
        false,
        { x: it.x + Math.cos(ang) * bDist, y: it.y + Math.sin(ang) * bDist, exact: true },
        'normal',
        null,
        true
      );
    }
    for (let k = 0; k < 2; k++) {
      const ang = Math.PI * k + 0.6;
      spawnMonster(
        room,
        false,
        { x: it.x + Math.cos(ang) * 145, y: it.y + Math.sin(ang) * 145, exact: true },
        'magic',
        null,
        true
      );
    }
    spawnMonster(room, false, { x: it.x, y: it.y - 155, exact: true }, 'rare', null, true);

    addRoomChat(room, 'Breach', `${player.name} ripped open an expanding Chayula Breach Ring! Slay Breach monsters to extend the rift!`, '#cc5de8');
    broadcastRoomEvent(room, {
      type: 'announcement',
      title: 'Chayula Breach Ripped Open!',
      subtitle: 'Expanding Void Ring opened! Continuous Breach waves emerge along the ring perimeter!',
      color: '#cc5de8'
    });
  }
}

function spawnWaveLeagueEncounter(room) {
  // Spawn 1 extra encounter every 4 waves so the arena never gets cluttered with boxes!
  if (room.wave % 4 !== 0) return;
  const alivePlayers = Array.from(room.players.values()).filter(p => !p.dead);
  if (alivePlayers.length === 0) return;
  const anchor = pick(alivePlayers);
  const ang = Math.random() * Math.PI * 2;
  const d = randInt(450, 680);
  const x = Math.max(-ARENA_HALF + 80, Math.min(ARENA_HALF - 80, Math.round(anchor.x + Math.cos(ang) * d)));
  const y = Math.max(-ARENA_HALF + 80, Math.min(ARENA_HALF - 80, Math.round(anchor.y + Math.sin(ang) * d)));

  if (room.wave % 8 === 4) {
    room.interactables.push({
      id: uid('brc'),
      kind: 'breach',
      sub: 'chayula',
      label: 'Breach Hand — Click or [E] to Rip Open Breach',
      color: '#cc5de8',
      x,
      y,
      used: false
    });
  } else {
    room.interactables.push({
      id: uid('box'),
      kind: 'strongbox',
      sub: 'arcanist',
      label: 'Abyssal Trove (Elite Pack)',
      color: '#53f574',
      x,
      y,
      used: false
    });
  }
}

function startAtlasRun(room, mapId) {
  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === mapId) || GameData.ATLAS_MAPS[0];
  room.selectedMapId = mapDef.id;
  room.state = 'RUN';
  room.wave = 1;
  room.waveProgress = 0;
  room.runTimer = 0;
  room.runDuration = mapDef.durationSec;
  room.spawnAccumulator = 0;
  room.bossSpawned = false;
  room.lastBossWave = 0;
  room.portalsOpen = false;
  room.enemies.clear();
  room.projectiles = [];
  room.groundDrops = [];
  room.hazards = [];
  room.activeBreaches = [];
  room.fxEvents = [];
  populateMapInteractables(room);

  for (const p of room.players.values()) {
    p.ready = false;
    p.dead = false;
    p.reviveProgress = 0;
    p.hhStacks = 0;
    p.hhTimer = 0;
    p.shrineBuffTimer = 0;
    p.targetDropId = null;
    p.targetChestId = null;
    p.lohBudget = 6;
    p.vaalSouls = 0;
    for (const f of GameData.FLASKS) {
      p.flaskCharges[f.id] = (p.unlockedFlasks || ['life']).includes(f.id) ? f.maxCharges : 0;
      p.activeFlasks[f.id] = 0;
    }
    if (Array.isArray(p.flaskBelt)) {
      p.flaskSlotCharges = p.flaskBelt.map(fId => {
        const fDef = fId ? GameData.FLASKS.find(f => f.id === fId) : null;
        return fDef ? fDef.maxCharges : 0;
      });
      p.flaskSlotTimers = [0, 0, 0, 0, 0];
    }
    // Rogue-lite per-run reset of Run Level, Skills & Run Stat Upgrades!
    p.currentMapId = mapDef.id;
    resetPlayerRunSkills(p);
    recalcPlayer(p, true);
    // Reset In-Run Gold to Starting Run Gold from Rogue-lite Skill Tree (Stash Gold remains safely in Hideout!)
    const treeStartGold = (p.stats && p.stats.startingGold) || 25;
    p.startingRunGold = 25 + treeStartGold;
    p.runGold = p.startingRunGold;
    p.earnedRunGold = 0;
    p.nextChestCost = getNextChestCost(p, room);
    p.x = randInt(-40, 40);
    p.y = randInt(-40, 40);
    p.graceTimer = 1.2;
    p.hitGraceTimer = 0;
    p.afkAnchorX = p.x;
    p.afkAnchorY = p.y;
    p.afkTimer = 0;

    sendPrivateProfile(p);
  }

  // Spawn initial monster packs around the perimeter (scales with Map Tier so higher tiers pressure immediately!)
  const initialPacks = 1 + Math.floor(((mapDef.tier || 1) - 1) * 0.6);
  for (let i = 0; i < initialPacks; i++) {
    spawnMonsterPack(room);
  }

  addRoomChat(room, 'Atlas', `Opened portals to ${mapDef.name}! Spend Run Gold on Golden Chests [E] & Draft Rerolls — unspent earned Gold banks to your Hideout Stash!`, '#ffd147');
  broadcastRoomEvent(room, {
    type: 'announcement',
    title: mapDef.name,
    subtitle: `Wave 1 Started! Earn Run Gold for Golden Chests & Rerolls — Extract to Bank Gold to Stash!`,
    color: '#ffd147'
  });
}

function returnToHideout(room, reasonTitle, reasonSub) {
  const wasPartyWipe = room.players.size > 0 && Array.from(room.players.values()).every(p => p.dead);
  room.state = 'HIDEOUT';
  room.wave = 1;
  room.waveProgress = 0;
  room.enemies.clear();
  room.projectiles = [];
  room.groundDrops = [];
  room.hazards = [];
  room.interactables = [];
  room.upgradeChests = [];
  room.activeBreaches = [];
  room.fxEvents = [];

  let totalBankedRoom = 0;
  for (const p of room.players.values()) {
    // Bank earned unspent Run Gold into persistent Stash Gold (100% on Extraction, 50% on Party Wipe!)
    const bankable = Math.max(0, Math.min(p.earnedRunGold || 0, p.runGold || 0));
    const bankedGold = wasPartyWipe ? Math.round(bankable * 0.5) : bankable;
    if (bankedGold > 0) {
      p.gold = (p.gold || 0) + bankedGold;
      totalBankedRoom = Math.max(totalBankedRoom, bankedGold);
      addRoomChat(
        room,
        'Stash',
        `${p.name} banked +${bankedGold} Run Gold into Stash Gold (${wasPartyWipe ? '50% Death Salvage' : '100% Extracted'})!`,
        '#ffd43b'
      );
    }
    p.runGold = 0;
    p.startingRunGold = 0;
    p.earnedRunGold = 0;
    p.ready = false;
    p.dead = false;
    p.reviveProgress = 0;
    p.hhStacks = 0;
    p.hhTimer = 0;
    p.shrineBuffTimer = 0;
    p.targetDropId = null;
    p.targetChestId = null;
    for (const f of GameData.FLASKS) {
      p.flaskCharges[f.id] = (p.unlockedFlasks || ['life']).includes(f.id) ? f.maxCharges : 0;
      p.activeFlasks[f.id] = 0;
    }
    if (Array.isArray(p.flaskBelt)) {
      p.flaskSlotCharges = p.flaskBelt.map(fId => {
        const fDef = fId ? GameData.FLASKS.find(f => f.id === fId) : null;
        return fDef ? fDef.maxCharges : 0;
      });
      p.flaskSlotTimers = [0, 0, 0, 0, 0];
    }
    // Rogue-lite reset of in-run skills & stat boons on return to Hideout!
    resetPlayerRunSkills(p);
    recalcPlayer(p, true);
    p.x = randInt(-90, 90);
    p.y = randInt(50, 150);
    sendPrivateProfile(p);
  }

  const goldSuffix = totalBankedRoom > 0 ? ` (+${totalBankedRoom}G Banked to Stash!)` : '';
  broadcastRoomEvent(room, {
    type: 'announcement',
    title: (reasonTitle || 'Returned to Sanctuary Hideout') + goldSuffix,
    subtitle: reasonSub || 'Spend Stash Gold at the Black Market [I], craft Gear with Orbs, and allocate Skill Tree Points [P]!',
    color: '#63a4ff'
  });
}

// =========================================================================
// COHESIVE PACK SPAWNING, MONSTER CREATION & ANTI-AFK HAZARDS
// =========================================================================
const MAX_ACTIVE_ENEMIES = 150;

function spawnMonster(room, isBoss = false, overridePos = null, forceRarity = null, forceBase = null, isBreachMob = false) {
  const alivePlayers = Array.from(room.players.values()).filter(p => !p.dead);
  if (alivePlayers.length === 0) return;

  if (!isBoss && room.enemies.size >= MAX_ACTIVE_ENEMIES) {
    if (forceRarity === 'rare') {
      for (const [mId, mObj] of room.enemies.entries()) {
        if (mObj.rarity === 'normal') {
          room.enemies.delete(mId);
          break;
        }
      }
    }
    if (room.enemies.size >= MAX_ACTIVE_ENEMIES) return;
  }

  let x, y;
  if (overridePos) {
    if (overridePos.exact) {
      x = overridePos.x;
      y = overridePos.y;
    } else {
      x = overridePos.x + randInt(-55, 55);
      y = overridePos.y + randInt(-55, 55);
    }
  } else {
    const anchor = pick(alivePlayers);
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = randInt(390, 520);
    x = anchor.x + Math.cos(angle) * spawnDist;
    y = anchor.y + Math.sin(angle) * spawnDist;
  }

  // STRICT ANTI-SPAWN-ON-PLAYER ENFORCEMENT:
  // Never allow any non-exact monster to spawn closer than 360 units to ANY living player (outside screen view)!
  if (!overridePos || !overridePos.exact) {
    for (const pl of alivePlayers) {
      const d = dist(x, y, pl.x, pl.y);
      if (d < 360) {
        const pushAng = d > 1 ? Math.atan2(y - pl.y, x - pl.x) : Math.random() * Math.PI * 2;
        x = Math.round(pl.x + Math.cos(pushAng) * 395);
        y = Math.round(pl.y + Math.sin(pushAng) * 395);
      }
    }
  }

  x = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, x));
  y = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, y));

  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];
  const mapTier = mapDef.tier || 1;
  const partyMult = 1 + (room.players.size - 1) * 0.55;
  // Exponential Wave & Map Tier HP, Armor, Speed + Damage Scaling
  const waveHpMult = Math.pow(1.26, room.wave - 1) * (1 + (room.wave - 1) * 0.12);
  const totalHpScale = mapDef.monsterScale * partyMult * waveHpMult;
  const tierDmgScale = mapDef.dmgScale || Math.pow(mapDef.monsterScale, 0.72);
  const waveDmgMult = Math.pow(1.14, room.wave - 1) * tierDmgScale;
  const tierArmor = mapDef.monsterArmor || 0;
  const tierSpeedScale = mapDef.speedScale || (1 + (mapTier - 1) * 0.12);
  const tierEliteBonus = mapDef.eliteBonus || 0;

  if (isBoss) {
    const bossId = uid('m');
    room.enemies.set(bossId, {
      id: bossId,
      name: mapDef.bossName,
      typeId: 'kitava_herald',
      rarity: 'boss',
      mods: ['Gargantuan', 'Flameweaver', 'Relentless'],
      x,
      y,
      hp: Math.round(2400 * totalHpScale),
      maxHp: Math.round(2400 * totalHpScale),
      armor: Math.round(tierArmor * 1.35),
      speed: Math.min(265, Math.round((152 + (mapTier - 1) * 12) * tierSpeedScale)),
      radius: 36,
      damage: Math.round(52 * waveDmgMult),
      xp: Math.round(350 * (1 + (mapTier - 1) * 0.45)),
      color: '#ff4d4d',
      behavior: 'boss',
      actionTimer: 2.2,
      hitTimer: 0,
      chillTimer: 0,
      shockTimer: 0,
      isBreachMob: false
    });
    return;
  }

  const eligiblePool = GameData.MONSTER_TYPES.filter(m => (m.minWave || 1) <= (room.wave || 1) + (mapTier - 1));
  let resolvedBase = null;
  if (typeof forceBase === 'string') {
    resolvedBase = GameData.MONSTER_TYPES.find(m => m.id === forceBase) || null;
  } else if (forceBase && typeof forceBase === 'object') {
    resolvedBase = forceBase;
  }
  const base = resolvedBase || pick(eligiblePool.length > 0 ? eligiblePool : GameData.MONSTER_TYPES);
  const roll = Math.random();
  let rarity = forceRarity || 'normal';
  if (!forceRarity) {
    if ((room.wave >= 2 || mapTier >= 2) && roll < 0.04 + room.wave * 0.006 + tierEliteBonus * 0.35) rarity = 'rare';
    else if (roll < 0.16 + room.wave * 0.015 + tierEliteBonus) rarity = 'magic';
  }

  let hpMulti = 1;
  let dmgMulti = 1;
  let speedMulti = isBreachMob ? 1.12 : 1;
  let radiusMulti = 1;
  const mods = [];
  let name = isBreachMob ? `Breach ${base.name}` : base.name;
  let color = isBreachMob ? '#cc5de8' : base.color;

  if (rarity === 'rare') {
    const mod1 = pick(GameData.RARE_MODS);
    const mod2 = pick(GameData.RARE_MODS.filter(m => m.id !== mod1.id));
    mods.push(mod1.name, mod2.name);
    hpMulti = (mod1.hpMulti || 1.45) * (mod2.hpMulti || 1.35);
    dmgMulti = (mod1.dmgMulti || 1.2) * (mod2.dmgMulti || 1.15);
    speedMulti *= Math.min(1.25, (mod1.speedMulti || 1.1) * (mod2.speedMulti || 1.08));
    radiusMulti = Math.max(mod1.radiusMulti || 1.2, mod2.radiusMulti || 1.2);
    color = '#ffd43b';
  } else if (rarity === 'magic') {
    const mod1 = pick(GameData.RARE_MODS);
    mods.push(mod1.name);
    hpMulti = mod1.hpMulti || 1.45;
    dmgMulti = mod1.dmgMulti || 1.15;
    speedMulti *= Math.min(1.18, mod1.speedMulti || 1.1);
    radiusMulti = mod1.radiusMulti || 1.12;
    color = '#4dabf7';
  }

  const mId = uid('m');
  room.enemies.set(mId, {
    id: mId,
    name,
    typeId: base.id,
    rarity,
    mods,
    x,
    y,
    hp: Math.round(base.hp * totalHpScale * hpMulti),
    maxHp: Math.round(base.hp * totalHpScale * hpMulti),
    armor: Math.round(tierArmor * (rarity === 'rare' ? 1.25 : rarity === 'magic' ? 1.1 : 1.0)),
    speed: Math.min(280, Math.round(base.speed * tierSpeedScale * (1 + (room.wave - 1) * 0.025) * speedMulti)),
    radius: Math.round(base.radius * radiusMulti),
    damage: Math.round(base.damage * waveDmgMult * dmgMulti),
    xp: Math.round(base.xp * (1 + (mapTier - 1) * 0.35) * (rarity === 'rare' ? 3.2 : rarity === 'magic' ? 1.7 : 1)),
    color,
    behavior: base.behavior,
    actionTimer: randInt(16, 32) / 10,
    hitTimer: 0,
    chillTimer: 0,
    shockTimer: 0,
    isBreachMob: !!isBreachMob
  });
}

// Spawn a cohesive monster pack 390-520 units from a living player (just outside screen edge)!
function spawnMonsterPack(room) {
  const alivePlayers = Array.from(room.players.values()).filter(p => !p.dead);
  if (alivePlayers.length === 0) return 0;

  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];
  const mapTier = mapDef.tier || 1;
  const tierEliteBonus = mapDef.eliteBonus || 0;
  const extraPackMobs = Math.floor((mapTier - 1) * 0.65);

  const anchor = pick(alivePlayers);
  const angle = Math.random() * Math.PI * 2;
  const packDist = randInt(390, 520);
  const packCenter = {
    x: Math.max(-ARENA_HALF + 90, Math.min(ARENA_HALF - 90, anchor.x + Math.cos(angle) * packDist)),
    y: Math.max(-ARENA_HALF + 90, Math.min(ARENA_HALF - 90, anchor.y + Math.sin(angle) * packDist))
  };

  const eligiblePool = GameData.MONSTER_TYPES.filter(m => (m.minWave || 1) <= (room.wave || 1) + (mapTier - 1));
  const activePool = eligiblePool.length > 0 ? eligiblePool : GameData.MONSTER_TYPES;
  const roll = Math.random();
  let spawned = 0;

  if ((room.wave >= 2 || mapTier >= 2) && roll < 0.10 + room.wave * 0.012 + tierEliteBonus * 0.6) {
    // Rare Leader + Magic Bodyguards + Normal Followers
    const followerBase = pick(activePool);
    spawnMonster(room, false, packCenter, 'rare', followerBase);
    spawned++;
    for (let i = 0; i < 2 + Math.floor(extraPackMobs * 0.5); i++) {
      spawnMonster(room, false, packCenter, 'magic', followerBase);
      spawned++;
    }
    for (let i = 0; i < 2 + extraPackMobs; i++) {
      spawnMonster(room, false, packCenter, 'normal', followerBase);
      spawned++;
    }
  } else if (roll < 0.40) {
    // Ranged Pack
    const rangedPool = activePool.filter(m => m.behavior !== 'melee');
    const rangedBase = rangedPool.length > 0 ? pick(rangedPool) : pick(activePool);
    const count = randInt(2, 3) + extraPackMobs;
    for (let i = 0; i < count; i++) {
      spawnMonster(room, false, packCenter, 'normal', rangedBase);
      spawned++;
    }
    if (room.wave >= 2 || mapTier >= 2 || Math.random() < 0.5) {
      spawnMonster(room, false, packCenter, 'magic', rangedBase);
      spawned++;
    }
  } else {
    // Cohesive Swarmer Pack
    const meleePool = activePool.filter(m => m.behavior === 'melee' || m.behavior === 'charge');
    const swarmBase = meleePool.length > 0 ? pick(meleePool) : pick(activePool);
    const count = randInt(3, 4) + extraPackMobs;
    for (let i = 0; i < count; i++) {
      spawnMonster(room, false, packCenter, 'normal', swarmBase);
      spawned++;
    }
    if (Math.random() < 0.35 + tierEliteBonus) {
      spawnMonster(room, false, packCenter, 'magic', swarmBase);
      spawned++;
    }
  }

  return spawned;
}

// Spawn a Telegraphed Ground AoE Hazard (Vaal Flameblast / Molten Mortar)
function spawnGroundHazard(room, x, y, radius, fuseSec, damage, title = 'Vaal Flameblast') {
  room.hazards.push({
    id: uid('haz'),
    x: Math.round(x),
    y: Math.round(y),
    r: radius,
    fuse: fuseSec,
    maxFuse: fuseSec,
    damage,
    title
  });
}


function spawnGroundDrop(room, x, y, dropCategory, forceRarity = null, itemLevel = 1) {
  if (room.groundDrops.length > 35) room.groundDrops.shift();
  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];
  const mapTier = mapDef ? mapDef.tier : 1;
  const rarityBonusPct = mapDef ? (mapDef.lootRarityBonus || 0) : 0;

  if (dropCategory === 'flask') {
    const allFlasks = GameData.FLASKS;
    const utilityFlasks = allFlasks.filter(f => f.id !== 'life');
    // Prioritize flasks that living players don't currently have on their belt or inventory, with a chance for extra Life/Utility flasks!
    const missingFlasks = utilityFlasks.filter(f => {
      for (const p of room.players.values()) {
        if (p.dead) continue;
        const onBelt = Array.isArray(p.flaskBelt) && p.flaskBelt.includes(f.id);
        const inInv = Array.isArray(p.inventory) && p.inventory.some(it => it && it.slot === 'flask' && it.flaskId === f.id);
        if (!onBelt && !inInv) return true;
      }
      return false;
    });
    const pool = (missingFlasks.length > 0 && Math.random() < 0.72) ? missingFlasks : allFlasks;
    const chosenFlask = pick(pool) || utilityFlasks[0];
    room.groundDrops.push({
      id: uid('drop'),
      x: Math.round(x + randInt(-18, 18)),
      y: Math.round(y + randInt(-18, 18)),
      dropType: 'flask',
      kind: 'flask',
      flaskId: chosenFlask.id,
      label: chosenFlask.name,
      rarity: 'flask',
      ttl: 180
    });
    addRoomChat(room, 'Loot', `[FLASK] ${chosenFlask.name} dropped on the ground!`, '#38d9a9');
    return;
  }

  if (dropCategory === 'currency') {
    // Higher Map Tiers shift currency orb weights toward Alchemy, Chaos, Exalted, and Divine Orbs!
    const tierBoost = mapTier - 1;
    const weightTable = [
      ['transmute', Math.max(0.16, 0.39 - tierBoost * 0.042)],
      ['alteration', Math.max(0.18, 0.31 - tierBoost * 0.024)],
      ['alchemy', 0.09 + tierBoost * 0.026],
      ['chaos', 0.045 + tierBoost * 0.022],
      ['exalted', 0.014 + tierBoost * 0.011],
      ['divine', 0.012 + tierBoost * 0.010],
      ['regret', 0.09 + tierBoost * 0.010]
    ];
    const totalW = weightTable.reduce((sum, [, w]) => sum + w, 0);
    let roll = Math.random() * totalW;
    let chosenKey = 'transmute';
    for (const [k, w] of weightTable) {
      if (roll < w) {
        chosenKey = k;
        break;
      }
      roll -= w;
    }
    const cDef = GameData.CURRENCIES[chosenKey] || GameData.CURRENCIES.transmute;
    const dropRarity = chosenKey === 'divine'
      ? 'divine'
      : (chosenKey === 'exalted' || chosenKey === 'chaos')
        ? 'currency_high'
        : 'currency';
    room.groundDrops.push({
      id: uid('drop'),
      x: Math.round(x + randInt(-22, 22)),
      y: Math.round(y + randInt(-22, 22)),
      dropType: 'currency',
      kind: 'currency',
      currencyId: chosenKey,
      label: cDef.name,
      rarity: dropRarity,
      t0: chosenKey === 'divine' || chosenKey === 'exalted',
      ttl: 180
    });
    if (chosenKey === 'divine' || chosenKey === 'exalted') {
      addRoomChat(room, 'Loot', `[${cDef.name.toUpperCase()}] ${cDef.name} dropped on the ground!`, chosenKey === 'divine' ? '#ff4d4d' : '#ffd43b');
    }
  } else {
    const item = generateGearItem(null, forceRarity, itemLevel, rarityBonusPct);
    const tpl = item.rarity === 'unique' ? (GameData.UNIQUE_TEMPLATES || []).find(u => u.name === item.name) : null;
    const isT0Unique = Boolean(tpl && typeof tpl.dropWeight === 'number' && tpl.dropWeight <= 0.50);
    room.groundDrops.push({
      id: uid('drop'),
      x: Math.round(x + randInt(-22, 22)),
      y: Math.round(y + randInt(-22, 22)),
      dropType: 'gear',
      kind: 'item',
      item,
      label: item.name,
      rarity: item.rarity,
      t0: isT0Unique,
      ttl: 180
    });
    if (item.rarity === 'unique' || item.rarity === 'rare') {
      addRoomChat(room, 'Loot', `[${item.rarity.toUpperCase()}] ${item.name} (ilvl ${item.ilvl}) dropped on the ground!`, isT0Unique ? '#ff4d4d' : item.rarity === 'unique' ? '#ff922b' : '#ffff77');
    }
  }
}

function pickupGroundFlask(room, player, drop) {
  if (!drop || !player) return;
  if (!Array.isArray(player.unlockedFlasks)) player.unlockedFlasks = ['life'];
  if (!Array.isArray(player.flaskBelt) || player.flaskBelt.length !== 5) {
    player.flaskBelt = ['life', null, null, null, null];
  }
  if (!Array.isArray(player.flaskSlotCharges) || player.flaskSlotCharges.length !== 5) {
    player.flaskSlotCharges = [15, 0, 0, 0, 0];
  }

  const fId = drop.flaskId || (drop.item && drop.item.flaskId) || 'quicksilver';
  const fDef = GameData.FLASKS.find(f => f.id === fId) || GameData.FLASKS[1];

  if (!player.unlockedFlasks.includes(fDef.id)) {
    player.unlockedFlasks.push(fDef.id);
  }
  player.flaskCharges[fDef.id] = fDef.maxCharges;

  // Refill all currently equipped belt flasks on pickup
  for (let i = 0; i < 5; i++) {
    const bId = player.flaskBelt[i];
    if (bId) {
      const bDef = GameData.FLASKS.find(f => f.id === bId);
      if (bDef) player.flaskSlotCharges[i] = bDef.maxCharges;
    }
  }

  const emptySlotIdx = player.flaskBelt.findIndex(s => !s);
  if (emptySlotIdx >= 0 && !player.flaskBelt.includes(fDef.id)) {
    player.flaskBelt[emptySlotIdx] = fDef.id;
    player.flaskSlotCharges[emptySlotIdx] = fDef.maxCharges;
    recalcPlayer(player, false);
    if (room.fxEvents.length < 28) {
      room.fxEvents.push({
        kind: 'dmg_num',
        x: Math.round(player.x),
        y: Math.round(player.y - 30),
        val: `EQUIPPED: ${fDef.name.toUpperCase()} [SLOT ${emptySlotIdx + 1}]!`,
        text: `FLASK EQUIPPED: ${fDef.name.toUpperCase()} [KEY ${emptySlotIdx + 1}]!`,
        color: '#38d9a9',
        size: 18,
        crit: true,
        dtype: 'loot'
      });
    }
    addRoomChat(room, 'Flask', `${player.name} equipped ${fDef.name} into Belt Slot ${emptySlotIdx + 1}! (Customize belt slots in Inventory [I])`, '#38d9a9');
  } else if (player.inventory.length < 32) {
    const flaskItem = buildFlaskItem(fDef.id);
    player.inventory.push(flaskItem);
    if (room.fxEvents.length < 28) {
      room.fxEvents.push({
        kind: 'dmg_num',
        x: Math.round(player.x),
        y: Math.round(player.y - 26),
        val: `+1 ${fDef.name.toUpperCase()} (BAG [I])`,
        text: `LOOTED: ${fDef.name.toUpperCase()} (EQUIP IN BELT [I])`,
        color: '#38d9a9',
        size: 16,
        crit: false,
        dtype: 'loot'
      });
    }
  } else {
    player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.25));
  }
  sendPrivateProfile(player);
}

const exportsObj = { createRoom, createPlayer, recalcPlayer, sendPrivateProfile, broadcastRoomEvent, addRoomChat, findShortestPassivePathToNode, canRemovePassiveNode, populateMapInteractables, tryBuyUpgradeChest, activateInteractable, spawnWaveLeagueEncounter, startAtlasRun, returnToHideout, spawnMonster, spawnMonsterPack, spawnGroundHazard, spawnGroundDrop, pickupGroundFlask };
Object.assign(global, exportsObj);
module.exports = exportsObj;
