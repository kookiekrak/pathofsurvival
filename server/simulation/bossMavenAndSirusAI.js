// Server Simulation Module: Authentic PoE Mechanics for The Maven, Sirus Awakener & Atlas Map Bosses
const GameData = global.GameData || require('../../public/shared/gameData.js');

// ============================================================================
// 3. THE MAVEN'S CRUCIBLE: MEMORY GAME (3-STEP SAFE SEQUENCE) & COIL BEAMS
// ============================================================================
function startMavenMemoryGame(room, boss) {
  boss.x = 0; boss.y = -60;
  boss.shielded = true;
  boss.shieldTimer = boss.pauseTimer = boss.castTimer = boss.castMax = 10.5;
  boss.castName = 'THE MEMORY GAME (WATCH & FOLLOW 1 → 2 → 3!)';

  const zones = [
    { label: 'NORTH', x: 0, y: -210 }, { label: 'EAST', x: 185, y: -30 },
    { label: 'SOUTH', x: 0, y: 145 }, { label: 'WEST', x: -185, y: -30 }
  ];
  const seq = [];
  for (let i = 0; i < 3; i++) {
    let pickZone = pick(zones);
    while (seq.length > 0 && seq[seq.length - 1].label === pickZone.label) pickZone = pick(zones);
    seq.push(pickZone);
  }

  const seqText = seq.map((z, idx) => `${idx + 1}: ${z.label}`).join('  ➔  ');
  room.mavenMemory = { bossId: boss.id, seq, timer: 0, flashedIdx: -1, resolvedIdx: -1 };

  broadcastRoomEvent(room, {
    type: 'announcement',
    title: `🧠 MAVEN MEMORY GAME: ${seqText}`,
    subtitle: 'Watch the 3 Green Memory Rings flash, then stand in each ring in order (1 → 2 → 3)!',
    color: '#da77f2'
  });
  addRoomChat(room, 'The Maven', `🧠 "Let us see if you remember!" Sequence: ${seqText}`, '#da77f2');
}

function tickMavenMemoryGame(room, dt, alivePlayers) {
  const mem = room.mavenMemory;
  if (!mem) return;
  const boss = room.enemies.get(mem.bossId);
  if (!boss || boss.hp <= 0) { room.mavenMemory = null; return; }
  mem.timer += dt;

  // Phase A (0s - 3.0s): Flash the 3 safe zones in order at t = 0.2s, 1.1s, 2.0s
  for (let i = 0; i < 3; i++) {
    if (mem.timer >= 0.2 + i * 0.9 && mem.flashedIdx < i) {
      mem.flashedIdx = i;
      const z = mem.seq[i];
      room.fxEvents.push({ kind: 'nova', x: z.x, y: z.y, r: 105, color: '#69db7c' });
      if (i === 0) {
        room.raidSanctuary = {
          id: uid('mem'), x: z.x, y: z.y, r: 110, fuse: 4.3 - mem.timer, maxFuse: 2.3,
          damage: Math.round(boss.damage * 2.2), bossName: `Memory Step 1 (${z.label})`, isMemoryStep: 1
        };
      }
    }
  }

  // Queue Step 2 sanctuary at t = 4.4s and Step 3 sanctuary at t = 6.9s
  if (mem.timer >= 4.4 && mem.resolvedIdx < 1) {
    mem.resolvedIdx = 1;
    const z2 = mem.seq[1];
    room.raidSanctuary = {
      id: uid('mem'), x: z2.x, y: z2.y, r: 110, fuse: 2.4, maxFuse: 2.4,
      damage: Math.round(boss.damage * 2.2), bossName: `Memory Step 2 (${z2.label})`, isMemoryStep: 2
    };
  }
  if (mem.timer >= 6.9 && mem.resolvedIdx < 2) {
    mem.resolvedIdx = 2;
    const z3 = mem.seq[2];
    room.raidSanctuary = {
      id: uid('mem'), x: z3.x, y: z3.y, r: 110, fuse: 2.4, maxFuse: 2.4,
      damage: Math.round(boss.damage * 2.4), bossName: `Memory Step 3 (${z3.label})`, isMemoryStep: 3
    };
  }

  if (mem.timer >= 9.6) {
    boss.shielded = false; boss.shieldTimer = 0;
    boss.pauseTimer = 3.0; boss.vulnerableTimer = 6.0;
    boss.castName = 'MEMORY GAME CLEARED — MAVEN STAGGERED (+50% DMG)!';
    boss.castTimer = boss.castMax = 6.0;
    room.mavenMemory = null;
    for (const p of alivePlayers) {
      p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.4));
      p.vaalSouls = Math.min(60, (p.vaalSouls || 0) + 25);
      queueGemDraft(p, `MAVEN MEMORY GAME SURVIVED — BONUS BOON`);
      sendPrivateProfile(p);
    }
  }
}

function updateMavenBossAI(room, m, dt, target, bestD, ang, alivePlayers) {
  const half = typeof RAID_ARENA_HALF === 'number' ? RAID_ARENA_HALF : 560;
  const hpRatio = m.hp / Math.max(1, m.maxHp);
  if ((m.bossPhase || 1) === 1 && hpRatio <= 0.70) {
    m.bossPhase = 2;
    startMavenMemoryGame(room, m);
    return;
  }
  if ((m.bossPhase || 1) === 2 && hpRatio <= 0.35 && !m.shielded) {
    m.bossPhase = 3;
    startMavenMemoryGame(room, m);
    room.raidBeams = room.raidBeams || [];
    room.raidBeams.push({
      id: uid('beam'), bossId: m.id, x: 0, y: -60,
      angle: 0, angVel: 0.56, arms: 2, length: 480,
      duration: 90.0, damage: Math.round(m.damage * 0.82), tickCd: 0.28
    });
    return;
  }
  if (m.shielded || m.actionTimer > 0 || bestD > 680) return;

  m.actionTimer = (m.bossPhase >= 2 ? 2.4 : 2.8) + Math.random() * 0.30;
  m.bossAttackIndex = ((m.bossAttackIndex || 0) + 1) % 4;

  if (m.bossAttackIndex === 0) {
    // 1. "CASCADE OF PAIN!" — Star-Bolts + 2 Rotating Void Lasers
    m.pauseTimer = 0.85;
    m.castName = '"CASCADE OF PAIN!" (STAR-BOLTS + VOID LASERS)';
    m.castTimer = m.castMax = 1.35;
    for (let i = -3; i <= 3; i++) {
      pushEnemyBolt(room, m.x, m.y, ang + i * 0.16, 240, 11, Math.round(m.damage * 0.88), 'cold', 2.8);
    }
    room.raidBeams = room.raidBeams || [];
    if (room.raidBeams.length < 2) {
      room.raidBeams.push({
        id: uid('beam'), bossId: m.id, x: m.x, y: m.y,
        angle: ang, angVel: 0.58, arms: 2, length: 480,
        duration: 4.5, damage: Math.round(m.damage * 0.78), tickCd: 0.28
      });
    }
  } else if (m.bossAttackIndex === 1) {
    // 2. "STAND STILL!" — Twin Overlapping Gravity Wells on Players
    m.pauseTimer = 0.75;
    m.castName = '"STAND STILL!" (GRAVITY CASCADE)';
    m.castTimer = m.castMax = 1.35;
    for (const p of alivePlayers) {
      spawnGroundHazard(room, p.x - 36, p.y, 72, 1.25, Math.round(m.damage * 1.35), 'Maven Gravity Cascade');
      spawnGroundHazard(room, p.x + 36, p.y, 72, 1.5, Math.round(m.damage * 1.35), 'Maven Gravity Cascade');
    }
  } else if (m.bossAttackIndex === 2) {
    // 3. Brain Synapse Soak Orb (Soak to stagger Maven & prevent Psychic Nova)
    const soakTarget = pick(alivePlayers) || target;
    m.castName = 'BRAIN SYNAPSE ORB (STAND INSIDE TO STAGGER!)';
    m.castTimer = m.castMax = 3.2;
    const sx = Math.max(-half + 90, Math.min(half - 90, Math.round(soakTarget.x + randInt(-60, 60))));
    const sy = Math.max(-half + 90, Math.min(half - 90, Math.round(soakTarget.y + randInt(-60, 60))));
    room.hazards.push({
      id: uid('haz'), kind: 'soak', staggerBossId: m.id, x: sx, y: sy,
      r: 74, fuse: 3.2, maxFuse: 3.2, damage: Math.round(m.damage * 1.7),
      title: 'SYNAPSE SOAK [STAND INSIDE!]', color: '#ffd43b'
    });
  } else {
    // 4. "TAKE THIS!" — Twin Celestial Orbs + 8-Bolt Starburst
    m.pauseTimer = 0.75;
    m.castName = '"TAKE THIS!" (TWIN CELESTIAL ORBS)';
    m.castTimer = m.castMax = 1.25;
    pushEnemyBolt(room, m.x, m.y, ang - 0.18, 165, 22, Math.round(m.damage * 1.35), 'fire', 4.0);
    pushEnemyBolt(room, m.x, m.y, ang + 0.18, 165, 22, Math.round(m.damage * 1.35), 'cold', 4.0);
    for (let k = 0; k < 8; k++) {
      pushEnemyBolt(room, m.x, m.y, (Math.PI * 2 * k) / 8, 225, 10, Math.round(m.damage * 0.85), 'lightning', 2.6);
    }
  }
}

// ============================================================================
// 4. SIRUS, AWAKENER OF WORLDS: "DIE!" BEAM, METEOR MAZE & CORRUPTION CROSS
// ============================================================================
function triggerSirusMeteorMaze(room, boss, phaseNum) {
  boss.bossPhase = phaseNum;
  boss.x = 0;
  boss.y = -60;
  boss.pauseTimer = 5.5;
  boss.castName = '"FEEL THE THRILL OF THE VOID!" (ESCAPE METEOR MAZE!)';
  boss.castTimer = boss.castMax = 5.5;

  for (const p of alivePlayersInRoom(room)) {
    p.x = boss.x + randInt(-30, 30);
    p.y = boss.y + randInt(-30, 30);
  }
  room.fxEvents.push({ kind: 'shockwave', x: boss.x, y: boss.y, r: 240, color: '#ff3b3b' });

  const exitAng = Math.random() * Math.PI * 2;
  const ex = Math.round(boss.x + Math.cos(exitAng) * 235);
  const ey = Math.round(boss.y + Math.sin(exitAng) * 235);
  room.raidSanctuary = {
    id: uid('sanc'), x: ex, y: ey, r: 115,
    fuse: 5.2, maxFuse: 5.2,
    damage: Math.round(boss.damage * 2.4),
    bossName: 'Sirus Meteor Maze'
  };

  // Faster 4-Way Spinning Everlasting Fire Cross in Phase 2 & 3!
  room.raidBeams = room.raidBeams || [];
  room.raidBeams.push({
    id: uid('beam'), bossId: boss.id, x: boss.x, y: boss.y,
    angle: 0.2, angVel: phaseNum === 3 ? 0.92 : 0.72, arms: 4, length: 480,
    duration: phaseNum === 3 ? 85.0 : 28.0, damage: Math.round(boss.damage * 0.82), tickCd: 0.25
  });

  broadcastRoomEvent(room, {
    type: 'announcement',
    title: `☄ SIRUS METEOR MAZE: RUN TO THE GOLDEN EXIT RING!`,
    subtitle: 'Sirus pulled the party into the Meteor Maze — dash out to the Golden Sanctuary Ring within 5.2s!',
    color: '#ff4d4d'
  });
  addRoomChat(room, 'Sirus', `☄ "Feel the thrill of the Void!" Escape the center to the Golden Sanctuary Ring!`, '#ff4d4d');
}

function alivePlayersInRoom(room) {
  return Array.from(room.players.values()).filter(p => !p.dead);
}

function updateSirusBossAI(room, m, dt, target, bestD, ang, alivePlayers) {
  const half = typeof RAID_ARENA_HALF === 'number' ? RAID_ARENA_HALF : 560;
  const hpRatio = m.hp / Math.max(1, m.maxHp);
  if ((m.bossPhase || 1) === 1 && hpRatio <= 0.70) {
    triggerSirusMeteorMaze(room, m, 2);
    return;
  }
  if ((m.bossPhase || 1) === 2 && hpRatio <= 0.35) {
    triggerSirusMeteorMaze(room, m, 3);
    return;
  }

  if (m.dieBeamWindup > 0) {
    m.dieBeamWindup -= dt;
    if (m.dieBeamWindup <= 0 && target) {
      const aimAng = Math.atan2(target.y - m.y, target.x - m.x);
      const types = ['physical', 'fire', 'cold', 'lightning'];
      for (let b = 0; b < 9; b++) {
        const bAng = aimAng + (b - 4) * 0.032;
        pushEnemyBolt(room, m.x + Math.cos(aimAng) * (b * 18), m.y + Math.sin(aimAng) * (b * 18), bAng, 420, 15, Math.round(m.damage * 0.95), types[b % 4], 2.2);
      }
      room.fxEvents.push({ kind: 'shockwave', x: Math.round(m.x), y: Math.round(m.y), r: 120, color: '#ff3b3b' });
    }
    return;
  }

  if (m.actionTimer > 0 || bestD > 680) return;
  m.actionTimer = (m.bossPhase >= 2 ? 2.4 : 2.8) + Math.random() * 0.30;
  m.bossAttackIndex = ((m.bossAttackIndex || 0) + 1) % 4;

  if (m.bossAttackIndex === 0) {
    const flankAng = Math.random() * Math.PI * 2;
    m.x = Math.max(-half + 90, Math.min(half - 90, Math.round(target.x + Math.cos(flankAng) * 230)));
    m.y = Math.max(-half + 90, Math.min(half - 90, Math.round(target.y + Math.sin(flankAng) * 230)));
    room.fxEvents.push({ kind: 'blink', x: m.x, y: m.y, r: 58, color: '#ff3b3b' });
    m.pauseTimer = 1.2;
    m.dieBeamWindup = 1.05;
    m.castName = '⚠ "DIE!" BEAM — DASH SIDEWAYS NOW!';
    m.castTimer = m.castMax = 1.05;
  } else if (m.bossAttackIndex === 1) {
    m.pauseTimer = 0.85;
    m.castName = '"RAIN OF STARS!" (CORRUPTED METEOR RING)';
    m.castTimer = m.castMax = 1.4;
    for (let k = 0; k < 6; k++) {
      const cAng = (Math.PI * 2 * k) / 6;
      spawnGroundHazard(room, target.x + Math.cos(cAng) * 110, target.y + Math.sin(cAng) * 110, 56, 1.35, Math.round(m.damage * 1.2), 'Rain of Stars');
    }
    spawnGroundHazard(room, target.x, target.y, 80, 1.5, Math.round(m.damage * 1.45), 'Awakener Starfall');
  } else if (m.bossAttackIndex === 2) {
    m.castName = 'DEATOMIZATION VORTEX (STAND INSIDE TO STAGGER!)';
    m.castTimer = m.castMax = 3.2;
    const sx = Math.max(-half + 90, Math.min(half - 90, Math.round(target.x + randInt(-65, 65))));
    const sy = Math.max(-half + 90, Math.min(half - 90, Math.round(target.y + randInt(-65, 65))));
    room.hazards.push({
      id: uid('haz'), kind: 'soak', staggerBossId: m.id, x: sx, y: sy,
      r: 74, fuse: 3.2, maxFuse: 3.2, damage: Math.round(m.damage * 1.75),
      title: 'AWAKENER ORB [STAND INSIDE!]', color: '#ffd43b'
    });
  } else {
    // 4. Desolation of the Awakener: 10 Corruption Bolts + 4-Way Spinning Beams + Corridor Slam
    m.pauseTimer = 0.85;
    m.castName = '"EVERLASTING FIRE!" (SPINNING CORRUPTION CROSS)';
    m.castTimer = m.castMax = 1.35;
    for (let k = 0; k < 10; k++) {
      const bAng = (Math.PI * 2 * k) / 10;
      pushEnemyBolt(room, m.x, m.y, bAng, 235, 11, Math.round(m.damage * 0.88), k % 2 === 0 ? 'fire' : 'physical', 2.8);
    }
    room.raidBeams = room.raidBeams || [];
    if (room.raidBeams.length === 0) {
      room.raidBeams.push({
        id: uid('beam'), bossId: m.id, x: m.x, y: m.y,
        angle: ang, angVel: m.bossPhase === 3 ? 0.85 : 0.65, arms: 4, length: 480,
        duration: 6.0, damage: Math.round(m.damage * 0.8), tickCd: 0.25
      });
    }
    for (let d = 1; d <= 4; d++) {
      spawnGroundHazard(room, m.x + Math.cos(ang) * (d * 80), m.y + Math.sin(ang) * (d * 80), 58, 0.45 + d * 0.2, Math.round(m.damage * 1.3), 'Desolation Slam');
    }
  }
}

function updateSingleBossAI(room, m, dt, target, bestD, ang, alivePlayers) {
  if (m.vulnerableTimer > 0) m.vulnerableTimer = Math.max(0, m.vulnerableTimer - dt);
  if (m.castTimer > 0) {
    m.castTimer = Math.max(0, m.castTimer - dt);
    if (m.castTimer === 0) m.castName = null;
  }

  if (m.raidId === 'raid_searing_exarch' && typeof updateSearingExarchAI === 'function') return updateSearingExarchAI(room, m, dt, target, bestD, ang, alivePlayers);
  if (m.raidId === 'raid_eater_of_worlds' && typeof updateEaterOfWorldsAI === 'function') return updateEaterOfWorldsAI(room, m, dt, target, bestD, ang, alivePlayers);
  if (m.raidId === 'raid_maven_crucible') return updateMavenBossAI(room, m, dt, target, bestD, ang, alivePlayers);
  if (m.raidId === 'raid_sirus_awakener') return updateSirusBossAI(room, m, dt, target, bestD, ang, alivePlayers);

  // Atlas Map Boss 50% HP Crucible Phase Transition (Sanctuary Ring + Sweeping Lasers + Stagger Reward!)
  if ((m.bossPhase || 1) === 1 && m.hp <= m.maxHp * 0.55) {
    m.bossPhase = 2; m.pauseTimer = m.castTimer = m.castMax = 3.8;
    m.castName = '⚡ CRUCIBLE OVERLOAD — STAND IN GOLDEN SANCTUARY RING!';
    const sAng = Math.random() * Math.PI * 2;
    const sx = Math.max(-ARENA_HALF + 140, Math.min(ARENA_HALF - 140, Math.round(m.x + Math.cos(sAng) * 165)));
    const sy = Math.max(-ARENA_HALF + 140, Math.min(ARENA_HALF - 140, Math.round(m.y + Math.sin(sAng) * 165)));
    room.raidSanctuary = { id: uid('sanc'), staggerBossId: m.id, x: sx, y: sy, r: 105, fuse: 3.8, maxFuse: 3.8, damage: Math.round(m.damage * 1.85), bossName: `${m.name} Crucible Slam` };
    room.raidBeams = room.raidBeams || [];
    room.raidBeams.push({ id: uid('beam'), bossId: m.id, x: m.x, y: m.y, angle: ang, angVel: 0.62, arms: 2, length: 420, duration: 7.5, damage: Math.round(m.damage * 0.78), tickCd: 0.26 });
    broadcastRoomEvent(room, { type: 'announcement', title: `⚡ ${m.name.toUpperCase()} — PHASE II CRUCIBLE OVERLOAD!`, subtitle: 'Dash into the Golden Sanctuary Ring within 3.8s to survive the Nova and STAGGER the Boss (+50% Damage)!', color: '#ffd43b' });
    return;
  }
  if (m.actionTimer > 0 || bestD > 680) return;

  m.actionTimer = (m.bossPhase === 2 ? 2.5 : 2.9) + Math.random() * 0.30;
  m.attackStep = (m.attackStep || 0) + 1;
  switch (m.attackStep % 4) {
    case 0: {
      m.pauseTimer = 1.1; m.castName = '⚠ CATACLYSMIC SLAM — DODGE RED CIRCLE!'; m.castTimer = m.castMax = 1.35;
      const lx = Math.round(target.x), ly = Math.round(target.y);
      room.hazards.push({ id: uid('haz'), x: lx, y: ly, r: 135, fuse: 1.35, maxFuse: 1.35, damage: Math.round(m.damage * 1.45), title: `${m.name} Slam`, leapBossId: m.id, color: '#ff4d4d' });
      for (let k = 0; k < 4; k++) {
        const aAng = (Math.PI * 2 * k) / 4 + 0.4;
        spawnGroundHazard(room, lx + Math.cos(aAng) * 130, ly + Math.sin(aAng) * 130, 58, 1.65, Math.round(m.damage * 1.1), 'Aftershock');
      }
      break;
    }
    case 1:
      m.pauseTimer = 1.0; m.castName = 'SWEEPING CRUCIBLE LASERS (ROTATE AROUND BOSS!)'; m.castTimer = m.castMax = 3.2;
      room.raidBeams = room.raidBeams || [];
      if (room.raidBeams.length === 0) {
        room.raidBeams.push({ id: uid('beam'), bossId: m.id, x: m.x, y: m.y, angle: ang - 0.5, angVel: 0.62, arms: 2, length: 400, duration: 3.4, damage: Math.round(m.damage * 0.78), tickCd: 0.26 });
      }
      for (let i = -2; i <= 2; i++) pushEnemyBolt(room, m.x, m.y, ang + i * 0.22, 235, 11, Math.round(m.damage * 0.88), 'fire', 2.6);
      break;
    case 2: {
      m.pauseTimer = 0.8; m.castName = '⚡ AETHER SIPHON — STAND IN GOLDEN RING TO STAGGER!'; m.castTimer = m.castMax = 3.0;
      const sx = Math.max(-ARENA_HALF + 120, Math.min(ARENA_HALF - 120, Math.round(target.x + randInt(-75, 75))));
      const sy = Math.max(-ARENA_HALF + 120, Math.min(ARENA_HALF - 120, Math.round(target.y + randInt(-75, 75))));
      room.hazards.push({ id: uid('haz'), kind: 'soak', staggerBossId: m.id, x: sx, y: sy, r: 74, fuse: 3.0, maxFuse: 3.0, damage: Math.round(m.damage * 1.55), title: 'SOAK TO STAGGER BOSS!', color: '#ffd43b' });
      break;
    }
    default:
      m.pauseTimer = 0.85; m.castName = 'TRIPLE SUNDER FAULT LINE & CHARGE'; m.castTimer = m.castMax = 1.25;
      for (const lane of [-0.32, 0, 0.32]) {
        const lAng = ang + lane;
        for (let d = 1; d <= 4; d++) spawnGroundHazard(room, m.x + Math.cos(lAng) * (d * 82), m.y + Math.sin(lAng) * (d * 82), 56, 0.45 + d * 0.2, Math.round(m.damage * 1.2), `${m.name} Sunder`);
      }
      m.chargeWindup = 0.45; m.chargeAngle = ang;
      break;
  }
}

const exportsObj = { startMavenMemoryGame, tickMavenMemoryGame, updateMavenBossAI, triggerSirusMeteorMaze, updateSirusBossAI, updateSingleBossAI };
Object.assign(global, exportsObj);
module.exports = exportsObj;
