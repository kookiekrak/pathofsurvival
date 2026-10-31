// Server Simulation Module: WoW-Style Multi-Phase Boss Raid Engine & Pinnacle Encounters
const GameData = global.GameData || require('../../public/shared/gameData.js');

function startPinnacleBossRaid(room, raidId) {
  const raidList = GameData.PINNACLE_RAID_BOSSES || [];
  const raidDef = raidList.find(r => r.id === raidId) || raidList[0];
  if (!raidDef) return;

  room.selectedMapId = raidDef.mapId || 'vaal_pyramid';
  room.isRaidEncounter = true;
  room.raidId = raidDef.id;
  room.state = 'RUN';
  room.wave = raidDef.tier * 2;
  room.waveProgress = 0;
  room.runTimer = 0;
  room.runDuration = 360;
  room.spawnAccumulator = 0;
  room.bossSpawned = true;
  room.lastBossWave = room.wave;
  room.portalsOpen = false;
  room.enemies.clear();
  room.projectiles = [];
  room.groundDrops = [];
  room.hazards = [];
  room.activeBreaches = [];
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
    p.vaalSouls = 30;
    p.vaalLockTimer = 0;
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

    // Grant 2 immediate Pre-Raid Preparation Drafts so players can assemble links before engaging!
    queueGemDraft(p, `RAID PREPARATION I — GEAR UP FOR ${raidDef.name.toUpperCase()}`);
    queueGemDraft(p, `RAID PREPARATION II — CHOOSE SUPPORT OR ASCENDANCY BOON`);
    sendPrivateProfile(p);
  }

  const partyMult = 1 + (room.players.size - 1) * 0.6;
  const bossId = uid('boss');
  const maxHp = Math.round(raidDef.hpBase * partyMult);
  room.enemies.set(bossId, {
    id: bossId,
    name: raidDef.bossName,
    typeId: 'kitava_herald',
    rarity: 'boss',
    isPinnacleRaid: true,
    raidId: raidDef.id,
    mods: ['Pinnacle Raid Boss', 'Multi-Phase', 'Soak & Pylon Mechanics'],
    x: 0,
    y: -210,
    hp: maxHp,
    maxHp,
    armor: raidDef.armor || 100,
    speed: 148 + raidDef.tier * 6,
    radius: 40,
    damage: raidDef.dmgBase,
    xp: 900 * raidDef.tier,
    color: '#ff3b3b',
    behavior: 'boss',
    bossPhase: 1,
    actionTimer: 3.2,
    castName: null,
    castTimer: 0,
    castMax: 0,
    shielded: false,
    shieldTimer: 0,
    vulnerableTimer: 0,
    hitTimer: 0,
    chillTimer: 0,
    shockTimer: 0
  });

  addRoomChat(room, 'Raid', `[PINNACLE RAID] ${raidDef.name} has manifested! Prepare your Gem Links and watch for Soak Circles, Soul Pylons & Sanctuary Domes!`, '#ff6b6b');
  broadcastRoomEvent(room, {
    type: 'announcement',
    title: `PINNACLE RAID: ${raidDef.name.toUpperCase()}`,
    subtitle: raidDef.mechanicsDesc,
    color: '#ff4d4d'
  });
}

function triggerBossPhaseIntermissionPylons(room, boss) {
  boss.bossPhase = 2;
  boss.x = 0;
  boss.y = -60;
  boss.shielded = true;
  boss.shieldTimer = 16.0;
  boss.pauseTimer = 16.0;
  boss.castName = 'OBLIVION CHANNEL (DESTROY 3 SOUL PYLONS!)';
  boss.castTimer = 16.0;
  boss.castMax = 16.0;

  const pylonHp = Math.max(80, Math.round(boss.maxHp * 0.085));
  for (let i = 0; i < 3; i++) {
    const ang = (Math.PI * 2 * i) / 3 - Math.PI / 2;
    const px = Math.round(boss.x + Math.cos(ang) * 210);
    const py = Math.round(boss.y + Math.sin(ang) * 210);
    const pId = uid('pylon');
    room.enemies.set(pId, {
      id: pId,
      name: 'Soul Conduit Pylon',
      typeId: 'raid_pylon',
      rarity: 'rare',
      isRaidPylon: true,
      parentBossId: boss.id,
      mods: ['Tethered Boss Shield', 'Destroy Quickly'],
      x: px,
      y: py,
      hp: pylonHp,
      maxHp: pylonHp,
      armor: Math.round((boss.armor || 0) * 0.4),
      speed: 0,
      radius: 24,
      damage: 0,
      xp: Math.round((boss.xp || 200) * 0.15),
      color: '#3bc9db',
      behavior: 'dummy',
      actionTimer: 99,
      hitTimer: 0,
      chillTimer: 0
    });
  }

  broadcastRoomEvent(room, {
    type: 'announcement',
    title: `⚠ PHASE 2: ${boss.name.toUpperCase()} IS SHIELDED!`,
    subtitle: 'Destroy the 3 Soul Conduit Pylons within 16s to shatter the shield and Stagger the Boss!',
    color: '#3bc9db'
  });
  addRoomChat(room, 'Raid Warning', `⚠ ${boss.name} is channeling Oblivion behind 3 Soul Conduit Pylons! Destroy all 3 Pylons to break the shield!`, '#3bc9db');
}

function triggerBossPhaseSanctuaryDome(room, boss) {
  boss.bossPhase = 3;
  boss.pauseTimer = 5.5;
  boss.castName = 'APOCALYPSE FLARE (STAND IN GOLDEN DOME!)';
  boss.castTimer = 5.5;
  boss.castMax = 5.5;

  const sx = Math.max(-240, Math.min(240, Math.round(boss.x + randInt(-160, 160))));
  const sy = Math.max(-240, Math.min(240, Math.round(boss.y + randInt(-140, 140))));
  room.raidSanctuary = {
    id: uid('sanc'),
    x: sx,
    y: sy,
    r: 125,
    fuse: 5.5,
    maxFuse: 5.5,
    damage: Math.round(boss.damage * 2.1),
    bossName: boss.name
  };

  broadcastRoomEvent(room, {
    type: 'announcement',
    title: '⚠ PHASE 3: STAND IN THE GOLDEN SANCTUARY DOME!',
    subtitle: `${boss.name} is charging Apocalypse Flare — get inside the Golden Dome within 5.5s!`,
    color: '#ffd43b'
  });
  addRoomChat(room, 'Raid Warning', `⚠ ${boss.name} entered Phase 3! Run inside the Golden Sanctuary Dome before Apocalypse Flare detonates!`, '#ffd43b');
}

function updateBossRaidMechanics(room, dt, alivePlayers) {
  // 1. Update Active Rotating Raid Laser Beams
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

  // 2. Update Golden Sanctuary Safe Dome (Phase 3 Raid Mechanic)
  if (room.raidSanctuary) {
    const s = room.raidSanctuary;
    s.fuse -= dt;
    if (s.fuse <= 0) {
      room.fxEvents.push({ kind: 'nova', x: s.x, y: s.y, r: 340, color: '#ff3b3b' });
      room.fxEvents.push({ kind: 'nova', x: s.x, y: s.y, r: s.r, color: '#ffd43b' });
      for (const p of alivePlayers) {
        if (dist(p.x, p.y, s.x, s.y) <= s.r + 16) {
          p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.4));
          p.es = Math.min(p.maxEs, p.es + Math.round(p.maxEs * 0.4));
          p.vaalSouls = Math.min(60, (p.vaalSouls || 0) + 25);
        } else {
          applyDamageToPlayer(room, p, s.damage, 'elemental', true);
        }
      }
      room.raidSanctuary = null;
    }
  }
}

function updateSingleBossAI(room, m, dt, target, bestD, ang, alivePlayers) {
  if (m.vulnerableTimer > 0) m.vulnerableTimer = Math.max(0, m.vulnerableTimer - dt);
  if (m.castTimer > 0) {
    m.castTimer = Math.max(0, m.castTimer - dt);
    if (m.castTimer === 0) m.castName = null;
  }

  // Check Phase Transitions at 70% HP (Soul Pylon Shield) and 35% HP (Golden Sanctuary Dome)
  const hpRatio = m.hp / Math.max(1, m.maxHp);
  if ((m.bossPhase || 1) === 1 && hpRatio <= 0.70) {
    triggerBossPhaseIntermissionPylons(room, m);
    return;
  }
  if (m.shielded) {
    m.shieldTimer -= dt;
    let activePylons = 0;
    for (const other of room.enemies.values()) {
      if (other.isRaidPylon && other.parentBossId === m.id) activePylons++;
    }
    if (activePylons === 0) {
      m.shielded = false;
      m.shieldTimer = 0;
      m.pauseTimer = 3.5;
      m.vulnerableTimer = 6.5;
      m.castName = 'STAGGERED (+50% DAMAGE TAKEN!)';
      m.castTimer = 6.5;
      m.castMax = 6.5;
      room.fxEvents.push({ kind: 'nova', x: Math.round(m.x), y: Math.round(m.y), r: 190, color: '#3bc9db' });
      broadcastRoomEvent(room, {
        type: 'announcement',
        title: `${m.name.toUpperCase()} STAGGERED!`,
        subtitle: 'All Soul Pylons destroyed! Boss takes +50% Damage for 6.5s + Party Boon Granted!',
        color: '#69db7c'
      });
      for (const p of alivePlayers) {
        p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.35));
        queueGemDraft(p, `RAID PYLON PHASE CLEARED — BONUS UPGRADE`);
        sendPrivateProfile(p);
      }
    } else if (m.shieldTimer <= 0) {
      m.shielded = false;
      m.pauseTimer = 0;
      m.castName = null;
      for (const [eId, other] of room.enemies.entries()) {
        if (other.isRaidPylon && other.parentBossId === m.id) room.enemies.delete(eId);
      }
      room.fxEvents.push({ kind: 'nova', x: Math.round(m.x), y: Math.round(m.y), r: 320, color: '#ff3b3b' });
      for (const p of alivePlayers) {
        applyDamageToPlayer(room, p, Math.round(m.damage * 1.45 * activePylons * 0.5), 'elemental', true);
      }
    }
    return;
  }

  if ((m.bossPhase || 1) === 2 && hpRatio <= 0.35) {
    triggerBossPhaseSanctuaryDome(room, m);
    return;
  }

  if (m.actionTimer > 0 || bestD > 680) return;
  m.actionTimer = m.bossPhase === 3 ? 3.1 : 3.8;
  m.bossAttackIndex = ((m.bossAttackIndex || 0) + 1) % 5;

  if (m.bossAttackIndex === 0) {
    // 1. WoW-Style Meteor Soak Circle (Players MUST stand inside to soak!)
    const soakTarget = pick(alivePlayers) || target;
    const sx = Math.max(-ARENA_HALF + 100, Math.min(ARENA_HALF - 100, Math.round(soakTarget.x + randInt(-75, 75))));
    const sy = Math.max(-ARENA_HALF + 100, Math.min(ARENA_HALF - 100, Math.round(soakTarget.y + randInt(-75, 75))));
    m.castName = 'VOID METEOR SOAK (STAND IN RING!)';
    m.castTimer = 3.6;
    m.castMax = 3.6;
    room.hazards.push({
      id: uid('haz'), kind: 'soak', x: sx, y: sy, r: 72,
      fuse: 3.6, maxFuse: 3.6, damage: Math.round(m.damage * 1.65),
      title: 'SOAK METEOR [STAND INSIDE!]', color: '#ffd43b'
    });
  } else if (m.bossAttackIndex === 1) {
    // 2. Rotating 4-Way Corruption Cross Beams
    m.pauseTimer = 1.2;
    m.castName = 'ROTATING CORRUPTION BEAMS';
    m.castTimer = 4.2;
    m.castMax = 4.2;
    room.raidBeams = room.raidBeams || [];
    room.raidBeams.push({
      id: uid('beam'), bossId: m.id, x: m.x, y: m.y,
      angle: ang + 0.35, angVel: 0.55, arms: 4, length: 420,
      duration: 4.2, damage: Math.round(m.damage * 0.72), tickCd: 0.3
    });
  } else if (m.bossAttackIndex === 2) {
    // 3. Rolling Magma / Void Wall with a dodgeable Gap
    m.pauseTimer = 0.7;
    m.castName = 'ROLLING CATACLYSM WALL';
    m.castTimer = 1.6;
    m.castMax = 1.6;
    const perpAng = ang + Math.PI / 2;
    const gapIdx = randInt(-1, 1);
    for (let w = -4; w <= 4; w++) {
      if (Math.abs(w - gapIdx) <= 0) continue; // 1-slot wide gap
      const wx = m.x + Math.cos(perpAng) * (w * 58);
      const wy = m.y + Math.sin(perpAng) * (w * 58);
      pushEnemyBolt(room, wx, wy, ang, 195, 14, Math.round(m.damage * 1.05), 'fire', 3.4);
    }
  } else if (m.bossAttackIndex === 3) {
    // 4. Cascading Sunder Line + Radial Bullet Ring
    m.pauseTimer = 0.8;
    m.castName = 'TECTONIC SUNDER SLAM';
    m.castTimer = 1.4;
    m.castMax = 1.4;
    for (const st of [{ d: 85, fuse: 0.65 }, { d: 165, fuse: 0.9 }, { d: 245, fuse: 1.15 }, { d: 325, fuse: 1.4 }]) {
      spawnGroundHazard(room, m.x + Math.cos(ang) * st.d, m.y + Math.sin(ang) * st.d, 56, st.fuse, Math.round(m.damage * 1.3), 'Boss Sunder Slam');
    }
    for (let k = 0; k < 10; k++) {
      pushEnemyBolt(room, m.x, m.y, (Math.PI * 2 * k) / 10, 175, 10, Math.round(m.damage * 0.85), 'lightning', 3.0);
    }
  } else {
    // 5. Telegraphed Leap Slam + Summon Royal Vanguards
    m.pauseTimer = 1.0;
    m.castName = 'CRUSHING LEAP SLAM';
    m.castTimer = 1.3;
    m.castMax = 1.3;
    const lx = Math.max(-ARENA_HALF + 80, Math.min(ARENA_HALF - 80, Math.round(target.x)));
    const ly = Math.max(-ARENA_HALF + 80, Math.min(ARENA_HALF - 80, Math.round(target.y)));
    room.hazards.push({
      id: uid('haz'), x: lx, y: ly, r: 88, fuse: 1.3, maxFuse: 1.3,
      damage: Math.round(m.damage * 1.45), title: `${m.name} Leap Slam`, leapBossId: m.id, color: '#ff4d4d'
    });
    for (let g = 0; g < 2; g++) {
      const gAng = ang + (g === 0 ? -0.8 : 0.8);
      spawnMonster(room, false, { x: m.x + Math.cos(gAng) * 85, y: m.y + Math.sin(gAng) * 85, exact: true }, 'magic');
    }
  }
}

const exportsObj = { startPinnacleBossRaid, updateBossRaidMechanics, updateSingleBossAI };
Object.assign(global, exportsObj);
module.exports = exportsObj;
