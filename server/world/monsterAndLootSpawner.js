// Server World Module: Cohesive Monster Pack Spawning, Ground Hazards & Loot/Flask Drops
const GameData = global.GameData || require('../../public/shared/gameData.js');

// =========================================================================
// COHESIVE PACK SPAWNING, MONSTER CREATION & ANTI-AFK HAZARDS
// =========================================================================
const MAX_ACTIVE_ENEMIES = 44;

function spawnMonster(room, isBoss = false, overridePos = null, forceRarity = null, forceBase = null, isBreachMob = false) {
  if (typeof overridePos === 'string' && typeof forceRarity === 'number' && typeof forceBase === 'number') {
    const altRarity = overridePos;
    overridePos = { x: forceRarity, y: forceBase };
    forceRarity = altRarity;
    forceBase = null;
  }
  const alivePlayers = Array.from(room.players.values()).filter(p => !p.dead);
  if (alivePlayers.length === 0) return null;

  const isBossSpawn = Boolean(isBoss || forceRarity === 'boss');
  const forceBuyIn = Boolean(overridePos && overridePos.forceBuyIn);
  if (!isBossSpawn && !forceBuyIn && room.enemies.size >= MAX_ACTIVE_ENEMIES) {
    if (forceRarity === 'rare') {
      for (const [mId, mObj] of room.enemies.entries()) {
        if (mObj.rarity === 'normal' && !mObj.isRitualMob) {
          room.enemies.delete(mId);
          break;
        }
      }
    }
    if (room.enemies.size >= MAX_ACTIVE_ENEMIES) return null;
  }

  let x, y;
  if (overridePos && typeof overridePos.x === 'number' && typeof overridePos.y === 'number') {
    if (overridePos.exact) {
      x = overridePos.x;
      y = overridePos.y;
    } else {
      x = overridePos.x + randInt(-50, 50);
      y = overridePos.y + randInt(-50, 50);
    }
  } else {
    const anchor = pick(alivePlayers);
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = randInt(390, 520);
    x = anchor.x + Math.cos(angle) * spawnDist;
    y = anchor.y + Math.sin(angle) * spawnDist;
  }

  // STRICT ANTI-SPAWN-ON-PLAYER ENFORCEMENT:
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

  const arenaLim = room.isRaidEncounter ? ((typeof RAID_ARENA_HALF === 'number' ? RAID_ARENA_HALF : 560) - 55) : (ARENA_HALF - 60);
  x = Math.max(-arenaLim, Math.min(arenaLim, x));
  y = Math.max(-arenaLim, Math.min(arenaLim, y));

  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];
  const mapTier = mapDef.tier || 1;
  const partyMult = 1 + (room.players.size - 1) * 0.55;
  const modHpMult = (room.mapModStats && room.mapModStats.hpMult) || 1;
  const modDmgMult = (room.mapModStats && room.mapModStats.dmgMult) || 1;
  const modSpdMult = (room.mapModStats && room.mapModStats.speedMult) || 1;
  const modArmorMult = (room.mapModStats && room.mapModStats.armorMult) || 1;

  // Compounding Wave & Map Tier HP, Armor, Speed + Damage Scaling
  const w = Math.max(1, room.wave || 1);
  const waveHpMult = Math.pow(1.25, w - 1) * (1 + (w - 1) * 0.15);
  const totalHpScale = mapDef.monsterScale * partyMult * waveHpMult * modHpMult;
  const tierDmgScale = mapDef.dmgScale || Math.pow(mapDef.monsterScale, 0.72);
  const waveDmgMult = Math.pow(1.125, w - 1) * (1 + (w - 1) * 0.05) * tierDmgScale * modDmgMult;
  const waveSpeedMult = Math.min(1.55, 1 + (w - 1) * 0.032);
  const tierArmor = (mapDef.monsterArmor || 0) * modArmorMult;
  const tierSpeedScale = mapDef.speedScale || (1 + (mapTier - 1) * 0.12);
  const tierEliteBonus = mapDef.eliteBonus || 0;
  const xpScale = 1 + (mapTier - 1) * 0.55 + Math.pow(mapTier - 1, 1.4) * 0.18;

  if (isBossSpawn) {
    // Clear remaining normal/magic/rare trash mobs so the Map Boss fight is a true 1v1 / party-vs-boss encounter!
    for (const [id, m] of room.enemies.entries()) {
      if (m.rarity !== 'boss') room.enemies.delete(id);
    }
    const bossId = uid('m');
    const bossHp = Math.round(6400 * totalHpScale);
    const bossObj = {
      id: bossId, name: mapDef.bossName, typeId: 'kitava_herald', rarity: 'boss',
      mods: ['Gargantuan', 'Flameweaver', 'Relentless'], x, y,
      hp: bossHp, maxHp: bossHp,
      armor: Math.round(tierArmor * 1.45),
      speed: Math.min(275, Math.round(142 * tierSpeedScale * modSpdMult)),
      radius: 36, damage: Math.round(68 * waveDmgMult),
      xp: Math.round(360 * xpScale),
      color: '#ff4d4d', behavior: 'boss', bossPhase: 1,
      actionTimer: 1.6, attackStep: 0,
      hitTimer: 0, chillTimer: 0, shockTimer: 0, isBreachMob: false
    };
    room.enemies.set(bossId, bossObj);
    return bossObj;
  }

  const eligiblePool = GameData.MONSTER_TYPES.filter(m => (m.minWave || 1) <= w + (mapTier - 1));
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
    if ((w >= 2 || mapTier >= 2) && roll < 0.04 + w * 0.006 + tierEliteBonus * 0.35) rarity = 'rare';
    else if (roll < 0.16 + w * 0.015 + tierEliteBonus) rarity = 'magic';
  }

  let hpMulti = 1;
  let dmgMulti = 1;
  let speedMulti = isBreachMob ? 1.12 : 1;
  let radiusMulti = 1;
  let rarityBonusPct = 0;
  const mods = [];
  let name = isBreachMob ? `Breach ${base.name}` : base.name;
  let color = isBreachMob ? '#cc5de8' : base.color;

  if (rarity === 'rare') {
    const rRoll = Math.random();
    const modCount = (overridePos && overridePos.forceModCount)
      ? overridePos.forceModCount
      : (rRoll < 0.35 ? 2 : rRoll < 0.68 ? 3 : rRoll < 0.88 ? 4 : rRoll < 0.96 ? 5 : 6);
    const availMods = [...(GameData.RARE_MODS || [])];
    const chosenMods = [];
    for (let i = 0; i < modCount && availMods.length > 0; i++) {
      const idx = Math.floor(Math.random() * availMods.length);
      const pickedMod = availMods.splice(idx, 1)[0];
      chosenMods.push(pickedMod);
      mods.push(pickedMod.name);
      speedMulti *= Math.min(1.08, pickedMod.speedMulti || 1.03);
      radiusMulti = Math.max(radiusMulti, pickedMod.radiusMulti || 1.2);
    }
    // Each modifier on a Rare monster grants +90% Increased Item Rarity and scales HP & Damage!
    rarityBonusPct = chosenMods.length * 90;
    hpMulti = 1 + chosenMods.length * 0.42;
    dmgMulti = 1 + chosenMods.length * 0.16;
    speedMulti = Math.min(1.32, speedMulti);
    color = '#ffd43b';
  } else if (rarity === 'magic') {
    const mod1 = pick(GameData.RARE_MODS);
    mods.push(mod1.name);
    rarityBonusPct = 45;
    hpMulti = mod1.hpMulti || 1.45;
    dmgMulti = mod1.dmgMulti || 1.15;
    speedMulti *= Math.min(1.18, mod1.speedMulti || 1.1);
    radiusMulti = mod1.radiusMulti || 1.12;
    color = '#4dabf7';
  }

  const mId = uid('m');
  const mObj = {
    id: mId, name, typeId: base.id, rarity, mods, rarityBonusPct, x, y,
    hp: Math.round(base.hp * totalHpScale * hpMulti),
    maxHp: Math.round(base.hp * totalHpScale * hpMulti),
    armor: Math.round(tierArmor * (rarity === 'rare' ? 1.3 : rarity === 'magic' ? 1.1 : 1.0)),
    speed: Math.min(285, Math.round(base.speed * tierSpeedScale * modSpdMult * waveSpeedMult * speedMulti)),
    radius: Math.round(base.radius * radiusMulti),
    damage: Math.round(base.damage * waveDmgMult * dmgMulti),
    xp: Math.round(base.xp * xpScale * (rarity === 'rare' ? 3.4 : rarity === 'magic' ? 1.7 : 1)),
    color, behavior: base.behavior, actionTimer: randInt(12, 22) / 10, specialCd: randInt(12, 22) / 10,
    hitTimer: 0, chillTimer: 0, shockTimer: 0, isBreachMob: !!isBreachMob
  };
  room.enemies.set(mId, mObj);
  return mObj;
}

function spawnMapBoss(room) {
  if (!room || room.isRaidEncounter) return;
  for (const [id, m] of room.enemies.entries()) {
    if (m.rarity !== 'boss') room.enemies.delete(id);
  }
  room.bossSpawned = true;
  room.lastBossWave = room.wave;
  spawnMonster(room, true);
  if (room.mapModStats && room.mapModStats.twinned) {
    spawnMonster(room, true);
  }
  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];
  broadcastRoomEvent(room, {
    type: 'announcement',
    title: `Map Boss: ${mapDef.bossName} (Wave ${room.wave})`,
    subtitle: 'Slay the Map Boss in a 1v1 Crucible duel to open the Extraction Portal at (0, 0)!',
    color: '#ff4d4d'
  });
}

// Spawn a cohesive 2-3 monster pack 390-520 units from a living player (68% projectile shooters, zero during boss fights)!
function spawnMonsterPack(room, anchorX = null, anchorY = null) {
  if (room.isRaidEncounter || Array.from(room.enemies.values()).some(e => e.rarity === 'boss')) return 0;
  const alivePlayers = Array.from(room.players.values()).filter(p => !p.dead);
  if (alivePlayers.length === 0) return 0;

  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];
  const mapTier = mapDef.tier || 1;
  const tierEliteBonus = mapDef.eliteBonus || 0;
  const w = Math.max(1, room.wave || 1);

  const anchor = (typeof anchorX === 'number' && typeof anchorY === 'number') ? { x: anchorX, y: anchorY } : pick(alivePlayers);
  const angle = Math.random() * Math.PI * 2;
  const packDist = randInt(390, 520);
  const packCenter = {
    x: Math.max(-ARENA_HALF + 90, Math.min(ARENA_HALF - 90, anchor.x + Math.cos(angle) * packDist)),
    y: Math.max(-ARENA_HALF + 90, Math.min(ARENA_HALF - 90, anchor.y + Math.sin(angle) * packDist))
  };

  const eligiblePool = GameData.MONSTER_TYPES.filter(m => (m.minWave || 1) <= w + (mapTier - 1));
  const activePool = eligiblePool.length > 0 ? eligiblePool : GameData.MONSTER_TYPES;
  const roll = Math.random();

  let packBase = null;
  let packCount = 2;
  if (roll < 0.40) {
    // ranged_barrage (40% weight)
    const rangedPool = activePool.filter(m => m.role === 'ranged' || m.behavior === 'ranged_kite' || m.behavior === 'toxic_mortar');
    packBase = rangedPool.length > 0 ? pick(rangedPool) : pick(activePool);
    packCount = randInt(2, 3);
  } else if (roll < 0.68) {
    // caster_coven (28% weight -> 68% total projectile shooter packs!)
    const casterPool = activePool.filter(m => m.role === 'caster' || m.behavior === 'frost_caster' || m.behavior === 'flameblast_caster' || m.behavior === 'storm_caller' || m.behavior === 'mortar_leap');
    packBase = casterPool.length > 0 ? pick(casterPool) : pick(activePool);
    packCount = 2;
  } else if (roll < 0.80) {
    // charger / kamikaze (12% weight)
    const chargerPool = activePool.filter(m => m.role === 'charger' || m.behavior === 'charge' || m.role === 'kamikaze');
    packBase = chargerPool.length > 0 ? pick(chargerPool) : pick(activePool);
    packCount = 2;
  } else if (roll < 0.90) {
    // tank / assassin (10% weight)
    const heavyPool = activePool.filter(m => m.role === 'tank' || m.role === 'assassin' || m.behavior === 'phalanx_tank' || m.behavior === 'blink_ambush');
    packBase = heavyPool.length > 0 ? pick(heavyPool) : pick(activePool);
    packCount = randInt(1, 2);
  } else {
    // swarmer melee (10% weight)
    const meleePool = activePool.filter(m => m.role === 'swarmer' || m.behavior === 'melee');
    packBase = meleePool.length > 0 ? pick(meleePool) : pick(activePool);
    packCount = randInt(2, 3);
  }

  let spawned = 0;
  const hasRareLeader = (w >= 2 || mapTier >= 2) && Math.random() < (0.14 + w * 0.012 + tierEliteBonus * 0.5);
  for (let i = 0; i < packCount; i++) {
    const mRarity = (i === 0 && hasRareLeader) ? 'rare' : (i === 0 && Math.random() < 0.45 + tierEliteBonus) ? 'magic' : 'normal';
    if (spawnMonster(room, false, packCenter, mRarity, packBase)) spawned++;
  }
  return spawned;
}

// Spawn a Telegraphed Ground AoE Hazard (Vaal Flameblast / Molten Mortar)
function spawnGroundHazard(room, x, y, radius, fuseSec, damage, title = 'Vaal Flameblast') {
  const lim = room.isRaidEncounter ? ((typeof RAID_ARENA_HALF === 'number' ? RAID_ARENA_HALF : 560) - 35) : (ARENA_HALF - 40);
  room.hazards.push({
    id: uid('haz'), x: Math.max(-lim, Math.min(lim, Math.round(x))), y: Math.max(-lim, Math.min(lim, Math.round(y))),
    r: radius, fuse: fuseSec, maxFuse: fuseSec, damage, title
  });
}

// PoE 2 Currency Rarity Calculation: Increased Item Rarity upgrades the tier of currency orb that drops!
function pickWeightedCurrency(rarityBonusPct = 0) {
  const rMult = 1 + Math.max(0, rarityBonusPct) / 100;
  const weightTable = [
    ['transmute', Math.max(4, 48 / Math.pow(rMult, 0.45))],
    ['alteration', Math.max(6, 36 / Math.pow(rMult, 0.25))],
    ['regret', 10 * Math.pow(rMult, 0.25)],
    ['alchemy', 11 * Math.pow(rMult, 0.55)],
    ['chaos', 5.5 * Math.pow(rMult, 0.85)],
    ['exalted', 0.9 * Math.pow(rMult, 1.15)],
    ['divine', 0.35 * Math.pow(rMult, 1.30)]
  ];
  let roll = Math.random() * weightTable.reduce((sum, [, w]) => sum + w, 0);
  for (const [k, w] of weightTable) {
    if (roll < w) return k;
    roll -= w;
  }
  return 'transmute';
}

function spawnCurrencyDrop(room, x, y, forcedCurrencyId = null, rarityBonusPct = 0) {
  if (room.groundDrops.length > 45) room.groundDrops.shift();
  const chosenKey = forcedCurrencyId || pickWeightedCurrency(rarityBonusPct);
  const cDef = GameData.CURRENCIES[chosenKey] || GameData.CURRENCIES.transmute;
  const dropRarity = chosenKey === 'divine' ? 'divine' : (chosenKey === 'exalted' || chosenKey === 'chaos') ? 'currency_high' : 'currency';
  room.groundDrops.push({
    id: uid('drop'), x: Math.round(x + randInt(-20, 20)), y: Math.round(y + randInt(-20, 20)),
    dropType: 'currency', kind: 'currency', currencyId: chosenKey, label: cDef.name,
    rarity: dropRarity, t0: chosenKey === 'divine' || chosenKey === 'exalted', ttl: 180
  });
  if (chosenKey === 'divine' || chosenKey === 'exalted') {
    addRoomChat(room, 'Loot', `[${cDef.name.toUpperCase()}] ${cDef.name} dropped on the ground!`, chosenKey === 'divine' ? '#ff4d4d' : '#ffd43b');
  }
}

function spawnGroundDrop(room, x, y, dropCategory, forceRarity = null, itemLevel = 1, rarityBonusOverride = null) {
  if (room.groundDrops.length > 45) room.groundDrops.shift();
  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];
  const rarityBonusPct = rarityBonusOverride !== null
    ? rarityBonusOverride
    : ((mapDef ? (mapDef.lootRarityBonus || 0) : 0) + ((room.mapModStats && room.mapModStats.rarity) || 0) + ((room.deliriumTier || 0) * 60));

  if (dropCategory === 'flask') {
    const allFlasks = GameData.FLASKS;
    const utilityFlasks = allFlasks.filter(f => f.id !== 'life');
    const missingFlasks = utilityFlasks.filter(f => {
      for (const p of room.players.values()) {
        if (p.dead) continue;
        const onBelt = Array.isArray(p.flaskBelt) && p.flaskBelt.includes(f.id);
        const inInv = Array.isArray(p.inventory) && p.inventory.some(it => it && it.slot === 'flask' && it.flaskId === f.id);
        if (!onBelt && !inInv) return true;
      }
      return false;
    });
    const chosenFlask = pick((missingFlasks.length > 0 && Math.random() < 0.72) ? missingFlasks : allFlasks) || utilityFlasks[0];
    const flaskItem = buildFlaskItem(chosenFlask.id);
    room.groundDrops.push({
      id: uid('drop'), x: Math.round(x + randInt(-18, 18)), y: Math.round(y + randInt(-18, 18)),
      dropType: 'flask', kind: 'flask', flaskId: chosenFlask.id, item: flaskItem, label: flaskItem.name, rarity: 'flask', ttl: 180
    });
    addRoomChat(room, 'Loot', `[FLASK] ${flaskItem.name} (${flaskItem.cost}/${flaskItem.maxCharges} Chg) dropped!`, '#38d9a9');
    return;
  }

  if (dropCategory === 'currency') {
    spawnCurrencyDrop(room, x, y, forceRarity, rarityBonusPct);
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
  if (!Array.isArray(player.unlockedFlasks)) player.unlockedFlasks = ['life', 'quicksilver'];
  const fId = drop.flaskId || (drop.item && drop.item.flaskId) || 'quicksilver';
  const fDef = GameData.FLASKS.find(f => f.id === fId) || GameData.FLASKS[1];
  const flaskItem = (drop.item && drop.item.slot === 'flask') ? drop.item : buildFlaskItem(fDef.id);
  if (!player.unlockedFlasks.includes(fDef.id)) player.unlockedFlasks.push(fDef.id);

  // If player.flaskBelt has an empty slot, auto-equip directly into the belt with full charges!
  if (Array.isArray(player.flaskBelt)) {
    const emptySlot = player.flaskBelt.findIndex(s => !s);
    if (emptySlot >= 0) {
      if (!Array.isArray(player.flaskBeltItems) || player.flaskBeltItems.length !== 5) player.flaskBeltItems = [null, null, null, null, null];
      if (!Array.isArray(player.flaskSlotCharges) || player.flaskSlotCharges.length !== 5) player.flaskSlotCharges = [15, 0, 0, 0, 0];
      player.flaskBelt[emptySlot] = fDef.id;
      player.flaskBeltItems[emptySlot] = {
        name: flaskItem.name || fDef.name, maxCharges: flaskItem.maxCharges || fDef.maxCharges,
        cost: flaskItem.cost || fDef.cost, duration: flaskItem.duration || fDef.duration,
        mods: Array.isArray(flaskItem.mods) ? flaskItem.mods : []
      };
      player.flaskSlotCharges[emptySlot] = flaskItem.maxCharges || fDef.maxCharges;
      player.flaskCharges[fDef.id] = flaskItem.maxCharges || fDef.maxCharges;
      recalcPlayer(player, false);
      sendPrivateProfile(player);
      return true;
    }
  }

  if ((player.inventory || []).length >= 50) return false;
  player.inventory.push(flaskItem);
  sendPrivateProfile(player);
  return true;
}

const exportsObj = {
  MAX_ACTIVE_ENEMIES, spawnMonster, spawnMapBoss, spawnMonsterPack,
  spawnGroundHazard, pickWeightedCurrency, spawnCurrencyDrop, spawnGroundDrop, pickupGroundFlask
};
Object.assign(global, exportsObj);
module.exports = exportsObj;
