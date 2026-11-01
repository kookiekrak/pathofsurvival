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
  room.deliriumTimer = 0; room.deliriumTier = 0; room.activeRitual = null;
  room.fxEvents = [];
  room.interactables = [];
  room.upgradeChests = [];

  for (const p of room.players.values()) {
    p.ready = false; p.dead = false; p.reviveProgress = 0;
    p.hhStacks = 0; p.hhTimer = 0; p.shrineBuffTimer = 0;
    p.targetDropId = null; p.targetChestId = null; p.lohBudget = 6;
    p.vaalSouls = 30; p.vaalLockTimer = 0;
    for (const f of GameData.FLASKS) {
      p.flaskCharges[f.id] = (p.unlockedFlasks || ['life', 'quicksilver']).includes(f.id) ? f.maxCharges : 0;
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
    p.currentMapId = room.selectedMapId;
    resetPlayerRunSkills(p);
    recalcPlayer(p, true);
    const treeStartGold = (p.stats && p.stats.startingGold) || 25;
    p.startingRunGold = 90 + treeStartGold;
    p.runGold = p.startingRunGold;
    p.earnedRunGold = 0;
    p.nextChestCost = getNextChestCost(p, room);
    p.x = randInt(-60, 60);
    p.y = randInt(140, 200);
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
    x: 0, y: -180, hp: maxHp, maxHp, armor: raidDef.armor || 100,
    speed: 152 + raidDef.tier * 3, radius: 40, damage: raidDef.dmgBase,
    xp: 900 * raidDef.tier, color: '#ff3b3b', behavior: 'boss', bossPhase: 1,
    actionTimer: 1.5, castName: null, castTimer: 0, castMax: 0,
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
  boss.x = 0; boss.y = -60;
  boss.shielded = true; boss.shieldTimer = 10.0; boss.pauseTimer = 10.0;
  boss.castName = '"CLEANSING FIRE!" (DODGE ROLLING MAGMA BOULDER WALLS!)';
  boss.castTimer = 10.0; boss.castMax = 10.0;
  room.exarchBoulderPhase = { bossId: boss.id, timer: 10.0, waveTimer: 0.2, waveDir: 0 };

  broadcastRoomEvent(room, {
    type: 'announcement', title: '🔥 SEARING EXARCH: CLEANSING FIRE BOULDER WAVE!',
    subtitle: 'Weave through the gaps in the 9-Boulder Magma Walls & Radial Solar Fireballs for 10s!', color: '#ff922b'
  });
  addRoomChat(room, 'The Searing Exarch', `🔥 "Be cleansed in solar fire!" Dodge the rolling Magma Boulder walls!`, '#ff922b');
}

function tickExarchBoulderPhase(room, dt) {
  const bp = room.exarchBoulderPhase;
  if (!bp) return;
  const boss = room.enemies.get(bp.bossId);
  if (!boss || boss.hp <= 0) { room.exarchBoulderPhase = null; return; }
  bp.timer -= dt; bp.waveTimer -= dt;
  if (bp.waveTimer <= 0 && bp.timer > 1.0) {
    bp.waveTimer = 1.65;
    const dirs = [
      { ang: Math.PI / 2, ox: 0, oy: -480, px: 1, py: 0 },
      { ang: 0, ox: -480, oy: -40, px: 0, py: 1 },
      { ang: -Math.PI / 2, ox: 0, oy: 440, px: 1, py: 0 },
      { ang: Math.PI, ox: 480, oy: -40, px: 0, py: 1 }
    ];
    const d = dirs[bp.waveDir % dirs.length];
    bp.waveDir++;
    const gap1 = randInt(-3, 0);
    const gap2 = randInt(1, 3);
    for (let slot = -5; slot <= 5; slot++) {
      if (slot === gap1 || slot === gap2) continue;
      const sx = Math.max(-520, Math.min(520, d.ox + d.px * (slot * 84)));
      const sy = Math.max(-520, Math.min(520, d.oy + d.py * (slot * 84)));
      pushEnemyBolt(room, sx, sy, d.ang, 205, 22, Math.round(boss.damage * 1.25), 'fire', 5.0, true);
    }
    for (let r = 0; r < 10; r++) {
      pushEnemyBolt(room, boss.x, boss.y, (Math.PI * 2 * r) / 10 + bp.waveDir * 0.25, 245, 11, Math.round(boss.damage * 0.95), 'fire', 3.2, true);
    }
  }
  if (bp.timer <= 0) {
    boss.shielded = false; boss.shieldTimer = 0; boss.pauseTimer = 2.0; boss.vulnerableTimer = 4.8;
    boss.castName = 'SOLAR EXHAUSTION (+50% DAMAGE TAKEN!)'; boss.castTimer = 4.8; boss.castMax = 4.8;
    room.exarchBoulderPhase = null;
  }
}

function updateSearingExarchAI(room, m, dt, target, bestD, ang) {
  const raidLim = (typeof RAID_ARENA_HALF === 'number' ? RAID_ARENA_HALF : 560) - 45;
  m.x = Math.max(-raidLim, Math.min(raidLim, m.x));
  m.y = Math.max(-raidLim, Math.min(raidLim, m.y));

  const hpRatio = m.hp / Math.max(1, m.maxHp);
  if ((m.bossPhase || 1) === 1 && hpRatio <= 0.70) { startExarchRollingBoulderPhase(room, m, 2); return; }
  if ((m.bossPhase || 1) === 2 && hpRatio <= 0.35 && !m.shielded) { startExarchRollingBoulderPhase(room, m, 3); return; }
  if (m.shielded || m.actionTimer > 0 || bestD > 720) return;

  m.actionTimer = (m.bossPhase >= 2 ? 2.4 : 2.8) + Math.random() * 0.30;
  m.bossAttackIndex = ((m.bossAttackIndex || 0) + 1) % 4;

  if (m.bossAttackIndex === 0) {
    m.pauseTimer = 1.6; m.castName = '🔥 "INCINERATION!" — DODGE OUT OF SOLAR NOVA!';
    m.castTimer = 1.9; m.castMax = 1.9;
    spawnGroundHazard(room, m.x, m.y, 235, 1.9, Math.round(m.damage * 2.1), 'Exarch Incineration Nova');
    for (let k = 0; k < 10; k++) {
      pushEnemyBolt(room, m.x, m.y, (Math.PI * 2 * k) / 10, 250, 13, Math.round(m.damage * 1.0), 'fire', 3.0, true);
    }
  } else if (m.bossAttackIndex === 1) {
    m.pauseTimer = 0.85; m.castName = '"ANNIHILATION!" (SOLAR CONE BARRAGE)';
    m.castTimer = 1.25; m.castMax = 1.25;
    for (let i = -3; i <= 3; i++) {
      pushEnemyBolt(room, m.x, m.y, ang + i * 0.16, 265, 13, Math.round(m.damage * 1.0), 'fire', 3.0, true);
    }
  } else if (m.bossAttackIndex === 2) {
    m.pauseTimer = 0.75; m.castName = 'SEARING RUNE TRAPS & METEOR RING';
    m.castTimer = 1.3; m.castMax = 1.3;
    for (let r = 0; r < 5; r++) {
      const rAng = (Math.PI * 2 * r) / 5 + Math.random() * 0.35;
      spawnGroundHazard(room, target.x + Math.cos(rAng) * 95, target.y + Math.sin(rAng) * 95, 58, 1.2 + r * 0.12, Math.round(m.damage * 1.3), 'Searing Rune Trap');
    }
    for (let k = 0; k < 8; k++) {
      pushEnemyBolt(room, m.x, m.y, (Math.PI * 2 * k) / 8, 240, 11, Math.round(m.damage * 0.9), 'fire', 2.8, true);
    }
  } else {
    m.pauseTimer = 0.65; m.castName = 'ROLLING MAGMA WALL (9 BOULDERS)';
    m.castTimer = 1.25; m.castMax = 1.25;
    const perpAng = ang + Math.PI / 2;
    const gap1 = randInt(-2, 0); const gap2 = randInt(1, 3);
    for (let w = -5; w <= 5; w++) {
      if (w === gap1 || w === gap2) continue;
      const bx = Math.max(-raidLim, Math.min(raidLim, m.x + Math.cos(perpAng) * (w * 64)));
      const by = Math.max(-raidLim, Math.min(raidLim, m.y + Math.sin(perpAng) * (w * 64)));
      pushEnemyBolt(room, bx, by, ang, 225, 18, Math.round(m.damage * 1.15), 'fire', 3.4, true);
    }
  }
}

// ============================================================================
// 2. THE EATER OF WORLDS: "INESCAPABLE DOOM" (SOAK 3 ORBS), "HUNGER!" & "CONSUME!"
// ============================================================================
function startEaterInescapableDoom(room, boss, phaseNum) {
  boss.bossPhase = phaseNum;
  boss.x = 0; boss.y = -60;
  boss.shielded = true; boss.shieldTimer = 9.0; boss.pauseTimer = 9.0;
  boss.castName = '"INESCAPABLE DOOM!" (SOAK ALL 3 AETHER RINGS!)';
  boss.castTimer = 9.0; boss.castMax = 9.0;

  for (let i = 0; i < 3; i++) {
    const oAng = (Math.PI * 2 * i) / 3 - Math.PI / 2;
    room.hazards.push({
      id: uid('haz'), kind: 'soak', x: Math.round(boss.x + Math.cos(oAng) * 195), y: Math.round(boss.y + Math.sin(oAng) * 195),
      r: 78, fuse: 2.8 + i * 2.4, maxFuse: 2.8 + i * 2.4, damage: Math.round(boss.damage * 1.95),
      title: `DOOM ORB #${i + 1} [STAND INSIDE!]`, color: '#ffd43b'
    });
  }
  broadcastRoomEvent(room, {
    type: 'announcement', title: '🐙 EATER OF WORLDS: INESCAPABLE DOOM!',
    subtitle: 'Stand inside Doom Orb #1 → #2 → #3 as they charge to prevent an arena-wide Doom detonation!', color: '#3bc9db'
  });
  addRoomChat(room, 'The Eater of Worlds', `🐙 "Inescapable Doom!" Stand inside each Golden Aether Ring (#1 → #2 → #3) before it detonates!`, '#3bc9db');
}

function updateEaterOfWorldsAI(room, m, dt, target, bestD, ang) {
  const raidLim = (typeof RAID_ARENA_HALF === 'number' ? RAID_ARENA_HALF : 560) - 45;
  m.x = Math.max(-raidLim, Math.min(raidLim, m.x));
  m.y = Math.max(-raidLim, Math.min(raidLim, m.y));

  const hpRatio = m.hp / Math.max(1, m.maxHp);
  if ((m.bossPhase || 1) === 1 && hpRatio <= 0.70) { startEaterInescapableDoom(room, m, 2); return; }
  if ((m.bossPhase || 1) === 2 && hpRatio <= 0.35 && !m.shielded) { startEaterInescapableDoom(room, m, 3); return; }
  if (m.shielded) {
    m.shieldTimer -= dt;
    if (m.shieldTimer <= 0) {
      m.shielded = false; m.pauseTimer = 2.0; m.vulnerableTimer = 4.8;
      m.castName = 'DOOM EXHAUSTED (+50% DAMAGE TAKEN!)'; m.castTimer = 4.8; m.castMax = 4.8;
    }
    return;
  }
  if (m.actionTimer > 0 || bestD > 720) return;

  m.actionTimer = (m.bossPhase >= 2 ? 2.4 : 2.8) + Math.random() * 0.30;
  m.bossAttackIndex = ((m.bossAttackIndex || 0) + 1) % 4;

  if (m.bossAttackIndex === 0) {
    m.pauseTimer = 1.1; m.castName = '🐙 "HUNGER!" — TENTACLE SLAM & TWIN BEAMS!';
    m.castTimer = 1.45; m.castMax = 1.45;
    spawnGroundHazard(room, target.x, target.y, 175, 1.45, Math.round(m.damage * 1.95), 'Eater "Hunger!" Slam');
    for (let k = 0; k < 8; k++) {
      pushEnemyBolt(room, m.x, m.y, (Math.PI * 2 * k) / 8, 250, 12, Math.round(m.damage * 0.92), 'lightning', 2.8, true);
    }
    room.raidBeams = room.raidBeams || [];
    room.raidBeams.push({
      id: uid('beam'), bossId: m.id, x: m.x, y: m.y,
      angle: ang - 0.55, angVel: 0.58, arms: 2, length: 480, duration: 3.2, damage: Math.round(m.damage * 0.85), tickCd: 0.24
    });
  } else if (m.bossAttackIndex === 1) {
    m.pauseTimer = 1.0; m.castName = '"CONSUME!" (TWIN SWEEPING COSMOS BEAMS)';
    m.castTimer = 3.4; m.castMax = 3.4;
    room.raidBeams = room.raidBeams || [];
    room.raidBeams.push({
      id: uid('beam'), bossId: m.id, x: m.x, y: m.y,
      angle: ang - 0.65, angVel: 0.62, arms: 2, length: 480, duration: 3.4, damage: Math.round(m.damage * 0.88), tickCd: 0.24
    });
    for (let k = -3; k <= 3; k++) {
      pushEnemyBolt(room, m.x, m.y, ang + k * 0.18, 245, 11, Math.round(m.damage * 0.90), 'cold', 2.8, true);
    }
  } else if (m.bossAttackIndex === 2) {
    m.pauseTimer = 0.85; m.castName = 'WRITHING TENTACLE CROSS';
    m.castTimer = 1.25; m.castMax = 1.25;
    for (let arm = 0; arm < 4; arm++) {
      const aAng = ang + (Math.PI * 2 * arm) / 4;
      for (let d = 1; d <= 4; d++) {
        spawnGroundHazard(room, m.x + Math.cos(aAng) * (d * 85), m.y + Math.sin(aAng) * (d * 85), 58, 0.45 + d * 0.20, Math.round(m.damage * 1.3), 'Tentacle Whip');
      }
    }
  } else {
    m.castName = 'DROWNING ORB (STAND INSIDE RING TO STAGGER!)'; m.castTimer = 3.2; m.castMax = 3.2;
    const sx = Math.max(-raidLim + 60, Math.min(raidLim - 60, Math.round(target.x + randInt(-65, 65))));
    const sy = Math.max(-raidLim + 60, Math.min(raidLim - 60, Math.round(target.y + randInt(-65, 65))));
    room.hazards.push({
      id: uid('haz'), kind: 'soak', staggerBossId: m.id, x: sx, y: sy, r: 74, fuse: 3.2, maxFuse: 3.2,
      damage: Math.round(m.damage * 1.75), title: 'AETHER SOAK [STAND INSIDE!]', color: '#ffd43b'
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
      bm.angle += (bm.angVel || 0.58) * dt;
      bm.tickCd = (bm.tickCd || 0) - dt;
      const boss = bm.bossId ? room.enemies.get(bm.bossId) : null;
      if (boss && boss.hp > 0) {
        bm.x = boss.x;
        bm.y = boss.y;
      }
      if (bm.tickCd <= 0) {
        bm.tickCd = 0.25;
        const arms = bm.arms || 4;
        const len = bm.length || 460;
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
    const sLim = (typeof RAID_ARENA_HALF === 'number' ? RAID_ARENA_HALF : 560) - 85;
    s.x = Math.max(-sLim, Math.min(sLim, s.x));
    s.y = Math.max(-sLim, Math.min(sLim, s.y));
    s.fuse -= dt;
    if (s.fuse <= 0) {
      room.fxEvents.push({ kind: 'nova', x: s.x, y: s.y, r: 340, color: '#ff3b3b' });
      room.fxEvents.push({ kind: 'nova', x: s.x, y: s.y, r: s.r, color: '#ffd43b' });
      let anyInside = false;
      for (const p of alivePlayers) {
        if (dist(p.x, p.y, s.x, s.y) <= s.r + 18) {
          anyInside = true;
          p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.25));
          if ((p.vaalLockTimer || 0) <= 0) p.vaalSouls = Math.min(60, (p.vaalSouls || 0) + 15);
        } else {
          applyDamageToPlayer(room, p, s.damage, 'elemental', true);
        }
      }
      if (anyInside && s.staggerBossId) {
        const stBoss = room.enemies.get(s.staggerBossId);
        if (stBoss && stBoss.hp > 0) {
          stBoss.shielded = false;
          stBoss.vulnerableTimer = 4.5;
          stBoss.pauseTimer = 2.6;
          stBoss.castName = '⚡ CRUCIBLE STAGGER (+50% DAMAGE TAKEN!)';
          stBoss.castTimer = stBoss.castMax = 4.5;
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
