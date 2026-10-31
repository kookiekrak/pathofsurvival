// Server Combat Module: Skill Execution Stat Builder, Damage Rolling, Target Acquisition & Enemy Hit Resolution
const GameData = global.GameData || require('../../public/shared/gameData.js');

// =========================================================================
// SKILL EXECUTION, VAAL ULTIMATES & DAMAGE CALCULATION
// =========================================================================
function buildSkillExecution(player, setup) {
  const active = setup.active;
  const s = player.stats;
  const activeLv = (setup.activeLevel || 1) + (s.allGemLevels || 0);

  // Gem Level Scaling: +20% MORE Damage, +3% Area & 3% Faster Cooldown per Gem Level above 1
  const gemLevelMulti = Math.pow(1.20, activeLv - 1);

  // Add flat base damage from Weapon + Skill Tree + Gear (scaled by cooldown effectiveness)
  const flatEffectiveness = (active.cooldown || 0.85) < 0.55 ? 0.55 : 1.0;
  const addedFlat = (s.flatDmg || 0) * flatEffectiveness;
  let dmgMin = (active.baseDamage[0] + addedFlat * 0.85) * gemLevelMulti;
  let dmgMax = (active.baseDamage[1] + addedFlat * 1.15) * gemLevelMulti;
  let cooldown = active.cooldown * Math.pow(0.97, activeLv - 1);
  let projCount = (active.projCount || 1) + (s.extraProj || 0);
  let chains = (active.chains || 0) + (s.extraChain || 0);
  let pierceCount = (active.pierce || 0) + (s.pierceCount || 0);
  let radius = (active.radius || 32) * (1 + (activeLv - 1) * 0.03);
  let repeatCount = (s.mirageEcho > 0 && Math.random() < 0.55) ? 1 : 0;
  let lifeOnHit = s.lifeOnHit || 0;
  let bonusCritChance = 0;
  let bonusCritMulti = 0;

  let moreMulti = 1 + (s.globalDmgMulti || 0) / 100;
  if (active.damageType !== 'physical' && s.eleMoreMulti > 0) {
    moreMulti *= 1 + s.eleMoreMulti / 100;
  }

  let incPct = 0;
  const tags = active.tags || [];
  if (active.damageType === 'physical' || tags.includes('Physical')) incPct += s.physDmgPct || 0;
  if (active.damageType !== 'physical') incPct += s.eleDmgPct || 0;
  if (tags.includes('Spell')) incPct += s.spellDmgPct || 0;
  if (tags.includes('Projectile')) incPct += s.projDmgPct || 0;
  if (tags.includes('AoE')) incPct += s.aoeDmgPct || 0;

  let areaScale = 1 + (s.areaPct || 0) / 100;

  for (const sup of setup.supports) {
    const supLv = (sup.level || 1) + (s.supportLevelBonus || 0);
    const m = sup.mods || {};
    if (m.flatBonusDamage) {
      const flat = m.flatBonusDamage * (1 + (supLv - 1) * 0.25);
      dmgMin += flat;
      dmgMax += flat;
    }
    if (m.extraProjectiles) projCount += m.extraProjectiles + Math.floor((supLv - 1) * 0.5);
    if (m.extraChains) chains += m.extraChains + Math.floor((supLv - 1) * 0.5);
    if (m.cooldownMulti) cooldown *= Math.max(0.58, m.cooldownMulti - (supLv - 1) * 0.03);
    if (m.damageMulti) moreMulti *= m.damageMulti + (supLv - 1) * 0.06;
    if (m.physMulti) moreMulti *= m.physMulti + (supLv - 1) * 0.06;
    if (m.areaMulti) areaScale *= m.areaMulti + (supLv - 1) * 0.05;
    if (m.repeatCount) repeatCount += m.repeatCount;
    if (m.lifeOnHit) lifeOnHit += m.lifeOnHit + (supLv - 1);
    if (m.bonusCritChance) bonusCritChance += m.bonusCritChance + (supLv - 1) * 3;
    if (m.bonusCritMulti) bonusCritMulti += m.bonusCritMulti + (supLv - 1) * 8;
  }

  // Unarmed / Naked Penalties: Fighting without a weapon deals 82% LESS damage; completely naked deals 90% LESS!
  const hasWeapon = Boolean(player.equipment && player.equipment.weapon);
  const equippedCount = s.equippedCount || 0;
  let gearPenaltyMulti = 1.0;
  if (!hasWeapon) {
    gearPenaltyMulti *= 0.18;
  }
  if (equippedCount === 0) {
    gearPenaltyMulti *= 0.55;
  }

  const levelScale = 1 + (player.level - 1) * 0.12;
  const totalMulti = (1 + incPct / 100) * moreMulti * levelScale * gearPenaltyMulti;
  dmgMin = Math.max(1, Math.round(dmgMin * totalMulti));
  dmgMax = Math.max(dmgMin, Math.round(dmgMax * totalMulti));

  // Holding LMB (Focus-Fire) grants +25% Cooldown Recovery!
  const firingCdrBonus = player.input && player.input.firing ? 25 : 0;
  cooldown = Math.max(0.18, cooldown / (1 + ((s.cdrPct || 0) + firingCdrBonus) / 100));
  radius = Math.round(radius * areaScale);

  const critChance = s.resoluteTechnique ? 0 : Math.min(95, s.finalCritChance + bonusCritChance);
  const critMulti = (s.critMulti + bonusCritMulti) / 100;

  return {
    active,
    dmgMin,
    dmgMax,
    cooldown,
    projCount,
    chains,
    pierceCount,
    radius,
    repeatCount,
    lifeOnHit,
    critChance,
    critMulti
  };
}

function rollSkillDamage(exec) {
  let dmg = randInt(exec.dmgMin, exec.dmgMax);
  let isCrit = false;
  if (exec.critChance > 0 && Math.random() * 100 < exec.critChance) {
    isCrit = true;
    dmg = Math.round(dmg * exec.critMulti);
  }
  return { dmg, isCrit };
}

function findNearestEnemy(room, x, y, maxRange = 800, excludeIds = null) {
  let best = null;
  let bestDist = maxRange;
  for (const m of room.enemies.values()) {
    if (excludeIds && excludeIds.has(m.id)) continue;
    if (Math.abs(x - m.x) >= bestDist || Math.abs(y - m.y) >= bestDist) continue;
    const d = dist(x, y, m.x, m.y);
    if (d < bestDist) {
      bestDist = d;
      best = m;
    }
  }
  return best;
}

function damageEnemy(room, enemy, dmg, isCrit, attacker, lifeOnHit = 0, damageType = 'physical', isShatterProc = false) {
  if (!room.enemies.has(enemy.id)) return;

  // Map Tier Monster Armor / Toughness Mitigation:
  // Ungeared / under-leveled hits glance off high-tier monsters for 1 damage, while geared + tree builds pierce cleanly!
  if ((enemy.armor || 0) > 0 && enemy.id !== 'hideout_dummy') {
    const mArmor = enemy.armor;
    const afterFlat = Math.max(1, dmg - mArmor * 0.45);
    const pierceRatio = dmg / (dmg + mArmor * 1.5);
    dmg = Math.max(1, Math.round(afterFlat * pierceRatio));
  }

  if ((enemy.shockTimer || 0) > 0) {
    dmg = Math.round(dmg * 1.2);
  }
  enemy.hp -= dmg;

  // Slayer's Execution (12% HP) or Windripper Culling Strike (15% HP)
  const cullPct = attacker && attacker.stats
    ? (attacker.stats.windripperCull > 0 ? 0.15 : attacker.stats.cullingStrike > 0 ? 0.12 : 0)
    : 0;
  if (
    enemy.hp > 0 &&
    enemy.rarity !== 'boss' &&
    enemy.rarity !== 'unique' &&
    cullPct > 0 &&
    enemy.hp <= enemy.maxHp * cullPct
  ) {
    enemy.hp = 0;
  }

  const hasStarforge = attacker && attacker.stats && attacker.stats.starforgeShock > 0 && damageType === 'physical';
  const hasWindripper = attacker && attacker.stats && attacker.stats.windripperCull > 0;
  const hasBrotherhood = attacker && attacker.stats && attacker.stats.brotherhoodChill > 0 && damageType === 'lightning';
  const hasArakaali = isCrit && attacker && attacker.stats && attacker.stats.arakaaliVenom > 0;
  if (damageType === 'cold' || hasStarforge || hasWindripper || hasBrotherhood) {
    enemy.chillTimer = Math.max(enemy.chillTimer || 0, 2.5);
  }
  if (damageType === 'lightning' || hasStarforge || hasWindripper || hasArakaali) {
    enemy.shockTimer = Math.max(enemy.shockTimer || 0, 2.8);
  }

  if (attacker && !attacker.dead) {
    if (lifeOnHit > 0 && (attacker.lohBudget || 0) > 0) {
      const healAmt = Math.min(lifeOnHit, attacker.lohBudget);
      attacker.lohBudget -= healAmt;
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmt);
      if (attacker.stats && attacker.stats.crownOfEyes > 0 && attacker.maxEs > 0) {
        attacker.es = Math.min(attacker.maxEs, attacker.es + healAmt);
      }
    }
    // Atziri's Acuity Instant Critical Leech (3% of Max Life & Energy Shield, 0.18s internal cooldown)
    if (isCrit && attacker.stats && attacker.stats.atziriInstantLeech > 0 && (attacker.acuityCd || 0) <= 0) {
      attacker.acuityCd = 0.18;
      const leechHp = Math.max(2, Math.round(attacker.maxHp * 0.03));
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + leechHp);
      if (attacker.maxEs > 0) {
        attacker.es = Math.min(attacker.maxEs, attacker.es + Math.max(1, Math.round(attacker.maxEs * 0.03)));
      }
    }
    // Mjölner Lightning Arc Proc on Hit (0.38s internal cooldown)
    if (!isShatterProc && attacker.stats && attacker.stats.mjolnerProc > 0 && (attacker.mjolnerCd || 0) <= 0) {
      attacker.mjolnerCd = 0.38;
      const arcDmg = Math.max(4, Math.round(dmg * 0.55));
      let chained = 0;
      for (const other of room.enemies.values()) {
        if (other.id === enemy.id) continue;
        if (Math.abs(enemy.x - other.x) > 210 || Math.abs(enemy.y - other.y) > 210) continue;
        if (dist(enemy.x, enemy.y, other.x, other.y) <= 210) {
          damageEnemy(room, other, arcDmg, false, attacker, 0, 'lightning', true);
          if (room.fxEvents.length < 22) {
            room.fxEvents.push({
              kind: 'chain',
              x1: Math.round(enemy.x),
              y1: Math.round(enemy.y),
              x2: Math.round(other.x),
              y2: Math.round(other.y),
              color: '#70b8ff'
            });
          }
          chained++;
          if (chained >= 2) break;
        }
      }
    }
    // Cospri's Malice Frost Nova Proc on Critical Hit (0.42s internal cooldown)
    if (!isShatterProc && isCrit && attacker.stats && attacker.stats.cospriProc > 0 && (attacker.cospriCd || 0) <= 0) {
      attacker.cospriCd = 0.42;
      const novaDmg = Math.max(5, Math.round(dmg * 0.6));
      if (room.fxEvents.length < 22) {
        room.fxEvents.push({
          kind: 'nova',
          x: Math.round(enemy.x),
          y: Math.round(enemy.y),
          r: 80,
          color: '#74c0fc'
        });
      }
      let novaHits = 0;
      for (const other of room.enemies.values()) {
        const hitR = 80 + other.radius;
        if (Math.abs(enemy.x - other.x) > hitR || Math.abs(enemy.y - other.y) > hitR) continue;
        if (dist(enemy.x, enemy.y, other.x, other.y) <= hitR) {
          other.chillTimer = Math.max(other.chillTimer || 0, 2.5);
          damageEnemy(room, other, novaDmg, false, attacker, 0, 'cold', true);
          if (++novaHits >= 8) break;
        }
      }
    }
    // Cast on Critical Strike Arcane Bolt Proc (0.35s internal cooldown)
    if (!isShatterProc && isCrit && attacker.stats && attacker.stats.castOnCrit > 0 && (attacker.cocCd || 0) <= 0) {
      attacker.cocCd = 0.35;
      const cocDmg = Math.max(6, Math.round(dmg * (0.45 + attacker.stats.castOnCrit * 0.15)));
      if (room.fxEvents.length < 22) {
        room.fxEvents.push({ kind: 'nova', x: Math.round(enemy.x), y: Math.round(enemy.y), r: 68, color: '#38d9a9' });
      }
      let cocHits = 0;
      for (const other of room.enemies.values()) {
        const hitR = 68 + other.radius;
        if (Math.abs(enemy.x - other.x) > hitR || Math.abs(enemy.y - other.y) > hitR) continue;
        if (dist(enemy.x, enemy.y, other.x, other.y) <= hitR) {
          damageEnemy(room, other, cocDmg, false, attacker, 0, 'lightning', true);
          if (++cocHits >= 5) break;
        }
      }
    }
    if (enemy.id === 'hideout_dummy') {
      attacker.vaalSouls = Math.min(45, (attacker.vaalSouls || 0) + 3);
    }
    // Subtle punchy knockback (8-16 units away from player)
    if (enemy.behavior !== 'dummy' && enemy.hp > 0) {
      const kbAng = Math.atan2(enemy.y - attacker.y, enemy.x - attacker.x);
      const kbDist = enemy.rarity === 'boss' ? 3 : enemy.rarity === 'rare' ? 8 : randInt(10, 16);
      enemy.x = Math.max(-ARENA_HALF + 50, Math.min(ARENA_HALF - 50, enemy.x + Math.cos(kbAng) * kbDist));
      enemy.y = Math.max(-ARENA_HALF + 50, Math.min(ARENA_HALF - 50, enemy.y + Math.sin(kbAng) * kbDist));
    }
  }

  if (isCrit || room.fxEvents.length < 18) {
    room.fxEvents.push({
      kind: 'dmg_num',
      x: Math.round(enemy.x + randInt(-10, 10)),
      y: Math.round(enemy.y - enemy.radius),
      val: dmg,
      crit: isCrit,
      dtype: damageType
    });
  }

  if (enemy.hp <= 0) {
    const wasChilled = (enemy.chillTimer || 0) > 0;
    const wasShocked = (enemy.shockTimer || 0) > 0;
    const deathX = enemy.x;
    const deathY = enemy.y;
    const enemyMaxHp = enemy.maxHp || 40;
    room.enemies.delete(enemy.id);
    onEnemyKilled(room, enemy, attacker);

    // Herald of Ice Shatter Nova when a chilled/frozen enemy dies or player has Herald of Ice (capped at 3 procs/tick)!
    const hasHeraldIce = Boolean(attacker && attacker.stats && attacker.stats.heraldIce > 0);
    if ((wasChilled || hasHeraldIce) && !isShatterProc && (room.procCountThisTick || 0) < 3) {
      room.procCountThisTick = (room.procCountThisTick || 0) + 1;
      const nowT = room.runTimer || 0;
      if (nowT - (room.lastShatterTime || 0) >= 0.16 && room.fxEvents.length < 22) {
        room.lastShatterTime = nowT;
        room.fxEvents.push({ kind: 'nova', x: Math.round(deathX), y: Math.round(deathY), r: 62, color: '#74c0fc' });
      }
      const shatterDmg = Math.max(5, Math.round(dmg * 0.35 + (hasHeraldIce ? enemyMaxHp * 0.14 : 0)));
      let shHits = 0;
      for (const other of room.enemies.values()) {
        const hitR = 62 + other.radius;
        if (Math.abs(deathX - other.x) > hitR || Math.abs(deathY - other.y) > hitR) continue;
        if (dist(deathX, deathY, other.x, other.y) <= hitR) {
          other.chillTimer = Math.max(other.chillTimer || 0, 2.2);
          damageEnemy(room, other, shatterDmg, false, attacker, 0, 'cold', true);
          if (++shHits >= 6) break;
        }
      }
    }

    // Herald of Ash / Profane Bloom / Gloom Shrine On-Kill Explosion (capped at 3 procs/tick)!
    const hasHeraldAsh = Boolean(attacker && attacker.stats && attacker.stats.heraldAsh > 0);
    const hasProfane = Boolean(attacker && attacker.stats && attacker.stats.profaneBloom > 0 && Math.random() < 0.45);
    if ((hasHeraldAsh || hasProfane) && !isShatterProc && (room.procCountThisTick || 0) < 3) {
      room.procCountThisTick = (room.procCountThisTick || 0) + 1;
      const nowT = room.runTimer || 0;
      const expColor = hasProfane ? '#cc5de8' : '#ff6b4a';
      if (nowT - (room.lastAshTime || 0) >= 0.15 && room.fxEvents.length < 22) {
        room.lastAshTime = nowT;
        room.fxEvents.push({ kind: 'nova', x: Math.round(deathX), y: Math.round(deathY), r: 72, color: expColor });
      }
      const expDmg = Math.max(6, Math.round(enemyMaxHp * 0.22));
      let expHits = 0;
      for (const other of room.enemies.values()) {
        const hitR = 72 + other.radius;
        if (Math.abs(deathX - other.x) > hitR || Math.abs(deathY - other.y) > hitR) continue;
        if (dist(deathX, deathY, other.x, other.y) <= hitR) {
          damageEnemy(room, other, expDmg, false, attacker, 0, 'fire', true);
          if (++expHits >= 6) break;
        }
      }
    }

    // Inpulsa's Broken Heart Shock Explosion when a shocked enemy dies (capped at 3 procs/tick)!
    if (wasShocked && !isShatterProc && attacker && attacker.stats && attacker.stats.inpulsaExplode > 0 && (room.procCountThisTick || 0) < 3) {
      room.procCountThisTick = (room.procCountThisTick || 0) + 1;
      const nowT = room.runTimer || 0;
      if (nowT - (room.lastInpulsaTime || 0) >= 0.16 && room.fxEvents.length < 22) {
        room.lastInpulsaTime = nowT;
        room.fxEvents.push({ kind: 'nova', x: Math.round(deathX), y: Math.round(deathY), r: 75, color: '#70b8ff' });
      }
      const inpulsaDmg = Math.max(6, Math.round(enemyMaxHp * 0.22));
      let inpHits = 0;
      for (const other of room.enemies.values()) {
        const hitR = 75 + other.radius;
        if (Math.abs(deathX - other.x) > hitR || Math.abs(deathY - other.y) > hitR) continue;
        if (dist(deathX, deathY, other.x, other.y) <= hitR) {
          damageEnemy(room, other, inpulsaDmg, false, attacker, 0, 'lightning', true);
          if (++inpHits >= 6) break;
        }
      }
    }
  }
}

const exportsObj = { buildSkillExecution, rollSkillDamage, findNearestEnemy, damageEnemy };
Object.assign(global, exportsObj);
module.exports = exportsObj;
