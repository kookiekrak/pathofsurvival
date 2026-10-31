// Server Simulation Module: Projectile Physics/Collisions, Monster AI, Elite Skills & Boss Choreography
const GameData = global.GameData || require('../../public/shared/gameData.js');

function pushEnemyBolt(room, x, y, ang, speed, radius, damage, damageType, duration) {
  room.projectiles.push({
    id: uid('eprj'),
    ownerId: 'enemy',
    skillId: 'enemy_bolt',
    behavior: 'standard',
    damageType,
    x,
    y,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    speed,
    radius,
    damage,
    duration
  });
}

function updateRoomEnemiesAndProjectiles(room, dt, allPlayers, alivePlayers) {
  // Update Projectiles
  for (let i = room.projectiles.length - 1; i >= 0; i--) {
    const prj = room.projectiles[i];
    prj.duration -= dt;
    if (prj.duration <= 0) {
      if (prj.behavior === 'tornado_burst') {
        const secCount = 6;
        room.fxEvents.push({ kind: 'nova', x: Math.round(prj.x), y: Math.round(prj.y), r: 56, color: '#ffe066' });
        for (let s = 0; s < secCount; s++) {
          const ang = (Math.PI * 2 * s) / secCount;
          room.projectiles.push({
            ...prj,
            id: uid('prj'),
            behavior: 'standard',
            vx: Math.cos(ang) * 540,
            vy: Math.sin(ang) * 540,
            duration: 0.42,
            maxDuration: 0.42,
            hitIds: new Set()
          });
        }
      } else if (prj.behavior === 'molten_lob') {
        // Lobbed magma spheres always detonate on landing!
        const owner = room.players.get(prj.ownerId);
        const splashRadius = prj.aoeRadius || 68;
        room.fxEvents.push({ kind: 'nova', x: Math.round(prj.x), y: Math.round(prj.y), r: splashRadius, color: '#ff6b4a' });
        for (const m of room.enemies.values()) {
          if (dist(prj.x, prj.y, m.x, m.y) <= splashRadius + m.radius) {
            const { dmg, isCrit } = rollSkillDamage(prj.exec);
            damageEnemy(room, m, dmg, isCrit, owner, prj.exec ? prj.exec.lifeOnHit : 0, 'fire');
          }
        }
      }
      room.projectiles.splice(i, 1);
      continue;
    }

    if (prj.behavior === 'boomerang') {
      const half = prj.maxDuration * 0.5;
      if (prj.duration < half && !prj.reversed) {
        prj.reversed = true;
        prj.vx = -prj.vx;
        prj.vy = -prj.vy;
        prj.hitIds.clear();
      }
    } else if (prj.behavior === 'spark_erratic') {
      const jitter = (Math.random() - 0.5) * 0.6;
      const curAng = Math.atan2(prj.vy, prj.vx) + jitter;
      prj.vx = Math.cos(curAng) * prj.speed;
      prj.vy = Math.sin(curAng) * prj.speed;
    }

    prj.x += prj.vx * dt;
    prj.y += prj.vy * dt;

    if (prj.ownerId === 'enemy') {
      for (const p of room.players.values()) {
        if (!p.dead && dist(prj.x, prj.y, p.x, p.y) <= prj.radius + 16) {
          applyDamageToPlayer(room, p, prj.damage, 'elemental');
          room.projectiles.splice(i, 1);
          break;
        }
      }
      continue;
    }

    const owner = room.players.get(prj.ownerId);
    for (const m of room.enemies.values()) {
      if (prj.hitIds.has(m.id)) continue;
      const hitR = prj.radius + m.radius;
      if (Math.abs(prj.x - m.x) > hitR || Math.abs(prj.y - m.y) > hitR) continue;
      if (dist(prj.x, prj.y, m.x, m.y) <= hitR) {
        prj.hitIds.add(m.id);
        const { dmg, isCrit } = rollSkillDamage(prj.exec);
        damageEnemy(room, m, dmg, isCrit, owner, prj.exec.lifeOnHit, prj.damageType);

        if ((prj.behavior === 'fireball_explode' || prj.behavior === 'molten_lob') && prj.hitIds.size <= 2) {
          if (room.fxEvents.length < 22) {
            room.fxEvents.push({
              kind: 'nova', x: Math.round(m.x), y: Math.round(m.y),
              r: prj.aoeRadius, color: prj.damageType === 'fire' ? '#ff6b4a' : '#d99b66'
            });
          }
          let splashHits = 0;
          for (const other of room.enemies.values()) {
            if (other.id === m.id) continue;
            const splashR = prj.aoeRadius + other.radius;
            if (Math.abs(m.x - other.x) > splashR || Math.abs(m.y - other.y) > splashR) continue;
            if (dist(m.x, m.y, other.x, other.y) <= splashR) {
              const splash = rollSkillDamage(prj.exec);
              damageEnemy(room, other, Math.round(splash.dmg * 0.75), splash.isCrit, owner, 0, prj.damageType, true);
              if (++splashHits >= 8) break;
            }
          }
        } else if (prj.behavior === 'lightning_arrow' && prj.hitIds.size <= 2) {
          // Lightning Arrow shocks target and arcs lightning bolts to 2 nearby enemies within 240 units!
          m.shockTimer = Math.max(m.shockTimer || 0, 4.0);
          let arcs = 0;
          for (const other of room.enemies.values()) {
            if (other.id === m.id) continue;
            if (Math.abs(m.x - other.x) > 240 || Math.abs(m.y - other.y) > 240) continue;
            if (dist(m.x, m.y, other.x, other.y) <= 240) {
              other.shockTimer = Math.max(other.shockTimer || 0, 3.0);
              const arcRoll = rollSkillDamage(prj.exec);
              damageEnemy(room, other, Math.round(arcRoll.dmg * 0.7), arcRoll.isCrit, owner, 0, 'lightning', true);
              if (room.fxEvents.length < 22) {
                room.fxEvents.push({
                  kind: 'chain', x1: Math.round(m.x), y1: Math.round(m.y),
                  x2: Math.round(other.x), y2: Math.round(other.y), color: '#70b8ff'
                });
              }
              arcs++;
              if (arcs >= 2) break;
            }
          }
        }

        if (prj.behavior === 'tornado_burst' && prj.hitIds.size === 1) {
          // Tornado Shot pierces 35 units into the pack and then bursts into 6 secondary arrows right on the enemies!
          prj.duration = Math.min(prj.duration, 0.06);
        }

        if (prj.chainsLeft > 0) {
          prj.chainsLeft--;
          const nextTarget = findNearestEnemy(room, m.x, m.y, 260, prj.hitIds);
          if (nextTarget) {
            const ang = Math.atan2(nextTarget.y - prj.y, nextTarget.x - prj.x);
            prj.vx = Math.cos(ang) * prj.speed;
            prj.vy = Math.sin(ang) * prj.speed;
          }
        } else if ((prj.pierceLeft || 0) > 0) {
          prj.pierceLeft--;
        } else if (prj.behavior !== 'sunder_wave' && prj.behavior !== 'boomerang' && prj.behavior !== 'tornado_burst') {
          room.projectiles.splice(i, 1);
          break;
        }
      }
    }
  }

  // Update Enemies: Anti-Straggler Repositioning & Varied Directional Archetype / Rare / Boss Skills
  const livingPlayers = Array.isArray(alivePlayers) && alivePlayers.length > 0
    ? alivePlayers
    : Array.from(room.players.values()).filter(p => !p.dead);

  for (const m of room.enemies.values()) {
    if (m.behavior === 'dummy' || livingPlayers.length === 0) continue;

    if (m.chillTimer > 0) m.chillTimer = Math.max(0, m.chillTimer - dt);
    if (m.shockTimer > 0) m.shockTimer = Math.max(0, m.shockTimer - dt);
    if (m.buffTimer > 0) m.buffTimer = Math.max(0, m.buffTimer - dt);
    if (m.hitTimer > 0) m.hitTimer = Math.max(0, m.hitTimer - dt);
    if (m.pauseTimer > 0) m.pauseTimer = Math.max(0, m.pauseTimer - dt);

    const chillMult = m.chillTimer > 0 ? 0.65 : 1.0;
    const buffSpeedMult = m.buffTimer > 0 ? 1.35 : 1.0;

    let target = livingPlayers[0];
    let bestD = dist(m.x, m.y, target.x, target.y);
    for (let i = 1; i < livingPlayers.length; i++) {
      const d = dist(m.x, m.y, livingPlayers[i].x, livingPlayers[i].y);
      if (d < bestD) {
        bestD = d;
        target = livingPlayers[i];
      }
    }

    // Anti-Straggler Teleport: reposition monsters that fall > 820 units behind the party,
    // placing them 410-520 units ahead (just outside camera view)!
    if (bestD > 820 && m.rarity !== 'boss' && m.rarity !== 'unique') {
      const moveHeading = Math.hypot(target.vx || 0, target.vy || 0) > 20
        ? Math.atan2(target.vy, target.vx) + (Math.random() - 0.5) * 1.1
        : Math.random() * Math.PI * 2;
      const teleDist = randInt(410, 520);
      let tx = Math.max(-ARENA_HALF + 70, Math.min(ARENA_HALF - 70, Math.round(target.x + Math.cos(moveHeading) * teleDist)));
      let ty = Math.max(-ARENA_HALF + 70, Math.min(ARENA_HALF - 70, Math.round(target.y + Math.sin(moveHeading) * teleDist)));
      for (const pl of livingPlayers) {
        const dPl = dist(tx, ty, pl.x, pl.y);
        if (dPl < 370) {
          const pAng = dPl > 1 ? Math.atan2(ty - pl.y, tx - pl.x) : Math.random() * Math.PI * 2;
          tx = Math.round(pl.x + Math.cos(pAng) * 410);
          ty = Math.round(pl.y + Math.sin(pAng) * 410);
        }
      }
      m.x = tx;
      m.y = ty;
      bestD = dist(m.x, m.y, target.x, target.y);
    }

    const ang = Math.atan2(target.y - m.y, target.x - m.x);
    let moveMult = m.pauseTimer > 0 ? 0.0 : 1.0;
    let moveAng = ang;

    // Handle active Rhoa / Charger windup & committed linear dash
    if (m.chargeWindup > 0) {
      m.chargeWindup -= dt;
      moveMult = 0;
      if (m.chargeWindup <= 0) m.chargeTimer = 0.45;
    } else if (m.chargeTimer > 0) {
      m.chargeTimer -= dt;
      moveAng = typeof m.chargeAngle === 'number' ? m.chargeAngle : ang;
      moveMult = 3.4;
    }

    m.actionTimer -= dt;

    // 1. MAP BOSS 4-PHASE CHOREOGRAPHED ATTACK CYCLE
    if ((m.rarity === 'boss' || m.rarity === 'unique' || m.behavior === 'boss') && m.actionTimer <= 0 && bestD < 640) {
      m.actionTimer = 3.6;
      m.bossAttackIndex = ((m.bossAttackIndex || 0) + 1) % 4;

      if (m.bossAttackIndex === 0) {
        // Phase 0: Bullet-Hell Spiral Nova (10-orb 360 ring + 5-projectile aimed cone)
        for (let k = 0; k < 10; k++) {
          const bAng = (Math.PI * 2 * k) / 10;
          pushEnemyBolt(room, m.x, m.y, bAng, 180, 11, Math.round(m.damage * 0.85), 'fire', 3.4);
        }
        for (let c = -2; c <= 2; c++) {
          const cAng = ang + c * 0.14;
          pushEnemyBolt(room, m.x, m.y, cAng, 230, 10, Math.round(m.damage * 0.9), 'lightning', 2.8);
        }
      } else if (m.bossAttackIndex === 1) {
        // Phase 1: Cascading Sunder Slam (4 staggered shockwaves along player line)
        m.pauseTimer = 0.8;
        const steps = [{ d: 80, fuse: 0.7 }, { d: 155, fuse: 0.95 }, { d: 230, fuse: 1.2 }, { d: 305, fuse: 1.45 }];
        for (const st of steps) {
          spawnGroundHazard(room, m.x + Math.cos(ang) * st.d, m.y + Math.sin(ang) * st.d, 52, st.fuse, Math.round(m.damage * 1.35), 'Boss Sunder Slam');
        }
        room.fxEvents.push({
          kind: 'dmg_num', x: Math.round(m.x), y: Math.round(m.y - 30),
          val: 'SUNDER SLAM!', text: 'SUNDER SLAM!', color: '#ff6b4a', size: 18, crit: true, dtype: 'fire'
        });
      } else if (m.bossAttackIndex === 2) {
        // Phase 2: Telegraphed Boss Leap Slam
        m.pauseTimer = 1.0;
        const leapX = Math.max(-ARENA_HALF + 80, Math.min(ARENA_HALF - 80, Math.round(target.x)));
        const leapY = Math.max(-ARENA_HALF + 80, Math.min(ARENA_HALF - 80, Math.round(target.y)));
        room.hazards.push({
          id: uid('haz'), x: leapX, y: leapY, r: 85, fuse: 1.25, maxFuse: 1.25,
          damage: Math.round(m.damage * 1.5), title: `${m.name} Leap Slam`, leapBossId: m.id, color: '#ff4d4d'
        });
      } else {
        // Phase 3: Summon Royal Guard + 8-Bolt Spiral
        for (let g = 0; g < 3; g++) {
          const gAng = (Math.PI * 2 * g) / 3;
          spawnMonster(room, false, { x: m.x + Math.cos(gAng) * 75, y: m.y + Math.sin(gAng) * 75, exact: true }, g === 0 ? 'magic' : 'normal', 'skeleton');
        }
        for (let k = 0; k < 8; k++) {
          const bAng = (Math.PI * 2 * k) / 8 + 0.2;
          pushEnemyBolt(room, m.x, m.y, bAng, 170, 10, Math.round(m.damage * 0.8), 'cold', 3.0);
        }
      }
    } else if (m.rarity === 'rare' && m.actionTimer <= 0 && bestD < 380) {
      // 2. RARE MONSTER SIGNATURE SKILLS (Every 5.0s: 8-Orb Ring, 3-Step Sunder Wave, or Frost Nova Self-Pulse)
      m.actionTimer = 5.0;
      m.rareSkillIdx = ((m.rareSkillIdx || 0) + 1) % 3;
      if (m.rareSkillIdx === 0) {
        for (let k = 0; k < 8; k++) {
          const bAng = (Math.PI * 2 * k) / 8;
          pushEnemyBolt(room, m.x, m.y, bAng, 155, 9, Math.round(m.damage * 0.85), 'fire', 3.2);
        }
      } else if (m.rareSkillIdx === 1 && room.hazards.length <= 2) {
        const steps = [{ d: 70, fuse: 0.6 }, { d: 140, fuse: 0.9 }, { d: 210, fuse: 1.2 }];
        for (const st of steps) {
          spawnGroundHazard(room, m.x + Math.cos(ang) * st.d, m.y + Math.sin(ang) * st.d, 42, st.fuse, Math.round(m.damage * 1.15), 'Rare Sunder Cascade');
        }
      } else {
        spawnGroundHazard(room, m.x, m.y, 90, 1.1, Math.round(m.damage * 1.2), 'Frost Nova Pulse');
      }
    } else if (m.actionTimer <= 0) {
      // 3. NORMAL / MAGIC ARCHETYPE SKILLS (NO ground mortars or orbital flameblasts!)
      if (m.behavior === 'charge' && bestD >= 110 && bestD <= 300) {
        // Charger (Rhoa): 0.5s windup lock, then linear dash!
        m.actionTimer = 4.5;
        m.chargeWindup = 0.5;
        m.chargeAngle = ang;
        room.fxEvents.push({
          kind: 'dmg_num', x: Math.round(m.x), y: Math.round(m.y - 22),
          val: 'CHARGING!', text: 'CHARGING!', color: '#fbbf24', size: 14, crit: false, dtype: 'physical'
        });
      } else if (m.behavior === 'flameblast_caster' && bestD < 340) {
        // Cultist Caster: Alternates 3-Bolt Fan Volley and Unholy Ally Empowerment (NO ground Flameblast!)
        m.actionTimer = 4.0;
        m.pauseTimer = 0.45;
        m.casterAlt = !m.casterAlt;
        if (m.casterAlt) {
          for (const offset of [-0.31, 0, 0.31]) {
            pushEnemyBolt(room, m.x, m.y, ang + offset, 175, 9, Math.round(m.damage * 0.85), 'fire', 2.8);
          }
        } else {
          let buffed = 0;
          for (const ally of room.enemies.values()) {
            if (ally.id !== m.id && dist(m.x, m.y, ally.x, ally.y) <= 140) {
              ally.buffTimer = 4.0;
              buffed++;
              if (buffed >= 3) break;
            }
          }
          room.fxEvents.push({ kind: 'nova', x: Math.round(m.x), y: Math.round(m.y), r: 65, color: '#a855f7' });
          if (buffed === 0 && room.enemies.size < 85) {
            spawnMonster(room, false, { x: m.x + Math.cos(ang) * 42, y: m.y + Math.sin(ang) * 42, exact: true }, 'normal', 'skeleton');
          }
        }
      } else if ((m.typeId === 'devourer' || m.typeId === 'kitava_herald') && bestD <= 95) {
        // Tank (Devourer / Herald): Close-range Frontal Heavy Smash 45 units in front of the tank
        m.actionTimer = 4.2;
        m.pauseTimer = 0.8;
        if (room.hazards.length <= 3) {
          spawnGroundHazard(room, m.x + Math.cos(ang) * 45, m.y + Math.sin(ang) * 45, 65, 0.95, Math.round(m.damage * 1.25), 'Heavy Slam');
        }
      } else if ((m.behavior === 'ranged_kite' || m.behavior === 'mortar_leap') && bestD < 320) {
        // Ranged (Archer / Goatman): Stops briefly and fires aimed shot or 2-arrow V-split (NO ground mortars!)
        m.actionTimer = 3.8 + Math.random() * 1.2;
        m.pauseTimer = 0.35;
        if (m.behavior === 'mortar_leap') {
          for (const offset of [-0.16, 0.16]) {
            pushEnemyBolt(room, m.x, m.y, ang + offset, 215, 8, Math.round(m.damage * 0.8), 'fire', 2.4);
          }
        } else {
          pushEnemyBolt(room, m.x, m.y, ang, 230, 8, Math.round(m.damage * 0.85), 'cold', 2.3);
        }
      }
    }

    m.x += Math.cos(moveAng) * m.speed * chillMult * buffSpeedMult * moveMult * dt;
    m.y += Math.sin(moveAng) * m.speed * chillMult * buffSpeedMult * moveMult * dt;

    // Individual Monster Contact Strike (Every monster hits independently!)
    if (m.hitTimer <= 0) {
      const contactDmg = m.buffTimer > 0 ? Math.round(m.damage * 1.2) : m.damage;
      for (const p of livingPlayers) {
        if (dist(m.x, m.y, p.x, p.y) <= m.radius + 17) {
          m.hitTimer = 0.72;
          applyDamageToPlayer(room, p, contactDmg, 'physical');
          break;
        }
      }
    }
  }
}

const exportsObj = { pushEnemyBolt, updateRoomEnemiesAndProjectiles };
Object.assign(global, exportsObj);
module.exports = exportsObj;
