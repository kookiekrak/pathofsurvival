// Shared GameData Module: Player Stats & Gem Setup Calculator
(function (exports) {
  const { CLASSES, SKILL_GEMS, RUN_UPGRADES, GEAR_SLOTS, STAT_LABELS, PASSIVE_NODES } = exports;

  // ============================================================================
  // 7. SHARED STAT & GEM LINK COMPUTATION HELPERS
  // ============================================================================
  function computePlayerStats(player) {
    const cls = CLASSES[player.classId] || CLASSES.Marauder;
    const base = cls.baseStats;

    const charLv = Math.max(1, Math.min(100, player.level || 1));
    const s = {
      str: base.str + (charLv - 1),
      dex: base.dex + (charLv - 1),
      int: base.int + (charLv - 1),
      flatDmg: Math.floor((charLv - 1) * 0.4),
      maxLife: base.maxLife + (charLv - 1) * 8,
      maxEs: base.maxEs || 0,
      armor: base.armor || 0,
      evasion: base.evasion || 0,
      moveSpeed: base.moveSpeed || 186,
      moveSpeedPct: 0,
      critChance: base.critChance || 5,
      critChanceInc: 0,
      critMulti: base.critMulti || 150,
      physDmgPct: 0,
      eleDmgPct: 0,
      spellDmgPct: 0,
      projDmgPct: 0,
      aoeDmgPct: 0,
      areaPct: 0,
      cdrPct: 0,
      allRes: 0,
      lifeRegen: base.lifeRegen !== undefined ? base.lifeRegen : 1.5,
      lifeOnHit: base.lifeOnHit || 0,
      lifeOnKill: 0,
      extraProj: 0,
      extraChain: 0,
      dodgeChance: 0,
      resoluteTechnique: 0,
      globalDmgMulti: 0,
      maxLifePct: 0,
      noEs: 0,
      noLifeRegen: 0,
      halfArmor: 0,
      esMoreMulti: 0,
      esRechargeFast: 0,
      eleMoreMulti: 0,
      headhunter: 0,
      mageblood: 0,
      allGemLevels: 0,
      supportLevelBonus: 0,
      starforgeShock: 0,
      voidBattery: 0,
      windripperCull: 0,
      kaomsFireBonus: 0,
      shavronneWard: 0,
      atziriInstantLeech: 0,
      crownOfEyes: 0,
      sevenLeagueDash: 0,
      lorisLucky: 0,
      mjolnerProc: 0,
      cospriProc: 0,
      arakaaliVenom: 0,
      inpulsaExplode: 0,
      brassDome: 0,
      brotherhoodChill: 0,
      vaalSoulGainPct: 0,
      flaskChargeGainPct: 0,
      cullingStrike: 0,
      goldGainPct: 0,
      startingGold: 0,
      ironReflexes: 0,
      armorMoreMulti: 0,
      heraldAsh: 0,
      heraldIce: 0,
      heraldThunder: 0,
      mirageEcho: 0,
      castOnCrit: 0,
      abberathSteps: 0,
      profaneBloom: 0,
      unarmedPenalty: 0,
      equippedCount: 0
    };

    // Apply Passive Tree Nodes
    const allocated = player.passives || [cls.startNode];
    for (const nodeId of allocated) {
      const node = PASSIVE_NODES[nodeId];
      if (!node || !node.stats) continue;
      for (const [k, v] of Object.entries(node.stats)) {
        if (k === 'critChance') s.critChanceInc += v;
        else if (s[k] !== undefined) s[k] += v;
      }
    }

    // Apply Equipped Gear Implicits & Affixes
    const gear = player.equipment || {};
    s.unarmedPenalty = gear.weapon ? 0 : 1;
    for (const slot of GEAR_SLOTS) {
      const item = gear[slot];
      if (!item) continue;
      s.equippedCount++;
      const ilvl = Math.max(1, item.ilvl || item.itemLevel || 1);
      if (slot === 'weapon' && (!item.implicits || !item.implicits.flatDmg)) {
        s.flatDmg += Math.round(15 * (1 + Math.max(0, ilvl - 1) * 0.055));
      }
      if (item.implicits) {
        for (const [k, v] of Object.entries(item.implicits)) {
          if (k === 'critChance') s.critChanceInc += v;
          else if (s[k] !== undefined) s[k] += v;
        }
      }
      if (item.affixes) {
        for (const afx of item.affixes) {
          if (afx.stat === 'critChance') s.critChanceInc += afx.val;
          else if (s[afx.stat] !== undefined) s[afx.stat] += afx.val;
        }
      }
    }

    // Apply Rogue-Lite In-Run Boons (player.runUpgrades as Array or Map)
    s.pierceCount = 0;
    const applyBoonStat = (k, v) => {
      if (k === 'maxHp' || k === 'maxLife') s.maxLife += v;
      else if (k === 'aoePct' || k === 'areaPct') s.areaPct += v;
      else if (k === 'critChancePct') s.critChance += v;
      else if (k === 'critChance') s.critChanceInc += v;
      else if (k === 'critMultiPct' || k === 'critMulti') s.critMulti += v;
      else if (k === 'chainCount' || k === 'extraChain') s.extraChain += v;
      else if (k === 'pierceCount') s.pierceCount += v;
      else if (s[k] !== undefined) s[k] += v;
    };
    if (player.runUpgrades) {
      if (Array.isArray(player.runUpgrades)) {
        for (const entry of player.runUpgrades) {
          const upId = typeof entry === 'string' ? entry : entry && entry.id;
          const stacks = (typeof entry === 'object' && entry && (entry.stacks || entry.count || entry.level)) || 1;
          const boon = RUN_UPGRADES[upId];
          if (boon && boon.stats) {
            for (const [k, v] of Object.entries(boon.stats)) {
              applyBoonStat(k, v * stacks);
            }
          }
        }
      } else if (typeof player.runUpgrades === 'object') {
        for (const [upId, stacks] of Object.entries(player.runUpgrades)) {
          const boon = RUN_UPGRADES[upId];
          if (boon && boon.stats && stacks > 0) {
            for (const [k, v] of Object.entries(boon.stats)) {
              applyBoonStat(k, v * stacks);
            }
          }
        }
      }
    }

    // PoE 1 Attribute Bonuses
    s.maxLife += Math.floor(s.str * 0.5);
    s.physDmgPct += Math.floor(s.str * 0.2);
    s.evasion = Math.floor(s.evasion * (1 + s.dex * 0.002));
    s.maxEs = Math.floor((s.maxEs + Math.floor(s.int * 0.35)) * (1 + s.int * 0.002));
    s.spellDmgPct += Math.floor(s.int * 0.2);

    // Unique Item Build-Defining Passives
    if (s.voidBattery > 0) {
      s.critChance += 18;
      s.critMulti += 35;
      s.spellDmgPct += 65;
    }
    if (s.crownOfEyes > 0) {
      s.physDmgPct += Math.round(s.spellDmgPct * 1.5);
    }
    if (s.lorisLucky > 0 && player.hp && player.maxHp && player.hp <= player.maxHp * 0.65) {
      s.moveSpeedPct += 20;
    }

    // Active Flask Buffs
    const buffs = player.activeFlasks || {};
    const belt = Array.isArray(player.flaskBelt) ? player.flaskBelt : [];
    const slotTimers = Array.isArray(player.flaskSlotTimers) ? player.flaskSlotTimers : [];
    const hasMageblood = s.mageblood > 0;
    const flaskEff = hasMageblood ? 1.25 : 1.0;

    const activeSet = new Set();
    for (const [k, t] of Object.entries(buffs)) {
      if (t > 0 && k !== 'life') activeSet.add(k);
    }
    for (let i = 0; i < belt.length; i++) {
      const fId = belt[i];
      if (!fId || fId === 'life') continue;
      if (hasMageblood || (slotTimers[i] || 0) > 0) {
        activeSet.add(fId);
      }
    }
    if (hasMageblood && activeSet.size === 0) {
      activeSet.add('quicksilver');
      activeSet.add('granite');
      activeSet.add('diamond');
      activeSet.add('quartz');
    }

    if (activeSet.has('quicksilver')) s.moveSpeedPct += Math.round(40 * flaskEff);
    if (activeSet.has('granite')) s.armor += Math.round(160 * flaskEff);
    if (activeSet.has('diamond')) {
      s.critChanceInc += Math.round(80 * flaskEff);
      s.critMulti += Math.round(40 * flaskEff);
    }
    if (activeSet.has('quartz')) s.dodgeChance += Math.round(20 * flaskEff);
    if (activeSet.has('silver')) {
      s.cdrPct += Math.round(22 * flaskEff);
      s.moveSpeedPct += Math.round(20 * flaskEff);
    }
    if (activeSet.has('amethyst')) {
      s.allRes += Math.round(25 * flaskEff);
    }

    // Active Shrine Buff
    if (player.shrineBuffTimer > 0 && player.shrineBuffType) {
      if (player.shrineBuffType === 'acceleration') {
        s.moveSpeedPct += 42;
        s.cdrPct += 32;
      } else if (player.shrineBuffType === 'diamond') {
        s.critChanceInc += 400;
        s.critMulti += 65;
      } else if (player.shrineBuffType === 'brutal') {
        s.globalDmgMulti += 45;
        s.areaPct += 35;
      } else if (player.shrineBuffType === 'echoing') {
        s.mirageEcho += 1;
        s.cdrPct += 35;
        s.moveSpeedPct += 18;
      } else if (player.shrineBuffType === 'thunderstorm') {
        s.heraldThunder += 2;
        s.eleDmgPct += 35;
      } else if (player.shrineBuffType === 'meteor') {
        s.heraldAsh += 2;
        s.aoeDmgPct += 35;
        s.areaPct += 25;
      }
    }

    // Keystone multipliers & trade-offs
    if (s.maxLifePct !== 0) {
      s.maxLife = Math.max(1, Math.floor(s.maxLife * (1 + s.maxLifePct / 100)));
    }
    if (s.noEs) {
      s.maxEs = 0;
    } else if (s.esMoreMulti !== 0) {
      s.maxEs = Math.max(0, Math.floor(s.maxEs * (1 + s.esMoreMulti / 100)));
    }
    if (s.noLifeRegen) {
      s.lifeRegen = 0;
    }
    if (s.ironReflexes) {
      s.armor += s.evasion;
      s.evasion = 0;
    }
    if (s.armorMoreMulti !== 0) {
      s.armor = Math.max(0, Math.floor(s.armor * (1 + s.armorMoreMulti / 100)));
    }
    if (s.halfArmor) {
      s.armor = Math.floor(s.armor * 0.5);
    }

    // Headhunter stacks (Up to 8 Stacks)
    const hhStacks = player.hhStacks || 0;
    if (hhStacks > 0) {
      s.moveSpeedPct += Math.min(32, hhStacks * 4);
      s.cdrPct += Math.min(32, hhStacks * 4);
      s.areaPct += Math.min(32, hhStacks * 4);
      s.globalDmgMulti += Math.min(32, hhStacks * 4);
      s.maxLife += hhStacks * 20;
      if (!s.noEs) s.maxEs += hhStacks * 20;
    }

    s.extraProj = Math.min(2, s.extraProj || 0);
    s.extraChain = Math.min(2, s.extraChain || 0);
    s.finalMoveSpeed = Math.round(s.moveSpeed * (1 + s.moveSpeedPct / 100));
    s.finalCritChance = s.resoluteTechnique ? 0 : Math.min(95, +(s.critChance * (1 + s.critChanceInc / 100)).toFixed(1));
    s.allRes = Math.min(78, s.allRes);
    s.maxHp = s.maxLife;
    s.aoePct = s.areaPct;
    s.chainCount = s.extraChain;

    return s;
  }

  function sumItemStats(item) {
    const totals = {};
    if (!item) return totals;
    const ilvl = Math.max(1, item.ilvl || item.itemLevel || 1);
    if (item.slot === 'weapon' && (!item.implicits || !item.implicits.flatDmg)) {
      totals.flatDmg = Math.round(15 * (1 + Math.max(0, ilvl - 1) * 0.055));
    }
    if (item.implicits) {
      for (const [k, v] of Object.entries(item.implicits)) {
        totals[k] = (totals[k] || 0) + v;
      }
    }
    if (item.affixes) {
      for (const afx of item.affixes) {
        totals[afx.stat] = (totals[afx.stat] || 0) + afx.val;
      }
    }
    return totals;
  }

  function compareGearItems(candidateItem, equippedItem) {
    const candStats = sumItemStats(candidateItem);
    const eqStats = sumItemStats(equippedItem);
    const allKeys = new Set([...Object.keys(candStats), ...Object.keys(eqStats)]);
    const deltas = [];

    for (const stat of allKeys) {
      const cVal = candStats[stat] || 0;
      const eVal = eqStats[stat] || 0;
      const diff = cVal - eVal;
      if (diff !== 0) {
        const label = STAT_LABELS[stat] || stat;
        deltas.push({
          stat,
          diff,
          label,
          formatted: `${diff > 0 ? '+' : ''}${diff} ${label}`
        });
      }
    }
    deltas.sort((a, b) => b.diff - a.diff);
    return deltas;
  }

  function canSupportSkill(activeDef, supDef) {
    if (!activeDef || !supDef || activeDef.type !== 'active' || supDef.type !== 'support') return false;
    const actTags = activeDef.tags || [];
    const req = supDef.requireTags || [];
    const exc = supDef.excludeTags || [];
    for (const exTag of exc) {
      if (actTags.includes(exTag)) return false;
    }
    if (req.length > 0) {
      const hasAny = req.some(t => actTags.includes(t));
      if (!hasAny) return false;
    }
    return true;
  }

  function getPlayerGemSetups(gemLinks) {
    const setups = [];
    if (!gemLinks || !Array.isArray(gemLinks)) return setups;

    for (let i = 0; i < gemLinks.length; i++) {
      const slotObj = gemLinks[i];
      if (!slotObj || !slotObj.activeGem) continue;
      const activeDef = SKILL_GEMS[slotObj.activeGem.id];
      if (!activeDef) continue;

      const supports = [];
      const seen = new Set();
      const maxLinks = slotObj.maxSupports || 2;
      for (let sIdx = 0; sIdx < maxLinks; sIdx++) {
        const supEntry = (slotObj.supports || [])[sIdx];
        if (!supEntry || !supEntry.id || seen.has(supEntry.id)) continue;
        const supDef = SKILL_GEMS[supEntry.id];
        if (supDef && supDef.type === 'support' && canSupportSkill(activeDef, supDef)) {
          seen.add(supEntry.id);
          supports.push({
            ...supDef,
            level: supEntry.level || 1
          });
        }
      }

      setups.push({
        slotIndex: i,
        active: activeDef,
        activeLevel: slotObj.activeGem.level || 1,
        supports,
        maxSupports: maxLinks,
        linkCount: 1 + supports.length
      });
    }
    return setups;
  }

  Object.assign(exports, { computePlayerStats, sumItemStats, compareGearItems, canSupportSkill, getPlayerGemSetups });
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : (global.GameData = global.GameData || exports));
