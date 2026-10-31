// Server Items Module: Affix Tier Brackets, Affix Rolling & Range Normalization
const GameData = global.GameData || require('../../public/shared/gameData.js');

// =========================================================================
// GEAR GENERATION (Pure Stats, Implicits & Affixes — Split from Gems!)
// =========================================================================
const RARE_PREFIXES = ['Havoc', 'Bramble', 'Gale', 'Vortex', 'Armageddon', 'Blood', 'Soul', 'Hypnotic', 'Dire', 'Loath', 'Cataclysm', 'Miracle'];
const RARE_SUFFIXES = ['Roar', 'Bite', 'Song', 'Ward', 'Grasp', 'Spire', 'Tread', 'Heart', 'Edge', 'Bane', 'Weaver', 'Shell'];

// Strict PoE Item Level (ilvl) -> Affix Tier Cap Brackets (T6–T1 across Map Tiers 1–16):
const AFFIX_TIER_BRACKETS = [
  { tierRank: 6, tierNum: 6, tierName: 'T6', minIlvl: 1,  minFrac: 0.00, maxFrac: 0.22 },
  { tierRank: 5, tierNum: 5, tierName: 'T5', minIlvl: 6,  minFrac: 0.22, maxFrac: 0.44 },
  { tierRank: 4, tierNum: 4, tierName: 'T4', minIlvl: 13, minFrac: 0.44, maxFrac: 0.68 },
  { tierRank: 3, tierNum: 3, tierName: 'T3', minIlvl: 21, minFrac: 0.68, maxFrac: 0.92 },
  { tierRank: 2, tierNum: 2, tierName: 'T2', minIlvl: 30, minFrac: 0.92, maxFrac: 1.18 },
  { tierRank: 1, tierNum: 1, tierName: 'T1', minIlvl: 40, minFrac: 1.18, maxFrac: 1.48 }
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

  // Flat combat stats scale smoothly with item level across Map Tiers 1-16!
  const isFlatStat = ['flatDmg', 'maxLife', 'maxEs', 'armor', 'evasion', 'lifeRegen', 'lifeOnHit'].includes(chosen.stat);
  const flatIlvlMult = isFlatStat ? (1 + Math.max(0, cleanIlvl - 1) * 0.28 + Math.pow(Math.max(0, cleanIlvl - 1), 1.35) * 0.04) : (1 + Math.floor(Math.max(0, cleanIlvl - 1) / 8) * 0.08);

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
