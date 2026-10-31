// Server Items Module: Draft Choice Application & Currency Orb Crafting
const GameData = global.GameData || require('../../public/shared/gameData.js');

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

const exportsObj = { applyGemDraftChoice, applyCurrencyToItem };
Object.assign(global, exportsObj);
module.exports = exportsObj;
