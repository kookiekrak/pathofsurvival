// Server Simulation Module: Authoritative 25Hz Main Simulation Loop & Snapshot Broadcaster
const GameData = global.GameData || require('../../public/shared/gameData.js');

// =========================================================================
// AUTHORITATIVE 25 HZ SIMULATION LOOP
// =========================================================================
const TICK_DT = 0.04;
setInterval(() => {
  for (const room of rooms.values()) {
    if (room.players.size === 0) continue;
    updateRoom(room, TICK_DT);
  }
}, 40);

function updateRoom(room, dt) {
  // Pause simulation ONLY in Singleplayer when choosing a Rogue-lite Level-Up or Chest upgrade!
  // In Multiplayer (2+ players in the room), combat never pauses!
  const isSingleplayer = room.players.size === 1;
  const isPaused = isSingleplayer && room.state === 'RUN' && Array.from(room.players.values()).some(
    p => !p.dead && p.pendingDrafts && p.pendingDrafts.length > 0
  );
  room.paused = isPaused;
  if (isPaused) {
    broadcastRoomSnapshot(room);
    return;
  }

  room.procCountThisTick = 0;
  const allPlayers = Array.from(room.players.values());
  const alivePlayers = [];

  updateRoomPlayers(room, dt, allPlayers, alivePlayers);
  const keepRunning = updateRoomWavesAndInteractables(room, dt, allPlayers, alivePlayers);
  if (!keepRunning) return;

  updateRoomEnemiesAndProjectiles(room, dt, allPlayers, alivePlayers);
  broadcastRoomSnapshot(room);
}

function broadcastRoomSnapshot(room) {
  // Broadcast Snapshot
  const snap = {
    type: 'state',
    roomCode: room.code,
    roomName: room.roomName,
    mode: room.state,
    paused: !!room.paused,
    mapId: room.selectedMapId,
    mapSeed: room.mapSeed || 1,
    isRaid: !!room.isRaidEncounter,
    deliriumRem: +(room.deliriumTimer || 0).toFixed(1),
    deliriumKills: room.deliriumKills || 0,
    raidBeams: room.raidBeams || [],
    raidSanctuary: room.raidSanctuary ? {
      x: room.raidSanctuary.x,
      y: room.raidSanctuary.y,
      r: room.raidSanctuary.r,
      rem: +Math.max(0, room.raidSanctuary.fuse).toFixed(1)
    } : null,
    wave: room.wave,
    waveProgress: Math.round(room.waveProgress || 0),
    runTimer: Math.round(room.runTimer),
    runDuration: room.runDuration,
    portalsOpen: room.portalsOpen,
    upgradeChests: room.upgradeChests || [],
    players: Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      classId: p.classId,
      league: p.league || 'Standard',
      deadHc: !!p.deadHardcore,
      ready: p.ready,
      level: p.level,
      runLevel: p.runLevel || 1,
      x: Math.round(p.x),
      y: Math.round(p.y),
      vx: Math.round(p.vx || 0),
      vy: Math.round(p.vy || 0),
      ax: +(p.aimX || 0).toFixed(1),
      ay: +(p.aimY || 1).toFixed(1),
      dashing: p.dashTimer > 0,
      firing: !!(p.input && p.input.firing),
      atkSeq: p.atkSeq || 0,
      atkAng: p.lastAtkAngle || 0,
      hp: Math.round(p.hp),
      maxHp: p.maxHp,
      es: Math.round(p.es),
      maxEs: p.maxEs,
      vaalSouls: p.vaalSouls || 0,
      maxVaalSouls: 60,
      vaalLock: +(p.vaalLockTimer || 0).toFixed(1),
      gold: room.state === 'RUN' ? Math.floor(p.runGold || 0) : Math.floor(p.gold || 0),
      runGold: Math.floor(p.runGold || 0),
      stashGold: Math.floor(p.gold || 0),
      nextChestCost: getNextChestCost(p, room),
      chestsOpened: p.chestsOpened || 0,
      dashCooldown: +p.dashCooldown.toFixed(1),
      hhStacks: p.hhStacks || 0,
      shrineBuff: p.shrineBuffTimer > 0 ? p.shrineBuffType : null,
      draftCount: p.pendingDrafts.length,
      kills: p.kills,
      dead: p.dead,
      reviveProgress: +p.reviveProgress.toFixed(2),
      rfRadius: getPlayerRfRadius(p)
    })),
    enemies: Array.from(room.enemies.values()).map(m => ({
      id: m.id,
      name: m.name,
      t: m.typeId,
      b: m.behavior,
      rarity: m.rarity,
      mods: m.mods,
      x: Math.round(m.x),
      y: Math.round(m.y),
      hp: m.hp,
      maxHp: m.maxHp,
      r: m.radius,
      c: m.color,
      chilled: m.chillTimer > 0,
      phase: m.bossPhase || 1,
      shielded: !!m.shielded,
      vuln: (m.vulnerableTimer || 0) > 0,
      castName: m.castName || null,
      castProg: m.castMax > 0 ? +(1 - m.castTimer / m.castMax).toFixed(2) : 0,
      pylon: !!m.isRaidPylon,
      parentId: m.parentBossId || null
    })),
    projectiles: room.projectiles.map(prj => ({
      id: prj.id,
      s: prj.skillId,
      dt: prj.damageType,
      x: Math.round(prj.x),
      y: Math.round(prj.y),
      vx: Math.round(prj.vx),
      vy: Math.round(prj.vy),
      r: prj.radius
    })),
    hazards: room.hazards.map(h => ({
      id: h.id,
      kind: h.kind || 'blast',
      color: h.color || null,
      x: h.x,
      y: h.y,
      r: h.r,
      prog: +(1 - h.fuse / h.maxFuse).toFixed(2),
      title: h.title
    })),
    interactables: room.interactables.filter(it => !it.used).map(it => ({
      id: it.id,
      kind: it.kind,
      sub: it.sub,
      label: it.label,
      color: it.color,
      x: it.x,
      y: it.y
    })),
    breaches: (room.activeBreaches || []).map(b => ({
      id: b.id,
      x: Math.round(b.x),
      y: Math.round(b.y),
      r: Math.round(b.radius),
      maxR: Math.round(b.maxRadius || 480),
      rem: +Math.max(0, b.duration).toFixed(1),
      kills: b.kills || 0
    })),
    drops: room.groundDrops.map(d => ({
      id: d.id,
      x: d.x,
      y: d.y,
      dt: d.dropType,
      kind: d.kind || (d.dropType === 'gear' ? 'item' : d.dropType === 'flask' ? 'flask' : 'currency'),
      flaskId: d.flaskId || null,
      currencyId: d.currencyId || null,
      t0: !!d.t0,
      label: d.label,
      rarity: d.rarity,
      item: d.item || null
    })),
    fx: room.fxEvents
  };

  room.fxEvents = [];
  broadcastRoomEvent(room, snap);
}

const exportsObj = { TICK_DT, updateRoom, broadcastRoomSnapshot };
Object.assign(global, exportsObj);
module.exports = exportsObj;
