// Server Simulation Module: Authentic PoE Mechanics for The Maven, Sirus Awakener & Atlas Map Bosses
const GameData = global.GameData || require('../../public/shared/gameData.js');

// ============================================================================
// 3. THE MAVEN'S CRUCIBLE: MEMORY GAME (3-STEP SAFE SEQUENCE) & COIL BEAMS
// ============================================================================
function startMavenMemoryGame(room, boss) {
  boss.x = 0;
  boss.y = -60;
  boss.shielded = true;
  boss.shieldTimer = 10.5;
  boss.pauseTimer = 10.5;
  boss.castName = 'THE MEMORY GAME (WATCH & FOLLOW 1 → 2 → 3!)';
  boss.castTimer = 10.5;
  boss.castMax = 10.5;

  const zones = [
    { label: 'NORTH', x: 0, y: -210 },
    { label: 'EAST', x: 185, y: -30 },
    { label: 'SOUTH', x: 0, y: 145 },
    { label: 'WEST', x: -185, y: -30 }
  ];
  const seq = [];
  for (let i = 0; i < 3; i++) {
    let pickZone = pick(zones);
    while (seq.length > 0 && seq[seq.length - 1].label === pickZone.label) {
      pickZone = pick(zones);
    }
    seq.push(pickZone);
  }

  const seqText = seq.map((z, idx) => `${idx + 1}: ${z.label}`).join('  ➔  ');
  room.mavenMemory = {
    bossId: boss.id,
    seq,
    timer: 0,
    flashedIdx: -1,
    resolvedIdx: -1
  };

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
  if (!boss || boss.hp <= 0) {
    room.mavenMemory = null;
    return;
  }
  mem.timer += dt;

  // Phase A (0s - 3.0s): Flash the 3 safe zones in order at t = 0.2s, 1.1s, 2.0s
  for (let i = 0; i < 3; i++) {
    if (mem.timer >= 0.2 + i * 0.9 && mem.flashedIdx < i) {
      mem.flashedIdx = i;
      const z = mem.seq[i];
      room.fxEvents.push({ kind: 'nova', x: z.x, y: z.y, r: 105, color: '#69db7c' });
      // Spawn the actual safe sanctuary ring for the upcoming step resolution
      if (i === 0) {
        room.raidSanctuary = {
          id: uid('mem'), x: z.x, y: z.y, r: 110,
          fuse: 4.3 - mem.timer, maxFuse: 2.3,
          damage: Math.round(boss.damage * 2.2),
          bossName: `Memory Step 1 (${z.label})`,
          isMemoryStep: 1
        };
      }
    }
  }

  // Queue Step 2 sanctuary at t = 4.4s and Step 3 sanctuary at t = 6.9s
  if (mem.timer >= 4.4 && mem.resolvedIdx < 1) {
    mem.resolvedIdx = 1;
    const z2 = mem.seq[1];
    room.raidSanctuary = {
      id: uid('mem'), x: z2.x, y: z2.y, r: 110,
      fuse: 2.4, maxFuse: 2.4,
      damage: Math.round(boss.damage * 2.2),
      bossName: `Memory Step 2 (${z2.label})`,
      isMemoryStep: 2
    };
  }
  if (mem.timer >= 6.9 && mem.resolvedIdx < 2) {
    mem.resolvedIdx = 2;
    const z3 = mem.seq[2];
    room.raidSanctuary = {
      id: uid('mem'), x: z3.x, y: z3.y, r: 110,
      fuse: 2.4, maxFuse: 2.4,
      damage: Math.round(boss.damage * 2.4),
      bossName: `Memory Step 3 (${z3.label})`,
      isMemoryStep: 3
    };
  }

  if (mem.timer >= 9.6) {
    boss.shielded = false;
    boss.shieldTimer = 0;
    boss.pauseTimer = 3.0;
    boss.vulnerableTimer = 6.0;
    boss.castName = 'MEMORY GAME CLEARED — MAVEN STAGGERED (+50% DMG)!';
    boss.castTimer = 6.0;
    boss.castMax = 6.0;
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
  const hpRatio = m.hp / Math.max(1, m.maxHp);
  if ((m.bossPhase || 1) === 1 && hpRatio <= 0.70) {
    m.bossPhase = 2;
    startMavenMemoryGame(room, m);
    return;
  }
  if ((m.bossPhase || 1) === 2 && hpRatio <= 0.35 && !m.shielded) {
    m.bossPhase = 3;
    startMavenMemoryGame(room, m);
    // Phase 3 also spawns Maven's permanent rotating Void Coil Beams!
    room.raidBeams = room.raidBeams || [];
    room.raidBeams.push({
      id: uid('beam'), bossId: m.id, x: 0, y: -60,
      angle: 0, angVel: 0.44, arms: 2, length: 480,
      duration: 90.0, damage: Math.round(m.damage * 0.75), tickCd: 0.3
    });
    return;
  }
  if (m.shielded || m.actionTimer > 0 || bestD > 680) return;

  m.actionTimer = m.bossPhase === 3 ? 2.8 : 3.5;
  m.bossAttackIndex = ((m.bossAttackIndex || 0) + 1) % 4;

  if (m.bossAttackIndex === 0) {
    // 1. "CASCADE OF PAIN!" — Rapid Alternating Homing Void Volley
    m.pauseTimer = 0.9;
    m.castName = '"CASCADE OF PAIN!" (VOID BARRAGE)';
    m.castTimer = 1.6;
    m.castMax = 1.6;
    for (let i = 0; i < 9; i++) {
      const spread = (i - 4) * 0.16;
      pushEnemyBolt(room, m.x, m.y, ang + spread, 235 + (i % 2) * 35, 11, Math.round(m.damage * 0.85), 'cold', 3.0);
    }
  } else if (m.bossAttackIndex === 1) {
    // 2. "STAND STILL!" — Twin Overlapping Gravity Wells on Players
    m.pauseTimer = 0.8;
    m.castName = '"STAND STILL!" (GRAVITY CASCADE)';
    m.castTimer = 1.5;
    m.castMax = 1.5;
    for (const p of alivePlayers) {
      spawnGroundHazard(room, p.x - 36, p.y, 68, 1.4, Math.round(m.damage * 1.35), 'Maven Gravity Cascade');
      spawnGroundHazard(room, p.x + 36, p.y, 68, 1.65, Math.round(m.damage * 1.35), 'Maven Gravity Cascade');
    }
  } else if (m.bossAttackIndex === 2) {
    // 3. Brain Synapse Soak Orb (Soak to prevent Psychic Nova)
    const soakTarget = pick(alivePlayers) || target;
    m.castName = 'BRAIN SYNAPSE ORB (SOAK INSIDE RING!)';
    m.castTimer = 3.5;
    m.castMax = 3.5;
    room.hazards.push({
      id: uid('haz'), kind: 'soak', x: Math.round(soakTarget.x + randInt(-60, 60)), y: Math.round(soakTarget.y + randInt(-60, 60)),
      r: 72, fuse: 3.5, maxFuse: 3.5, damage: Math.round(m.damage * 1.7),
      title: 'SYNAPSE SOAK [STAND INSIDE!]', color: '#ffd43b'
    });
  } else {
    // 4. "TAKE THIS!" — Giant Twin Solar/Void Orbs + Summon Maven Nucleus Add
    m.pauseTimer = 0.7;
    m.castName = '"TAKE THIS!" (TWIN CELESTIAL ORBS)';
    m.castTimer = 1.4;
    m.castMax = 1.4;
    pushEnemyBolt(room, m.x, m.y, ang - 0.18, 145, 22, Math.round(m.damage * 1.35), 'fire', 4.2);
    pushEnemyBolt(room, m.x, m.y, ang + 0.18, 145, 22, Math.round(m.damage * 1.35), 'cold', 4.2);
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
  boss.castTimer = 5.5;
  boss.castMax = 5.5;

  // Pull all alive players toward the center of Sirus's Meteor Maze!
  for (const p of alivePlayersInRoom(room)) {
    p.x = boss.x + randInt(-30, 30);
    p.y = boss.y + randInt(-30, 30);
  }
  room.fxEvents.push({ kind: 'shockwave', x: boss.x, y: boss.y, r: 240, color: '#ff3b3b' });

  // Spawn an Escape Sanctuary Dome at the outer edge of the Meteor Maze!
  const exitAng = Math.random() * Math.PI * 2;
  const ex = Math.round(boss.x + Math.cos(exitAng) * 235);
  const ey = Math.round(boss.y + Math.sin(exitAng) * 235);
  room.raidSanctuary = {
    id: uid('sanc'), x: ex, y: ey, r: 115,
    fuse: 5.2, maxFuse: 5.2,
    damage: Math.round(boss.damage * 2.4),
    bossName: 'Sirus Meteor Maze'
  };

  // Spawn 4-Way Spinning Everlasting Fire Cross in Phase 2 & 3!
  room.raidBeams = room.raidBeams || [];
  room.raidBeams.push({
    id: uid('beam'), bossId: boss.id, x: boss.x, y: boss.y,
    angle: 0.2, angVel: phaseNum === 3 ? 0.65 : 0.48, arms: 4, length: 460,
    duration: phaseNum === 3 ? 75.0 : 22.0, damage: Math.round(boss.damage * 0.78), tickCd: 0.28
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
  const hpRatio = m.hp / Math.max(1, m.maxHp);
  if ((m.bossPhase || 1) === 1 && hpRatio <= 0.70) {
    triggerSirusMeteorMaze(room, m, 2);
    return;
  }
  if ((m.bossPhase || 1) === 2 && hpRatio <= 0.35) {
    triggerSirusMeteorMaze(room, m, 3);
    return;
  }

  // Fire queued "DIE!" beam burst after windup!
  if (m.dieBeamWindup > 0) {
    m.dieBeamWindup -= dt;
    if (m.dieBeamWindup <= 0 && target) {
      const aimAng = Math.atan2(target.y - m.y, target.x - m.x);
      const types = ['physical', 'fire', 'cold', 'lightning'];
      for (let b = 0; b < 7; b++) {
        const bAng = aimAng + (b - 3) * 0.032;
        pushEnemyBolt(room, m.x + Math.cos(aimAng) * (b * 18), m.y + Math.sin(aimAng) * (b * 18), bAng, 410, 15, Math.round(m.damage * 0.92), types[b % 4], 2.2);
      }
      room.fxEvents.push({ kind: 'shockwave', x: Math.round(m.x), y: Math.round(m.y), r: 120, color: '#ff3b3b' });
    }
    return;
  }

  if (m.actionTimer > 0 || bestD > 680) return;
  m.actionTimer = m.bossPhase === 3 ? 2.7 : 3.4;
  m.bossAttackIndex = ((m.bossAttackIndex || 0) + 1) % 4;

  if (m.bossAttackIndex === 0) {
    // 1. Iconic PoE Sirus "DIE!" Tracking Beam (Teleports to flank, winds up 1.15s, fires multi-elemental laser stream!)
    const flankAng = Math.random() * Math.PI * 2;
    m.x = Math.max(-ARENA_HALF + 120, Math.min(ARENA_HALF - 120, Math.round(target.x + Math.cos(flankAng) * 230)));
    m.y = Math.max(-ARENA_HALF + 120, Math.min(ARENA_HALF - 120, Math.round(target.y + Math.sin(flankAng) * 230)));
    room.fxEvents.push({ kind: 'blink', x: m.x, y: m.y, r: 58, color: '#ff3b3b' });
    m.pauseTimer = 1.25;
    m.dieBeamWindup = 1.15;
    m.castName = '⚠ "DIE!" BEAM — DASH SIDEWAYS NOW!';
    m.castTimer = 1.15;
    m.castMax = 1.15;
  } else if (m.bossAttackIndex === 1) {
    // 2. "RAIN OF STARS" — Circle of Clone Rings + Center Meteor
    m.pauseTimer = 0.9;
    m.castName = '"RAIN OF STARS!" (CORRUPTED CLONE RING)';
    m.castTimer = 1.6;
    m.castMax = 1.6;
    for (let k = 0; k < 6; k++) {
      const cAng = (Math.PI * 2 * k) / 6;
      spawnGroundHazard(room, target.x + Math.cos(cAng) * 110, target.y + Math.sin(cAng) * 110, 52, 1.5, Math.round(m.damage * 1.15), 'Rain of Stars');
    }
    spawnGroundHazard(room, target.x, target.y, 76, 1.65, Math.round(m.damage * 1.45), 'Awakener Starfall');
  } else if (m.bossAttackIndex === 2) {
    // 3. Deatomization Storm Soak / Chaos Vortex
    m.castName = 'DEATOMIZATION VORTEX (SOAK ORB!)';
    m.castTimer = 3.5;
    m.castMax = 3.5;
    room.hazards.push({
      id: uid('haz'), kind: 'soak', x: Math.round(target.x + randInt(-65, 65)), y: Math.round(target.y + randInt(-65, 65)),
      r: 74, fuse: 3.5, maxFuse: 3.5, damage: Math.round(m.damage * 1.75),
      title: 'AWAKENER ORB [STAND INSIDE!]', color: '#ffd43b'
    });
  } else {
    // 4. Desolation of the Awakener (3-Line Corridor Barrage)
    m.pauseTimer = 0.8;
    m.castName = '"EVERLASTING FIRE!" (CORRIDOR BARRAGE)';
    m.castTimer = 1.4;
    m.castMax = 1.4;
    for (let d = 1; d <= 4; d++) {
      spawnGroundHazard(room, m.x + Math.cos(ang) * (d * 80), m.y + Math.sin(ang) * (d * 80), 58, 0.5 + d * 0.22, Math.round(m.damage * 1.3), 'Desolation Slam');
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

  if (m.actionTimer > 0 || bestD > 620) return;
  m.actionTimer = 3.5;
  m.bossAttackIndex = ((m.bossAttackIndex || 0) + 1) % 3;
  if (m.bossAttackIndex === 0) {
    m.pauseTimer = 0.8;
    m.castName = 'TECTONIC SUNDER LINE';
    m.castTimer = 1.3;
    m.castMax = 1.3;
    for (let d = 1; d <= 4; d++) {
      spawnGroundHazard(room, m.x + Math.cos(ang) * (d * 80), m.y + Math.sin(ang) * (d * 80), 56, 0.45 + d * 0.22, Math.round(m.damage * 1.3), `${m.name} Sunder`);
    }
  } else if (m.bossAttackIndex === 1) {
    m.pauseTimer = 1.0;
    m.castName = 'CRUSHING LEAP SLAM';
    m.castTimer = 1.3;
    m.castMax = 1.3;
    room.hazards.push({
      id: uid('haz'), x: Math.round(target.x), y: Math.round(target.y), r: 86, fuse: 1.3, maxFuse: 1.3,
      damage: Math.round(m.damage * 1.45), title: `${m.name} Leap Slam`, leapBossId: m.id, color: '#ff4d4d'
    });
  } else {
    m.pauseTimer = 0.7;
    m.castName = 'ELEMENTAL NOVA BARRAGE';
    m.castTimer = 1.1;
    m.castMax = 1.1;
    for (let k = 0; k < 10; k++) {
      pushEnemyBolt(room, m.x, m.y, (Math.PI * 2 * k) / 10, 185, 11, Math.round(m.damage * 0.9), 'fire', 3.0);
    }
  }
}

const exportsObj = {
  startMavenMemoryGame,
  tickMavenMemoryGame,
  updateMavenBossAI,
  triggerSirusMeteorMaze,
  updateSirusBossAI,
  updateSingleBossAI
};
Object.assign(global, exportsObj);
module.exports = exportsObj;
