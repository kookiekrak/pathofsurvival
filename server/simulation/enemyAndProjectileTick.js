// Server Simulation Module: Projectile Physics/Collisions, Monster AI, Elite Skills & Boss Choreography
const GameData = global.GameData || require('../../public/shared/gameData.js');

function pushEnemyBolt(room, xOrBolt, y, ang, speed, radius, damage, damageType, duration, skipExtraProj) {
  if (room.projectiles.length >= 90) {
    const pIdx = room.projectiles.findIndex(p => p.ownerId !== 'enemy');
    if (pIdx >= 0) room.projectiles.splice(pIdx, 1);
    else room.projectiles.shift();
  }
  if (xOrBolt && typeof xOrBolt === 'object') {
    room.projectiles.push({ id: uid('eprj'), ownerId: 'enemy', skillId: 'enemy_bolt', behavior: 'standard', ...xOrBolt });
    return;
  }
  const x = xOrBolt;
  room.projectiles.push({
    id: uid('eprj'), ownerId: 'enemy', skillId: 'enemy_bolt', behavior: 'standard',
    damageType, x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, speed, radius, damage, duration
  });
  if (!skipExtraProj && room.mapModStats && room.mapModStats.extraProj > 0) {
    const sideAng = ang + (Math.random() < 0.5 ? 0.18 : -0.18);
    pushEnemyBolt(room, x, y, sideAng, speed, radius, damage, damageType, duration, true);
  }
}

function updateRoomEnemiesAndProjectiles(room, dt, allPlayers, alivePlayers) {
  const enemyList = Array.from(room.enemies.values());

  // Update Projectiles
  for (let i = room.projectiles.length - 1; i >= 0; i--) {
    const prj = room.projectiles[i];
    prj.duration -= dt;
    if (prj.duration <= 0) {
      if (prj.behavior === 'tornado_burst') {
        room.fxEvents.push({ kind: 'nova', x: Math.round(prj.x), y: Math.round(prj.y), r: 56, color: '#ffe066' });
        for (let k = 0; k < 2; k++) {
          const ang = (Math.PI * 2 * k) / 2 + (prj.vx ? Math.atan2(prj.vy, prj.vx) : 0);
          if (room.projectiles.length >= 90) room.projectiles.shift();
          room.projectiles.push({
            ...prj, id: uid('prj'), behavior: 'standard', vx: Math.cos(ang) * 540, vy: Math.sin(ang) * 540,
            duration: 0.42, maxDuration: 0.42, hitIds: new Set()
          });
        }
      } else if (prj.behavior === 'molten_lob') {
        const owner = room.players.get(prj.ownerId);
        const splashRadius = prj.aoeRadius || 68;
        room.fxEvents.push({ kind: 'nova', x: Math.round(prj.x), y: Math.round(prj.y), r: splashRadius, color: '#ff6b4a' });
        for (let eIdx = 0; eIdx < enemyList.length; eIdx++) {
          const enemy = enemyList[eIdx];
          if (enemy.hp <= 0) continue;
          const hitR = splashRadius + (enemy.radius || 16);
          if (Math.abs(prj.x - enemy.x) > hitR || Math.abs(prj.y - enemy.y) > hitR) continue;
          if (dist(prj.x, prj.y, enemy.x, enemy.y) <= hitR) {
            const { dmg, isCrit } = rollSkillDamage(prj.exec);
            damageEnemy(room, enemy, dmg, isCrit, owner, prj.exec ? prj.exec.lifeOnHit : 0, 'fire');
          }
        }
      } else if (prj.behavior === 'eye_of_winter') {
        room.fxEvents.push({ kind: 'nova', sub: 'ice_nova', x: Math.round(prj.x), y: Math.round(prj.y), r: 78, color: '#74c0fc' });
        for (let k = 0; k < 2; k++) {
          const ang = (Math.PI * 2 * k) / 2;
          if (room.projectiles.length >= 90) room.projectiles.shift();
          room.projectiles.push({
            ...prj, id: uid('prj'), behavior: 'standard', vx: Math.cos(ang) * 480, vy: Math.sin(ang) * 480,
            radius: 10, duration: 0.36, maxDuration: 0.36, hitIds: new Set()
          });
        }
      }
      room.projectiles.splice(i, 1);
      continue;
    }

    if (prj.behavior === 'ball_lightning' || prj.behavior === 'eye_of_winter') {
      prj.pulseCd = (prj.pulseCd || 0.28) - dt;
      if (prj.pulseCd <= 0) {
        prj.pulseCd = 0.28;
        const owner = room.players.get(prj.ownerId);
        const isBall = prj.behavior === 'ball_lightning';
        const pulseR = prj.aoeRadius || (isBall ? 125 : 95);
        let hits = 0;
        for (let eIdx = 0; eIdx < enemyList.length; eIdx++) {
          const enemy = enemyList[eIdx];
          if (enemy.hp <= 0) continue;
          const hitR = pulseR + (enemy.radius || 16);
          if (Math.abs(prj.x - enemy.x) > hitR || Math.abs(prj.y - enemy.y) > hitR) continue;
          if (dist(prj.x, prj.y, enemy.x, enemy.y) <= hitR) {
            const { dmg, isCrit } = rollSkillDamage(prj.exec);
            damageEnemy(room, enemy, dmg, isCrit, owner, prj.exec ? prj.exec.lifeOnHit : 0, isBall ? 'lightning' : 'cold');
            if (isBall && room.fxEvents.length < 22) {
              room.fxEvents.push({ kind: 'chain', x1: Math.round(prj.x), y1: Math.round(prj.y), x2: Math.round(enemy.x), y2: Math.round(enemy.y), color: '#74c0fc' });
            }
            if (++hits >= 3) break;
          }
        }
      }
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
    const isVaalHit = !!(prj.isVaalProj || (prj.exec && prj.exec.isVaal));
    for (let eIdx = 0; eIdx < enemyList.length; eIdx++) {
      const enemy = enemyList[eIdx];
      if (enemy.hp <= 0 || prj.hitIds.has(enemy.id)) continue;
      const hitR = (prj.radius || 8) + (enemy.radius || 16);
      if (Math.abs(prj.x - enemy.x) > hitR || Math.abs(prj.y - enemy.y) > hitR) continue;
      if (dist(prj.x, prj.y, enemy.x, enemy.y) <= hitR) {
        prj.hitIds.add(enemy.id);
        const { dmg, isCrit } = rollSkillDamage(prj.exec);
        damageEnemy(room, enemy, dmg, isCrit, owner, prj.exec.lifeOnHit, prj.damageType, false, isVaalHit);

        if ((prj.behavior === 'fireball_explode' || prj.behavior === 'molten_lob') && prj.hitIds.size <= 2) {
          if (room.fxEvents.length < 22) {
            room.fxEvents.push({
              kind: 'nova', x: Math.round(enemy.x), y: Math.round(enemy.y),
              r: prj.aoeRadius, color: prj.damageType === 'fire' ? '#ff6b4a' : '#d99b66'
            });
          }
          let splashHits = 0;
          for (let oIdx = 0; oIdx < enemyList.length; oIdx++) {
            const other = enemyList[oIdx];
            if (other.id === enemy.id || other.hp <= 0) continue;
            const splashR = prj.aoeRadius + (other.radius || 16);
            if (Math.abs(enemy.x - other.x) > splashR || Math.abs(enemy.y - other.y) > splashR) continue;
            if (dist(enemy.x, enemy.y, other.x, other.y) <= splashR) {
              const splash = rollSkillDamage(prj.exec);
              damageEnemy(room, other, Math.round(splash.dmg * 0.75), splash.isCrit, owner, 0, prj.damageType, true);
              if (++splashHits >= 6) break;
            }
          }
        } else if (prj.behavior === 'lightning_arrow' && prj.hitIds.size <= 2) {
          enemy.shockTimer = Math.max(enemy.shockTimer || 0, 4.0);
          let arcs = 0;
          for (let oIdx = 0; oIdx < enemyList.length; oIdx++) {
            const other = enemyList[oIdx];
            if (other.id === enemy.id || other.hp <= 0) continue;
            if (Math.abs(enemy.x - other.x) > 240 || Math.abs(enemy.y - other.y) > 240) continue;
            if (dist(enemy.x, enemy.y, other.x, other.y) <= 240) {
              other.shockTimer = Math.max(other.shockTimer || 0, 3.0);
              const arcRoll = rollSkillDamage(prj.exec);
              damageEnemy(room, other, Math.round(arcRoll.dmg * 0.7), arcRoll.isCrit, owner, 0, 'lightning', true);
              if (room.fxEvents.length < 22) {
                room.fxEvents.push({
                  kind: 'chain', x1: Math.round(enemy.x), y1: Math.round(enemy.y),
                  x2: Math.round(other.x), y2: Math.round(other.y), color: '#70b8ff'
                });
              }
              if (++arcs >= 2) break;
            }
          }
        }

        if (prj.behavior === 'tornado_burst' && prj.hitIds.size === 1) {
          prj.duration = Math.min(prj.duration, 0.06);
        }

        if (prj.chainsLeft > 0) {
          prj.chainsLeft--;
          const nextTarget = findNearestEnemy(room, enemy.x, enemy.y, 260, prj.hitIds);
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

    // Never jump/teleport monsters in front of players when they outrun/kite them; only recycle if stranded > 1050 units away!
    if (bestD > 1050 && m.rarity !== 'boss' && m.rarity !== 'unique' && !m.isRitualMob) {
      const pAng = Math.random() * Math.PI * 2;
      const teleDist = randInt(440, 560);
      m.x = Math.max(-ARENA_HALF + 70, Math.min(ARENA_HALF - 70, Math.round(target.x + Math.cos(pAng) * teleDist)));
      m.y = Math.max(-ARENA_HALF + 70, Math.min(ARENA_HALF - 70, Math.round(target.y + Math.sin(pAng) * teleDist)));
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

    // 1. MULTI-PHASE RAID & ATLAS BOSS AI (Delegated to bossRaidEngine.js)
    if (m.rarity === 'boss' || m.rarity === 'unique' || m.behavior === 'boss') {
      if (typeof updateSingleBossAI === 'function') {
        updateSingleBossAI(room, m, dt, target, bestD, ang, livingPlayers);
      }
    } else if (m.rarity === 'rare' && m.actionTimer <= 0 && bestD < 380) {
      // 2. RARE MONSTER SIGNATURE SKILLS & ARCHNEMESIS MODS
      m.actionTimer = 4.8;
      if (Array.isArray(m.mods) && m.mods.includes('Mirror Image') && !m.clonedOnce && m.hp < m.maxHp * 0.55) {
        m.clonedOnce = true;
        spawnMonster(room, false, { x: m.x + 36, y: m.y, exact: true }, 'magic', m.typeId);
        room.fxEvents.push({ kind: 'nova', x: Math.round(m.x), y: Math.round(m.y), r: 65, color: '#cc5de8' });
      }
      if (Array.isArray(m.mods) && m.mods.includes('Storm Herald') && room.hazards.length <= 3) {
        spawnGroundHazard(room, target.x + randInt(-35, 35), target.y + randInt(-35, 35), 54, 0.95, Math.round(m.damage * 1.2), 'Storm Herald Bolt');
      }
      m.rareSkillIdx = ((m.rareSkillIdx || 0) + 1) % 3;
      if (m.rareSkillIdx === 0) {
        for (let k = 0; k < 5; k++) {
          pushEnemyBolt(room, m.x, m.y, (Math.PI * 2 * k) / 5, 155, 9, Math.round(m.damage * 0.85), 'fire', 2.8, true);
        }
      } else if (m.rareSkillIdx === 1 && room.hazards.length <= 2) {
        for (const st of [{ d: 70, fuse: 0.6 }, { d: 140, fuse: 0.9 }, { d: 210, fuse: 1.2 }]) {
          spawnGroundHazard(room, m.x + Math.cos(ang) * st.d, m.y + Math.sin(ang) * st.d, 42, st.fuse, Math.round(m.damage * 1.15), 'Rare Sunder Cascade');
        }
      } else {
        spawnGroundHazard(room, m.x, m.y, 90, 1.1, Math.round(m.damage * 1.2), 'Frost Nova Pulse');
      }
    } else if (m.actionTimer <= 0) {
      // 3. 16 VARIED MONSTER ARCHETYPE SKILLS (1 bolt per attack, 350 range & 2.8-3.8s cooldowns for ranged/casters)
      const rangedCd = 2.8 + Math.random() * 1.0;
      if (m.behavior === 'treasure_goblin') {
        m.actionTimer = 2.6;
        target.runGold = (target.runGold || 0) + 3;
        target.earnedRunGold = (target.earnedRunGold || 0) + 3;
      } else if (m.behavior === 'blink_ambush' && bestD >= 150 && bestD <= 300) {
        m.actionTimer = 5.2;
        room.fxEvents.push({ kind: 'nova', x: Math.round(m.x), y: Math.round(m.y), r: 42, color: '#9775fa' });
        m.x = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(target.x - Math.cos(ang) * 75)));
        m.y = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(target.y - Math.sin(ang) * 75)));
        room.fxEvents.push({ kind: 'nova', x: Math.round(m.x), y: Math.round(m.y), r: 48, color: '#9775fa' });
      } else if (m.behavior === 'storm_caller' && bestD < 350) {
        m.actionTimer = m.specialCd = rangedCd;
        m.pauseTimer = 0.4;
        if (room.hazards.length <= 3) spawnGroundHazard(room, target.x + randInt(-30, 30), target.y + randInt(-30, 30), 52, 1.0, Math.round(m.damage * 1.1), 'Stormcaller Strike');
        pushEnemyBolt(room, m.x, m.y, ang, 200, 8, Math.round(m.damage * 0.8), 'lightning', 2.2);
      } else if (m.behavior === 'frost_caster' && bestD < 350) {
        m.actionTimer = m.specialCd = rangedCd;
        m.pauseTimer = 0.35;
        pushEnemyBolt(room, m.x, m.y, ang, 195, 8, Math.round(m.damage * 0.8), 'cold', 2.2);
      } else if (m.behavior === 'necromancer' && bestD < 350) {
        m.actionTimer = m.specialCd = rangedCd + 0.6;
        m.pauseTimer = 0.45;
        let healed = 0;
        for (const ally of room.enemies.values()) {
          if (ally.id !== m.id && ally.rarity !== 'boss' && dist(m.x, m.y, ally.x, ally.y) <= 160) {
            ally.hp = Math.min(ally.maxHp, ally.hp + Math.round(ally.maxHp * 0.22));
            ally.buffTimer = 4.0;
            if (++healed >= 3) break;
          }
        }
        room.fxEvents.push({ kind: 'nova', x: Math.round(m.x), y: Math.round(m.y), r: 72, color: '#be4bdb' });
        pushEnemyBolt(room, m.x, m.y, ang, 195, 8, Math.round(m.damage * 0.8), 'cold', 2.2);
        if (healed === 0 && room.enemies.size < 65) {
          spawnMonster(room, false, { x: m.x + Math.cos(ang) * 45, y: m.y + Math.sin(ang) * 45, exact: true }, 'normal', 'skeleton');
        }
      } else if (m.behavior === 'toxic_mortar' && bestD < 350) {
        m.actionTimer = m.specialCd = rangedCd;
        m.pauseTimer = 0.35;
        pushEnemyBolt(room, m.x, m.y, ang, 185, 8, Math.round(m.damage * 0.8), 'physical', 2.2);
      } else if (m.behavior === 'charge' && bestD >= 110 && bestD <= 320) {
        m.actionTimer = 4.2;
        m.chargeWindup = 0.5;
        m.chargeAngle = ang;
      } else if (m.behavior === 'flameblast_caster' && bestD < 350) {
        m.actionTimer = m.specialCd = rangedCd;
        m.pauseTimer = 0.4;
        pushEnemyBolt(room, m.x, m.y, ang, 185, 8, Math.round(m.damage * 0.82), 'fire', 2.3);
      } else if ((m.typeId === 'devourer' || m.typeId === 'kitava_herald' || m.behavior === 'phalanx_tank') && bestD <= 95) {
        m.actionTimer = 4.0;
        m.pauseTimer = 0.8;
        if (room.hazards.length <= 3) spawnGroundHazard(room, m.x + Math.cos(ang) * 45, m.y + Math.sin(ang) * 45, 65, 0.95, Math.round(m.damage * 1.25), 'Heavy Slam');
      } else if ((m.behavior === 'ranged_kite' || m.behavior === 'mortar_leap') && bestD < 350) {
        m.actionTimer = m.specialCd = rangedCd;
        m.pauseTimer = 0.35;
        const bType = m.behavior === 'mortar_leap' ? 'fire' : 'cold';
        pushEnemyBolt(room, m.x, m.y, ang, 205, 8, Math.round(m.damage * 0.8), bType, 2.1);
      }
    }

    if (m.behavior === 'treasure_goblin' && bestD < 260) {
      moveAng = ang + Math.PI + Math.sin((room.runTimer || 0) * 2.4) * 0.7;
    }

    m.x += Math.cos(moveAng) * m.speed * chillMult * buffSpeedMult * moveMult * dt;
    m.y += Math.sin(moveAng) * m.speed * chillMult * buffSpeedMult * moveMult * dt;
    if (room.isRaidEncounter) {
      const rBound = (typeof RAID_ARENA_HALF === 'number' ? RAID_ARENA_HALF : 560) - 40;
      m.x = Math.max(-rBound, Math.min(rBound, m.x));
      m.y = Math.max(-rBound, Math.min(rBound, m.y));
    }

    // Individual Monster Contact Strike (Every monster hits independently!)
    if (m.hitTimer <= 0 && !m.shielded) {
      const contactDmg = m.buffTimer > 0 ? Math.round(m.damage * 1.2) : m.damage;
      for (const p of livingPlayers) {
        if (dist(m.x, m.y, p.x, p.y) <= m.radius + 17) {
          if (applyDamageToPlayer(room, p, contactDmg, 'physical')) {
            m.hitTimer = 0.72;
            if (Array.isArray(m.mods) && m.mods.includes('Vampiric')) {
              m.hp = Math.min(m.maxHp, m.hp + Math.round(m.maxHp * 0.08));
            }
          }
          break;
        }
      }
    }
  }
}

const exportsObj = { pushEnemyBolt, updateRoomEnemiesAndProjectiles };
Object.assign(global, exportsObj);
module.exports = exportsObj;
