// Server Simulation Module: Authentic PoE Pinnacle Boss Raid Engine (Searing Exarch, Eater of Worlds & Map Bosses)
const GameData = global.GameData || require('../../public/shared/gameData.js');

function startPinnacleBossRaid(room, raidId) {
  const raidList = GameData.PINNACLE_RAID_BOSSES || [];
  const raidDef = raidList.find(r => r.id === raidId) || raidList[0];
  if (!raidDef) return;

  room.selectedMapId = raidDef.mapId || 'vaal_pyramid';
  room.activeRaidDef = raidDef;
  room.isRaidEncounter = true;
  room.raidId = raidDef.id;
  room.state = 'RUN';
  room.wave = raidDef.tier * 2;
  room.waveProgress = 0; room.runTimer = 0; room.runDuration = 360; room.spawnAccumulator = 0;
  room.bossSpawned = true; room.lastBossWave = room.wave; room.portalsOpen = false;
  room.enemies.clear();
  room.projectiles = []; room.groundDrops = []; room.hazards = []; room.activeBreaches = [];
  room.raidBeams = []; room.raidSanctuary = null; room.mavenMemory = null; room.exarchBoulderPhase = null;
  room.fxEvents = [];
  populateMapInteractables(room);

  for (const p of room.players.values()) {
    p.ready = false; p.dead = false; p.reviveProgress = 0;
    p.hhStacks = 0; p.hhTimer = 0; p.shrineBuffTimer = 0;
    p.targetDropId = null; p.targetChestId = null; p.lohBudget = 6;
    p.vaalSouls = 30; p.vaalLockTimer = 0;
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
    p.currentMapId = room.selectedMapId;
    resetPlayerRunSkills(p);
    recalcPlayer(p, true);
    const treeStartGold = (p.stats && p.stats.startingGold) || 25;
    p.startingRunGold = 90 + treeStartGold;
    p.runGold = p.startingRunGold;
    p.earnedRunGold = 0;
    p.nextChestCost = getNextChestCost(p, room);
    p.x = randInt(-45, 45);
    p.y = randInt(80, 140);
    p.graceTimer = 2.0;
    p.hitGraceTimer = 0;

    queueGemDraft(p, `RAID PREPARATION I — GEAR UP FOR ${raidDef.name.toUpperCase()}`);
    queueGemDraft(p, `RAID PREPARATION II — CHOOSE SUPPORT OR ASCENDANCY BOON`);
    sendPrivateProfile(p);
  }

  const partyMult = 1 + (room.players.size - 1) * 0.6;
  const bossId = uid('boss');
  const maxHp = Math.round(raidDef.hpBase * partyMult);
  const modelByRaid = {
    raid_searing_exarch: 'kitava_herald',
    raid_eater_of_worlds: 'devourer',
    raid_maven_crucible: 'necromancer',
    raid_sirus_awakener: 'cultist'
  };
  room.enemies.set(bossId, {
    id: bossId, name: raidDef.bossName, typeId: modelByRaid[raidDef.id] || 'kitava_herald',
    rarity: 'boss', isPinnacleRaid: true, raidId: raidDef.id,
    mods: [raidDef.subtitle || 'Pinnacle Raid Boss', raidDef.mechanicsDesc],
    x: 0, y: -210, hp: maxHp, maxHp, armor: raidDef.armor || 100,
    speed: 146 + raidDef.tier * 3, radius: 40, damage: raidDef.dmgBase,
    xp: 900 * raidDef.tier, color: '#ff3b3b', behavior: 'boss', bossPhase: 1,
    actionTimer: 3.0, castName: null, castTimer: 0, castMax: 0,
    shielded: false, shieldTimer: 0, vulnerableTimer: 0, hitTimer: 0, chillTimer: 0, shockTimer: 0
  });

  addRoomChat(room, 'Raid', `[PINNACLE RAID] ${raidDef.name} has manifested! Mechanics: ${raidDef.mechanicsDesc}`, '#ff6b6b');
  broadcastRoomEvent(room, {
    type: 'announcement',
    title: `PINNACLE RAID: ${raidDef.name.toUpperCase()}`,
    subtitle: raidDef.mechanicsDesc,
    color: '#ff4d4d'
  });
}

// ============================================================================
// 1. THE SEARING EXARCH: CLEANSING FIRE ROLLING BOULDER BULLET-HELL & INCINERATION
// ============================================================================
function startExarchRollingBoulderPhase(room, boss, phaseNum) {
  boss.bossPhase = phaseNum;
  boss.x = 0;
  boss.y = -60;
  boss.shielded = true;
  boss.shieldTimer = 10.0;
  boss.pauseTimer = 10.0;
  boss.castName = '"CLEANSING FIRE!" (DODGE ROLLING MAGMA BOULDER WALLS!)';
  boss.castTimer = 10.0;
  boss.castMax = 10.0;

  room.exarchBoulderPhase = {
    bossId: boss.id,
    timer: 10.0,
    waveTimer: 0.2,
    waveDir: 0
  };
  // Spawn a Searing Minotaur Vanguard during the boulder phase (authentic Exarch mechanic!)
  spawnMonster(room, false, { x: boss.x + 120, y: boss.y + 80, exact: true }, 'rare');

  broadcastRoomEvent(room, {
    type: 'announcement',
    title: '🔥 SEARING EXARCH: CLEANSING FIRE BOULDER WAVE!',
    subtitle: 'Weave through the gaps in the Rolling Magma Boulders for 10s while avoiding the Minotaur!',
    color: '#ff922b'
  });
  addRoomChat(room, 'The Searing Exarch', `🔥 "Be cleansed in solar fire!" Dodge the rolling Magma Boulder walls!`, '#ff922b');
}

function tickExarchBoulderPhase(room, dt) {
  const bp = room.exarchBoulderPhase;
  if (!bp) return;
  const boss = room.enemies.get(bp.bossId);
  if (!boss || boss.hp <= 0) {
    room.exarchBoulderPhase = null;
    return;
  }
  bp.timer -= dt;
  bp.waveTimer -= dt;
  if (bp.waveTimer <= 0 && bp.timer > 1.2) {
    bp.waveTimer = 2.1;
    const dirs = [
      { ang: Math.PI / 2, ox: 0, oy: -420, px: 1, py: 0 },
      { ang: 0, ox: -420, oy: -60, px: 0, py: 1 },
      { ang: -Math.PI / 2, ox: 0, oy: 320, px: 1, py: 0 },
      { ang: Math.PI, ox: 420, oy: -60, px: 0, py: 1 }
    ];
    const d = dirs[bp.waveDir % dirs.length];
    bp.waveDir++;
    const gap1 = randInt(-3, 0);
    const gap2 = randInt(1, 3);
    for (let slot = -5; slot <= 5; slot++) {
      if (slot === gap1 || slot === gap2) continue;
      const sx = d.ox + d.px * (slot * 68);
      const sy = d.oy + d.py * (slot * 68);
      pushEnemyBolt(room, sx, sy, d.ang, 168, 22, Math.round(boss.damage * 1.15), 'fire', 5.2);
    }
  }
  if (bp.timer <= 0) {
    boss.shielded = false;
    boss.shieldTimer = 0;
    boss.pauseTimer = 2.5;
    boss.vulnerableTimer = 5.5;
    boss.castName = 'SOLAR EXHAUSTION (+50% DAMAGE TAKEN!)';
    boss.castTimer = 5.5;
    boss.castMax = 5.5;
    room.exarchBoulderPhase = null;
  }
}

function updateSearingExarchAI(room, m, dt, target, bestD, ang, alivePlayers) {
  const hpRatio = m.hp / Math.max(1, m.maxHp);
  if ((m.bossPhase || 1) === 1 && hpRatio <= 0.70) {
    startExarchRollingBoulderPhase(room, m, 2);
    return;
  }
  if ((m.bossPhase || 1) === 2 && hpRatio <= 0.35 && !m.shielded) {
    startExarchRollingBoulderPhase(room, m, 3);
    return;
  }
  if (m.shielded || m.actionTimer > 0 || bestD > 680) return;

  m.actionTimer = m.bossPhase === 3 ? 2.9 : 3.6;
  m.bossAttackIndex = ((m.bossAttackIndex || 0) + 1) % 4;

  if (m.bossAttackIndex === 0) {
    // 1. "INCINERATION!" — Giant 235-Radius Solar Flameblast Centered on Exarch (Run OUT!)
    m.pauseTimer = 2.8;
    m.castName = '🔥 "INCINERATION!" — GET OUTSIDE THE BLAST RING!';
    m.castTimer = 2.6;
    m.castMax = 2.6;
    spawnGroundHazard(room, m.x, m.y, 235, 2.6, Math.round(m.damage * 2.1), 'Exarch Incineration Nova');
  } else if (m.bossAttackIndex === 1) {
    // 2. "ANNIHILATION!" — Sweeping Fan of 11 Solar Fireballs
    m.pauseTimer = 1.0;
    m.castName = '"ANNIHILATION!" (SWEEPING SOLAR ARC)';
    m.castTimer = 1.4;
    m.castMax = 1.4;
    for (let i = -5; i <= 5; i++) {
      pushEnemyBolt(room, m.x, m.y, ang + i * 0.14, 235, 13, Math.round(m.damage * 0.95), 'fire', 3.2);
    }
  } else if (m.bossAttackIndex === 2) {
    // 3. Searing Disintegration Rune Traps (Ring of Runes around Players)
    m.pauseTimer = 0.8;
    m.castName = 'SEARING RUNE TRAPS';
    m.castTimer = 1.5;
    m.castMax = 1.5;
    for (let r = 0; r < 5; r++) {
      const rAng = (Math.PI * 2 * r) / 5 + Math.random() * 0.4;
      spawnGroundHazard(room, target.x + Math.cos(rAng) * 90, target.y + Math.sin(rAng) * 90, 52, 1.4 + r * 0.15, Math.round(m.damage * 1.25), 'Searing Rune Trap');
    }
  } else {
    // 4. Rolling Magma Line Wall with Gap
    m.pauseTimer = 0.8;
    m.castName = 'ROLLING MAGMA LINE';
    m.castTimer = 1.5;
    m.castMax = 1.5;
    const perpAng = ang + Math.PI / 2;
    const gap = randInt(-1, 1);
    for (let w = -4; w <= 4; w++) {
      if (w === gap) continue;
      pushEnemyBolt(room, m.x + Math.cos(perpAng) * (w * 60), m.y + Math.sin(perpAng) * (w * 60), ang, 190, 16, Math.round(m.damage * 1.05), 'fire', 3.4);
    }
  }
}

// ============================================================================
// 2. THE EATER OF WORLDS: "INESCAPABLE DOOM" (SOAK 3 ORBS), "HUNGER!" & "CONSUME!"
// ============================================================================
function startEaterInescapableDoom(room, boss, phaseNum) {
  boss.bossPhase = phaseNum;
  boss.x = 0;
  boss.y = -60;
  boss.shielded = true;
  boss.shieldTimer = 9.5;
  boss.pauseTimer = 9.5;
  boss.castName = '"INESCAPABLE DOOM!" (SOAK ALL 3 AETHER RINGS!)';
  boss.castTimer = 9.5;
  boss.castMax = 9.5;

  for (let i = 0; i < 3; i++) {
    const oAng = (Math.PI * 2 * i) / 3 - Math.PI / 2;
    const ox = Math.round(boss.x + Math.cos(oAng) * 195);
    const oy = Math.round(boss.y + Math.sin(oAng) * 195);
    room.hazards.push({
      id: uid('haz'), kind: 'soak', x: ox, y: oy, r: 78,
      fuse: 3.0 + i * 2.6, maxFuse: 3.0 + i * 2.6,
      damage: Math.round(boss.damage * 1.85),
      title: `DOOM ORB #${i + 1} [STAND INSIDE!]`, color: '#ffd43b'
    });
  }

  broadcastRoomEvent(room, {
    type: 'announcement',
    title: '🐙 EATER OF WORLDS: INESCAPABLE DOOM!',
    subtitle: 'Stand inside Doom Orb #1 → #2 → #3 as they charge to prevent an arena-wide Doom detonation!',
    color: '#3bc9db'
  });
  addRoomChat(room, 'The Eater of Worlds', `🐙 "Inescapable Doom!" Stand inside each Golden Aether Ring (#1 → #2 → #3) before it detonates!`, '#3bc9db');
}

function updateEaterOfWorldsAI(room, m, dt, target, bestD, ang, alivePlayers) {
  const hpRatio = m.hp / Math.max(1, m.maxHp);
  if ((m.bossPhase || 1) === 1 && hpRatio <= 0.70) {
    startEaterInescapableDoom(room, m, 2);
    return;
  }
  if ((m.bossPhase || 1) === 2 && hpRatio <= 0.35 && !m.shielded) {
    startEaterInescapableDoom(room, m, 3);
    return;
  }
  if (m.shielded) {
    m.shieldTimer -= dt;
    if (m.shieldTimer <= 0) {
      m.shielded = false;
      m.pauseTimer = 2.5;
      m.vulnerableTimer = 5.5;
      m.castName = 'DOOM EXHAUSTED (+50% DAMAGE TAKEN!)';
      m.castTimer = 5.5;
      m.castMax = 5.5;
    }
    return;
  }
  if (m.actionTimer > 0 || bestD > 680) return;

  m.actionTimer = m.bossPhase === 3 ? 2.8 : 3.5;
  m.bossAttackIndex = ((m.bossAttackIndex || 0) + 1) % 4;

  if (m.bossAttackIndex === 0) {
    // 1. "HUNGER!" — Massive 185-Radius Tentacle Mass Slam on Player
    m.pauseTimer = 1.6;
    m.castName = '🐙 "HUNGER!" — DODGE MASSIVE TENTACLE SLAM!';
    m.castTimer = 1.75;
    m.castMax = 1.75;
    spawnGroundHazard(room, target.x, target.y, 180, 1.75, Math.round(m.damage * 1.95), 'Eater "Hunger!" Slam');
  } else if (m.bossAttackIndex === 1) {
    // 2. "CONSUME!" — Sweeping Tracking Beam + Inward Pull
    m.pauseTimer = 1.4;
    m.castName = '"CONSUME!" (SWEEPING COSMOS BEAM)';
    m.castTimer = 3.8;
    m.castMax = 3.8;
    room.raidBeams = room.raidBeams || [];
    room.raidBeams.push({
      id: uid('beam'), bossId: m.id, x: m.x, y: m.y,
      angle: ang - 0.65, angVel: 0.42, arms: 2, length: 440,
      duration: 3.8, damage: Math.round(m.damage * 0.8), tickCd: 0.26
    });
  } else if (m.bossAttackIndex === 2) {
    // 3. Tentacle Whip Cross (4 Perpendicular Lines of Tentacle Slams)
    m.pauseTimer = 0.9;
    m.castName = 'WRITHING TENTACLE CROSS';
    m.castTimer = 1.4;
    m.castMax = 1.4;
    for (let arm = 0; arm < 4; arm++) {
      const aAng = ang + (Math.PI * 2 * arm) / 4;
      for (let d = 1; d <= 3; d++) {
        spawnGroundHazard(room, m.x + Math.cos(aAng) * (d * 85), m.y + Math.sin(aAng) * (d * 85), 54, 0.55 + d * 0.25, Math.round(m.damage * 1.25), 'Tentacle Whip');
      }
    }
  } else {
    // 4. Drowning Aether Soak Sphere
    m.castName = 'DROWNING ORB (STAND INSIDE RING!)';
    m.castTimer = 3.4;
    m.castMax = 3.4;
    room.hazards.push({
      id: uid('haz'), kind: 'soak', x: Math.round(target.x + randInt(-65, 65)), y: Math.round(target.y + randInt(-65, 65)),
      r: 72, fuse: 3.4, maxFuse: 3.4, damage: Math.round(m.damage * 1.65),
      title: 'AETHER SOAK [STAND INSIDE!]', color: '#ffd43b'
    });
  }
}

// ============================================================================
// SHARED RAID MECHANIC TICK & DISPATCHER
// ============================================================================
function updateBossRaidMechanics(room, dt, alivePlayers) {
  if (room.exarchBoulderPhase) tickExarchBoulderPhase(room, dt);
  if (room.mavenMemory && typeof tickMavenMemoryGame === 'function') tickMavenMemoryGame(room, dt, alivePlayers);

  if (Array.isArray(room.raidBeams)) {
    for (let i = room.raidBeams.length - 1; i >= 0; i--) {
      const bm = room.raidBeams[i];
      bm.duration -= dt;
      bm.angle += (bm.angVel || 0.52) * dt;
      bm.tickCd = (bm.tickCd || 0) - dt;
      const boss = bm.bossId ? room.enemies.get(bm.bossId) : null;
      if (boss && boss.hp > 0) {
        bm.x = boss.x;
        bm.y = boss.y;
      }
      if (bm.tickCd <= 0) {
        bm.tickCd = 0.28;
        const arms = bm.arms || 4;
        const len = bm.length || 420;
        for (const p of alivePlayers) {
          for (let a = 0; a < arms; a++) {
            const armAng = bm.angle + (Math.PI * 2 * a) / arms;
            const dx = p.x - bm.x;
            const dy = p.y - bm.y;
            const proj = dx * Math.cos(armAng) + dy * Math.sin(armAng);
            const perp = Math.abs(-dx * Math.sin(armAng) + dy * Math.cos(armAng));
            if (proj >= 18 && proj <= len && perp <= 24) {
              applyDamageToPlayer(room, p, bm.damage, 'elemental', true);
              break;
            }
          }
        }
      }
      if (bm.duration <= 0 || (bm.bossId && !room.enemies.has(bm.bossId))) {
        room.raidBeams.splice(i, 1);
      }
    }
  }

  if (room.raidSanctuary) {
    const s = room.raidSanctuary;
    s.fuse -= dt;
    if (s.fuse <= 0) {
      room.fxEvents.push({ kind: 'nova', x: s.x, y: s.y, r: 340, color: '#ff3b3b' });
      room.fxEvents.push({ kind: 'nova', x: s.x, y: s.y, r: s.r, color: '#ffd43b' });
      for (const p of alivePlayers) {
        if (dist(p.x, p.y, s.x, s.y) <= s.r + 18) {
          p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.25));
        } else {
          applyDamageToPlayer(room, p, s.damage, 'elemental', true);
        }
      }
      room.raidSanctuary = null;
    }
  }
}

const exportsObj = {
  startPinnacleBossRaid,
  updateSearingExarchAI,
  updateEaterOfWorldsAI,
  updateBossRaidMechanics
};
Object.assign(global, exportsObj);
module.exports = exportsObj;
