// Server Items Module: Affix Tier Brackets, Affix Rolling & Range Normalization
const GameData = global.GameData || require('../../public/shared/gameData.js');

// =========================================================================
// GEAR GENERATION (Pure Stats, Implicits & Affixes — Split from Gems!)
// =========================================================================
const RARE_PREFIXES = ['Havoc', 'Bramble', 'Gale', 'Vortex', 'Armageddon', 'Blood', 'Soul', 'Hypnotic', 'Dire', 'Loath', 'Cataclysm', 'Miracle'];
const RARE_SUFFIXES = ['Roar', 'Bite', 'Song', 'Ward', 'Grasp', 'Spire', 'Tread', 'Heart', 'Edge', 'Bane', 'Weaver', 'Shell'];

// Strict PoE Item Level (ilvl) -> Fixed Deterministic Affix Tier Brackets (T6–T1 across Map Tiers 1–16):
const AFFIX_TIER_BRACKETS = [
  { tierRank: 6, tierNum: 6, tierName: 'T6', minIlvl: 1,  minFrac: 0.00, maxFrac: 0.16 },
  { tierRank: 5, tierNum: 5, tierName: 'T5', minIlvl: 6,  minFrac: 0.17, maxFrac: 0.34 },
  { tierRank: 4, tierNum: 4, tierName: 'T4', minIlvl: 13, minFrac: 0.35, maxFrac: 0.54 },
  { tierRank: 3, tierNum: 3, tierName: 'T3', minIlvl: 21, minFrac: 0.55, maxFrac: 0.76 },
  { tierRank: 2, tierNum: 2, tierName: 'T2', minIlvl: 30, minFrac: 0.77, maxFrac: 1.00 },
  { tierRank: 1, tierNum: 1, tierName: 'T1', minIlvl: 40, minFrac: 1.01, maxFrac: 1.28 }
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

  // Strictly enforce minIlvl <= cleanIlvl, and weight rolls toward the top 3 unlocked tiers for this ilvl!
  const allowedBrackets = AFFIX_TIER_BRACKETS.filter(b => b.minIlvl <= cleanIlvl);
  const bracketPool = allowedBrackets.length > 0 ? allowedBrackets : [AFFIX_TIER_BRACKETS[0]];
  const topWindow = bracketPool.slice(Math.max(0, bracketPool.length - 3));
  const chosenBracket = preferHighTier
    ? bracketPool[bracketPool.length - 1]
    : (Math.random() < 0.78 ? pick(topWindow) : pick(bracketPool));

  const baseMin = typeof chosen.min === 'number' ? chosen.min : 10;
  const baseMax = typeof chosen.max === 'number' ? chosen.max : 30;
  const span = Math.max(1, baseMax - baseMin);

  const rollMin = Math.max(1, Math.round(baseMin + span * chosenBracket.minFrac));
  const rollMax = Math.max(rollMin + 1, Math.round(baseMin + span * chosenBracket.maxFrac));
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
  const ilvl = Math.max(1, Math.min(52, Math.floor(item.ilvl || item.itemLevel || 1)));
  item.ilvl = ilvl;
  item.itemLevel = ilvl;
  if (item.rarity === 'unique') {
    const tpl = (GameData.UNIQUE_TEMPLATES || []).find(u => u.name === item.name);
    if (tpl) {
      const rebuilt = buildUniqueFromTemplate(tpl, ilvl, item.id);
      item.implicits = rebuilt.implicits;
      item.affixes = rebuilt.affixes;
      item.mods = rebuilt.affixes;
    }
    return item;
  }
  const baseSlot = String(item.slot || '').startsWith('ring') ? 'ring' : item.slot;
  const slotBases = (GameData.GEAR_BASES && GameData.GEAR_BASES[baseSlot]) || [];
  const baseDef = slotBases.find(b => b.name === item.baseName) || slotBases[0];
  if (baseDef && baseDef.implicits) {
    const flatScale = 1 + Math.max(0, ilvl - 1) * 0.055;
    const flatKeys = new Set(['flatDmg', 'maxLife', 'maxEs', 'armor', 'evasion', 'lifeRegen']);
    const normImp = {};
    for (const [k, v] of Object.entries(baseDef.implicits)) {
      normImp[k] = (typeof v === 'number' && flatKeys.has(k)) ? Math.max(1, Math.round(v * flatScale)) : v;
    }
    item.implicits = normImp;
  }
  item.affixes = item.affixes.map(a => {
    if (!a) return a;
    const rangeInfo = GameData.computeAffixTierRange ? GameData.computeAffixTierRange(a, ilvl) : null;
    if (!rangeInfo) return a;
    const { rollMin, rollMax, baseTier, labelTemplate } = rangeInfo;
    const rawVal = typeof a.val === 'number' ? a.val : (typeof a.value === 'number' ? a.value : rollMin);
    const curVal = Math.max(rollMin, Math.min(rollMax, rawVal));
    const tpl = a.labelTemplate || labelTemplate || '+{val}';
    const cleanText = tpl.includes('{val}') ? tpl.replace('{val}', curVal) : String(a.text || '').replace(/^\[T\d+\]\s*/i, '');
    return {
      ...a,
      val: curVal,
      value: curVal,
      rollMin,
      rollMax,
      baseTier,
      labelTemplate: tpl,
      tierName: `${baseTier} (${rollMin}–${rollMax})`,
      text: cleanText
    };
  });
  item.mods = item.affixes;
  return item;
}

const exportsObj = {
  RARE_PREFIXES,
  RARE_SUFFIXES,
  AFFIX_TIER_BRACKETS,
  getMaxTierForIlvl,
  rollAffix,
  normalizeItemAffixRanges
};
Object.assign(global, exportsObj);
module.exports = exportsObj;
