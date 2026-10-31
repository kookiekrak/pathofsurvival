// Server World Module: Passive Tree Pathfinding, Shrines, Strongboxes, Breaches & Upgrade Chests
const GameData = global.GameData || require('../../public/shared/gameData.js');

function findShortestPassivePathToNode(allocatedPassives, targetNodeId) {
  return typeof GameData.findShortestPassivePath === 'function'
    ? GameData.findShortestPassivePath(allocatedPassives, targetNodeId)
    : [];
}

function canRemovePassiveNode(passives, nodeToRemove, startNode) {
  return typeof GameData.canRemovePassiveNode === 'function'
    ? GameData.canRemovePassiveNode(passives, nodeToRemove, startNode)
    : false;
}

// =========================================================================
// MAP RUN INITIALIZATION, SHRINES, STRONGBOXES, BREACHES, ESSENCES & RITUALS
// =========================================================================
const RAID_ARENA_HALF = 560;

function randArenaPos(minD, maxD, existingList) {
  for (let attempt = 0; attempt < 24; attempt++) {
    const ang = Math.random() * Math.PI * 2;
    const d = randInt(minD, maxD);
    const x = Math.round(Math.cos(ang) * d);
    const y = Math.round(Math.sin(ang) * d);
    if (!existingList || existingList.every(o => dist(x, y, o.x, o.y) >= 160)) {
      return { x, y };
    }
  }
  const ang = Math.random() * Math.PI * 2;
  const d = randInt(minD, maxD);
  return { x: Math.round(Math.cos(ang) * d), y: Math.round(Math.sin(ang) * d) };
}

function populateMapInteractables(room) {
  room.mapSeed = randInt(1000, 999999);
  room.interactables = [];
  room.upgradeChests = [];
  if (room.isRaidEncounter) return;

  const shrineTypes = [
    { kind: 'shrine', sub: 'echoing', label: 'Echoing Shrine (Skills Repeat + 35% CDR)', color: '#da77f2' },
    { kind: 'shrine', sub: 'thunderstorm', label: 'Thunderstorm Shrine (Auto-Lightning Bolts)', color: '#74c0fc' },
    { kind: 'shrine', sub: 'meteor', label: 'Meteor Shrine (Auto-Fireball Cataclysms)', color: '#ff922b' },
    { kind: 'shrine', sub: 'diamond', label: 'Diamond Shrine (100% Crit & +65% Crit Multi)', color: '#3bc9db' },
    { kind: 'shrine', sub: 'acceleration', label: 'Acceleration Shrine (+42% Speed & +32% CDR)', color: '#69db7c' },
    { kind: 'shrine', sub: 'brutal', label: 'Brutal Shrine (+45% More Damage & +35% AoE)', color: '#ff6b6b' }
  ];
  const boxTypes = [
    { sub: 'arcanist', label: "Arcanist's Strongbox (Currency & Ambush)", color: '#ffd43b' },
    { sub: 'armourer', label: "Armourer's Strongbox (Rare Gear & Ambush)", color: '#ff922b' },
    { sub: 'diviner', label: "Diviner's Strongbox (High-Tier Loot & Elites)", color: '#38d9a9' }
  ];

  // 1) Spawn 2 Shrines & 2 Strongboxes well-spaced across the arena so exploration feels rewarding
  for (let i = 0; i < 2; i++) {
    const pos = randArenaPos(260 + i * 240, 520 + i * 360, room.interactables);
    const st = shrineTypes[(i + randInt(0, shrineTypes.length - 1)) % shrineTypes.length];
    room.interactables.push({
      id: uid('shr'), kind: 'shrine', sub: st.sub, label: st.label, color: st.color,
      x: pos.x, y: pos.y, used: false
    });
  }
  for (let i = 0; i < 2; i++) {
    const pos = randArenaPos(300 + i * 260, 580 + i * 380, room.interactables);
    const bt = boxTypes[(i + randInt(0, boxTypes.length - 1)) % boxTypes.length];
    room.interactables.push({
      id: uid('box'), kind: 'strongbox', sub: bt.sub, label: bt.label, color: bt.color,
      x: pos.x, y: pos.y, used: false
    });
  }

  // 2) Spawn 2 Distinct League Encounters per map (Breach, Essence, Ritual, or Delirium)
  const leaguePool = [
    { idPrefix: 'brc', kind: 'breach', sub: 'chayula', label: 'Breach Hand — Click or [E] to Rip Open Breach', color: '#cc5de8' },
    { idPrefix: 'ess', kind: 'essence', sub: 'screaming', label: 'Essence Monolith — Release Crystal Rare & Gear [E]', color: '#3bc9db' },
    { idPrefix: 'rit', kind: 'ritual', sub: 'tribute', label: 'Ritual Altar — 3-Wave Blood Tribute & Party Boon [E]', color: '#ff4d6d' },
    { idPrefix: 'del', kind: 'delirium', sub: 'mirror', label: 'Mirror of Delirium — 42s Fog Surge & Bonus Rarity [E]', color: '#ced4da' }
  ];
  const firstIdx = randInt(0, leaguePool.length - 1);
  const chosenEncs = [leaguePool[firstIdx], leaguePool[(firstIdx + randInt(1, leaguePool.length - 1)) % leaguePool.length]];
  for (let i = 0; i < chosenEncs.length; i++) {
    const enc = chosenEncs[i];
    const pos = randArenaPos(340 + i * 260, 620 + i * 360, room.interactables);
    room.interactables.push({
      id: uid(enc.idPrefix), kind: enc.kind, sub: enc.sub, label: enc.label, color: enc.color,
      x: pos.x, y: pos.y, used: false
    });
  }

  // 3) Spawn 8 Golden Upgrade Chests across inner, mid, and outer rings so players always have Golden Boxes to spend Run Gold on!
  const chestRings = [
    [175, 320], [210, 360], [260, 420],
    [380, 620], [440, 720], [520, 840],
    [720, 1080], [820, 1220]
  ];
  for (const [minR, maxR] of chestRings) {
    const pos = randArenaPos(minR, maxR, [...room.interactables, ...room.upgradeChests]);
    room.upgradeChests.push({ id: `uchest_${uid('uc')}`, x: pos.x, y: pos.y, opened: false });
  }
}

function spawnAdditionalUpgradeChest(room) {
  if (!room || room.isRaidEncounter) return;
  if (!Array.isArray(room.upgradeChests)) room.upgradeChests = [];
  const alivePlayers = Array.from((room.players || new Map()).values()).filter(p => !p.dead);
  const anchor = alivePlayers.length > 0 ? pick(alivePlayers) : { x: 0, y: 0 };
  while (room.upgradeChests.filter(c => !c.opened).length < 6) {
    const ang = Math.random() * Math.PI * 2;
    const d = randInt(240, 660);
    const lim = (typeof ARENA_HALF === 'number' ? ARENA_HALF : 2850) - 90;
    const x = Math.max(-lim, Math.min(lim, Math.round(anchor.x + Math.cos(ang) * d)));
    const y = Math.max(-lim, Math.min(lim, Math.round(anchor.y + Math.sin(ang) * d)));
    room.upgradeChests.push({ id: `uchest_${uid('uc')}`, x, y, opened: false });
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
    if (!targetChest) return false;
  }

  player.targetChestId = null;
  const cost = getNextChestCost(player, room);
  if ((player.runGold || 0) < cost) {
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
  if (Array.isArray(player.flaskBelt) && Array.isArray(player.flaskSlotCharges)) {
    for (let sIdx = 0; sIdx < 5; sIdx++) {
      const fId = player.flaskBelt[sIdx];
      if (!fId) continue;
      const fDef = GameData.FLASKS.find(fl => fl.id === fId);
      const slotMeta = (Array.isArray(player.flaskBeltItems) && player.flaskBeltItems[sIdx]) || null;
      const maxChg = (slotMeta && slotMeta.maxCharges) || (fDef ? fDef.maxCharges : 30);
      player.flaskSlotCharges[sIdx] = Math.min(maxChg, (player.flaskSlotCharges[sIdx] || 0) + 8);
    }
  }
  for (const f of GameData.FLASKS) {
    if ((player.unlockedFlasks || ['life']).includes(f.id)) {
      player.flaskCharges[f.id] = Math.min(f.maxCharges, (player.flaskCharges[f.id] || 0) + 8);
    }
  }

  // Respawn 1 new Golden Upgrade Chest far out if fewer than 1 unopened remain
  spawnAdditionalUpgradeChest(room);

  room.fxEvents.push({
    kind: 'nova',
    x: Math.round(targetChest.x),
    y: Math.round(targetChest.y),
    r: 68,
    color: '#facc15'
  });

  queueGemDraft(player, `Golden Upgrade Chest #${player.chestsOpened} — Choose Gem or Run Boon`);
  sendPrivateProfile(player);
  return true;
}

function spawnRitualWave(room) {
  if (!room || !room.activeRitual) return;
  const rit = room.activeRitual;
  const totalCount = 3 + (rit.wave || 1);
  const rareCount = rit.wave >= 3 ? 2 : 1;
  room.fxEvents.push({ kind: 'nova', x: Math.round(rit.x), y: Math.round(rit.y), r: 165, color: '#ff4d6d' });

  for (let k = 0; k < totalCount; k++) {
    const ang = (Math.PI * 2 * k) / totalCount + (Math.random() - 0.5) * 0.25;
    const d = randInt(125, 220);
    const mx = Math.max(-ARENA_HALF + 70, Math.min(ARENA_HALF - 70, Math.round(rit.x + Math.cos(ang) * d)));
    const my = Math.max(-ARENA_HALF + 70, Math.min(ARENA_HALF - 70, Math.round(rit.y + Math.sin(ang) * d)));
    const rarity = k < rareCount ? 'rare' : (k < rareCount + 2 ? 'magic' : 'normal');
    const m = spawnMonster(room, false, { x: mx, y: my, exact: true, forceBuyIn: true }, rarity);
    if (m) m.isRitualMob = true;
  }
}

function activateInteractable(room, player, it) {
  if (!it || it.used) return;
  if (it.kind === 'upgrade_chest') {
    tryBuyUpgradeChest(room, player, it.id);
    return;
  }
  it.used = true;
  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];
  const mapIIR = ((mapDef && mapDef.lootRarityBonus) || 0) + ((room.mapModStats && room.mapModStats.rarity) || 0) + ((room.deliriumTier || 0) * 60);

  if (it.kind === 'shrine') {
    for (const p of room.players.values()) {
      p.shrineBuffType = it.sub;
      p.shrineBuffTimer = 28;
      p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.35));
      p.es = Math.min(p.maxEs, p.es + Math.round(p.maxEs * 0.35));
      recalcPlayer(p, false);
      sendPrivateProfile(p);
    }
    for (const m of Array.from(room.enemies.values())) {
      if (dist(it.x, it.y, m.x, m.y) <= 185 + m.radius) {
        damageEnemy(room, m, 35 + (player.level || 1) * 8, true, player, 0, 'lightning');
      }
    }
    room.fxEvents.push({ kind: 'nova', x: it.x, y: it.y, r: 145, color: it.color || '#69db7c' });
    addRoomChat(room, 'Shrine', `${player.name} activated ${it.label} for 28s!`, it.color);
    broadcastRoomEvent(room, { type: 'announcement', title: it.label, subtitle: '28s Party Shrine Boon Active!', color: it.color });
  } else if (it.kind === 'essence') {
    const dropIlvl = (mapDef.tier - 1) * 3 + Math.ceil((room.wave || 1) / 2) + 2;
    room.fxEvents.push({ kind: 'nova', x: it.x, y: it.y, r: 120, color: '#3bc9db' });
    spawnMonster(room, false, { x: it.x + 55, y: it.y, exact: true }, 'rare');
    spawnMonster(room, false, { x: it.x - 55, y: it.y, exact: true }, 'rare');
    for (let k = 0; k < 2; k++) {
      const ang = Math.PI * k;
      spawnMonster(room, false, { x: it.x + Math.cos(ang) * 110, y: it.y + Math.sin(ang) * 110, exact: true }, 'magic');
    }
    if (Math.random() < 0.35) {
      spawnGroundDrop(room, it.x - 16, it.y, 'currency', null, 1, mapIIR + 180);
    }
    spawnGroundDrop(room, it.x, it.y + 18, 'gear', 'rare', dropIlvl, mapIIR + 180);
    addRoomChat(room, 'Essence', `${player.name} shattered an Essence Monolith — Twin Crystal Rares & Rare Gear released!`, '#3bc9db');
  } else if (it.kind === 'ritual') {
    // 3-Wave Blood Ritual Encounter: loot & tribute boon draft drop only after clearing all 3 waves!
    room.activeRitual = { id: it.id, x: it.x, y: it.y, r: 320, wave: 1, maxWaves: 3 };
    spawnRitualWave(room);
    addRoomChat(room, 'Ritual', `${player.name} consecrated a Blood Ritual Altar — Wave 1 of 3 begun! Slay all Ritual Offerings!`, '#ff4d6d');
    broadcastRoomEvent(room, {
      type: 'announcement',
      title: 'BLOOD RITUAL — WAVE 1 OF 3!',
      subtitle: 'Slay all 3 Waves of Blood Offerings inside the Ritual Ring to claim Tribute Loot & Boon!',
      color: '#ff4d6d'
    });
  } else if (it.kind === 'delirium') {
    room.deliriumTimer = 42.0;
    room.deliriumKills = 0;
    room.deliriumTier = 1;
    room.deliriumWaveCd = 4.0;
    room.fxEvents.push({ kind: 'nova', x: it.x, y: it.y, r: 180, color: '#ced4da' });
    spawnMonsterPack(room, player.x, player.y);
    spawnMonster(room, false, { x: it.x + 85, y: it.y, exact: true, forceModCount: 4 }, 'rare');
    addRoomChat(room, 'Delirium', `${player.name} shattered a Mirror of Delirium! (42s Simulacrum Fog — Tier 1: +60% Item & Currency Rarity)`, '#dee2e6');
    broadcastRoomEvent(room, {
      type: 'announcement',
      title: 'MIRROR OF DELIRIUM SHATTERED! (TIER 1)',
      subtitle: '42s Delirium Fog Active — Slay hordes to climb Reward Tiers for +60% Rarity per Tier!',
      color: '#dee2e6'
    });
  } else if (it.kind === 'strongbox') {
    addRoomChat(room, 'Ambush', `${player.name} opened ${it.label} — Ambush Guard Pack approaching from afar!`, '#ffd43b');
    const guardCount = 4;
    for (let k = 0; k < guardCount; k++) {
      const ang = (Math.PI * 2 * k) / guardCount + (Math.random() - 0.5) * 0.3;
      const ambushDist = 340 + Math.random() * 180;
      const gx = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(it.x + Math.cos(ang) * ambushDist)));
      const gy = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(it.y + Math.sin(ang) * ambushDist)));
      spawnMonster(room, false, { x: gx, y: gy, exact: true }, k === 0 ? 'rare' : k === 1 ? 'magic' : 'normal');
    }
    const dropIlvl = (mapDef.tier - 1) * 3 + Math.ceil((room.wave || 1) / 2) + 1;
    const boxRarity = Math.random() < 0.005 ? 'unique' : (Math.random() < 0.55 ? 'rare' : 'magic');
    if (it.sub === 'arcanist' || Math.random() < 0.25) {
      spawnGroundDrop(room, it.x - 14, it.y, 'currency', null, 1, mapIIR + 140);
    }
    spawnGroundDrop(room, it.x + 14, it.y, 'gear', boxRarity, dropIlvl, mapIIR + 140);
  } else if (it.kind === 'breach') {
    room.fxEvents.push({ kind: 'nova', x: it.x, y: it.y, r: 140, color: '#cc5de8' });
    if (!Array.isArray(room.activeBreaches)) room.activeBreaches = [];
    const breachObj = {
      id: `breach_${it.id}`,
      x: it.x,
      y: it.y,
      radius: 24,
      maxRadius: 240,
      duration: 11.0,
      maxDuration: 11.0,
      elapsed: 0,
      spawnTimer: 0.2,
      wavesSpawned: 1,
      kills: 0
    };
    room.activeBreaches.push(breachObj);

    for (let k = 0; k < 4; k++) {
      const ang = (Math.PI * 2 * k) / 4 + (Math.random() - 0.5) * 0.25;
      const bDist = randInt(95, 165);
      spawnMonster(room, false, { x: it.x + Math.cos(ang) * bDist, y: it.y + Math.sin(ang) * bDist, exact: true }, 'normal', null, true);
    }
    spawnMonster(room, false, { x: it.x, y: it.y - 155, exact: true }, 'rare', null, true);

    addRoomChat(room, 'Breach', `${player.name} ripped open an expanding Chayula Breach Ring (11s)!`, '#cc5de8');
    broadcastRoomEvent(room, {
      type: 'announcement',
      title: 'Chayula Breach Ripped Open!',
      subtitle: 'Void Ring opened for 11 seconds! Slay Breach hordes before it collapses!',
      color: '#cc5de8'
    });
  }
}

function spawnWaveLeagueEncounter() {
  // Disabled so waves never spam extra boxes/breaches across the map!
  return;
}

const exportsObj = {
  RAID_ARENA_HALF,
  findShortestPassivePathToNode,
  canRemovePassiveNode,
  populateMapInteractables,
  spawnAdditionalUpgradeChest,
  tryBuyUpgradeChest,
  spawnRitualWave,
  activateInteractable,
  spawnWaveLeagueEncounter
};
Object.assign(global, exportsObj);
module.exports = exportsObj;
