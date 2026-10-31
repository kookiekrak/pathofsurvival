// Server World Module: Cohesive Monster Pack Spawning, Ground Hazards & Loot/Flask Drops
const GameData = global.GameData || require('../../public/shared/gameData.js');

// =========================================================================
// COHESIVE PACK SPAWNING, MONSTER CREATION & ANTI-AFK HAZARDS
// =========================================================================
const MAX_ACTIVE_ENEMIES = 90;

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
  const modHpMult = (room.mapModStats && room.mapModStats.hpMult) || 1;
  const modDmgMult = (room.mapModStats && room.mapModStats.dmgMult) || 1;
  const modSpeedMult = (room.mapModStats && room.mapModStats.speedMult) || 1;
  const modArmorMult = (room.mapModStats && room.mapModStats.armorMult) || 1;

  // Exponential Wave & Map Tier HP, Armor, Speed + Damage Scaling
  const waveHpMult = Math.pow(1.12, room.wave - 1) * (1 + (room.wave - 1) * 0.04);
  const totalHpScale = mapDef.monsterScale * partyMult * waveHpMult * modHpMult;
  const tierDmgScale = mapDef.dmgScale || Math.pow(mapDef.monsterScale, 0.72);
  const waveDmgMult = Math.pow(1.055, room.wave - 1) * tierDmgScale * modDmgMult;
  const tierArmor = (mapDef.monsterArmor || 0) * modArmorMult;
  const tierSpeedScale = (mapDef.speedScale || (1 + (mapTier - 1) * 0.12)) * modSpeedMult;
  const tierEliteBonus = mapDef.eliteBonus || 0;
  const xpScale = 1 + (mapTier - 1) * 0.55 + Math.pow(mapTier - 1, 1.4) * 0.18;

  if (isBoss) {
    const bossId = uid('m');
    room.enemies.set(bossId, {
      id: bossId, name: mapDef.bossName, typeId: 'kitava_herald', rarity: 'boss',
      mods: ['Gargantuan', 'Flameweaver', 'Relentless'], x, y,
      hp: Math.round(1650 * totalHpScale), maxHp: Math.round(1650 * totalHpScale),
      armor: Math.round(tierArmor * 1.35),
      speed: Math.min(265, Math.round((152 + (mapTier - 1) * 12) * tierSpeedScale)),
      radius: 36, damage: Math.round(42 * waveDmgMult),
      xp: Math.round(320 * xpScale),
      color: '#ff4d4d', behavior: 'boss', actionTimer: 2.2,
      hitTimer: 0, chillTimer: 0, shockTimer: 0, isBreachMob: false
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
    id: mId, name, typeId: base.id, rarity, mods, x, y,
    hp: Math.round(base.hp * totalHpScale * hpMulti),
    maxHp: Math.round(base.hp * totalHpScale * hpMulti),
    armor: Math.round(tierArmor * (rarity === 'rare' ? 1.25 : rarity === 'magic' ? 1.1 : 1.0)),
    speed: Math.min(280, Math.round(base.speed * tierSpeedScale * (1 + (room.wave - 1) * 0.025) * speedMulti)),
    radius: Math.round(base.radius * radiusMulti),
    damage: Math.round(base.damage * waveDmgMult * dmgMulti),
    xp: Math.round(base.xp * xpScale * (rarity === 'rare' ? 3.2 : rarity === 'magic' ? 1.7 : 1)),
    color, behavior: base.behavior, actionTimer: randInt(16, 32) / 10,
    hitTimer: 0, chillTimer: 0, shockTimer: 0, isBreachMob: !!isBreachMob
  });
}

// Spawn a cohesive monster pack 390-520 units from a living player (just outside screen edge)!
function spawnMonsterPack(room) {
  const alivePlayers = Array.from(room.players.values()).filter(p => !p.dead);
  if (alivePlayers.length === 0) return 0;

  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];
  const mapTier = mapDef.tier || 1;
  const tierEliteBonus = mapDef.eliteBonus || 0;
  const basePackMobs = Math.floor((mapTier - 1) * 0.5);
  const modPackBonus = (room.mapModStats && room.mapModStats.packSize > 0)
    ? Math.min(2, Math.max(1, Math.round((3 + basePackMobs) * (room.mapModStats.packSize / 100))))
    : 0;
  const extraPackMobs = basePackMobs + modPackBonus;

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
    id: uid('haz'), x: Math.round(x), y: Math.round(y),
    r: radius, fuse: fuseSec, maxFuse: fuseSec, damage, title
  });
}

function spawnGroundDrop(room, x, y, dropCategory, forceRarity = null, itemLevel = 1, rarityBonusOverride = null) {
  if (room.groundDrops.length > 35) room.groundDrops.shift();
  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];
  const mapTier = mapDef ? mapDef.tier : 1;
  const rarityBonusPct = rarityBonusOverride !== null
    ? rarityBonusOverride
    : ((mapDef ? (mapDef.lootRarityBonus || 0) : 0) + ((room.mapModStats && room.mapModStats.rarity) || 0));

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
    const flaskItem = buildFlaskItem(chosenFlask.id);
    room.groundDrops.push({
      id: uid('drop'), x: Math.round(x + randInt(-18, 18)), y: Math.round(y + randInt(-18, 18)),
      dropType: 'flask', kind: 'flask', flaskId: chosenFlask.id, item: flaskItem, label: flaskItem.name, rarity: 'flask', ttl: 180
    });
    addRoomChat(room, 'Loot', `[FLASK] ${flaskItem.name} (${flaskItem.cost}/${flaskItem.maxCharges} Chg) dropped!`, '#38d9a9');
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
    const dropRarity = chosenKey === 'divine' ? 'divine' : (chosenKey === 'exalted' || chosenKey === 'chaos') ? 'currency_high' : 'currency';
    room.groundDrops.push({
      id: uid('drop'), x: Math.round(x + randInt(-22, 22)), y: Math.round(y + randInt(-22, 22)),
      dropType: 'currency', kind: 'currency', currencyId: chosenKey, label: cDef.name,
      rarity: dropRarity, t0: chosenKey === 'divine' || chosenKey === 'exalted', ttl: 180
    });
    if (chosenKey === 'divine' || chosenKey === 'exalted') {
      addRoomChat(room, 'Loot', `[${cDef.name.toUpperCase()}] ${cDef.name} dropped on the ground!`, chosenKey === 'divine' ? '#ff4d4d' : '#ffd43b');
    }
  } else {
    const item = generateGearItem(null, forceRarity, itemLevel, rarityBonusPct);
    const tpl = item.rarity === 'unique' ? (GameData.UNIQUE_TEMPLATES || []).find(u => u.name === item.name) : null;
    const isT0Unique = Boolean(tpl && typeof tpl.dropWeight === 'number' && tpl.dropWeight <= 0.50);
    room.groundDrops.push({
      id: uid('drop'), x: Math.round(x + randInt(-22, 22)), y: Math.round(y + randInt(-22, 22)),
      dropType: 'gear', kind: 'item', item, label: item.name, rarity: item.rarity, t0: isT0Unique, ttl: 180
    });
    if (item.rarity === 'unique' || item.rarity === 'rare') {
      addRoomChat(room, 'Loot', `[${item.rarity.toUpperCase()}] ${item.name} (ilvl ${item.ilvl}) dropped on the ground!`, isT0Unique ? '#ff4d4d' : item.rarity === 'unique' ? '#ff922b' : '#ffff77');
    }
  }
}

function pickupGroundFlask(room, player, drop) {
  if (!drop || !player) return false;
  if (!Array.isArray(player.unlockedFlasks)) player.unlockedFlasks = ['life'];
  if ((player.inventory || []).length >= 32) return false;

  const fId = drop.flaskId || (drop.item && drop.item.flaskId) || 'quicksilver';
  const fDef = GameData.FLASKS.find(f => f.id === fId) || GameData.FLASKS[1];

  if (!player.unlockedFlasks.includes(fDef.id)) {
    player.unlockedFlasks.push(fDef.id);
  }
  const flaskItem = (drop.item && drop.item.slot === 'flask') ? drop.item : buildFlaskItem(fDef.id);
  player.inventory.push(flaskItem);
  sendPrivateProfile(player);
  return true;
}

const exportsObj = {
  MAX_ACTIVE_ENEMIES,
  spawnMonster,
  spawnMonsterPack,
  spawnGroundHazard,
  spawnGroundDrop,
  pickupGroundFlask
};
Object.assign(global, exportsObj);
module.exports = exportsObj;
