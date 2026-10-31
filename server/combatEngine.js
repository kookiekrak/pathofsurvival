// Server Module: Skill Execution, Vaal Ultimates, Damage Mitigation, Kills & Loot Drops
const GameData = require('../public/shared/gameData.js');
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
  let repeatCount = 0;
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

    // Herald of Ice Shatter Nova when a chilled/frozen enemy dies (capped at 3 procs/tick to prevent O(N^2) freezes)!
    if (wasChilled && !isShatterProc && (room.procCountThisTick || 0) < 3) {
      room.procCountThisTick = (room.procCountThisTick || 0) + 1;
      const nowT = room.runTimer || 0;
      if (nowT - (room.lastShatterTime || 0) >= 0.16 && room.fxEvents.length < 22) {
        room.lastShatterTime = nowT;
        room.fxEvents.push({
          kind: 'nova',
          x: Math.round(deathX),
          y: Math.round(deathY),
          r: 55,
          color: '#74c0fc'
        });
      }
      const shatterDmg = Math.max(4, Math.round(dmg * 0.3));
      let shHits = 0;
      for (const other of room.enemies.values()) {
        const hitR = 55 + other.radius;
        if (Math.abs(deathX - other.x) > hitR || Math.abs(deathY - other.y) > hitR) continue;
        if (dist(deathX, deathY, other.x, other.y) <= hitR) {
          damageEnemy(room, other, shatterDmg, false, attacker, 0, 'cold', true);
          if (++shHits >= 6) break;
        }
      }
    }

    // Inpulsa's Broken Heart Shock Explosion when a shocked enemy dies (capped at 3 procs/tick)!
    if (wasShocked && !isShatterProc && attacker && attacker.stats && attacker.stats.inpulsaExplode > 0 && (room.procCountThisTick || 0) < 3) {
      room.procCountThisTick = (room.procCountThisTick || 0) + 1;
      const nowT = room.runTimer || 0;
      if (nowT - (room.lastInpulsaTime || 0) >= 0.16 && room.fxEvents.length < 22) {
        room.lastInpulsaTime = nowT;
        room.fxEvents.push({
          kind: 'nova',
          x: Math.round(deathX),
          y: Math.round(deathY),
          r: 75,
          color: '#70b8ff'
        });
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

function onEnemyKilled(room, enemy, killer) {
  if (killer && !killer.dead) {
    killer.kills++;
    if (killer.stats.lifeOnKill > 0) {
      killer.hp = Math.min(killer.maxHp, killer.hp + killer.stats.lifeOnKill);
    }
    if (enemy.rarity === 'rare' && killer.stats.headhunter > 0) {
      killer.hhStacks = Math.min(8, (killer.hhStacks || 0) + 1);
      killer.hhTimer = 20;
      recalcPlayer(killer, false);
    }
  }

  // Advance Kill-Driven Wave Progress (10 Waves)
  if (room.state === 'RUN') {
    const waveGain = enemy.rarity === 'boss' ? 100 : enemy.rarity === 'rare' ? 8.5 : enemy.rarity === 'magic' ? 3.0 : 1.1;
    room.waveProgress = Math.min(100, (room.waveProgress || 0) + waveGain);
  }

  // Grant Persistent Character XP, Un-inflated In-Run Rogue-Lite XP, Scaled-Down Gold, Flask Charges & Vaal Souls
  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];
  const mapTier = mapDef ? mapDef.tier : 1;
  const goldMult = mapDef ? (mapDef.goldMult || 1.0) : 1.0;
  const baseGoldGain = (enemy.rarity === 'boss' || enemy.rarity === 'unique')
    ? 32 + mapTier * 8
    : enemy.rarity === 'rare'
      ? 6 + Math.round(mapTier * 1.5)
      : enemy.rarity === 'magic'
        ? 2 + Math.floor(mapTier * 0.4)
        : (Math.random() < 0.65 ? 1 : 0);
  const goldGain = baseGoldGain > 0 ? Math.max(1, Math.round(baseGoldGain * goldMult)) : 0;

  // Un-inflated In-Run Rogue-lite XP (tier-independent so entering higher-tier maps NEVER grants 10 levels instantly!)
  const baseRunXpGain = (enemy.rarity === 'boss' || enemy.rarity === 'unique')
    ? 190
    : enemy.rarity === 'rare'
      ? 42
      : enemy.rarity === 'magic'
        ? 18
        : 9;

  const soulGain = enemy.rarity === 'boss' || enemy.rarity === 'rare' ? 8 : enemy.rarity === 'magic' ? 3 : 1;
  for (const p of room.players.values()) {
    if (!p.dead) {
      const pGoldGain = goldGain > 0 ? Math.max(1, Math.round(goldGain * (1 + ((p.stats && p.stats.goldGainPct) || 0) / 100))) : 0;
      const pSoulGain = Math.max(1, Math.round(soulGain * (1 + ((p.stats && p.stats.vaalSoulGainPct) || 0) / 100)));
      p.runGold = (p.runGold || 0) + pGoldGain;
      p.earnedRunGold = (p.earnedRunGold || 0) + pGoldGain;
      p.nextChestCost = getNextChestCost(p, room);
      p.vaalSouls = Math.min(45, (p.vaalSouls || 0) + pSoulGain);

      const baseCharge = enemy.rarity === 'boss' ? 8 : enemy.rarity === 'rare' ? 3 : enemy.rarity === 'magic' ? 1 : (Math.random() < 0.35 ? 1 : 0);
      const chargeGain = Math.round(baseCharge * (1 + ((p.stats && p.stats.flaskChargeGainPct) || 0) / 100));
      if (chargeGain > 0) {
        if (Array.isArray(p.flaskBelt)) {
          for (let sIdx = 0; sIdx < 5; sIdx++) {
            const fId = p.flaskBelt[sIdx];
            if (!fId) continue;
            const fDef = GameData.FLASKS.find(fl => fl.id === fId);
            if (fDef) {
              p.flaskSlotCharges[sIdx] = Math.min(fDef.maxCharges, (p.flaskSlotCharges[sIdx] || 0) + chargeGain);
              p.flaskCharges[fId] = p.flaskSlotCharges[sIdx];
            }
          }
        }
        const unlocked = p.unlockedFlasks || ['life'];
        for (const f of GameData.FLASKS) {
          if (unlocked.includes(f.id)) {
            p.flaskCharges[f.id] = Math.min(f.maxCharges, (p.flaskCharges[f.id] || 0) + chargeGain);
          }
        }
      }

      if (enemy.rarity === 'boss' || enemy.rarity === 'unique') {
        const bossStashBounty = Math.round((35 + mapTier * 10) * goldMult);
        p.gold = (p.gold || 0) + bossStashBounty;
        sendPrivateProfile(p);
      }

      // 1. In-Run Rogue-Lite Leveling (Resets each map, grants Gem / Run Boon Drafts, max 1 level-up per kill event)
      if (room.state === 'RUN') {
        p.runLevel = p.runLevel || 1;
        p.runXpNext = p.runXpNext || 180;
        p.runXp = (p.runXp || 0) + baseRunXpGain;
        if (p.runXp >= p.runXpNext) {
          p.runXp -= p.runXpNext;
          p.runLevel++;
          p.runXpNext = Math.round(p.runXpNext * 1.45 + 85);
          // Clamp any overflow so a single kill never chains multiple instant levels
          if (p.runXp >= p.runXpNext) {
            p.runXp = p.runXpNext - 1;
          }
          queueGemDraft(p, `ROGUE-LITE LV. ${p.runLevel} — PICK 1 UPGRADE [F1 / F2 / F3]`);
          sendPrivateProfile(p);
          room.fxEvents.push({
            kind: 'level_up',
            x: Math.round(p.x),
            y: Math.round(p.y)
          });
        }
      }

      // 2. Persistent Character Leveling (Saved across maps in SQLite,Lv 1-45, grants +1 Permanent Skill Tree Point)
      if ((p.level || 1) < 45) {
        p.xp = (p.xp || 0) + (enemy.xp || 0);
        p.xpNext = p.xpNext || getCharXpForLevel(p.level || 1);
        if (p.xp >= p.xpNext) {
          p.xp -= p.xpNext;
          p.level = Math.min(45, (p.level || 1) + 1);
          p.xpNext = getCharXpForLevel(p.level);
          if (p.xp >= p.xpNext) {
            p.xp = Math.floor(p.xpNext * 0.5);
          }
          const totalTreePts = Math.max(0, (p.passives ? p.passives.length - 1 : 0) + (p.passivePoints || 0));
          if (totalTreePts < 45) {
            p.passivePoints = (p.passivePoints || 0) + 1;
          }
          recalcPlayer(p, true);
          sendPrivateProfile(p);
          room.fxEvents.push({
            kind: 'level_up',
            x: Math.round(p.x),
            y: Math.round(p.y)
          });
          room.fxEvents.push({
            kind: 'dmg_num',
            x: Math.round(p.x),
            y: Math.round(p.y - 36),
            val: `CHAR LV. ${p.level}! (+1 TREE POINT [P])`,
            text: `CHARACTER LEVEL ${p.level}! (+1 PASSIVE POINT [P])`,
            color: '#ffd43b',
            size: 19,
            crit: true,
            dtype: 'lightning'
          });
        }
      }
    }
  }

  // =========================================================================
  // MAP TIER SCALED LOOT & UTILITY FLASK DROPS
  // =========================================================================
  if (enemy.isBreachMob && Array.isArray(room.activeBreaches) && room.activeBreaches.length > 0) {
    const activeB = room.activeBreaches[0];
    activeB.kills = (activeB.kills || 0) + 1;
    activeB.duration = Math.min(activeB.maxDuration || 26, activeB.duration + 0.32);
    activeB.maxRadius = Math.min(560, (activeB.maxRadius || 480) + 2.5);
  }
  const breachMult = enemy.isBreachMob ? 0.25 : 1.0;
  const qtyMult = ((mapDef && mapDef.lootQuantity) || 100) / 100;
  const baseIlvl = (mapTier - 1) * 3 + Math.ceil((room.wave || 1) / 2);

  if (enemy.rarity === 'boss' || enemy.rarity === 'unique') {
    const bossOrbs = 1 + Math.floor(mapTier / 2);
    const bossGearCount = 1 + Math.floor(mapTier / 3);
    const bossIlvl = baseIlvl + 2;
    for (let i = 0; i < bossOrbs; i++) {
      spawnGroundDrop(room, enemy.x - 20 + i * 16, enemy.y, 'currency');
    }
    for (let i = 0; i < bossGearCount; i++) {
      const uniqueChance = 0.08 + (mapTier - 1) * 0.03;
      spawnGroundDrop(room, enemy.x + 20 + i * 18, enemy.y, 'gear', Math.random() < uniqueChance ? 'unique' : 'rare', bossIlvl);
    }
    // Map Bosses guarantee a Utility Flask drop if any player is missing one (or 35% chance otherwise)
    const anyMissingFlask = Array.from(room.players.values()).some(p => !p.dead && (p.unlockedFlasks || ['life']).length < 5);
    if (anyMissingFlask || Math.random() < 0.35) {
      spawnGroundDrop(room, enemy.x, enemy.y + 24, 'flask');
    }

    addRoomChat(room, 'Atlas', `${enemy.name} has been slain! Extraction Portal is open at (0, 0) — extract or fight endless waves!`, '#53f574');
    broadcastRoomEvent(room, {
      type: 'announcement',
      title: `${enemy.name} Vanquished!`,
      subtitle: 'Extraction Portal open at (0, 0) — extract to Hideout or survive endless waves!',
      color: '#53f574'
    });
    room.portalsOpen = true;
    return;
  }

  // Rare monsters have a chance to drop a Utility Flask!
  if (enemy.rarity === 'rare' && Math.random() < 0.14 * breachMult) {
    spawnGroundDrop(room, enemy.x, enemy.y - 16, 'flask');
  }

  // Drop rates scale directly with Map Tier Item Quantity (qtyMult = 1.0x in T1 up to 3.8x in T6):
  const gearChance = (enemy.rarity === 'rare' ? 0.018 : enemy.rarity === 'magic' ? 0.0012 : 0) * qtyMult * breachMult;
  const currencyChance = (enemy.rarity === 'rare' ? 0.028 : enemy.rarity === 'magic' ? 0.0032 : 0.0006) * qtyMult * breachMult;

  if (gearChance > 0 && Math.random() < gearChance) {
    const dropIlvl = baseIlvl + (enemy.rarity === 'rare' ? 1 : 0);
    spawnGroundDrop(room, enemy.x, enemy.y, 'gear', null, dropIlvl);
  } else if (Math.random() < currencyChance) {
    spawnGroundDrop(room, enemy.x, enemy.y, 'currency');
  }
}


function triggerSkillSetup(room, player, exec) {
  const active = exec.active;
  const isFiringLmb = !!(player.input && player.input.firing);
  // Auto-aim only acquires monsters within visible screen distance (330 units) so players never shoot off-screen into HUD corners!
  const nearest = findNearestEnemy(room, player.x, player.y, 330);

  // When holding LMB (Focus-Fire), aim directly along cursor; otherwise auto-aim at nearest visible enemy!
  let baseAngle = Math.atan2(player.aimY || -1, player.aimX || 0);
  if (!isFiringLmb && nearest) {
    baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  }

  if (active.behavior !== 'rf_aura') {
    player.atkSeq = (player.atkSeq || 0) + 1;
    player.lastAtkAngle = +baseAngle.toFixed(2);
  }

  // 1. Righteous Fire Aura
  if (active.behavior === 'rf_aura' || active.id === 'righteous_fire') {
    for (const m of room.enemies.values()) {
      const hitR = exec.radius + m.radius;
      if (Math.abs(player.x - m.x) > hitR || Math.abs(player.y - m.y) > hitR) continue;
      if (dist(player.x, player.y, m.x, m.y) <= hitR) {
        const { dmg, isCrit } = rollSkillDamage(exec);
        damageEnemy(room, m, dmg, isCrit, player, exec.lifeOnHit, 'fire');
      }
    }
    return;
  }

  // 2. Ice Nova (Large cold nova that chills/freezes enemies for 2.5s)
  if (active.behavior === 'ice_nova_ring' || active.id === 'ice_nova') {
    for (const m of room.enemies.values()) {
      const hitR = exec.radius + m.radius;
      if (Math.abs(player.x - m.x) > hitR || Math.abs(player.y - m.y) > hitR) continue;
      if (dist(player.x, player.y, m.x, m.y) <= hitR) {
        const { dmg, isCrit } = rollSkillDamage(exec);
        m.chillTimer = Math.max(m.chillTimer || 0, 2.5);
        damageEnemy(room, m, dmg, isCrit, player, exec.lifeOnHit, 'cold');
      }
    }
    room.fxEvents.push({
      kind: 'nova',
      sub: 'ice_nova',
      ownerId: player.id,
      x: Math.round(player.x),
      y: Math.round(player.y),
      r: exec.radius,
      color: '#74c0fc'
    });
    return;
  }

  // 3. Cyclone (360-degree spinning physical melee sweep around player)
  if (active.behavior === 'cyclone_spin' || active.id === 'cyclone') {
    const spinRadius = Math.max(85, exec.radius);
    for (const m of room.enemies.values()) {
      const hitR = spinRadius + m.radius;
      if (Math.abs(player.x - m.x) > hitR || Math.abs(player.y - m.y) > hitR) continue;
      if (dist(player.x, player.y, m.x, m.y) <= hitR) {
        const { dmg, isCrit } = rollSkillDamage(exec);
        damageEnemy(room, m, dmg, isCrit, player, exec.lifeOnHit, active.damageType || 'physical');
      }
    }
    room.fxEvents.push({
      kind: 'nova',
      sub: 'cyclone',
      ownerId: player.id,
      x: Math.round(player.x),
      y: Math.round(player.y),
      r: spinRadius,
      color: '#ffa94d'
    });
    return;
  }

  // 4. Blade Vortex (360-degree rapid physical blade pulse + orbiting slash fx)
  if (active.behavior === 'blade_vortex' || active.behavior === 'bv_aura' || active.id === 'blade_vortex') {
    const bvRadius = Math.max(92, exec.radius);
    for (const m of room.enemies.values()) {
      const hitR = bvRadius + m.radius;
      if (Math.abs(player.x - m.x) > hitR || Math.abs(player.y - m.y) > hitR) continue;
      if (dist(player.x, player.y, m.x, m.y) <= hitR) {
        const { dmg, isCrit } = rollSkillDamage(exec);
        damageEnemy(room, m, dmg, isCrit, player, exec.lifeOnHit, 'physical');
      }
    }
    room.fxEvents.push({
      kind: 'nova',
      sub: 'blade_vortex',
      ownerId: player.id,
      x: Math.round(player.x),
      y: Math.round(player.y),
      r: bvRadius,
      color: '#66d9e8'
    });
    return;
  }

  // 5. Arc (Chaining lightning bolt)
  if (active.behavior === 'arc_chain' || active.id === 'arc') {
    if (!nearest) return;
    const hitSet = new Set();
    let currTarget = nearest;
    let prevX = player.x;
    let prevY = player.y;
    const points = [[Math.round(prevX), Math.round(prevY)]];
    const totalChains = 1 + exec.chains;

    for (let c = 0; c < totalChains && currTarget; c++) {
      points.push([Math.round(currTarget.x), Math.round(currTarget.y)]);
      hitSet.add(currTarget.id);
      const { dmg, isCrit } = rollSkillDamage(exec);
      damageEnemy(room, currTarget, dmg, isCrit, player, exec.lifeOnHit, 'lightning');
      currTarget = findNearestEnemy(room, currTarget.x, currTarget.y, 280, hitSet);
    }

    room.fxEvents.push({
      kind: 'arc',
      points
    });
    return;
  }

  // 6. Molten Strike (Immediate melee hit + 3+ lobbed magma projectiles)
  if (active.behavior === 'molten_lob' || active.id === 'molten_strike') {
    const meleeRange = Math.max(78, exec.radius + 28);
    let hitAnyMelee = false;
    for (const m of Array.from(room.enemies.values())) {
      if (dist(player.x, player.y, m.x, m.y) <= meleeRange + m.radius) {
        const { dmg, isCrit } = rollSkillDamage(exec);
        damageEnemy(room, m, dmg, isCrit, player, exec.lifeOnHit, 'fire');
        hitAnyMelee = true;
      }
    }
    if (hitAnyMelee) {
      room.fxEvents.push({
        kind: 'nova',
        x: Math.round(player.x + Math.cos(baseAngle) * 28),
        y: Math.round(player.y + Math.sin(baseAngle) * 28),
        r: 44,
        color: '#ff6b4a'
      });
    }
  }

  const count = Math.max(1, exec.projCount);
  const spreadTotal = Math.min(Math.PI * 0.85, (count - 1) * 0.16);
  const behavior = active.id === 'lightning_arrow' ? 'lightning_arrow' : active.behavior;

  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : -spreadTotal / 2 + (spreadTotal / (count - 1)) * i;
    const ang = baseAngle + offset;
    const speed = active.projSpeed || 520;

    room.projectiles.push({
      id: uid('prj'),
      ownerId: player.id,
      skillId: active.id,
      behavior,
      damageType: active.damageType,
      x: player.x,
      y: player.y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      speed,
      radius: behavior === 'sunder_wave' ? exec.radius : 11,
      aoeRadius: exec.radius,
      chainsLeft: behavior === 'lightning_arrow' ? Math.max(2, exec.chains) : exec.chains,
      pierceLeft: behavior === 'lightning_arrow' ? Math.max(2, exec.pierceCount || 0) : (exec.pierceCount || 0),
      duration: active.duration || 0.85,
      maxDuration: active.duration || 0.85,
      exec,
      hitIds: new Set()
    });
  }
}

function triggerVaalSkill(room, player) {
  if (player.dead || (player.vaalSouls || 0) < 45) return false;
  player.vaalSouls = 0;

  const cls = GameData.CLASSES[player.classId] || GameData.CLASSES.Marauder;
  const vaalId = cls.vaalSkill || 'vaal_cyclone';
  const vaalDef = (GameData.VAAL_SKILLS && GameData.VAAL_SKILLS[vaalId]) || {
    id: vaalId,
    name: `Vaal ${cls.name} Cataclysm`,
    damageType: player.classId === 'Witch' ? 'lightning' : player.classId === 'Templar' ? 'fire' : 'physical',
    color: cls.glow || cls.color || '#ff6b4a'
  };

  const setups = GameData.getPlayerGemSetups(player.gemLinks);
  const baseExec = setups.length > 0
    ? buildSkillExecution(player, setups[0])
    : {
        active: { id: vaalId, damageType: vaalDef.damageType || 'physical' },
        dmgMin: 35,
        dmgMax: 60,
        critChance: 20,
        critMulti: 1.75,
        lifeOnHit: 5,
        radius: 90
      };

  const vaalExec = {
    ...baseExec,
    dmgMin: Math.round(baseExec.dmgMin * 3.5),
    dmgMax: Math.round(baseExec.dmgMax * 3.5),
    radius: 85
  };

  // 1. Emit 3 concentric shockwave novas
  const novaColor = vaalDef.color || cls.glow || '#ff6b4a';
  for (const r of [110, 185, 260]) {
    room.fxEvents.push({
      kind: 'nova',
      x: Math.round(player.x),
      y: Math.round(player.y),
      r,
      color: novaColor
    });
  }

  // 2. Damage & stun/freeze all enemies within 260 units for 3.5x skill damage
  for (const m of Array.from(room.enemies.values())) {
    if (dist(player.x, player.y, m.x, m.y) <= 260 + m.radius) {
      m.chillTimer = Math.max(m.chillTimer || 0, 3.0);
      m.actionTimer = Math.max(m.actionTimer || 0, 2.5);
      const { dmg, isCrit } = rollSkillDamage(vaalExec);
      damageEnemy(room, m, dmg, isCrit, player, vaalExec.lifeOnHit, vaalDef.damageType || 'physical');
    }
  }

  // 3. Spawn a massive screen-clearing ring of 16 projectiles
  const ringCount = 16;
  for (let i = 0; i < ringCount; i++) {
    const ang = (Math.PI * 2 * i) / ringCount;
    const speed = 560;
    room.projectiles.push({
      id: uid('prj'),
      ownerId: player.id,
      skillId: baseExec.active ? baseExec.active.id : 'fireball',
      behavior: 'fireball_explode',
      damageType: vaalDef.damageType || 'fire',
      x: player.x,
      y: player.y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      speed,
      radius: 14,
      aoeRadius: 65,
      chainsLeft: 1,
      pierceLeft: 1,
      duration: 1.05,
      maxDuration: 1.05,
      exec: vaalExec,
      hitIds: new Set()
    });
  }

  player.atkSeq = (player.atkSeq || 0) + 1;
  sendPrivateProfile(player);
  return true;
}


function getPlayerRfRadius(player) {
  const setups = GameData.getPlayerGemSetups(player.gemLinks);
  for (const s of setups) {
    if (s.active.id === 'righteous_fire') {
      const exec = buildSkillExecution(player, s);
      return exec.radius;
    }
  }
  if (player.stats && player.stats.kaomsFireBonus > 0) {
    return 115;
  }
  return 0;
}

function applyDamageToPlayer(room, player, rawDamage, dmgType, ignoreEvade = false) {
  if (player.dashTimer > 0 || (player.graceTimer || 0) > 0 || (player.hitGraceTimer || 0) > 0) return;
  const s = player.stats;

  // Naked Vulnerability Penalty: Fighting with 0 equipped gear pieces increases incoming damage by 35% and disables evasion!
  const isNaked = (s.equippedCount || 0) === 0;
  if (isNaked) {
    rawDamage = Math.round(rawDamage * 1.35);
  }

  // Lori's Lantern Unlucky Enemy Damage (-25% incoming damage when below 65% Life)
  if (s.lorisLucky > 0 && player.hp <= player.maxHp * 0.65) {
    rawDamage = Math.max(1, Math.round(rawDamage * 0.75));
  }
  // The Brass Dome Bulwark (-20% incoming damage from enemy hits & slams)
  if (s.brassDome > 0) {
    rawDamage = Math.max(1, Math.round(rawDamage * 0.8));
  }

  if (!ignoreEvade && !isNaked) {
    const evadeChance = Math.min(60, (s.dodgeChance || 0) + Math.floor(s.evasion / (s.evasion + 240) * 48));
    if (Math.random() * 100 < evadeChance) {
      room.fxEvents.push({
        kind: 'dmg_num',
        x: Math.round(player.x),
        y: Math.round(player.y - 20),
        val: 'EVADE',
        crit: false,
        dtype: 'evade'
      });
      return;
    }
  }

  // Grant 0.22s anti-shotgun hit grace window so identical-tick overlaps don't instakill, while surrounds remain lethal!
  player.hitGraceTimer = isNaked ? 0.14 : 0.22;

  // Reset PoE Energy Shield recharge delay whenever hit (unless Shavronne's Wrappings is equipped!)
  if (!s.shavronneWard) {
    player.esDelayTimer = s.esRechargeFast ? 1.0 : 2.2;
  } else if ((player.shavNovaCd || 0) <= 0) {
    player.shavNovaCd = 0.85;
    const novaDmg = Math.round((45 + (player.level || 1) * 12) * (1 + (s.spellDmgPct || 0) / 100));
    room.fxEvents.push({
      kind: 'nova',
      x: Math.round(player.x),
      y: Math.round(player.y),
      r: 115,
      color: '#74c0fc'
    });
    for (const m of Array.from(room.enemies.values())) {
      if (dist(player.x, player.y, m.x, m.y) <= 115 + m.radius) {
        damageEnemy(room, m, novaDmg, false, player, 0, 'lightning');
      }
    }
  }

  let mitigated = rawDamage;
  if (dmgType === 'physical') {
    const armorRed = Math.min(0.65, s.armor / (s.armor + rawDamage * 12));
    mitigated = Math.max(2, Math.round(rawDamage * (1 - armorRed)));
  } else {
    mitigated = Math.max(2, Math.round(rawDamage * (1 - (s.allRes || 0) / 100)));
  }

  if (player.es > 0) {
    const esAbsorb = Math.min(player.es, mitigated);
    player.es -= esAbsorb;
    mitigated -= esAbsorb;
  }
  player.hp -= mitigated;

  room.fxEvents.push({
    kind: 'dmg_num',
    x: Math.round(player.x),
    y: Math.round(player.y - 24),
    val: `-${rawDamage}`,
    crit: false,
    dtype: 'player_hit'
  });

  if (player.hp <= 0) {
    player.hp = 0;
    player.dead = true;
    player.reviveProgress = 0;
  }
}

const exportsObj = { buildSkillExecution, rollSkillDamage, findNearestEnemy, damageEnemy, onEnemyKilled, triggerSkillSetup, triggerVaalSkill, getPlayerRfRadius, applyDamageToPlayer };
Object.assign(global, exportsObj);
module.exports = exportsObj;
