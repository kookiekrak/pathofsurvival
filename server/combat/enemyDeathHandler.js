// Server Combat Module: Enemy Death Rewards, XP/Run-Leveling, Flask Refills & Loot Table Rolls
const GameData = global.GameData || require('../../public/shared/gameData.js');

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

  // Volatile Magma Bearer & Archnemesis Magma Barrier On-Death Explosion Hazard
  if (enemy.typeId === 'volatile_imp' || (Array.isArray(enemy.mods) && enemy.mods.includes('Magma Barrier'))) {
    if (room.hazards.length <= 5) {
      spawnGroundHazard(room, enemy.x, enemy.y, 68, 1.35, Math.round((enemy.damage || 30) * 1.45), 'Volatile Flameblood');
    }
  }
  if ((room.deliriumTimer || 0) > 0 && !enemy.isRaidPylon) {
    room.deliriumKills = (room.deliriumKills || 0) + (enemy.rarity === 'rare' ? 4 : enemy.rarity === 'magic' ? 2 : 1);
    const newTier = Math.min(8, 1 + Math.floor(room.deliriumKills / 10));
    if (newTier > (room.deliriumTier || 1)) {
      room.deliriumTier = newTier;
      addRoomChat(room, 'Delirium', `Delirium Reward Tier ${newTier} reached! (+${newTier * 60}% Item & Currency Rarity)`, '#dee2e6');
      broadcastRoomEvent(room, {
        type: 'announcement',
        title: `DELIRIUM REWARD TIER ${newTier}! (+${newTier * 60}% Item & Currency Rarity)`,
        subtitle: `Delirium Simulacrum intensity increased — slain foes drop higher-tier Orbs & Gear!`,
        color: '#dee2e6'
      });
    }
  }

  // Advance Kill-Driven Wave Progress (10 Waves)
  if (room.state === 'RUN' && !room.isRaidEncounter && !enemy.isRaidPylon) {
    const waveGain = enemy.rarity === 'boss' ? 100 : enemy.rarity === 'rare' ? 8.5 : enemy.rarity === 'magic' ? 3.0 : 1.1;
    room.waveProgress = Math.min(100, (room.waveProgress || 0) + waveGain);
  }

  // Grant Persistent Character XP, Un-inflated In-Run Rogue-Lite XP, Scaled-Down Gold, Flask Charges & Vaal Souls
  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];
  const mapTier = room.activeRaidDef ? room.activeRaidDef.tier : (mapDef ? mapDef.tier : 1);
  const tierGoldMult = 1 + Math.pow(Math.max(0, mapTier - 1), 0.6) * 0.18;
  const baseGoldGain = (enemy.rarity === 'boss' || enemy.rarity === 'unique')
    ? 16 + Math.round(mapTier * 1.5)
    : enemy.typeId === 'gilded_goblin'
      ? 28 + mapTier * 2
      : enemy.rarity === 'rare'
        ? 3 + Math.floor(mapTier * 0.4)
        : enemy.rarity === 'magic'
          ? 1 + (mapTier >= 8 ? 1 : 0)
          : (Math.random() < 0.25 ? 1 : 0);
  const goldGain = baseGoldGain > 0 ? Math.max(1, Math.round(baseGoldGain * tierGoldMult)) : 0;

  // Un-inflated In-Run Rogue-lite XP (tier-independent so entering higher-tier maps NEVER grants 10 levels instantly!)
  const baseRunXpGain = (enemy.rarity === 'boss' || enemy.rarity === 'unique')
    ? 190
    : enemy.rarity === 'rare'
      ? 42
      : enemy.rarity === 'magic'
        ? 18
        : 9;

  // Balanced Vaal Soul Gain: Respects 8s Soul Gain Prevention (vaalLockTimer), Vaal Kill Exclusion, and Density Budget Cap!
  const rawSoulGain = enemy.rarity === 'boss' ? 10 : enemy.rarity === 'rare' ? 4 : enemy.rarity === 'magic' ? 2 : (Math.random() < 0.65 ? 1 : 0);
  for (const p of room.players.values()) {
    if (!p.dead) {
      p.bestTier = Math.max(p.bestTier || (p.currencies && p.currencies._bestTier) || 1, mapTier);
      if (p.currencies) p.currencies._bestTier = p.bestTier;
      const pGoldGain = goldGain > 0 ? Math.max(1, Math.round(goldGain * (1 + ((p.stats && p.stats.goldGainPct) || 0) / 100))) : 0;
      p.runGold = (p.runGold || 0) + pGoldGain;
      p.earnedRunGold = (p.earnedRunGold || 0) + pGoldGain;
      p.nextChestCost = getNextChestCost(p, room);

      if (!enemy.killedByVaal && (p.vaalLockTimer || 0) <= 0 && rawSoulGain > 0) {
        const budget = typeof p.soulGainBudget === 'number' ? p.soulGainBudget : 10;
        if (budget > 0) {
          const pSoulGain = Math.min(budget, Math.max(1, Math.round(rawSoulGain * (1 + ((p.stats && p.stats.vaalSoulGainPct) || 0) / 100))));
          p.soulGainBudget = Math.max(0, budget - pSoulGain);
          p.vaalSouls = Math.min(60, (p.vaalSouls || 0) + pSoulGain);
        }
      }

      const baseCharge = enemy.rarity === 'boss' ? 8 : enemy.rarity === 'rare' ? 3 : enemy.rarity === 'magic' ? 1 : (Math.random() < 0.35 ? 1 : 0);
      const chargeGain = Math.round(baseCharge * (1 + ((p.stats && p.stats.flaskChargeGainPct) || 0) / 100));
      if (chargeGain > 0) {
        if (Array.isArray(p.flaskBelt)) {
          for (let sIdx = 0; sIdx < 5; sIdx++) {
            const fId = p.flaskBelt[sIdx];
            if (!fId) continue;
            const fDef = GameData.FLASKS.find(fl => fl.id === fId);
            if (fDef) {
              const slotMeta = (Array.isArray(p.flaskBeltItems) && p.flaskBeltItems[sIdx]) || null;
              const maxChg = (slotMeta && slotMeta.maxCharges) || fDef.maxCharges;
              p.flaskSlotCharges[sIdx] = Math.min(maxChg, (p.flaskSlotCharges[sIdx] || 0) + chargeGain);
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
        const bossStashBounty = Math.round((14 + mapTier * 2.5) * tierGoldMult);
        p.gold = (p.gold || 0) + bossStashBounty;
        p.bossKills = (p.bossKills || (p.currencies && p.currencies._bossKills) || 0) + 1;
        if (p.currencies) p.currencies._bossKills = p.bossKills;
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

      // 2. Persistent Character Leveling (Saved across maps in SQLite, Lv 1-100, grants +1 Permanent Skill Tree Point up to 45)
      if ((p.level || 1) < 100) {
        p.xp = (p.xp || 0) + (enemy.xp || 0);
        p.xpNext = p.xpNext || getCharXpForLevel(p.level || 1);
        if (p.xp >= p.xpNext) {
          p.xp -= p.xpNext;
          p.level = Math.min(100, (p.level || 1) + 1);
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
        }
      }
    }
  }

  // =========================================================================
  // POE 2 RARITY-ONLY SCALED LOOT & CURRENCY DROPS (ZERO QUANTITY SCALING!)
  // =========================================================================
  if (enemy.isBreachMob && Array.isArray(room.activeBreaches) && room.activeBreaches.length > 0) {
    const activeB = room.activeBreaches[0];
    activeB.kills = (activeB.kills || 0) + 1;
  }
  const breachMult = enemy.isBreachMob ? 0.25 : 1.0;
  const mapIIR = ((mapDef && mapDef.lootRarityBonus) || 0) + ((room.mapModStats && room.mapModStats.rarity) || 0) + ((room.deliriumTier || 0) * 60);
  const mobIIR = enemy.rarityBonusPct || (Array.isArray(enemy.mods) ? enemy.mods.length * 90 : 0);
  const totalRarityBonus = mapIIR + mobIIR;
  const iirMult = 1 + totalRarityBonus / 100;
  const baseIlvl = (mapTier - 1) * 3 + Math.ceil((room.wave || 1) / 2);

  if (enemy.rarity === 'boss' || enemy.rarity === 'unique') {
    const bossIlvl = baseIlvl + 2;
    const bossIIR = totalRarityBonus + (enemy.isPinnacleRaid ? 320 : 180);
    // Bosses drop 1 guaranteed high-rarity PoE 2 Currency Orb & 1 guaranteed high-rarity item (50% chance for a 2nd on Raid Boss)
    spawnCurrencyDrop(room, enemy.x - 18, enemy.y, null, bossIIR);
    const bossGearCount = (enemy.isPinnacleRaid && Math.random() < 0.5) ? 2 : 1;
    for (let i = 0; i < bossGearCount; i++) {
      const uniqueChance = Math.min(0.18, (0.018 + (mapTier - 1) * 0.002) * Math.sqrt(iirMult));
      spawnGroundDrop(room, enemy.x + 18 + i * 20, enemy.y, 'gear', Math.random() < uniqueChance ? 'unique' : 'rare', bossIlvl, bossIIR);
    }
    if (Math.random() < 0.05) {
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

  if (enemy.isRaidPylon) return;
  if (enemy.typeId === 'gilded_goblin') {
    spawnCurrencyDrop(room, enemy.x - 16, enemy.y, null, totalRarityBonus + 220);
    spawnGroundDrop(room, enemy.x + 16, enemy.y, 'gear', Math.random() < 0.025 ? 'unique' : 'rare', baseIlvl + 2, totalRarityBonus + 220);
    addRoomChat(room, 'Perandus', `🪙 ${killer ? killer.name : 'The party'} slayed the Perandus Treasure Hoarder — Jackpot Loot Drop!`, '#fcc419');
    return;
  }

  // Rare monsters have a low chance (0.3%) to drop a Flask
  if (enemy.rarity === 'rare' && Math.random() < 0.003 * breachMult) {
    spawnGroundDrop(room, enemy.x, enemy.y - 16, 'flask');
  }

  // Fixed low drop frequencies (do NOT scale with lootQuantity — only item/currency tier scales with totalRarityBonus!)
  const modCount = Array.isArray(enemy.mods) ? enemy.mods.length : 0;
  const gearChance = (enemy.rarity === 'rare'
    ? Math.min(0.45, 0.12 + modCount * 0.05)
    : enemy.rarity === 'magic'
      ? 0.022
      : 0.0035) * breachMult;

  const currencyChance = (enemy.rarity === 'rare'
    ? (0.18 + modCount * 0.05)
    : enemy.rarity === 'magic'
      ? 0.035
      : 0.008) * breachMult;

  if (Math.random() < gearChance) {
    const dropIlvl = baseIlvl + (enemy.rarity === 'rare' ? 1 : 0);
    spawnGroundDrop(room, enemy.x, enemy.y, 'gear', null, dropIlvl, totalRarityBonus);
  }
  if (Math.random() < currencyChance) {
    spawnCurrencyDrop(room, enemy.x + randInt(-14, 14), enemy.y + randInt(-14, 14), null, totalRarityBonus);
  }
}

const exportsObj = { onEnemyKilled };
Object.assign(global, exportsObj);
module.exports = exportsObj;
