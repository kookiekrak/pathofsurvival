// Server Module: Gear Generation, Currency Crafting, Rogue-Lite Economy & Gem/Boon Drafts
const GameData = require('../public/shared/gameData.js');
// =========================================================================
// GEAR GENERATION (Pure Stats, Implicits & Affixes — Split from Gems!)
// =========================================================================
const RARE_PREFIXES = ['Havoc', 'Bramble', 'Gale', 'Vortex', 'Armageddon', 'Blood', 'Soul', 'Hypnotic', 'Dire', 'Loath', 'Cataclysm', 'Miracle'];
const RARE_SUFFIXES = ['Roar', 'Bite', 'Song', 'Ward', 'Grasp', 'Spire', 'Tread', 'Heart', 'Edge', 'Bane', 'Weaver', 'Shell'];

// Strict PoE Item Level (ilvl) -> Affix Tier Cap Brackets:
// T5: minIlvl 1 | T4: minIlvl 3 | T3: minIlvl 6 | T2: minIlvl 10 | T1: minIlvl 15
const AFFIX_TIER_BRACKETS = [
  { tierRank: 5, tierNum: 5, tierName: 'T5', minIlvl: 1, minFrac: 0.0, maxFrac: 0.25 },
  { tierRank: 4, tierNum: 4, tierName: 'T4', minIlvl: 3, minFrac: 0.25, maxFrac: 0.50 },
  { tierRank: 3, tierNum: 3, tierName: 'T3', minIlvl: 6, minFrac: 0.50, maxFrac: 0.78 },
  { tierRank: 2, tierNum: 2, tierName: 'T2', minIlvl: 10, minFrac: 0.78, maxFrac: 1.00 },
  { tierRank: 1, tierNum: 1, tierName: 'T1', minIlvl: 15, minFrac: 1.02, maxFrac: 1.30 }
];

function getMaxTierForIlvl(ilvl = 1) {
  const cleanIlvl = Math.max(1, Math.floor(ilvl || 1));
  let best = AFFIX_TIER_BRACKETS[0];
  for (const b of AFFIX_TIER_BRACKETS) {
    if (cleanIlvl >= b.minIlvl) best = b;
  }
  return best.tierName;
}

function rollAffix(pool, existingIds = new Set(), ilvl = 1, preferHighTier = false) {
  const cleanIlvl = Math.max(1, Math.floor(ilvl || 1));
  const candidates = (pool || GameData.AFFIX_POOL).filter(a => a && !existingIds.has(a.id));
  if (candidates.length === 0) return null;

  const chosen = pick(candidates);
  const maxTierForIlvl = getMaxTierForIlvl(cleanIlvl);

  // Strictly enforce minIlvl <= cleanIlvl so low-ilvl items can NEVER roll higher tiers
  const allowedBrackets = AFFIX_TIER_BRACKETS.filter(b => b.minIlvl <= cleanIlvl);
  const bracketPool = allowedBrackets.length > 0 ? allowedBrackets : [AFFIX_TIER_BRACKETS[0]];
  const chosenBracket = preferHighTier
    ? bracketPool[bracketPool.length - 1]
    : pick(bracketPool);

  const baseMin = typeof chosen.min === 'number' ? chosen.min : 10;
  const baseMax = typeof chosen.max === 'number' ? chosen.max : 30;
  const span = Math.max(1, baseMax - baseMin);

  let tMin;
  let tMax;
  if (chosenBracket.tierRank === 1) {
    tMin = Math.max(baseMax, Math.round(baseMax * chosenBracket.minFrac));
    tMax = Math.max(tMin + 1, Math.round(baseMax * chosenBracket.maxFrac));
  } else {
    tMin = Math.max(1, Math.round(baseMin + span * chosenBracket.minFrac));
    tMax = Math.max(tMin, Math.round(baseMin + span * chosenBracket.maxFrac));
  }

  // Flat combat stats scale strongly with item level so higher Map Tier gear is required for T3-T6!
  const isFlatStat = ['flatDmg', 'maxLife', 'maxEs', 'armor', 'evasion', 'lifeRegen', 'lifeOnHit'].includes(chosen.stat);
  const flatIlvlMult = isFlatStat ? (1 + Math.max(0, cleanIlvl - 1) * 0.24) : 1.0;

  const rollMin = Math.max(1, Math.round(tMin * flatIlvlMult));
  const rollMax = Math.max(rollMin + 1, Math.round(tMax * flatIlvlMult));
  const val = randInt(rollMin, rollMax);
  const rawLabel = (chosen.label || '+{val}').replace('{val}', val);
  return {
    id: chosen.id,
    name: chosen.name || chosen.id,
    stat: chosen.stat,
    val,
    value: val,
    rollMin,
    rollMax,
    baseTier: chosenBracket.tierName,
    labelTemplate: chosen.label,
    tierNum: chosenBracket.tierNum,
    tierRank: chosenBracket.tierRank,
    tierName: `${chosenBracket.tierName} (${rollMin}–${rollMax})`,
    minIlvl: chosenBracket.minIlvl,
    maxTierForIlvl,
    text: rawLabel
  };
}

function normalizeItemAffixRanges(item) {
  if (!item || !Array.isArray(item.affixes) || item.slot === 'flask') return item;
  const ilvl = Math.max(1, Math.floor(item.ilvl || item.itemLevel || 1));
  if (item.rarity === 'unique') {
    const tpl = (GameData.UNIQUE_TEMPLATES || []).find(u => u.name === item.name);
    if (tpl && !item.affixes.some(a => a && typeof a.rollMin === 'number')) {
      const rebuilt = buildUniqueFromTemplate(tpl, ilvl, item.id);
      item.affixes = rebuilt.affixes;
      item.mods = rebuilt.affixes;
    }
    return item;
  }
  item.affixes = item.affixes.map(a => {
    if (!a) return a;
    const rangeInfo = GameData.computeAffixTierRange ? GameData.computeAffixTierRange(a, ilvl) : null;
    if (!rangeInfo) return a;
    const { rollMin, rollMax, baseTier, labelTemplate } = rangeInfo;
    const curVal = typeof a.val === 'number' ? a.val : (typeof a.value === 'number' ? a.value : rollMin);
    const cleanText = String(a.text || '').replace(/^\[T\d+\]\s*/i, '');
    return {
      ...a,
      val: curVal,
      value: curVal,
      rollMin,
      rollMax,
      baseTier,
      labelTemplate: a.labelTemplate || labelTemplate,
      tierName: `${baseTier} (${rollMin}–${rollMax})`,
      text: cleanText
    };
  });
  item.mods = item.affixes;
  return item;
}

function buildUniqueFromTemplate(tpl, ilvl = 1, existingId = null) {
  const cleanIlvl = Math.max(1, Math.floor(ilvl || 1));
  const flatScale = 1 + Math.max(0, cleanIlvl - 1) * 0.22 + Math.pow(Math.max(0, cleanIlvl - 1), 1.2) * 0.05;
  const pctScale = 1 + Math.floor(Math.max(0, cleanIlvl - 1) / 4) * 0.10;
  const flatKeys = new Set(['flatDmg', 'maxLife', 'maxEs', 'armor', 'evasion', 'lifeRegen', 'lifeOnHit']);
  const scaledImplicits = {};
  for (const [k, v] of Object.entries(tpl.implicits || {})) {
    const mult = flatKeys.has(k) ? flatScale : pctScale;
    scaledImplicits[k] = typeof v === 'number' ? Math.max(1, Math.round(v * mult)) : v;
  }
  const binaryKeys = new Set([
    'headhunter', 'mageblood', 'allGemLevels', 'supportLevelBonus', 'extraProj', 'extraChain',
    'starforgeShock', 'voidBattery', 'windripperCull', 'kaomsFireBonus', 'shavronneWard',
    'atziriInstantLeech', 'crownOfEyes', 'sevenLeagueDash', 'lorisLucky',
    'mjolnerProc', 'cospriProc', 'arakaaliVenom', 'inpulsaExplode', 'brassDome', 'brotherhoodChill'
  ]);
  const uniqueAffixes = (tpl.affixes || []).map(a => {
    const hasRange = typeof a.min === 'number' && typeof a.max === 'number';
    if (!hasRange && (a.binary || a.fixed || binaryKeys.has(a.stat))) {
      const fixedTxt = (a.text || '').replace('{val}', a.val);
      return {
        ...a,
        text: fixedTxt,
        value: a.val,
        tierNum: 1,
        tierRank: 1,
        tierName: 'Unique',
        maxTierForIlvl: 'Unique'
      };
    }
    const mult = a.noIlvlScale ? 1.0 : (flatKeys.has(a.stat) ? flatScale : pctScale);
    const baseMin = hasRange ? a.min : Math.max(1, Math.round((a.val || 10) * 0.8));
    const baseMax = hasRange ? a.max : Math.max(baseMin + 1, Math.round((a.val || 10) * 1.2));
    const rollMin = Math.max(1, Math.round(baseMin * mult));
    const rollMax = Math.max(rollMin, Math.round(baseMax * mult));
    const rolledVal = randInt(rollMin, rollMax);

    let rolledText = a.text || '+{val}';
    if (rolledText.includes('{val}')) {
      rolledText = rolledText.replace('{val}', rolledVal);
    } else {
      rolledText = rolledText.replace(/\+?\d+%?/, (m) => {
        const hasPlus = m.startsWith('+');
        const hasPct = m.endsWith('%');
        return `${hasPlus ? '+' : ''}${rolledVal}${hasPct ? '%' : ''}`;
      });
    }
    const tierLabel = rollMin !== rollMax ? `Unique (${rollMin}–${rollMax})` : 'Unique';
    return {
      ...a,
      val: rolledVal,
      value: rolledVal,
      rollMin,
      rollMax,
      text: rolledText,
      tierNum: 1,
      tierRank: 1,
      tierName: tierLabel,
      maxTierForIlvl: 'Unique'
    };
  });
  return {
    id: existingId || uid('item'),
    name: tpl.name,
    baseName: tpl.baseName,
    slot: tpl.slot,
    rarity: 'unique',
    ilvl: cleanIlvl,
    itemLevel: cleanIlvl,
    maxTierForIlvl: 'Unique',
    implicits: scaledImplicits,
    affixes: uniqueAffixes,
    mods: uniqueAffixes,
    flavor: tpl.flavor
  };
}

function normalizeUniqueItem(item) {
  if (!item || item.rarity !== 'unique') return item;
  const tpl = (GameData.UNIQUE_TEMPLATES || []).find(u => u.name === item.name) || GameData.UNIQUE_TEMPLATES[0];
  if (!tpl) return item;
  if (Array.isArray(item.affixes) && item.affixes.some(a => a && typeof a.rollMin === 'number')) {
    return {
      ...item,
      baseName: tpl.baseName || item.baseName,
      slot: tpl.slot || item.slot,
      flavor: tpl.flavor || item.flavor
    };
  }
  return buildUniqueFromTemplate(tpl, item.ilvl || item.itemLevel || 1, item.id);
}

function pickWeightedUniqueTemplate(pool) {
  const list = pool && pool.length > 0 ? pool : GameData.UNIQUE_TEMPLATES;
  const totalW = list.reduce((sum, u) => sum + (typeof u.dropWeight === 'number' ? u.dropWeight : 1.0), 0);
  let r = Math.random() * totalW;
  for (const u of list) {
    r -= (typeof u.dropWeight === 'number' ? u.dropWeight : 1.0);
    if (r <= 0) return u;
  }
  return list[list.length - 1];
}

function buildFlaskItem(flaskId, existingId = null) {
  const fDef = (GameData.FLASKS || []).find(f => f.id === flaskId) || GameData.FLASKS[0];
  return {
    id: existingId || uid('flask'),
    flaskId: fDef.id,
    name: fDef.name,
    baseName: 'Belt Flask',
    slot: 'flask',
    rarity: 'flask',
    ilvl: 1,
    itemLevel: 1,
    maxTierForIlvl: 'Flask',
    implicits: {},
    affixes: [
      {
        id: `flask_${fDef.id}`,
        stat: 'flask',
        val: 1,
        value: 1,
        tierName: `${fDef.cost}/${fDef.maxCharges} Charges`,
        text: fDef.desc
      }
    ],
    mods: [],
    flavor: 'Left-Click in Inventory (or hover & press Keys 1–5) to equip into any Belt Slot [1–5].'
  };
}

function generateGearItem(slotArg, rarityArg, itemLevel = 1, rarityBonusPct = 0) {
  const ilvl = Math.max(1, Math.floor(itemLevel || 1));
  const maxTierForIlvl = getMaxTierForIlvl(ilvl);
  const slot = slotArg || pick(GameData.GEAR_SLOTS);
  let rarity = rarityArg;
  if (!rarity) {
    // Map Tier rarity bonus scales up Unique, Rare, and Magic roll thresholds!
    const rarityMult = 1 + Math.max(0, rarityBonusPct) / 100;
    const uniqueThresh = Math.min(0.035, 0.005 * rarityMult);
    const rareThresh = uniqueThresh + Math.min(0.24, 0.055 * rarityMult);
    const magicThresh = rareThresh + Math.min(0.45, 0.26 * Math.sqrt(rarityMult));
    const roll = Math.random();
    if (roll < uniqueThresh) rarity = 'unique';
    else if (roll < rareThresh) rarity = 'rare';
    else if (roll < magicThresh) rarity = 'magic';
    else rarity = 'normal';
  }

  if (rarity === 'unique') {
    const pool = GameData.UNIQUE_TEMPLATES.filter(u => !slotArg || u.slot === slotArg);
    const tpl = pickWeightedUniqueTemplate(pool);
    return buildUniqueFromTemplate(tpl, ilvl);
  }

  const base = pick(GameData.GEAR_BASES[slot]);
  // Scale flat implicits (flatDmg, maxLife, armor, evasion, maxEs) strongly with ilvl so higher-tier gear matters!
  const flatImplicitScale = 1 + Math.max(0, ilvl - 1) * 0.35 + Math.pow(Math.max(0, ilvl - 1), 1.3) * 0.10;
  const pctImplicitScale = 1 + Math.floor(Math.max(0, ilvl - 1) / 3) * 0.14;
  const flatImplicitKeys = new Set(['flatDmg', 'maxLife', 'maxEs', 'armor', 'evasion', 'lifeRegen']);
  const scaledImplicits = {};
  for (const [k, v] of Object.entries(base.implicits || {})) {
    if (typeof v === 'number') {
      const mult = flatImplicitKeys.has(k) ? flatImplicitScale : pctImplicitScale;
      scaledImplicits[k] = Math.max(1, Math.round(v * mult));
    } else {
      scaledImplicits[k] = v;
    }
  }

  const affixes = [];
  const existingIds = new Set();
  const numAffixes = rarity === 'rare' ? randInt(3, 5) : rarity === 'magic' ? randInt(1, 2) : 0;

  for (let i = 0; i < numAffixes; i++) {
    const rolled = rollAffix(GameData.AFFIX_POOL, existingIds, ilvl, false);
    if (!rolled) break;
    existingIds.add(rolled.id);
    affixes.push(rolled);
  }

  let name = base.name;
  if (rarity === 'rare') {
    name = `${pick(RARE_PREFIXES)} ${pick(RARE_SUFFIXES)} ${base.name}`;
  } else if (rarity === 'magic' && affixes.length > 0) {
    name = `Infused ${base.name}`;
  }

  return {
    id: uid('item'),
    name,
    baseName: base.name,
    slot: base.slot,
    rarity,
    ilvl,
    itemLevel: ilvl,
    maxTierForIlvl,
    implicits: scaledImplicits,
    affixes,
    mods: affixes
  };
}

function getStarterWeaponBase(classId) {
  const weapons = (GameData.GEAR_BASES && GameData.GEAR_BASES.weapon) || [];
  if (classId === 'Marauder' || classId === 'Duelist' || classId === 'Templar') {
    return weapons.find(w => w.id === 'karui_chopper') || weapons[0];
  }
  if (classId === 'Ranger') {
    return weapons.find(w => w.id === 'harbinger_bow') || weapons[1] || weapons[0];
  }
  if (classId === 'Shadow') {
    return weapons.find(w => w.id === 'imperial_skean') || weapons[3] || weapons[1] || weapons[0];
  }
  // Witch, Scion, or fallback
  return weapons.find(w => w.id === 'prophecy_wand') || weapons[2] || weapons[0];
}

// Clean Starter Loadout: Worn starter weapon + chestplate + boots, 1 starter Active Skill Gem, NO inventory clutter!
function createStarterLoadout(classId) {
  const cls = GameData.CLASSES[classId] || GameData.CLASSES.Marauder;
  const weaponBase = getStarterWeaponBase(classId);

  const weapon = {
    id: uid('item'),
    name: `Weathered ${weaponBase.name}`,
    baseName: weaponBase.name,
    slot: 'weapon',
    rarity: 'normal',
    ilvl: 1,
    itemLevel: 1,
    maxTierForIlvl: 'T5',
    implicits: { ...weaponBase.implicits },
    affixes: [],
    mods: []
  };

  const body = {
    id: uid('item'),
    name: `Worn Brigandine`,
    baseName: 'Triumphant Lamellar',
    slot: 'body',
    rarity: 'normal',
    ilvl: 1,
    itemLevel: 1,
    maxTierForIlvl: 'T5',
    implicits: { maxLife: 34, armor: 42 },
    affixes: [],
    mods: []
  };

  const boots = {
    id: uid('item'),
    name: `Tattered Greaves`,
    baseName: 'Titan Greaves',
    slot: 'boots',
    rarity: 'normal',
    ilvl: 1,
    itemLevel: 1,
    maxTierForIlvl: 'T5',
    implicits: { maxLife: 14, armor: 18, moveSpeedPct: 12 },
    affixes: [],
    mods: []
  };

  const currencies = {
    transmute: 1,
    alteration: 1,
    alchemy: 0,
    chaos: 0,
    exalted: 0,
    divine: 1,
    regret: 1
  };

  // Dedicated Gem Link Board (4 Active Skill Slots, completely separate from Gear!)
  const gemLinks = [
    {
      slotIndex: 0,
      activeGem: { id: cls.starterSkill, level: 1 },
      maxSupports: 2,
      supports: []
    },
    {
      slotIndex: 1,
      activeGem: null,
      maxSupports: 2,
      supports: []
    },
    {
      slotIndex: 2,
      activeGem: null,
      maxSupports: 2,
      supports: []
    },
    {
      slotIndex: 3,
      activeGem: null,
      maxSupports: 2,
      supports: []
    }
  ];

  return {
    equipment: {
      weapon,
      helm: null,
      body,
      gloves: null,
      boots,
      belt: null,
      ring: null,
      amulet: null
    },
    gemLinks,
    supportReserve: [],
    inventory: [],
    currencies
  };
}

// =========================================================================
// ROGUE-LITE PER-RUN STAT UPGRADES & WAVE GEM DRAFT GENERATOR
// =========================================================================
const FALLBACK_RUN_UPGRADES = {
  up_move_speed: {
    id: 'up_move_speed',
    name: 'Fleetfoot Reflexes',
    color: 'G',
    subtitle: 'ROGUE-LITE RUN BOON • MOBILITY',
    desc: '+12% Movement Speed & +10% Attack/Cast Speed',
    stats: { moveSpeedPct: 12, cdrPct: 10 }
  },
  up_extra_proj: {
    id: 'up_extra_proj',
    name: 'Endless Munitions',
    color: 'G',
    subtitle: 'ROGUE-LITE RUN BOON • PROJECTILES',
    desc: '+1 Additional Projectile to all Skills',
    stats: { extraProj: 1 }
  },
  up_armor_ward: {
    id: 'up_armor_ward',
    name: 'Granite Bastion',
    color: 'R',
    subtitle: 'ROGUE-LITE RUN BOON • DEFENCE',
    desc: '+90 Armour & +35 Maximum Life',
    stats: { armor: 90, maxLife: 35 }
  },
  up_phys_might: {
    id: 'up_phys_might',
    name: 'Brutal Slaughter',
    color: 'R',
    subtitle: 'ROGUE-LITE RUN BOON • PHYSICAL',
    desc: '+25% Physical Damage & +10% Area of Effect',
    stats: { physDmgPct: 25, areaPct: 10 }
  },
  up_ele_overload: {
    id: 'up_ele_overload',
    name: 'Elemental Overload',
    color: 'B',
    subtitle: 'ROGUE-LITE RUN BOON • ELEMENTAL',
    desc: '+25% Elemental & Spell Damage & +8% Cast Speed',
    stats: { eleDmgPct: 25, spellDmgPct: 25, cdrPct: 8 }
  },
  up_crit_strikes: {
    id: 'up_crit_strikes',
    name: 'Deadly Precision',
    color: 'G',
    subtitle: 'ROGUE-LITE RUN BOON • CRITICAL',
    desc: '+35% Increased Critical Strike Chance & +25% Crit Multiplier',
    stats: { critChance: 35, critMulti: 25 }
  },
  up_attack_cast: {
    id: 'up_attack_cast',
    name: 'Soul Acceleration',
    color: 'G',
    subtitle: 'ROGUE-LITE RUN BOON • SPEED',
    desc: '+14% Faster Skill Cooldown Recovery & +6% Move Speed',
    stats: { cdrPct: 14, moveSpeedPct: 6 }
  },
  up_aoe_reach: {
    id: 'up_aoe_reach',
    name: 'Amplified Reach',
    color: 'B',
    subtitle: 'ROGUE-LITE RUN BOON • AREA',
    desc: '+18% Area of Effect Radius & +15% Global Damage',
    stats: { areaPct: 18, physDmgPct: 15, eleDmgPct: 15 }
  },
  up_life_regen: {
    id: 'up_life_regen',
    name: 'Vitality Surge',
    color: 'R',
    subtitle: 'ROGUE-LITE RUN BOON • VITALITY',
    desc: '+45 Maximum Life & +4 Life Regenerated per sec',
    stats: { maxLife: 45, lifeRegen: 4 }
  },
  up_es_barrier: {
    id: 'up_es_barrier',
    name: 'Arcane Aegis',
    color: 'B',
    subtitle: 'ROGUE-LITE RUN BOON • WARD',
    desc: '+45 Maximum Energy Shield & +10% Elemental Resistances',
    stats: { maxEs: 45, allRes: 10 }
  },
  up_chain_pierce: {
    id: 'up_chain_pierce',
    name: 'Ricochet Mastery',
    color: 'G',
    subtitle: 'ROGUE-LITE RUN BOON • CHAIN',
    desc: 'Projectiles Chain +1 Time & Pierce +1 Target',
    stats: { extraChain: 1, pierceCount: 1 }
  },
  up_vampiric: {
    id: 'up_vampiric',
    name: 'Vaal Pact Leech',
    color: 'R',
    subtitle: 'ROGUE-LITE RUN BOON • LEECH',
    desc: 'Restore +2 Life on Hit & +15% Global Damage',
    stats: { lifeOnHit: 2, physDmgPct: 15, eleDmgPct: 15 }
  }
};

function getRunUpgradesCatalog() {
  if (GameData.RUN_UPGRADES && typeof GameData.RUN_UPGRADES === 'object') {
    return GameData.RUN_UPGRADES;
  }
  return FALLBACK_RUN_UPGRADES;
}

function getNextChestCost(player, room = null) {
  const mapId = (room && room.selectedMapId) || (player && player.currentMapId) || 'strand';
  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === mapId) || GameData.ATLAS_MAPS[0];
  const tierMult = mapDef ? Math.pow(mapDef.goldMult || 1, 0.5) : 1;
  const base = 30 * Math.pow(1.45, (player && player.chestsOpened) || 0);
  return Math.max(30, Math.round((base * tierMult) / 5) * 5);
}

function getDraftRerollCost(player) {
  return Math.round(15 * Math.pow(1.4, (player && player.draftRerolls) || 0));
}

function getSkillTomeCost(player) {
  const totalPts = Math.max(0, (player && player.passives ? player.passives.length - 1 : 0) + ((player && player.passivePoints) || 0));
  return Math.round(160 + Math.max(0, totalPts - 2) * 40);
}

function getGambleCosts(room = null, player = null) {
  const lv = Math.max(1, (player && player.level) || 1);
  const ilvl = Math.max(1, lv);
  return {
    level: lv,
    tier: Math.min(6, Math.ceil(lv / 6)),
    ilvl,
    weapon: Math.round((45 + lv * 16 + Math.pow(lv, 1.35) * 3.5) / 5) * 5,
    body: Math.round((40 + lv * 14 + Math.pow(lv, 1.35) * 3.0) / 5) * 5,
    armour: Math.round((30 + lv * 11 + Math.pow(lv, 1.35) * 2.5) / 5) * 5,
    jewelry: Math.round((50 + lv * 18 + Math.pow(lv, 1.35) * 4.0) / 5) * 5
  };
}

function syncSkillRingsFromGemLinks(player) {
  player.skillRings = (player.gemLinks || [])
    .filter(s => s && s.activeGem)
    .map(s => ({
      activeGem: s.activeGem.id,
      level: s.activeGem.level || 1,
      supportGems: (s.supports || []).map(sup => sup.id),
      cdTimer: 0
    }));
}

function getCharXpForLevel(level = 1) {
  const lv = Math.max(1, Math.floor(level || 1));
  return Math.round(450 * Math.pow(1.36, lv - 1) + (lv - 1) * 220);
}

// Reset per-run Rogue-lite Level (`runLevel`), Skills, Run Stat Upgrades & Chest Cost when starting a Map or returning to Hideout!
// Persistent Character Level (`level`, `xp`, `xpNext`), Skill Tree nodes/points, Unlocked Flasks, Stash Gold, Gear & Orbs are preserved!
function resetPlayerRunSkills(player) {
  const cls = GameData.CLASSES[player.classId] || GameData.CLASSES.Marauder;
  player.runLevel = 1;
  player.runXp = 0;
  player.runXpNext = 180;
  player.gemLinks = [
    {
      slotIndex: 0,
      activeGem: { id: cls.starterSkill, level: 1 },
      maxSupports: 2,
      supports: []
    },
    { slotIndex: 1, activeGem: null, maxSupports: 2, supports: [] },
    { slotIndex: 2, activeGem: null, maxSupports: 2, supports: [] },
    { slotIndex: 3, activeGem: null, maxSupports: 2, supports: [] }
  ];
  player.supportReserve = [];
  player.pendingDrafts = [];
  player.runUpgrades = {};
  player.skillTimers = {};
  player.chestsOpened = 0;
  player.draftRerolls = 0;
  player.nextChestCost = getNextChestCost(player);
  syncSkillRingsFromGemLinks(player);
}

function canSupportLinkToActive(activeDef, supDef) {
  if (typeof GameData.canSupportSkill === 'function') {
    return GameData.canSupportSkill(activeDef, supDef);
  }
  if (!activeDef || !supDef) return false;
  const actTags = activeDef.tags || [];
  const req = supDef.requireTags || [];
  const exc = supDef.excludeTags || [];
  if (exc.some(t => actTags.includes(t))) return false;
  if (req.length > 0 && !req.some(t => actTags.includes(t))) return false;
  return true;
}

function generateGemDraftOptions(player) {
  const options = [];
  const usedIds = new Set();

  const activeDefs = Object.values(GameData.SKILL_GEMS).filter(g => g.type === 'active');
  const supportDefs = Object.values(GameData.SKILL_GEMS).filter(g => g.type === 'support');

  const ownedActives = new Map();
  const activeSkillTags = new Set();
  const equippedActiveDefs = [];

  player.gemLinks.forEach((slot, idx) => {
    if (slot.activeGem) {
      ownedActives.set(slot.activeGem.id, { slotIndex: idx, level: slot.activeGem.level, slot });
      const actDef = GameData.SKILL_GEMS[slot.activeGem.id];
      if (actDef) {
        equippedActiveDefs.push({ actDef, slot });
        for (const t of (actDef.tags || [])) activeSkillTags.add(t);
      }
    }
  });

  const hasOpenActiveSlot = player.gemLinks.some(s => !s.activeGem);
  const colorLabel = (c) => (c === 'R' ? 'RED (STR)' : c === 'G' ? 'GREEN (DEX)' : c === 'B' ? 'BLUE (INT)' : 'PRISMATIC');

  // 1. Active Skill Pool (Upgrade existing Active Skills or Unlock New Active Skill / Link Socket)
  const activePool = [];
  for (const act of activeDefs) {
    if (ownedActives.has(act.id)) {
      const info = ownedActives.get(act.id);
      if (info.level < 8) {
        activePool.push({
          optionId: `act_up_${act.id}`,
          optionType: 'active_upgrade',
          kind: 'active_upgrade',
          gemId: act.id,
          color: act.color,
          title: `${act.name} (Lv. ${info.level + 1})`,
          subtitle: `${colorLabel(act.color)} ACTIVE SKILL UPGRADE`,
          desc: `Levels up ${act.name} to Lv. ${info.level + 1}: +14% MORE Damage, +3% Area & +3% Speed.`,
          weight: 3.4
        });
      }
    } else if (hasOpenActiveSlot) {
      activePool.push({
        optionId: `act_new_${act.id}`,
        optionType: 'active_new',
        kind: 'active_new',
        gemId: act.id,
        color: act.color,
        title: `New Skill: ${act.name}`,
        subtitle: `NEW ${colorLabel(act.color)} ACTIVE SKILL GEM`,
        desc: act.description,
        weight: 2.2
      });
    }
  }

  // Add Link Expansion option if any active slot has < 5 support sockets (6-Link max)
  const expandableSlot = player.gemLinks.find(s => s.activeGem && s.maxSupports < 5);
  if (expandableSlot) {
    const actDef = GameData.SKILL_GEMS[expandableSlot.activeGem.id];
    activePool.push({
      optionId: `link_exp_${expandableSlot.slotIndex}`,
      optionType: 'link_expand',
      kind: 'link_expand',
      slotIndex: expandableSlot.slotIndex,
      color: 'W',
      title: `Orb of Fusing: ${actDef.name} (${expandableSlot.maxSupports + 2}-Link)`,
      subtitle: 'SOCKET LINK EXPANSION',
      desc: `Adds +1 Linked Support Socket to ${actDef.name} (up to ${expandableSlot.maxSupports + 2}-Link).`,
      weight: 2.2
    });
  }

  // 2. Compatible Support Gem Pool (ONLY Support Gems that work with your currently equipped Active Skills!)
  const supportPool = [];
  for (const sup of supportDefs) {
    const compatibleSkillNames = [];
    let isUpgradeable = false;
    let canSocketInEquipped = false;

    for (const { actDef, slot } of equippedActiveDefs) {
      if (!canSupportLinkToActive(actDef, sup)) continue;
      const existingSup = slot.supports.find(s => s && s.id === sup.id);
      if (existingSup) {
        if ((existingSup.level || 1) < 5) {
          isUpgradeable = true;
          compatibleSkillNames.push(`${actDef.name} (Lv.${(existingSup.level || 1) + 1})`);
        }
      } else if (slot.supports.length < slot.maxSupports) {
        canSocketInEquipped = true;
        compatibleSkillNames.push(actDef.name);
      }
    }

    if (!isUpgradeable && !canSocketInEquipped) continue;

    supportPool.push({
      optionId: `sup_${sup.id}`,
      optionType: 'support_gem',
      kind: 'support_gem',
      gemId: sup.id,
      color: sup.color,
      title: `${sup.name} (${sup.short})`,
      subtitle: `SUPPORTS: ${compatibleSkillNames.join(', ').toUpperCase()}`,
      desc: sup.description,
      weight: isUpgradeable ? 3.2 : 3.0
    });
  }

  // 3. Context-Aware, Varied Rogue-lite Boon Pool (24 balanced boons filtered by your active skill tags!)
  const runPool = [];
  const runCatalog = getRunUpgradesCatalog();
  const currentRunUpgrades = player.runUpgrades || {};
  for (const up of Object.values(runCatalog)) {
    const stacks = currentRunUpgrades[up.id] || 0;
    const maxRanks = up.maxRanks || (up.id === 'up_extra_proj' ? 1 : 3);
    if (stacks >= maxRanks) continue;
    if (Array.isArray(up.requireTags) && up.requireTags.length > 0) {
      const matchesEquippedSkill = up.requireTags.some(t => activeSkillTags.has(t));
      if (!matchesEquippedSkill) continue;
    }
    runPool.push({
      optionId: `run_${up.id}`,
      optionType: 'run_upgrade',
      kind: 'run_upgrade',
      gemId: up.id,
      color: up.color || 'W',
      title: maxRanks > 1 ? `${up.name} (Rank ${stacks + 1}/${maxRanks})` : up.name,
      subtitle: up.subtitle || 'ROGUE-LITE RUN BOON',
      desc: up.desc || up.description || 'Increases character power for the current Map Run.',
      weight: 2.5
    });
  }

  const pickWeighted = (arr) => {
    const totalW = arr.reduce((acc, item) => acc + (item.weight || 1), 0);
    let r = Math.random() * totalW;
    let chosenIdx = 0;
    for (let i = 0; i < arr.length; i++) {
      r -= arr[i].weight || 1;
      if (r <= 0) {
        chosenIdx = i;
        break;
      }
    }
    return arr.splice(chosenIdx, 1)[0];
  };

  // Guarantee a balanced 3-choice spread: 1 Active Skill/Link, 1 Compatible Support Gem, 1 Compatible Rogue-lite Boon
  if (activePool.length > 0) {
    const chosen = pickWeighted(activePool);
    if (chosen && !usedIds.has(chosen.optionId)) {
      usedIds.add(chosen.optionId);
      options.push(chosen);
    }
  }
  if (supportPool.length > 0) {
    const chosen = pickWeighted(supportPool);
    if (chosen && !usedIds.has(chosen.optionId)) {
      usedIds.add(chosen.optionId);
      options.push(chosen);
    }
  }
  if (runPool.length > 0 && options.length < 3) {
    const chosen = pickWeighted(runPool);
    if (chosen && !usedIds.has(chosen.optionId)) {
      usedIds.add(chosen.optionId);
      options.push(chosen);
    }
  }

  const combined = [...activePool, ...supportPool, ...runPool];
  while (options.length < 3 && combined.length > 0) {
    const chosen = pickWeighted(combined);
    if (chosen && !usedIds.has(chosen.optionId)) {
      usedIds.add(chosen.optionId);
      options.push(chosen);
    }
  }

  return options;
}

function queueGemDraft(player, reasonLabel) {
  const choices = generateGemDraftOptions(player);
  if (choices.length > 0) {
    player.pendingDrafts.push({
      id: uid('draft'),
      reason: reasonLabel || 'Wave Gem & Ascendancy Draft',
      choices
    });
  }
}

function applyGemDraftChoice(player, optionId) {
  if (!player.pendingDrafts || player.pendingDrafts.length === 0) return false;
  const currentDraft = player.pendingDrafts[0];
  const choice = currentDraft.choices.find(
    c => c.optionId === optionId || c.gemId === optionId
  );
  if (!choice) return false;

  player.pendingDrafts.shift();

  let healBonus = false;
  if (choice.kind === 'run_upgrade' || choice.optionType === 'run_upgrade') {
    if (!player.runUpgrades) player.runUpgrades = {};
    player.runUpgrades[choice.gemId] = (player.runUpgrades[choice.gemId] || 0) + 1;
    healBonus = true;
  } else if (choice.kind === 'active_upgrade') {
    for (const slot of player.gemLinks) {
      if (slot.activeGem && slot.activeGem.id === choice.gemId) {
        slot.activeGem.level = (slot.activeGem.level || 1) + 1;
        break;
      }
    }
  } else if (choice.kind === 'active_new') {
    const emptySlot = player.gemLinks.find(s => !s.activeGem);
    if (emptySlot) {
      emptySlot.activeGem = { id: choice.gemId, level: 1 };
    }
  } else if (choice.kind === 'support_gem') {
    const supDef = GameData.SKILL_GEMS[choice.gemId];
    let upgradedExisting = false;
    for (const slot of player.gemLinks) {
      if (!slot.activeGem) continue;
      const actDef = GameData.SKILL_GEMS[slot.activeGem.id];
      if (!canSupportLinkToActive(actDef, supDef)) continue;
      for (const sup of slot.supports) {
        if (sup && sup.id === choice.gemId) {
          sup.level = (sup.level || 1) + 1;
          upgradedExisting = true;
          break;
        }
      }
      if (upgradedExisting) break;
    }

    if (!upgradedExisting) {
      let placed = false;
      for (const slot of player.gemLinks) {
        if (!slot.activeGem) continue;
        const actDef = GameData.SKILL_GEMS[slot.activeGem.id];
        if (!canSupportLinkToActive(actDef, supDef)) continue;
        if (slot.supports.length < slot.maxSupports && !slot.supports.some(s => s.id === choice.gemId)) {
          slot.supports.push({ id: choice.gemId, level: 1 });
          placed = true;
          break;
        }
      }
      if (!placed) {
        player.supportReserve.push({ id: uid('sup'), gemId: choice.gemId, level: 1 });
      }
    }
  } else if (choice.kind === 'link_expand') {
    const slot = player.gemLinks[choice.slotIndex];
    if (slot) {
      slot.maxSupports = Math.min(5, (slot.maxSupports || 2) + 1);
    }
  }

  syncSkillRingsFromGemLinks(player);
  const prevMaxHp = player.maxHp || 100;
  const prevMaxEs = player.maxEs || 0;
  recalcPlayer(player, false);
  if (healBonus) {
    if (player.maxHp > prevMaxHp) player.hp = Math.min(player.maxHp, player.hp + (player.maxHp - prevMaxHp));
    if (player.maxEs > prevMaxEs) player.es = Math.min(player.maxEs, player.es + (player.maxEs - prevMaxEs));
  }
  // Grant a 2.0-second grace shield when resuming from a draft choice!
  player.graceTimer = Math.max(player.graceTimer || 0, 2.0);
  return true;
}


// =========================================================================
// CURRENCY CRAFTING ON GEAR (Cleanly separated from Gems!)
// =========================================================================
function applyCurrencyToItem(player, currencyId, targetLocation, slotOrIdx) {
  if (!player.currencies[currencyId] || player.currencies[currencyId] <= 0) {
    return { ok: false, reason: 'Not enough currency orbs.' };
  }

  let item = null;
  if (targetLocation === 'equipment') {
    item = player.equipment[slotOrIdx];
  } else if (targetLocation === 'inventory') {
    item = player.inventory[slotOrIdx];
  }

  if (!item || item.slot === 'flask') {
    return { ok: false, reason: 'Select a valid piece of equipment.' };
  }
  if (item.rarity === 'unique' && currencyId !== 'divine') {
    return { ok: false, reason: 'Unique items can only be modified by a Divine Orb (to reroll stat ranges).' };
  }

  const ilvl = Math.max(1, Math.floor(item.ilvl || item.itemLevel || 1));
  item.ilvl = ilvl;
  item.itemLevel = ilvl;
  if (item.rarity !== 'unique') {
    item.maxTierForIlvl = getMaxTierForIlvl(ilvl);
  }

  const pickAffixes = (count) => {
    const existingIds = new Set();
    const out = [];
    for (let i = 0; i < count; i++) {
      const rolled = rollAffix(GameData.AFFIX_POOL, existingIds, ilvl, false);
      if (!rolled) break;
      existingIds.add(rolled.id);
      out.push(rolled);
    }
    return out;
  };

  if (currencyId === 'divine') {
    if (item.rarity !== 'magic' && item.rarity !== 'rare' && item.rarity !== 'unique') {
      return { ok: false, reason: 'Divine Orb requires a Magic, Rare, or Unique item.' };
    }
    normalizeItemAffixRanges(item);
    let rerolledCount = 0;
    item.affixes = (item.affixes || []).map(a => {
      if (!a || typeof a.rollMin !== 'number' || typeof a.rollMax !== 'number' || a.rollMax <= a.rollMin) {
        return a;
      }
      rerolledCount++;
      const newVal = randInt(a.rollMin, a.rollMax);
      let newText = a.labelTemplate || a.text || '+{val}';
      if (newText.includes('{val}')) {
        newText = newText.replace('{val}', newVal);
      } else {
        newText = newText.replace(/^\[T\d+\]\s*/i, '').replace(/\+?\d+%?/, (m) => {
          const hasPlus = m.startsWith('+');
          const hasPct = m.endsWith('%');
          return `${hasPlus ? '+' : ''}${newVal}${hasPct ? '%' : ''}`;
        });
      }
      const baseTier = a.baseTier || (item.rarity === 'unique' ? 'Unique' : String(a.tierName || 'T5').split(' ')[0]);
      return {
        ...a,
        val: newVal,
        value: newVal,
        text: newText,
        tierName: `${baseTier} (${a.rollMin}–${a.rollMax})`
      };
    });
    item.mods = item.affixes;
    if (rerolledCount === 0) {
      return { ok: false, reason: 'This item has no variable modifier ranges to reroll.' };
    }
    player.currencies.divine--;
    recalcPlayer(player, false);
    return { ok: true, msg: `Divined ${item.name} — rerolled ${rerolledCount} modifier values within their tier ranges!` };
  }

  if (currencyId === 'regret') {
    if (item.rarity !== 'magic' && item.rarity !== 'rare') {
      return { ok: false, reason: 'Orb of Scouring requires a Magic (Blue) or Rare (Yellow) item.' };
    }
    item.rarity = 'normal';
    item.affixes = [];
    item.mods = [];
    item.name = item.baseName;
  } else if (currencyId === 'transmute') {
    if (item.rarity !== 'normal') return { ok: false, reason: 'Orb of Transmutation requires a Normal (White) item.' };
    item.rarity = 'magic';
    item.affixes = pickAffixes(randInt(1, 2));
    item.mods = item.affixes;
    item.name = `Infused ${item.baseName}`;
  } else if (currencyId === 'alteration') {
    if (item.rarity !== 'magic') return { ok: false, reason: 'Orb of Alteration requires a Magic (Blue) item.' };
    item.affixes = pickAffixes(randInt(1, 2));
    item.mods = item.affixes;
  } else if (currencyId === 'alchemy') {
    if (item.rarity !== 'normal') return { ok: false, reason: 'Orb of Alchemy requires a Normal (White) item.' };
    item.rarity = 'rare';
    item.affixes = pickAffixes(randInt(3, 5));
    item.mods = item.affixes;
    item.name = `${pick(RARE_PREFIXES)} ${pick(RARE_SUFFIXES)} ${item.baseName}`;
  } else if (currencyId === 'chaos') {
    if (item.rarity !== 'rare') return { ok: false, reason: 'Chaos Orb requires a Rare (Yellow) item.' };
    item.affixes = pickAffixes(randInt(4, 5));
    item.mods = item.affixes;
    item.name = `${pick(RARE_PREFIXES)} ${pick(RARE_SUFFIXES)} ${item.baseName}`;
  } else if (currencyId === 'exalted') {
    if (item.rarity !== 'rare') return { ok: false, reason: 'Exalted Orb requires a Rare (Yellow) item.' };
    if (item.affixes.length >= 6) return { ok: false, reason: 'Item already has the maximum of 6 modifiers.' };
    const existingIds = new Set(item.affixes.map(a => a.id));
    // Exalted Orb rolls the highest tier allowed by item.ilvl (still strictly capped by minIlvl <= item.ilvl!)
    const rolled = rollAffix(GameData.AFFIX_POOL, existingIds, ilvl, true);
    if (!rolled) return { ok: false, reason: 'No additional modifiers available.' };
    item.affixes.push(rolled);
    item.mods = item.affixes;
  } else {
    return { ok: false, reason: 'Unknown currency orb.' };
  }

  player.currencies[currencyId]--;
  recalcPlayer(player, false);
  return { ok: true, msg: `Crafted ${item.name} (ilvl ${ilvl}, max ${item.maxTierForIlvl}) with ${GameData.CURRENCIES[currencyId].name}!` };
}

const exportsObj = { RARE_PREFIXES, RARE_SUFFIXES, AFFIX_TIER_BRACKETS, getMaxTierForIlvl, rollAffix, normalizeItemAffixRanges, buildUniqueFromTemplate, normalizeUniqueItem, pickWeightedUniqueTemplate, buildFlaskItem, generateGearItem, getStarterWeaponBase, createStarterLoadout, applyCurrencyToItem, FALLBACK_RUN_UPGRADES, getRunUpgradesCatalog, getNextChestCost, getDraftRerollCost, getSkillTomeCost, getGambleCosts, getCharXpForLevel, syncSkillRingsFromGemLinks, resetPlayerRunSkills, canSupportLinkToActive, generateGemDraftOptions, queueGemDraft, applyGemDraftChoice };
Object.assign(global, exportsObj);
module.exports = exportsObj;
