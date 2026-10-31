// Server Items Module: Unique Templates, Flask Items, Gear Generation & Starter Loadouts
const GameData = global.GameData || require('../../public/shared/gameData.js');

function buildUniqueFromTemplate(tpl, ilvl = 1, existingId = null) {
  const cleanIlvl = Math.max(1, Math.floor(ilvl || 1));
  const flatScale = 1 + Math.max(0, cleanIlvl - 1) * 0.28 + Math.pow(Math.max(0, cleanIlvl - 1), 1.35) * 0.04;
  const pctScale = 1 + Math.floor(Math.max(0, cleanIlvl - 1) / 8) * 0.08;
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

function buildFlaskItem(flaskId, existingId = null, customStats = null) {
  const fDef = (GameData.FLASKS || []).find(f => f.id === flaskId) || GameData.FLASKS[0];
  let maxCharges = fDef.maxCharges || 30;
  let cost = fDef.cost || 10;
  let duration = fDef.duration || 5.0;
  let prefix = '';

  if (customStats && typeof customStats === 'object') {
    maxCharges = customStats.maxCharges || maxCharges;
    cost = customStats.cost || cost;
    duration = customStats.duration || duration;
    prefix = customStats.prefix || '';
  } else if (customStats !== false) {
    const rollType = Math.random();
    if (rollType < 0.25) {
      prefix = 'Ample ';
      maxCharges = Math.round(maxCharges * (1.2 + Math.random() * 0.3));
    } else if (rollType < 0.50) {
      prefix = "Chemist's ";
      cost = Math.max(3, Math.round(cost * (0.68 + Math.random() * 0.14)));
      maxCharges = Math.max(cost, Math.round(maxCharges * (0.9 + Math.random() * 0.2)));
    } else if (rollType < 0.75 && fDef.id !== 'life') {
      prefix = "Experimenter's ";
      duration = +(duration * (1.18 + Math.random() * 0.25)).toFixed(1);
      maxCharges = Math.max(cost, Math.round(maxCharges * (0.95 + Math.random() * 0.2)));
    } else {
      prefix = 'Perpetual ';
      maxCharges = Math.max(cost + 2, Math.round(maxCharges * (0.85 + Math.random() * 0.45)));
      cost = Math.max(3, Math.min(maxCharges, Math.round(cost * (0.8 + Math.random() * 0.25))));
    }
  }

  const displayName = (customStats && customStats.name) ? customStats.name : `${prefix}${fDef.name}`.trim();
  const durText = fDef.id !== 'life' ? ` • Lasts ${duration}s` : '';
  const modLines = [];
  if (maxCharges > fDef.maxCharges) {
    modLines.push(`+${Math.round((maxCharges / fDef.maxCharges - 1) * 100)}% Increased Maximum Charges (Ample)`);
  } else if (maxCharges < fDef.maxCharges) {
    modLines.push(`-${Math.round((1 - maxCharges / fDef.maxCharges) * 100)}% Maximum Charges`);
  }
  if (cost < fDef.cost) {
    modLines.push(`-${Math.round((1 - cost / fDef.cost) * 100)}% Reduced Charges Used (Chemist's)`);
  } else if (cost > fDef.cost) {
    modLines.push(`+${Math.round((cost / fDef.cost - 1) * 100)}% Charges Used`);
  }
  if (fDef.id !== 'life' && duration > fDef.duration) {
    modLines.push(`+${Math.round((duration / fDef.duration - 1) * 100)}% Increased Flask Effect Duration (Experimenter's)`);
  }
  if (modLines.length === 0 && customStats && Array.isArray(customStats.mods)) {
    modLines.push(...customStats.mods);
  }

  const affixes = [
    {
      id: `flask_${fDef.id}`,
      stat: 'flask',
      val: 1,
      value: 1,
      tierName: `${cost}/${maxCharges} Charges${durText}`,
      text: `${fDef.desc} (Auto-Triggers in Combat & on Full Charges)`
    },
    ...modLines.map((line, idx) => ({
      id: `flask_mod_${idx}`,
      stat: 'flaskMod',
      val: 1,
      value: 1,
      tierName: 'Flask Mod',
      text: line
    }))
  ];

  return {
    id: existingId || uid('flask'),
    flaskId: fDef.id,
    name: displayName,
    baseName: fDef.name,
    slot: 'flask',
    rarity: 'flask',
    ilvl: 1,
    itemLevel: 1,
    maxCharges,
    cost,
    duration,
    maxTierForIlvl: 'Flask',
    implicits: {},
    affixes,
    mods: modLines,
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
    const uniqueThresh = Math.min(0.003, 0.0007 * rarityMult);
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
  // Scale flat implicits (flatDmg, maxLife, armor, evasion, maxEs) smoothly with ilvl across T1-T16!
  const flatImplicitScale = 1 + Math.max(0, ilvl - 1) * 0.28 + Math.pow(Math.max(0, ilvl - 1), 1.35) * 0.04;
  const pctImplicitScale = 1 + Math.floor(Math.max(0, ilvl - 1) / 8) * 0.08;
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
    maxTierForIlvl: 'T6',
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
    maxTierForIlvl: 'T6',
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
    maxTierForIlvl: 'T6',
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
    { slotIndex: 0, activeGem: { id: cls.starterSkill, level: 1 }, maxSupports: 2, supports: [] },
    { slotIndex: 1, activeGem: null, maxSupports: 2, supports: [] },
    { slotIndex: 2, activeGem: null, maxSupports: 2, supports: [] },
    { slotIndex: 3, activeGem: null, maxSupports: 2, supports: [] }
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

const exportsObj = {
  buildUniqueFromTemplate,
  normalizeUniqueItem,
  pickWeightedUniqueTemplate,
  buildFlaskItem,
  generateGearItem,
  getStarterWeaponBase,
  createStarterLoadout
};
Object.assign(global, exportsObj);
module.exports = exportsObj;
