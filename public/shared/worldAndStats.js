// Shared GameData Module
(function (exports) {
  const G = typeof window !== "undefined" && window.GameData ? window.GameData : Object.assign({}, require("./classesAndSkills.js"), require("./itemsAndCrafting.js"), require("./passiveTreeData.js"));
  const { CLASSES, SKILL_GEMS, RUN_UPGRADES, GEAR_SLOTS, STAT_LABELS, PASSIVE_NODES } = G;
  // ============================================================================
  // 6. BALANCED MONSTER ARCHETYPES, RARE MODS & 6 ATLAS MAPS (TIERS 1-6)
  // ============================================================================
  const MONSTER_TYPES = [
    {
      id: 'skeleton',
      name: 'Brittle Emperor Guard',
      role: 'swarmer',
      minWave: 1,
      hp: 46,
      speed: 138,
      radius: 14,
      damage: 18,
      xp: 18,
      color: '#d9d2c5',
      behavior: 'melee'
    },
    {
      id: 'scarab',
      name: 'Vaal Blood Swarmer',
      role: 'swarmer',
      minWave: 1,
      hp: 36,
      speed: 154,
      radius: 13,
      damage: 16,
      xp: 16,
      color: '#e03131',
      behavior: 'melee'
    },
    {
      id: 'archer',
      name: 'Undying Vaal Archer',
      role: 'ranged',
      minWave: 1,
      hp: 54,
      speed: 128,
      radius: 15,
      damage: 20,
      xp: 20,
      color: '#74c0fc',
      behavior: 'ranged_kite'
    },
    {
      id: 'rhoa',
      name: 'Albino Bone Rhoa',
      role: 'charger',
      minWave: 3,
      hp: 98,
      speed: 162,
      radius: 16,
      damage: 28,
      xp: 26,
      color: '#a89f91',
      behavior: 'charge'
    },
    {
      id: 'goatman',
      name: 'Molten Goatman Shaman',
      role: 'caster',
      minWave: 3,
      hp: 110,
      speed: 134,
      radius: 17,
      damage: 26,
      xp: 28,
      color: '#a65332',
      behavior: 'mortar_leap'
    },
    {
      id: 'cultist',
      name: 'Atziri Blood Cultist',
      role: 'caster',
      minWave: 5,
      hp: 120,
      speed: 132,
      radius: 16,
      damage: 30,
      xp: 30,
      color: '#c92a2a',
      behavior: 'flameblast_caster'
    },
    {
      id: 'devourer',
      name: 'Abyssal Executioner',
      role: 'tank',
      minWave: 5,
      hp: 195,
      speed: 136,
      radius: 20,
      damage: 38,
      xp: 36,
      color: '#5c940d',
      behavior: 'melee'
    },
    {
      id: 'kitava_herald',
      name: 'Herald of Kitava',
      role: 'tank',
      minWave: 7,
      hp: 280,
      speed: 142,
      radius: 23,
      damage: 46,
      xp: 48,
      color: '#f03e3e',
      behavior: 'mortar_leap'
    }
  ];

  const RARE_MODS = [
    { id: 'hasted', name: 'Hasted', color: '#74c0fc', speedMulti: 1.32, hpMulti: 1.55, dmgMulti: 1.2 },
    { id: 'gargantuan', name: 'Gargantuan', color: '#ffa94d', radiusMulti: 1.35, hpMulti: 2.25, dmgMulti: 1.35 },
    { id: 'soul_eater', name: 'Soul Conduit', color: '#da77f2', hpMulti: 1.8, dmgMulti: 1.3, speedMulti: 1.2 },
    { id: 'flameweaver', name: 'Flameweaver', color: '#ff6b6b', hpMulti: 1.7, dmgMulti: 1.4 },
    { id: 'frost_strider', name: 'Frost Strider', color: '#66d9e8', hpMulti: 1.7, speedMulti: 1.22, dmgMulti: 1.25 },
    { id: 'steel_infused', name: 'Steel-Infused', color: '#ced4da', hpMulti: 1.95, dmgMulti: 1.35, radiusMulti: 1.18 }
  ];

  const ATLAS_MAPS = [
    {
      id: 'strand',
      name: 'Forsaken Strand',
      tier: 1,
      durationSec: 240,
      monsterScale: 1.0,
      dmgScale: 1.0,
      monsterArmor: 0,
      speedScale: 1.0,
      packDensity: 1.0,
      eliteBonus: 0,
      lootQuantity: 100,
      lootRarityBonus: 0,
      goldMult: 1.0,
      recGear: 'Starter Gear',
      bossName: 'Hillock',
      themeColor: '#1f2933',
      desc: 'Baseline monster strength & drops.'
    },
    {
      id: 'fetid_pool',
      name: 'The Fetid Pool',
      tier: 2,
      durationSec: 250,
      monsterScale: 3.5,
      dmgScale: 2.4,
      monsterArmor: 24,
      speedScale: 1.12,
      packDensity: 1.18,
      eliteBonus: 0.05,
      lootQuantity: 150,
      lootRarityBonus: 35,
      goldMult: 1.12,
      recGear: 'ilvl 3+ Gear • 6+ Tree Pts',
      bossName: 'Kadavrus',
      themeColor: '#1b2b1e',
      desc: '3.5x Monster HP • +50% Drops • +35% Rarity.'
    },
    {
      id: 'vaal_pyramid',
      name: 'Ancient Pyramid',
      tier: 3,
      durationSec: 260,
      monsterScale: 11.0,
      dmgScale: 5.2,
      monsterArmor: 78,
      speedScale: 1.24,
      packDensity: 1.36,
      eliteBonus: 0.10,
      lootQuantity: 220,
      lootRarityBonus: 80,
      goldMult: 1.25,
      recGear: 'ilvl 6+ Gear • 14+ Tree Pts',
      bossName: 'Oversoul Construct',
      themeColor: '#2b2118',
      desc: '11x Monster HP • +120% Drops • +80% Rarity.'
    },
    {
      id: 'crimson_temple',
      name: 'Crimson Temple',
      tier: 4,
      durationSec: 270,
      monsterScale: 32.0,
      dmgScale: 10.5,
      monsterArmor: 220,
      speedScale: 1.36,
      packDensity: 1.56,
      eliteBonus: 0.16,
      lootQuantity: 320,
      lootRarityBonus: 145,
      goldMult: 1.40,
      recGear: 'ilvl 10+ Gear • 22+ Tree Pts',
      bossName: 'Crimson Queen',
      themeColor: '#291518',
      desc: '32x Monster HP • +220% Drops • +145% Rarity.'
    },
    {
      id: 'defiled_cathedral',
      name: 'Defiled Cathedral',
      tier: 5,
      durationSec: 285,
      monsterScale: 90.0,
      dmgScale: 20.0,
      monsterArmor: 580,
      speedScale: 1.48,
      packDensity: 1.78,
      eliteBonus: 0.22,
      lootQuantity: 460,
      lootRarityBonus: 230,
      goldMult: 1.55,
      recGear: 'ilvl 13+ Gear • 30+ Tree Pts',
      bossName: 'High Templar Avarius',
      themeColor: '#1c1d2e',
      desc: '90x Monster HP • +360% Drops • +230% Rarity.'
    },
    {
      id: 'shaper_realm',
      name: 'Void Crucible',
      tier: 6,
      durationSec: 300,
      monsterScale: 250.0,
      dmgScale: 38.0,
      monsterArmor: 1450,
      speedScale: 1.62,
      packDensity: 2.10,
      eliteBonus: 0.30,
      lootQuantity: 680,
      lootRarityBonus: 360,
      goldMult: 1.75,
      recGear: 'ilvl 16+ Gear • 38+ Tree Pts',
      bossName: 'The Void Arbiter',
      themeColor: '#161326',
      desc: '250x Monster HP • +580% Drops • +360% Rarity.'
    }
  ];

  // ============================================================================
  // 7. SHARED STAT & GEM LINK COMPUTATION HELPERS
  // ============================================================================
  function computePlayerStats(player) {
    const cls = CLASSES[player.classId] || CLASSES.Marauder;
    const base = cls.baseStats;

    const charLv = Math.max(1, Math.min(45, player.level || 1));
    const s = {
      str: base.str + (charLv - 1),
      dex: base.dex + (charLv - 1),
      int: base.int + (charLv - 1),
      flatDmg: Math.floor((charLv - 1) * 0.75),
      maxLife: base.maxLife + (charLv - 1) * 5,
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
      // Ensure legacy weapons without flatDmg in implicits still grant baseline ilvl-scaled weapon damage
      if (slot === 'weapon' && (!item.implicits || !item.implicits.flatDmg)) {
        s.flatDmg += Math.round(15 * (1 + Math.max(0, ilvl - 1) * 0.45));
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

    // PoE 1 Attribute Bonuses (Level life bonus is already applied in base s.maxLife above!)
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

    // Active Flask Buffs (Per-Slot Customizable Belt or Permanent 1.25x Effect with Mageblood!)
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
        s.moveSpeedPct += 35;
        s.cdrPct += 25;
      } else if (player.shrineBuffType === 'diamond') {
        s.critChanceInc += 250;
        s.critMulti += 60;
      } else if (player.shrineBuffType === 'brutal') {
        s.globalDmgMulti += 40;
        s.areaPct += 30;
      }
    }

    // Keystone multipliers & trade-offs
    if (s.maxLifePct > 0) {
      s.maxLife = Math.floor(s.maxLife * (1 + s.maxLifePct / 100));
    }
    if (s.noEs) {
      s.maxEs = 0;
    } else if (s.esMoreMulti > 0) {
      s.maxEs = Math.floor(s.maxEs * (1 + s.esMoreMulti / 100));
    }
    if (s.noLifeRegen) {
      s.lifeRegen = 0;
    }
    if (s.halfArmor) {
      s.armor = Math.floor(s.armor * 0.5);
    }

    // Headhunter stacks (Up to 8 Stacks)
    const hhStacks = player.hhStacks || 0;
    if (hhStacks > 0) {
      s.moveSpeedPct += Math.min(64, hhStacks * 8);
      s.cdrPct += Math.min(64, hhStacks * 8);
      s.areaPct += Math.min(64, hhStacks * 8);
      s.globalDmgMulti += Math.min(80, hhStacks * 10);
      s.maxLife += hhStacks * 35;
      if (!s.noEs) s.maxEs += hhStacks * 35;
    }

    s.finalMoveSpeed = Math.round(s.moveSpeed * (1 + s.moveSpeedPct / 100));
    s.finalCritChance = s.resoluteTechnique ? 0 : Math.min(95, +(s.critChance * (1 + s.critChanceInc / 100)).toFixed(1));
    s.allRes = Math.min(75, s.allRes);
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
      totals.flatDmg = Math.round(15 * (1 + Math.max(0, ilvl - 1) * 0.45));
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

  exports.CLASSES = CLASSES;
  Object.assign(exports, { MONSTER_TYPES, RARE_MODS, ATLAS_MAPS, computePlayerStats, sumItemStats, compareGearItems, canSupportSkill, getPlayerGemSetups });
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : exports);
