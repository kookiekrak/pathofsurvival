// Server World Module: Atlas Map Launch, Map Currency Crafting & Sanctuary Hideout Extraction
const GameData = global.GameData || require('../../public/shared/gameData.js');

const DEFAULT_MAP_MOD_POOL = [
  { id: 'savage', name: 'Savage (+28% Monster Damage)', quant: 14, rarity: 8, packSize: 5, dmgMult: 1.28 },
  { id: 'armored', name: 'Armoured (+40% Monster Ward & +25% HP)', quant: 15, rarity: 9, packSize: 5, hpMult: 1.25, armorMult: 1.40 },
  { id: 'fleet', name: 'Fleet (+22% Monster Speed)', quant: 14, rarity: 8, packSize: 6, speedMult: 1.22 },
  { id: 'multiproj', name: 'Splitting (Monsters fire +2 Projectiles)', quant: 18, rarity: 12, packSize: 6, extraProj: 2 },
  { id: 'titanic', name: 'Titanic (+45% Monster Life)', quant: 16, rarity: 10, packSize: 6, hpMult: 1.45 },
  { id: 'overlord', name: 'Twinned (Area contains 2 Map Bosses)', quant: 22, rarity: 18, packSize: 8, twinned: true },
  { id: 'swarming', name: 'Swarming (+24% Monster Pack Size)', quant: 15, rarity: 8, packSize: 24 },
  { id: 'smothering', name: 'Smothering (Players have 40% less Life Regen)', quant: 16, rarity: 10, packSize: 7, lessRegen: 40 },
  { id: 'executioner', name: 'Executioner (+35% Monster Damage & +15% Speed)', quant: 20, rarity: 14, packSize: 8, dmgMult: 1.35, speedMult: 1.15 },
  { id: 'bountiful', name: 'Bountiful (+30% Monster Life & +20% Rarity)', quant: 16, rarity: 20, packSize: 6, hpMult: 1.30 }
];

function getMapModPool() {
  return (Array.isArray(GameData.MAP_MOD_POOL) && GameData.MAP_MOD_POOL.length > 0)
    ? GameData.MAP_MOD_POOL
    : DEFAULT_MAP_MOD_POOL;
}

function rollRandomMapMods(count, existingIds = []) {
  const pool = getMapModPool().filter(m => !existingIds.includes(m.id));
  const picked = [];
  const avail = [...pool];
  for (let i = 0; i < count && avail.length > 0; i++) {
    const idx = Math.floor(Math.random() * avail.length);
    picked.push(avail.splice(idx, 1)[0]);
  }
  return picked;
}

function computeMapModStats(mods = []) {
  const stats = {
    quant: 0, rarity: 0, packSize: 0,
    hpMult: 1, dmgMult: 1, speedMult: 1, armorMult: 1,
    extraProj: 0, twinned: false, lessRegen: 0,
    mods: mods.map(m => m.name)
  };
  for (const mod of mods) {
    if (!mod) continue;
    stats.quant += mod.quant || 0;
    stats.rarity += mod.rarity || 0;
    stats.packSize += mod.packSize || 0;
    if (mod.hpMult) stats.hpMult *= mod.hpMult;
    if (mod.dmgMult) stats.dmgMult *= mod.dmgMult;
    if (mod.speedMult) stats.speedMult *= mod.speedMult;
    if (mod.armorMult) stats.armorMult *= mod.armorMult;
    if (mod.extraProj) stats.extraProj += mod.extraProj;
    if (mod.twinned) stats.twinned = true;
    if (mod.lessRegen) stats.lessRegen = Math.max(stats.lessRegen, mod.lessRegen);
  }
  return stats;
}

function craftRoomMapWithOrb(room, player, orbId) {
  if (!room || !player || room.state !== 'HIDEOUT') {
    return { ok: false, reason: 'Maps can only be crafted in the Sanctuary Hideout!' };
  }
  const mapId = room.selectedMapId || 'strand';
  if (!room.craftedMap || room.craftedMap.mapId !== mapId) {
    room.craftedMap = { mapId, rarity: 'normal', mods: [], scoured: false };
  }
  const cm = room.craftedMap;
  const curKey = orbId === 'scour' ? 'regret' : orbId;
  const have = (player.currencies && player.currencies[curKey]) || 0;
  if (have <= 0) {
    return { ok: false, reason: `Not enough ${curKey.toUpperCase()} Orbs to craft this map!` };
  }

  if (orbId === 'transmute') {
    if (cm.rarity !== 'normal') return { ok: false, reason: 'Transmutation requires a Normal (White) Map!' };
    player.currencies[curKey]--;
    cm.rarity = 'magic';
    cm.scoured = false;
    cm.mods = rollRandomMapMods(Math.random() < 0.55 ? 2 : 1);
  } else if (orbId === 'alteration') {
    if (cm.rarity !== 'magic') return { ok: false, reason: 'Alteration requires a Magic (Blue) Map!' };
    player.currencies[curKey]--;
    cm.mods = rollRandomMapMods(Math.random() < 0.65 ? 2 : 1);
  } else if (orbId === 'alchemy') {
    if (cm.rarity !== 'normal') return { ok: false, reason: 'Alchemy requires a Normal (White) Map! Use Scour/Regret first.' };
    player.currencies[curKey]--;
    cm.rarity = 'rare';
    cm.scoured = false;
    cm.mods = rollRandomMapMods(4);
  } else if (orbId === 'chaos') {
    if (cm.rarity !== 'rare') return { ok: false, reason: 'Chaos Orb requires a Rare (Yellow) Map!' };
    player.currencies[curKey]--;
    cm.mods = rollRandomMapMods(Math.random() < 0.45 ? 5 : 4);
  } else if (orbId === 'exalted') {
    if (cm.rarity !== 'rare') return { ok: false, reason: 'Exalted Orb requires a Rare (Yellow) Map!' };
    if (cm.mods.length >= 6) return { ok: false, reason: 'Map already has the maximum 6 modifiers!' };
    const extra = rollRandomMapMods(1, cm.mods.map(m => m.id));
    if (extra.length === 0) return { ok: false, reason: 'No additional map modifiers available!' };
    player.currencies[curKey]--;
    cm.mods.push(extra[0]);
  } else if (orbId === 'regret' || orbId === 'scour') {
    if (cm.rarity === 'normal' && cm.mods.length === 0) return { ok: false, reason: 'Map is already Normal with 0 modifiers!' };
    player.currencies[curKey]--;
    cm.rarity = 'normal';
    cm.mods = [];
    cm.scoured = true;
  } else {
    return { ok: false, reason: 'Unsupported currency orb for Map Crafting.' };
  }

  const st = computeMapModStats(cm.mods);
  room.mapModStats = st;
  return {
    ok: true,
    msg: `Crafted ${cm.rarity.toUpperCase()} Map (${cm.mods.length} Mods: +${st.quant}% Quant, +${st.rarity}% Rarity, +${st.packSize}% Pack Size)!`
  };
}

function startAtlasRun(room, mapId) {
  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === mapId) || GameData.ATLAS_MAPS[0];
  room.selectedMapId = mapDef.id;
  if (!room.craftedMap || room.craftedMap.mapId !== mapDef.id) {
    room.craftedMap = { mapId: mapDef.id, rarity: 'normal', mods: [], scoured: false };
  }
  // If map is Tier 3+ and has no mods (and wasn't scoured clean), roll 1-2 innate map mods; Tier 1-2 stay Normal unless crafted!
  if ((mapDef.tier || 1) >= 3 && room.craftedMap.mods.length === 0 && !room.craftedMap.scoured) {
    const autoCount = (mapDef.tier || 1) >= 11 ? 2 : 1;
    room.craftedMap.mods = rollRandomMapMods(autoCount);
    room.craftedMap.rarity = 'magic';
  }
  room.mapModStats = computeMapModStats(room.craftedMap.mods);
  room.isRaidEncounter = false;
  room.raidId = null;
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
  room.activeRitual = null;
  room.deliriumTimer = 0;
  room.deliriumKills = 0;
  room.deliriumTier = 0;
  room.deliriumWaveCd = 0;
  room.raidBeams = [];
  room.raidSanctuary = null;
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
    p.vaalLockTimer = 0;
    for (const f of GameData.FLASKS) {
      p.flaskCharges[f.id] = (p.unlockedFlasks || ['life']).includes(f.id) ? f.maxCharges : 0;
      p.activeFlasks[f.id] = 0;
    }
    if (Array.isArray(p.flaskBelt)) {
      p.flaskSlotCharges = p.flaskBelt.map((fId, idx) => {
        const fDef = fId ? GameData.FLASKS.find(f => f.id === fId) : null;
        const meta = Array.isArray(p.flaskBeltItems) ? p.flaskBeltItems[idx] : null;
        return (meta && meta.maxCharges) || (fDef ? fDef.maxCharges : 0);
      });
      p.flaskSlotTimers = [0, 0, 0, 0, 0];
    }
    // Rogue-lite per-run reset of Run Level, Skills, Run Stat Upgrades & fresh 6-item Run Vendor Stock!
    p.currentMapId = mapDef.id;
    generatePlayerVendorStock(p, mapDef.tier || 1);
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

  // Spawn initial monster packs around the perimeter (scales with Map Tier & Map Pack Size modifier!)
  const packMult = 1 + ((room.mapModStats && room.mapModStats.packSize) || 0) / 100;
  const initialPacks = Math.max(6, Math.round((6 + Math.floor(((mapDef.tier || 1) - 1) * 0.35)) * packMult));
  for (let i = 0; i < initialPacks; i++) {
    spawnMonsterPack(room);
  }

  const modSummary = room.mapModStats && room.mapModStats.mods && room.mapModStats.mods.length > 0
    ? ` [+${room.mapModStats.quant}% Qty / +${room.mapModStats.rarity}% Rarity • ${room.mapModStats.mods.join(' • ')}]`
    : '';
  addRoomChat(room, 'Atlas', `Opened portals to ${mapDef.name}!${modSummary}`, '#ffd147');
  broadcastRoomEvent(room, {
    type: 'announcement',
    title: `${mapDef.name} (${(room.craftedMap && room.craftedMap.rarity || 'normal').toUpperCase()})`,
    subtitle: modSummary ? `Active Mods:${modSummary}` : `Wave 1 Started! Earn Run Gold for Golden Chests & Rerolls!`,
    color: '#ffd147'
  });
}

function returnToHideout(room, reasonTitle, reasonSub) {
  room.state = 'HIDEOUT';
  room.craftedMap = { mapId: room.selectedMapId || 'strand', rarity: 'normal', mods: [], scoured: false };
  room.mapModStats = null;
  room.wave = 1;
  room.waveProgress = 0;
  room.enemies.clear();
  room.projectiles = [];
  room.groundDrops = [];
  room.hazards = [];
  room.interactables = [];
  room.upgradeChests = [];
  room.activeBreaches = [];
  room.activeRitual = null;
  room.deliriumTimer = 0;
  room.deliriumKills = 0;
  room.deliriumTier = 0;
  room.deliriumWaveCd = 0;
  room.raidBeams = [];
  room.raidSanctuary = null;
  room.fxEvents = [];

  for (const p of room.players.values()) {
    if ((p.earnedRunGold || 0) > 0) {
      p.gold = (p.gold || 0) + Math.floor(p.earnedRunGold);
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
      p.flaskSlotCharges = p.flaskBelt.map((fId, idx) => {
        const fDef = fId ? GameData.FLASKS.find(f => f.id === fId) : null;
        const meta = Array.isArray(p.flaskBeltItems) ? p.flaskBeltItems[idx] : null;
        return (meta && meta.maxCharges) || (fDef ? fDef.maxCharges : 0);
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

  broadcastRoomEvent(room, {
    type: 'announcement',
    title: reasonTitle || 'Returned to Sanctuary Hideout',
    subtitle: reasonSub || 'Craft Gear with Orbs [I], allocate Skill Tree Points [P], and prepare for your next Atlas Map!',
    color: '#63a4ff'
  });
}

const exportsObj = {
  getMapModPool,
  rollRandomMapMods,
  computeMapModStats,
  craftRoomMapWithOrb,
  startAtlasRun,
  returnToHideout
};
Object.assign(global, exportsObj);
module.exports = exportsObj;
