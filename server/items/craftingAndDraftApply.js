// Server Items Module: Draft Choice Application & Currency Orb Crafting
const GameData = global.GameData || require('../../public/shared/gameData.js');

function autoGrantRandomSupportGem(player, preferredActiveId = null) {
  const supportDefs = Object.values(GameData.SKILL_GEMS).filter(g => g && g.type === 'support');
  if (supportDefs.length === 0) return null;

  const activeSlots = (player.gemLinks || []).filter(s => s && s.activeGem);
  if (activeSlots.length === 0) return null;

  // Ensure every active slot supports up to 5 Support Gems (6-Link) automatically
  for (const s of activeSlots) {
    if ((s.maxSupports || 2) < 5) s.maxSupports = 5;
    if (!Array.isArray(s.supports)) s.supports = [];
  }

  // Sort slots: preferredActiveId first, then fewest linked supports
  const orderedSlots = [...activeSlots].sort((a, b) => {
    if (preferredActiveId) {
      if (a.activeGem.id === preferredActiveId && b.activeGem.id !== preferredActiveId) return -1;
      if (b.activeGem.id === preferredActiveId && a.activeGem.id !== preferredActiveId) return 1;
    }
    return a.supports.length - b.supports.length;
  });

  // 1. Try to auto-link a new random compatible Support Gem into an open socket (< 5 supports)
  for (const slot of orderedSlots) {
    if (slot.supports.length >= 5) continue;
    const actDef = GameData.SKILL_GEMS[slot.activeGem.id];
    if (!actDef) continue;
    const compat = supportDefs.filter(
      sup => canSupportLinkToActive(actDef, sup) && !slot.supports.some(s => s && s.id === sup.id)
    );
    if (compat.length > 0) {
      const picked = pick(compat);
      slot.supports.push({ id: picked.id, level: 1 });
      return `Auto-Linked ${picked.name} → ${actDef.name} (${1 + slot.supports.length}-Link)!`;
    }
  }

  // 2. If all equipped skills have full 6-Links (or all compatible supports linked), level up a linked Support Gem!
  const allLinkedPairs = [];
  for (const slot of orderedSlots) {
    const actDef = GameData.SKILL_GEMS[slot.activeGem.id];
    for (const sup of slot.supports) {
      if (sup && (sup.level || 1) < 8) {
        allLinkedPairs.push({ slot, actDef, sup, supDef: GameData.SKILL_GEMS[sup.id] });
      }
    }
  }
  if (allLinkedPairs.length > 0) {
    const target = pick(allLinkedPairs);
    target.sup.level = (target.sup.level || 1) + 1;
    return `Upgraded ${target.supDef ? target.supDef.name : target.sup.id} (Lv. ${target.sup.level}) on ${target.actDef ? target.actDef.name : 'Skill'}!`;
  }
  return null;
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
  let preferredSkillId = null;
  if (choice.kind === 'run_upgrade' || choice.optionType === 'run_upgrade') {
    if (!player.runUpgrades) player.runUpgrades = {};
    player.runUpgrades[choice.gemId] = (player.runUpgrades[choice.gemId] || 0) + 1;
    healBonus = true;
  } else if (choice.kind === 'active_upgrade') {
    preferredSkillId = choice.gemId;
    for (const slot of player.gemLinks) {
      if (slot.activeGem && slot.activeGem.id === choice.gemId) {
        slot.activeGem.level = (slot.activeGem.level || 1) + 1;
        break;
      }
    }
  } else if (choice.kind === 'active_new') {
    preferredSkillId = choice.gemId;
    const emptySlot = player.gemLinks.find(s => !s.activeGem);
    if (emptySlot) {
      emptySlot.activeGem = { id: choice.gemId, level: 1 };
      emptySlot.maxSupports = 5;
    }
  }

  // Every draft pick (Main Skill or Ascendancy Run Modifier) automatically links or upgrades a random compatible Support Gem!
  player.lastAutoSupportMsg = autoGrantRandomSupportGem(player, preferredSkillId);

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
  } else if (targetLocation === 'stash') {
    if (!Array.isArray(player.accountStash) && typeof getAccountStash === 'function') {
      player.accountStash = getAccountStash(player.accountId);
    }
    item = Array.isArray(player.accountStash) ? player.accountStash[slotOrIdx] : null;
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
    if (targetLocation === 'stash' && typeof saveAccountStash === 'function') {
      saveAccountStash(player.accountId, player.accountStash);
    }
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
  if (targetLocation === 'stash' && typeof saveAccountStash === 'function') {
    saveAccountStash(player.accountId, player.accountStash);
  }
  recalcPlayer(player, false);
  return { ok: true, msg: `Crafted ${item.name} (ilvl ${ilvl}, max ${item.maxTierForIlvl}) with ${GameData.CURRENCIES[currencyId].name}!` };
}

function generatePlayerVendorStock(player, mapTierOverride = null) {
  const tier = Math.max(1, mapTierOverride || (player && player.bestTier) || 1);
  const baseIlvl = Math.max(1, Math.min(48, (tier - 1) * 3 + 2));
  const slotPlan = [
    'weapon',
    'body',
    pick(['helm', 'gloves', 'boots']),
    pick(['helm', 'gloves', 'boots']),
    pick(['ring', 'amulet', 'belt']),
    pick(GameData.GEAR_SLOTS)
  ];
  const stock = slotPlan.map((slot, idx) => {
    const itemIlvl = Math.max(1, baseIlvl + (idx >= 3 ? 1 : 0));
    let rarity = 'magic';
    if (idx === 5) {
      rarity = 'rare';
    } else if (idx === 3 || Math.random() < 0.42) {
      rarity = 'rare';
    }
    const item = generateGearItem(slot, rarity, itemIlvl, 0);
    const cost = rarity === 'unique'
      ? Math.round(220 + itemIlvl * 24)
      : rarity === 'rare'
        ? Math.round(75 + itemIlvl * 11)
        : Math.round(40 + itemIlvl * 6);
    return {
      stockId: item.id,
      item,
      cost,
      sold: false
    };
  });
  if (player) {
    player.vendorStock = stock;
    if (player.currencies) player.currencies._vendorStock = stock;
  }
  return stock;
}

function awardSalvageShards(player, item, isRunMode = false) {
  if (!player.currencies) player.currencies = {};
  if (!player.currencies._shards || typeof player.currencies._shards !== 'object') {
    player.currencies._shards = { transmute: 0, alteration: 0, alchemy: 0, chaos: 0, exalted: 0, divine: 0 };
  }
  const shards = player.currencies._shards;
  const ilvl = Math.max(1, Math.floor((item && (item.ilvl || item.itemLevel)) || 1));
  const gains = {};

  if (item && (item.slot === 'flask' || item.rarity === 'flask')) {
    gains.alteration = 4;
  } else if (item && item.rarity === 'unique') {
    gains.chaos = 5;
    gains.exalted = 4;
    gains.divine = 3;
  } else if (item && item.rarity === 'rare') {
    gains.alchemy = 4 + (ilvl >= 14 ? 2 : 0);
    gains.chaos = 2 + Math.min(4, Math.floor(ilvl / 10));
    if (ilvl >= 20) gains.exalted = 1 + (ilvl >= 35 ? 1 : 0);
  } else if (item && item.rarity === 'magic') {
    gains.transmute = 2;
    gains.alteration = 4 + (ilvl >= 12 ? 2 : 0);
  } else {
    gains.transmute = 4;
  }

  const shardParts = [];
  const orbParts = [];
  const shortNames = {
    transmute: 'Transmute',
    alteration: 'Alteration',
    alchemy: 'Alchemy',
    chaos: 'Chaos',
    exalted: 'Exalted',
    divine: 'Divine'
  };

  for (const [k, amt] of Object.entries(gains)) {
    shards[k] = (shards[k] || 0) + amt;
    shardParts.push(`+${amt} ${shortNames[k]} Shards`);
    if (shards[k] >= 10) {
      const fullOrbs = Math.floor(shards[k] / 10);
      shards[k] %= 10;
      player.currencies[k] = (player.currencies[k] || 0) + fullOrbs;
      orbParts.push(`+${fullOrbs} ${shortNames[k]} Orb${fullOrbs > 1 ? 's' : ''}!`);
    }
  }

  const goldGain = item && item.rarity === 'unique'
    ? Math.round(18 + ilvl * 2)
    : item && item.rarity === 'rare'
      ? Math.round(8 + ilvl * 1.2)
      : Math.round(4 + ilvl * 0.6);

  if (isRunMode) {
    player.runGold = (player.runGold || 0) + goldGain;
  }
  player.gold = (player.gold || 0) + goldGain;

  return {
    goldGain,
    shardsText: shardParts.join(', '),
    orbsText: orbParts.join(' ')
  };
}

const exportsObj = { applyGemDraftChoice, applyCurrencyToItem, generatePlayerVendorStock, awardSalvageShards };
Object.assign(global, exportsObj);
module.exports = exportsObj;
