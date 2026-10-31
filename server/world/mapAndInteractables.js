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
function populateMapInteractables(room) {
  room.interactables = [];
  const shrineTypes = [
    { kind: 'shrine', sub: 'echoing', label: 'Echoing Shrine (Skills Repeat + 35% CDR)', color: '#da77f2' },
    { kind: 'shrine', sub: 'thunderstorm', label: 'Thunderstorm Shrine (Auto-Lightning Bolts)', color: '#74c0fc' },
    { kind: 'shrine', sub: 'meteor', label: 'Meteor Shrine (Auto-Fireball Cataclysms)', color: '#ff922b' },
    { kind: 'shrine', sub: 'gloom', label: 'Gloom Shrine (Chaos Hex Explosions on Kill)', color: '#be4bdb' },
    { kind: 'shrine', sub: 'diamond', label: 'Diamond Shrine (100% Crit & +65% Crit Multi)', color: '#3bc9db' },
    { kind: 'shrine', sub: 'acceleration', label: 'Acceleration Shrine (+42% Speed & +32% CDR)', color: '#69db7c' },
    { kind: 'shrine', sub: 'brutal', label: 'Brutal Shrine (+45% More Damage & +35% AoE)', color: '#ff6b6b' }
  ];

  // Spawn 5 Active PoE Shrines across the map
  for (let i = 0; i < 5; i++) {
    const ang = (Math.PI * 2 * i) / 5 + (Math.random() - 0.5) * 0.35;
    const d = randInt(340, 1050);
    const st = shrineTypes[i % shrineTypes.length];
    room.interactables.push({
      id: uid('shr'), kind: 'shrine', sub: st.sub, label: st.label, color: st.color,
      x: Math.round(Math.cos(ang) * d), y: Math.round(Math.sin(ang) * d), used: false
    });
  }

  // Spawn 3 PoE Strongboxes (Arcanist, Armourer, Diviner)
  const boxTypes = [
    { sub: 'arcanist', label: "Arcanist's Strongbox (Currency & Ambush)", color: '#ffd43b' },
    { sub: 'armourer', label: "Armourer's Strongbox (Rare Gear & Ambush)", color: '#ff922b' },
    { sub: 'diviner', label: "Diviner's Strongbox (High-Tier Loot & Elites)", color: '#38d9a9' }
  ];
  for (let i = 0; i < 3; i++) {
    const ang = (Math.PI * 2 * i) / 3 + 0.45 + (Math.random() - 0.5) * 0.25;
    const d = Math.round(480 + Math.random() * 580);
    const bt = boxTypes[i % boxTypes.length];
    room.interactables.push({
      id: uid('box'), kind: 'strongbox', sub: bt.sub, label: bt.label, color: bt.color,
      x: Math.round(Math.cos(ang) * d), y: Math.round(Math.sin(ang) * d), used: false
    });
  }

  // Spawn 2 Breach Hands across the map
  for (let i = 0; i < 2; i++) {
    const ang = Math.PI * i + 0.35 + (Math.random() - 0.5) * 0.25;
    const d = randInt(420, 860);
    room.interactables.push({
      id: uid('brc'), kind: 'breach', sub: 'chayula',
      label: 'Breach Hand — Click or [E] to Rip Open Breach', color: '#cc5de8',
      x: Math.round(Math.cos(ang) * d), y: Math.round(Math.sin(ang) * d), used: false
    });
  }

  // Spawn 2 Essence Monoliths (Frozen Multi-Essence Bosses that drop guaranteed Currency & Rare Gear)
  for (let i = 0; i < 2; i++) {
    const ang = Math.PI * i + 1.15;
    const d = randInt(390, 820);
    room.interactables.push({
      id: uid('ess'), kind: 'essence', sub: 'screaming',
      label: 'Essence Monolith — Release Crystal Rare & Orbs [E]', color: '#3bc9db',
      x: Math.round(Math.cos(ang) * d), y: Math.round(Math.sin(ang) * d), used: false
    });
  }

  // Spawn 2 Blood Ritual Altars (Summons Ritual Circle Wave + Grants Free Party Boon Draft & Gold)
  for (let i = 0; i < 2; i++) {
    const ang = Math.PI * i + 2.1;
    const d = randInt(440, 880);
    room.interactables.push({
      id: uid('rit'), kind: 'ritual', sub: 'tribute',
      label: 'Ritual Altar — Tribute Wave & Free Party Upgrade [E]', color: '#ff4d6d',
      x: Math.round(Math.cos(ang) * d), y: Math.round(Math.sin(ang) * d), used: false
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
    room.upgradeChests.push({ id: chestId, x: cx, y: cy, opened: false });
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
      p.shrineBuffTimer = 28;
      p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.35));
      p.es = Math.min(p.maxEs, p.es + Math.round(p.maxEs * 0.35));
      recalcPlayer(p, false);
      sendPrivateProfile(p);
    }
    // Immediate Shrine Shockwave damages surrounding monsters
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
    spawnMonster(room, false, { x: it.x + 45, y: it.y, exact: true }, 'rare');
    spawnMonster(room, false, { x: it.x - 45, y: it.y, exact: true }, 'rare');
    for (let k = 0; k < 4; k++) {
      const ang = (Math.PI * 2 * k) / 4;
      spawnMonster(room, false, { x: it.x + Math.cos(ang) * 110, y: it.y + Math.sin(ang) * 110, exact: true }, 'magic');
    }
    spawnGroundDrop(room, it.x - 16, it.y, 'currency');
    spawnGroundDrop(room, it.x + 16, it.y, 'currency');
    spawnGroundDrop(room, it.x, it.y + 18, 'gear', 'rare', dropIlvl);
    addRoomChat(room, 'Essence', `${player.name} shattered an Essence Monolith — Twin Crystal Rares & Crafting Orbs released!`, '#3bc9db');
  } else if (it.kind === 'ritual') {
    room.fxEvents.push({ kind: 'nova', x: it.x, y: it.y, r: 155, color: '#ff4d6d' });
    for (let k = 0; k < 8; k++) {
      const ang = (Math.PI * 2 * k) / 8;
      spawnMonster(room, false, { x: it.x + Math.cos(ang) * 160, y: it.y + Math.sin(ang) * 160, exact: true }, k < 2 ? 'rare' : 'magic');
    }
    for (const p of room.players.values()) {
      if (!p.dead) {
        p.runGold = (p.runGold || 0) + 55;
        p.earnedRunGold = (p.earnedRunGold || 0) + 55;
        p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.45));
        queueGemDraft(p, 'Ritual Tribute Altar — Choose 1 Free Blood Tribute Upgrade');
        sendPrivateProfile(p);
      }
    }
    addRoomChat(room, 'Ritual', `${player.name} consecrated a Blood Ritual Altar (+55 Run Gold & Free Tribute Upgrade Draft)!`, '#ff4d6d');
    broadcastRoomEvent(room, { type: 'announcement', title: 'Blood Ritual Consecrated!', subtitle: '+55 Run Gold & Free Tribute Upgrade Draft Granted!', color: '#ff4d6d' });
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
    room.fxEvents.push({ kind: 'nova', x: it.x, y: it.y, r: 140, color: '#cc5de8' });
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
      spawnMonster(room, false, { x: it.x + Math.cos(ang) * bDist, y: it.y + Math.sin(ang) * bDist, exact: true }, 'normal', null, true);
    }
    for (let k = 0; k < 2; k++) {
      const ang = Math.PI * k + 0.6;
      spawnMonster(room, false, { x: it.x + Math.cos(ang) * 145, y: it.y + Math.sin(ang) * 145, exact: true }, 'magic', null, true);
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

const exportsObj = {
  findShortestPassivePathToNode,
  canRemovePassiveNode,
  populateMapInteractables,
  tryBuyUpgradeChest,
  activateInteractable,
  spawnWaveLeagueEncounter
};
Object.assign(global, exportsObj);
module.exports = exportsObj;
