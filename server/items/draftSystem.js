// Server Items Module: Rogue-Lite Economy Costs, Run Skill Resets & Gem/Boon Draft Generator
const GameData = global.GameData || require('../../public/shared/gameData.js');

// =========================================================================
// ROGUE-LITE PER-RUN STAT UPGRADES & WAVE GEM DRAFT GENERATOR
// =========================================================================
const FALLBACK_RUN_UPGRADES = {
  up_move_speed: {
    id: 'up_move_speed', name: 'Fleetfoot Reflexes', color: 'G',
    subtitle: 'ROGUE-LITE RUN BOON • MOBILITY', desc: '+12% Movement Speed & +10% Attack/Cast Speed',
    stats: { moveSpeedPct: 12, cdrPct: 10 }
  },
  up_extra_proj: {
    id: 'up_extra_proj', name: 'Endless Munitions', color: 'G',
    subtitle: 'ROGUE-LITE RUN BOON • PROJECTILES', desc: '+1 Additional Projectile to all Skills',
    stats: { extraProj: 1 }
  },
  up_armor_ward: {
    id: 'up_armor_ward', name: 'Granite Bastion', color: 'R',
    subtitle: 'ROGUE-LITE RUN BOON • DEFENCE', desc: '+90 Armour & +35 Maximum Life',
    stats: { armor: 90, maxLife: 35 }
  },
  up_phys_might: {
    id: 'up_phys_might', name: 'Brutal Slaughter', color: 'R',
    subtitle: 'ROGUE-LITE RUN BOON • PHYSICAL', desc: '+25% Physical Damage & +10% Area of Effect',
    stats: { physDmgPct: 25, areaPct: 10 }
  },
  up_ele_overload: {
    id: 'up_ele_overload', name: 'Elemental Overload', color: 'B',
    subtitle: 'ROGUE-LITE RUN BOON • ELEMENTAL', desc: '+25% Elemental & Spell Damage & +8% Cast Speed',
    stats: { eleDmgPct: 25, spellDmgPct: 25, cdrPct: 8 }
  },
  up_crit_strikes: {
    id: 'up_crit_strikes', name: 'Deadly Precision', color: 'G',
    subtitle: 'ROGUE-LITE RUN BOON • CRITICAL', desc: '+35% Increased Critical Strike Chance & +25% Crit Multiplier',
    stats: { critChance: 35, critMulti: 25 }
  },
  up_attack_cast: {
    id: 'up_attack_cast', name: 'Soul Acceleration', color: 'G',
    subtitle: 'ROGUE-LITE RUN BOON • SPEED', desc: '+14% Faster Skill Cooldown Recovery & +6% Move Speed',
    stats: { cdrPct: 14, moveSpeedPct: 6 }
  },
  up_aoe_reach: {
    id: 'up_aoe_reach', name: 'Amplified Reach', color: 'B',
    subtitle: 'ROGUE-LITE RUN BOON • AREA', desc: '+18% Area of Effect Radius & +15% Global Damage',
    stats: { areaPct: 18, physDmgPct: 15, eleDmgPct: 15 }
  },
  up_life_regen: {
    id: 'up_life_regen', name: 'Vitality Surge', color: 'R',
    subtitle: 'ROGUE-LITE RUN BOON • VITALITY', desc: '+45 Maximum Life & +4 Life Regenerated per sec',
    stats: { maxLife: 45, lifeRegen: 4 }
  },
  up_es_barrier: {
    id: 'up_es_barrier', name: 'Arcane Aegis', color: 'B',
    subtitle: 'ROGUE-LITE RUN BOON • WARD', desc: '+45 Maximum Energy Shield & +10% Elemental Resistances',
    stats: { maxEs: 45, allRes: 10 }
  },
  up_chain_pierce: {
    id: 'up_chain_pierce', name: 'Ricochet Mastery', color: 'G',
    subtitle: 'ROGUE-LITE RUN BOON • CHAIN', desc: 'Projectiles Chain +1 Time & Pierce +1 Target',
    stats: { extraChain: 1, pierceCount: 1 }
  },
  up_vampiric: {
    id: 'up_vampiric', name: 'Vaal Pact Leech', color: 'R',
    subtitle: 'ROGUE-LITE RUN BOON • LEECH', desc: 'Restore +2 Life on Hit & +15% Global Damage',
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
  const base = 25 * Math.pow(1.24, (player && player.chestsOpened) || 0);
  return Math.max(25, Math.round((base * tierMult) / 5) * 5);
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
    { slotIndex: 0, activeGem: { id: cls.starterSkill, level: 1 }, maxSupports: 5, supports: [] },
    { slotIndex: 1, activeGem: null, maxSupports: 5, supports: [] },
    { slotIndex: 2, activeGem: null, maxSupports: 5, supports: [] },
    { slotIndex: 3, activeGem: null, maxSupports: 5, supports: [] }
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

  const ownedActives = new Map();
  const activeSkillTags = new Set();

  player.gemLinks.forEach((slot, idx) => {
    if (slot.activeGem) {
      ownedActives.set(slot.activeGem.id, { slotIndex: idx, level: slot.activeGem.level, slot });
      const actDef = GameData.SKILL_GEMS[slot.activeGem.id];
      if (actDef) {
        for (const t of (actDef.tags || [])) activeSkillTags.add(t);
      }
    }
  });

  const hasOpenActiveSlot = player.gemLinks.some(s => !s.activeGem);
  const colorLabel = (c) => (c === 'R' ? 'RED (STR)' : c === 'G' ? 'GREEN (DEX)' : c === 'B' ? 'BLUE (INT)' : 'PRISMATIC');

  // 1. Main Skill Pool (Upgrade existing Main Skills or Unlock New Main Skill — automatically grants a Support Gem!)
  const activePool = [];
  for (const act of activeDefs) {
    if (ownedActives.has(act.id)) {
      const info = ownedActives.get(act.id);
      if (info.level < 10) {
        activePool.push({
          optionId: `act_up_${act.id}`,
          optionType: 'active_upgrade',
          kind: 'active_upgrade',
          gemId: act.id,
          color: act.color,
          title: `${act.name} (Lv. ${info.level + 1})`,
          subtitle: `${colorLabel(act.color)} MAIN SKILL + AUTO-SUPPORT`,
          desc: `Levels up ${act.name} to Lv. ${info.level + 1} (+14% MORE Damage, +3% Area & Speed) AND auto-links a random Support Gem!`,
          weight: 3.2
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
        subtitle: `NEW ${colorLabel(act.color)} MAIN SKILL + AUTO-SUPPORT`,
        desc: `${act.description} Automatically links a random compatible Support Gem!`,
        weight: 2.8
      });
    }
  }

  // 2. Context-Aware Rogue-lite Boon & Ascendancy Modifier Pool (also auto-grants a random Support Gem to your skills!)
  const runPool = [];
  const runCatalog = Object.assign({}, getRunUpgradesCatalog());
  if (GameData.ASCENDANCY_BOONS) {
    const ascList = Array.isArray(GameData.ASCENDANCY_BOONS) ? GameData.ASCENDANCY_BOONS : Object.values(GameData.ASCENDANCY_BOONS);
    for (const ab of ascList) {
      if (ab && ab.id && !runCatalog[ab.id]) runCatalog[ab.id] = ab;
    }
  }
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
      subtitle: `${up.subtitle || 'ASCENDANCY RUN MODIFIER'} + AUTO-SUPPORT`,
      desc: `${up.desc || up.description || 'Increases character power for this Map Run.'} (+1 Random Support Gem auto-linked!)`,
      weight: 3.4
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

  // Guarantee at least 1 Main Skill option and at least 1 Ascendancy/Run Modifier option when available!
  if (activePool.length > 0) {
    const chosenAct = pickWeighted(activePool);
    if (chosenAct) {
      usedIds.add(chosenAct.optionId);
      options.push(chosenAct);
    }
  }
  if (runPool.length > 0) {
    const chosenRun = pickWeighted(runPool);
    if (chosenRun) {
      usedIds.add(chosenRun.optionId);
      options.push(chosenRun);
    }
  }

  const combined = [...activePool, ...runPool];
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

const exportsObj = {
  FALLBACK_RUN_UPGRADES,
  getRunUpgradesCatalog,
  getNextChestCost,
  getDraftRerollCost,
  getSkillTomeCost,
  getGambleCosts,
  syncSkillRingsFromGemLinks,
  getCharXpForLevel,
  resetPlayerRunSkills,
  canSupportLinkToActive,
  generateGemDraftOptions,
  queueGemDraft
};
Object.assign(global, exportsObj);
module.exports = exportsObj;
