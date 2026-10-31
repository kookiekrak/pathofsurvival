// Server Simulation Module: Per-Player Movement, Flask/Buff Ticks, Auto-Cast Skills & Ground Drop Pickups
const GameData = global.GameData || require('../../public/shared/gameData.js');

function updateRoomPlayers(room, dt, allPlayers, alivePlayers) {
  let livingCount = 0;

  for (const p of room.players.values()) {
    if (p.dashCooldown > 0) p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    if (p.esDelayTimer > 0) p.esDelayTimer = Math.max(0, p.esDelayTimer - dt);
    if (p.graceTimer > 0) p.graceTimer = Math.max(0, p.graceTimer - dt);
    if (p.hitGraceTimer > 0) p.hitGraceTimer = Math.max(0, p.hitGraceTimer - dt);
    if ((p.acuityCd || 0) > 0) p.acuityCd = Math.max(0, p.acuityCd - dt);
    if ((p.shavNovaCd || 0) > 0) p.shavNovaCd = Math.max(0, p.shavNovaCd - dt);
    if ((p.kaomsTickCd || 0) > 0) p.kaomsTickCd = Math.max(0, p.kaomsTickCd - dt);
    if ((p.mjolnerCd || 0) > 0) p.mjolnerCd = Math.max(0, p.mjolnerCd - dt);
    if ((p.cospriCd || 0) > 0) p.cospriCd = Math.max(0, p.cospriCd - dt);
    if ((p.cocCd || 0) > 0) p.cocCd = Math.max(0, p.cocCd - dt);
    if ((p.heraldThunderCd || 0) > 0) p.heraldThunderCd = Math.max(0, p.heraldThunderCd - dt);
    if ((p.abberathCd || 0) > 0) p.abberathCd = Math.max(0, p.abberathCd - dt);
    if ((p.meteorShrineCd || 0) > 0) p.meteorShrineCd = Math.max(0, p.meteorShrineCd - dt);
    if ((p.autoLifeFlaskCd || 0) > 0) p.autoLifeFlaskCd = Math.max(0, p.autoLifeFlaskCd - dt);
    if ((p.vaalLockTimer || 0) > 0) p.vaalLockTimer = Math.max(0, p.vaalLockTimer - dt);
    p.soulGainBudget = Math.min(10, (typeof p.soulGainBudget === 'number' ? p.soulGainBudget : 10) + 5.0 * dt);

    // Tick active utility flasks (both per-slot timers and legacy activeFlasks map) & shrine buffs
    let statBuffExpired = false;
    if (Array.isArray(p.flaskSlotTimers)) {
      for (let sIdx = 0; sIdx < 5; sIdx++) {
        if ((p.flaskSlotTimers[sIdx] || 0) > 0) {
          p.flaskSlotTimers[sIdx] = Math.max(0, p.flaskSlotTimers[sIdx] - dt);
          if (p.flaskSlotTimers[sIdx] === 0) statBuffExpired = true;
        }
      }
    }
    for (const k of ['quicksilver', 'granite', 'diamond', 'quartz', 'silver', 'amethyst']) {
      if ((p.activeFlasks[k] || 0) > 0) {
        p.activeFlasks[k] = Math.max(0, p.activeFlasks[k] - dt);
        if (p.activeFlasks[k] === 0) statBuffExpired = true;
      }
    }
    if (p.shrineBuffTimer > 0) {
      p.shrineBuffTimer = Math.max(0, p.shrineBuffTimer - dt);
      if (p.shrineBuffTimer === 0) {
        p.shrineBuffType = null;
        statBuffExpired = true;
      }
    }
    if (p.hhTimer > 0) {
      p.hhTimer -= dt;
      if (p.hhTimer <= 0) {
        p.hhStacks = 0;
        statBuffExpired = true;
      }
    }
    if (statBuffExpired) {
      recalcPlayer(p, false);
      sendPrivateProfile(p);
    }

    if (p.dead) {
      for (const ally of room.players.values()) {
        if (!ally.dead && dist(p.x, p.y, ally.x, ally.y) < 70) {
          p.reviveProgress += dt * 0.45;
          if (p.reviveProgress >= 1) {
            p.dead = false;
            p.reviveProgress = 0;
            p.hp = Math.round(p.maxHp * 0.55);
            p.es = p.maxEs;
          }
        }
      }
      continue;
    }

    livingCount++;
    if (Array.isArray(alivePlayers) && !alivePlayers.includes(p)) {
      alivePlayers.push(p);
    }

    // Regenerate Life (small passive regen), refill Life-on-Hit cap budget (max 24 HP/sec), & Energy Shield
    p.lohBudget = Math.min(6, (p.lohBudget || 0) + 24 * dt);
    const regenMult = (room.mapModStats && room.mapModStats.lessRegen)
      ? Math.max(0.1, 1 - room.mapModStats.lessRegen / 100)
      : 1;
    p.hp = Math.min(p.maxHp, p.hp + (p.stats.lifeRegen || 1.5) * regenMult * dt);
    if (p.maxEs > 0) {
      if (p.stats && p.stats.shavronneWard > 0) {
        p.es = Math.min(p.maxEs, p.es + p.maxEs * 0.12 * dt);
      } else if (p.esDelayTimer <= 0) {
        p.es = Math.min(p.maxEs, p.es + p.maxEs * 0.25 * dt);
      }
    }

    // Auto-Flask Triggering in Maps:
    // - Life Flasks trigger at < 82% HP OR when charges reach FULL (and injured or enemies nearby)!
    // - Utility Flasks trigger when charges reach FULL (<= 65% timer left) OR when buff is inactive (and enemies nearby or Quicksilver)!
    if (room.state === 'RUN' && (room.runTimer || 0) >= 1.0 && Array.isArray(p.flaskBelt)) {
      if (!Array.isArray(p.flaskSlotCharges) || p.flaskSlotCharges.length < 5) p.flaskSlotCharges = [15, 0, 0, 0, 0];
      if (!Array.isArray(p.flaskSlotTimers) || p.flaskSlotTimers.length < 5) p.flaskSlotTimers = [0, 0, 0, 0, 0];
      const hasNearbyEnemy = findNearestEnemy(room, p.x, p.y, 620) !== null || !!room.isRaidEncounter;
      let usedAnyFlask = false;
      let usedUtilityFlask = false;
      for (let sIdx = 0; sIdx < 5; sIdx++) {
        const fId = p.flaskBelt[sIdx];
        if (!fId) continue;
        const fDef = GameData.FLASKS.find(fl => fl.id === fId);
        if (!fDef) continue;
        const slotMeta = (Array.isArray(p.flaskBeltItems) && p.flaskBeltItems[sIdx]) || null;
        const maxCharges = (slotMeta && slotMeta.maxCharges) || fDef.maxCharges || 30;
        const useCost = (slotMeta && slotMeta.cost) || fDef.useCost || fDef.cost || 5;
        const dur = (slotMeta && slotMeta.duration) || fDef.duration || 5.0;
        const curCharges = p.flaskSlotCharges[sIdx] ?? p.flaskCharges[fId] ?? 0;
        if (curCharges < useCost) continue;
        const isFullCharges = curCharges >= maxCharges;

        if (fId === 'life') {
          if ((p.hp < p.maxHp * 0.82 || (isFullCharges && (p.hp < p.maxHp * 0.98 || hasNearbyEnemy))) && (p.autoLifeFlaskCd || 0) <= 0) {
            p.flaskSlotCharges[sIdx] = Math.max(0, curCharges - useCost);
            p.flaskCharges[fId] = p.flaskSlotCharges[sIdx];
            p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.45));
            p.autoLifeFlaskCd = 2.0;
            usedAnyFlask = true;
          }
        } else if (!(p.stats && p.stats.mageblood > 0)) {
          const buffInactive = (p.flaskSlotTimers[sIdx] || 0) <= 0 && (p.activeFlasks[fId] || 0) <= 0;
          if ((isFullCharges && (p.flaskSlotTimers[sIdx] || 0) <= dur * 0.65) || (buffInactive && (hasNearbyEnemy || fId === 'quicksilver'))) {
            p.flaskSlotCharges[sIdx] = Math.max(0, curCharges - useCost);
            p.flaskCharges[fId] = p.flaskSlotCharges[sIdx];
            p.flaskSlotTimers[sIdx] = dur;
            p.activeFlasks[fId] = dur;
            if (fId === 'quartz') {
              p.es = Math.min(p.maxEs, p.es + Math.round(p.maxEs * 0.4));
            } else if (fId === 'amethyst') {
              p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.2));
              p.es = Math.min(p.maxEs, p.es + Math.round(p.maxEs * 0.2));
            }
            usedUtilityFlask = true;
            usedAnyFlask = true;
          }
        }
      }
      if (usedUtilityFlask) recalcPlayer(p, false);
      if (usedAnyFlask) sendPrivateProfile(p);
    }

    // Kaom's Heart Molten Caldera Aura (Pulses Fire Damage equal to 18% of Max Life/sec to nearby enemies)
    if (p.stats && p.stats.kaomsFireBonus > 0 && (p.kaomsTickCd || 0) <= 0) {
      p.kaomsTickCd = 0.4;
      const burnDmg = Math.max(4, Math.round(p.maxHp * 0.18 * 0.4 * (1 + (p.stats.eleDmgPct || 0) / 100)));
      for (const m of Array.from(room.enemies.values())) {
        if (dist(p.x, p.y, m.x, m.y) <= 115 + m.radius) {
          damageEnemy(room, m, burnDmg, false, p, 0, 'fire');
        }
      }
    }

    // Herald of Thunder / Thunderstorm Shrine Auto-Lightning Bolt
    if (p.stats && p.stats.heraldThunder > 0 && (p.heraldThunderCd || 0) <= 0) {
      const target = findNearestEnemy(room, p.x, p.y, 310);
      if (target) {
        p.heraldThunderCd = p.shrineBuffType === 'thunderstorm' ? 0.45 : 0.75;
        const baseBolt = 18 + (p.level || 1) * 4 + (p.stats.flatDmg || 0) * 0.8;
        const boltDmg = Math.max(8, Math.round(baseBolt * (1 + ((p.stats.eleDmgPct || 0) + (p.stats.spellDmgPct || 0)) / 100)));
        if (room.fxEvents.length < 22) {
          room.fxEvents.push({ kind: 'chain', x1: Math.round(p.x), y1: Math.round(p.y - 28), x2: Math.round(target.x), y2: Math.round(target.y), color: '#74c0fc' });
          room.fxEvents.push({ kind: 'nova', x: Math.round(target.x), y: Math.round(target.y), r: 54, color: '#74c0fc' });
        }
        damageEnemy(room, target, boltDmg, false, p, 0, 'lightning');
      }
    }

    // Meteor Shrine Auto-Fireball Cataclysm
    if (p.shrineBuffTimer > 0 && p.shrineBuffType === 'meteor' && (p.meteorShrineCd || 0) <= 0) {
      const target = findNearestEnemy(room, p.x, p.y, 340);
      if (target) {
        p.meteorShrineCd = 0.7;
        const metDmg = Math.max(18, Math.round((32 + (p.level || 1) * 6 + (p.stats.flatDmg || 0)) * (1 + (p.stats.eleDmgPct || 0) / 100)));
        if (room.fxEvents.length < 22) {
          room.fxEvents.push({ kind: 'nova', x: Math.round(target.x), y: Math.round(target.y), r: 95, color: '#ff6b4a' });
        }
        let hits = 0;
        for (const m of Array.from(room.enemies.values())) {
          if (dist(target.x, target.y, m.x, m.y) <= 95 + m.radius) {
            damageEnemy(room, m, metDmg, true, p, 0, 'fire');
            if (++hits >= 8) break;
          }
        }
      }
    }

    // Movement / Flame Dash
    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      p.x += p.dashDirX * 840 * dt;
      p.y += p.dashDirY * 840 * dt;
    } else {
      let ix = (p.input.right ? 1 : 0) - (p.input.left ? 1 : 0);
      let iy = (p.input.down ? 1 : 0) - (p.input.up ? 1 : 0);
      const len = Math.hypot(ix, iy);
      if (len > 0) {
        ix /= len;
        iy /= len;
        p.targetDropId = null; // Manual WASD cancels walk-to-loot / walk-to-chest
        p.targetChestId = null;
      } else if (p.targetChestId && Array.isArray(room.upgradeChests)) {
        const tChest = room.upgradeChests.find(c => c.id === p.targetChestId && !c.opened);
        if (tChest) {
          const d = dist(p.x, p.y, tChest.x, tChest.y);
          if (d <= 105) {
            p.targetChestId = null;
            tryBuyUpgradeChest(room, p, tChest.id);
          } else {
            ix = (tChest.x - p.x) / d;
            iy = (tChest.y - p.y) / d;
          }
        } else {
          p.targetChestId = null;
        }
      } else if (p.targetDropId) {
        // Walk toward clicked ground gear item if not within pickup range yet
        const tDrop = room.groundDrops.find(d => d.id === p.targetDropId);
        if (tDrop) {
          const d = dist(p.x, p.y, tDrop.x, tDrop.y);
          if (d > 75) {
            ix = (tDrop.x - p.x) / d;
            iy = (tDrop.y - p.y) / d;
          }
        } else {
          p.targetDropId = null;
        }
      }

      const moveSpd = p.stats.finalMoveSpeed || 215;
      p.vx = ix * moveSpd;
      p.vy = iy * moveSpd;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    const raidBound = (typeof RAID_ARENA_HALF === 'number' ? RAID_ARENA_HALF : 560) - 30;
    const bound = room.state === 'HIDEOUT' ? HIDEOUT_HALF - 24 : room.isRaidEncounter ? raidBound : ARENA_HALF - 32;
    p.x = Math.max(-bound, Math.min(bound, p.x));
    p.y = Math.max(-bound, Math.min(bound, p.y));

    // Abberath's Fury Hooves (Fiery footsteps while moving)
    if (p.stats && p.stats.abberathSteps > 0 && Math.hypot(p.vx || 0, p.vy || 0) > 25 && (p.abberathCd || 0) <= 0) {
      p.abberathCd = 0.45;
      const stompDmg = Math.max(6, Math.round((14 + (p.level || 1) * 3 + (p.stats.flatDmg || 0) * 0.6) * (1 + ((p.stats.eleDmgPct || 0) + (p.stats.aoeDmgPct || 0)) / 100)));
      if (room.fxEvents.length < 22) {
        room.fxEvents.push({ kind: 'nova', x: Math.round(p.x), y: Math.round(p.y), r: 72, color: '#ff922b' });
      }
      let hits = 0;
      for (const m of Array.from(room.enemies.values())) {
        if (dist(p.x, p.y, m.x, m.y) <= 72 + m.radius) {
          damageEnemy(room, m, stompDmg, false, p, 0, 'fire');
          if (++hits >= 6) break;
        }
      }
    }

    // Loot Pickup Rules:
    // - Currency Orbs auto-pickup when walking closely over them (52 units), or when clicked.
    // - GEAR & FLASKS NEVER AUTO-PICKUP! They are ONLY picked up when explicitly clicked (`p.targetDropId === drop.id`).
    for (let i = room.groundDrops.length - 1; i >= 0; i--) {
      const drop = room.groundDrops[i];
      const d = dist(p.x, p.y, drop.x, drop.y);
      if (drop.dropType === 'currency' && d <= 52) {
        p.currencies[drop.currencyId] = (p.currencies[drop.currencyId] || 0) + 1;
        room.groundDrops.splice(i, 1);
        sendPrivateProfile(p);
      } else if (drop.dropType === 'flask' && p.targetDropId === drop.id && d <= 125) {
        p.targetDropId = null;
        if (pickupGroundFlask(room, p, drop)) room.groundDrops.splice(i, 1);
      } else if (drop.dropType === 'gear' && p.targetDropId === drop.id && d <= 125) {
        p.targetDropId = null;
        if (p.inventory.length < 50) {
          p.inventory.push(drop.item);
          room.groundDrops.splice(i, 1);
          sendPrivateProfile(p);
        }
      }
    }

    // Trigger Automated Linked Skills from the player's Gem Link Board (or manual LMB Focus-Fire)!
    const setups = GameData.getPlayerGemSetups(p.gemLinks);
    const hasVisibleEnemy = findNearestEnemy(room, p.x, p.y, 330) !== null;
    const canFire = hasVisibleEnemy || !!(p.input && p.input.firing);
    for (let idx = 0; idx < setups.length; idx++) {
      const setup = setups[idx];
      const key = `slot_${setup.slotIndex}_${setup.active.id}`;
      const exec = buildSkillExecution(p, setup);
      p.skillTimers[key] = (p.skillTimers[key] || 0) - dt;
      if (p.skillTimers[key] <= 0 && canFire) {
        p.skillTimers[key] = exec.cooldown;
        triggerSkillSetup(room, p, exec);
        if (exec.repeatCount > 0) {
          triggerSkillSetup(room, p, exec);
        }
      }
    }
  }

  return livingCount;
}

const exportsObj = { updateRoomPlayers };
Object.assign(global, exportsObj);
module.exports = exportsObj;
