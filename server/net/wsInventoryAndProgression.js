// Server Network Module: WebSocket Handlers for Inventory, Flask Belt, Gem Links, Skill Tree, Drafts & Vendor/Crafting
const GameData = global.GameData || require('../../public/shared/gameData.js');

function ensureFlaskBeltArrays(player) {
  if (!Array.isArray(player.flaskBelt) || player.flaskBelt.length !== 5) player.flaskBelt = ['life', 'quicksilver', null, null, null];
  if (!Array.isArray(player.flaskBeltItems) || player.flaskBeltItems.length !== 5) player.flaskBeltItems = [null, null, null, null, null];
  if (!Array.isArray(player.flaskSlotCharges) || player.flaskSlotCharges.length !== 5) player.flaskSlotCharges = [15, 20, 0, 0, 0];
  if (!Array.isArray(player.flaskSlotTimers) || player.flaskSlotTimers.length !== 5) player.flaskSlotTimers = [0, 0, 0, 0, 0];
}

function sendCraftFeedback(ws, ok, msg) {
  ws.send(JSON.stringify({ type: 'craft_feedback', ok, msg }));
}

function pushPlayerFloatingText(room, player, val, text, color, size = 16, crit = false, dtype = 'loot') {
  if (!room || room.state !== 'HIDEOUT') return;
  room.fxEvents.push({ kind: 'dmg_num', x: Math.round(player.x), y: Math.round(player.y - 28), val, text, color, size, crit, dtype });
}

function resolveInventoryIndex(player, msg) {
  if (typeof msg.invIdx === 'number' && msg.invIdx >= 0) return msg.invIdx;
  if (msg.itemId) return player.inventory.findIndex(i => i && i.id === msg.itemId);
  return -1;
}

function equipFlaskFromInventorySlot(player, invIdx, slotIdx) {
  const item = player.inventory[invIdx];
  if (!item || (item.slot !== 'flask' && !item.flaskId)) return false;
  ensureFlaskBeltArrays(player);
  const fId = item.flaskId || 'life';
  const fDef = GameData.FLASKS.find(f => f.id === fId) || GameData.FLASKS[0];
  const prevFlaskId = player.flaskBelt[slotIdx];
  const prevMeta = player.flaskBeltItems[slotIdx] || null;
  const newMeta = {
    name: item.name || fDef.name, maxCharges: item.maxCharges || fDef.maxCharges,
    cost: item.cost || fDef.cost, duration: item.duration || fDef.duration,
    mods: Array.isArray(item.mods) ? item.mods : []
  };
  player.flaskBelt[slotIdx] = fDef.id;
  player.flaskBeltItems[slotIdx] = newMeta;
  player.flaskSlotCharges[slotIdx] = newMeta.maxCharges;
  if (!player.unlockedFlasks.includes(fDef.id)) player.unlockedFlasks.push(fDef.id);
  if (prevFlaskId) player.inventory[invIdx] = buildFlaskItem(prevFlaskId, null, prevMeta || false);
  else player.inventory.splice(invIdx, 1);
  recalcPlayer(player, false);
  sendPrivateProfile(player);
  return true;
}

function handleInventoryAndProgressionMessage(ws, msg, currentRoom, currentPlayer) {
  if (msg.type === 'pick_gem_draft' || msg.type === 'select_draft' || msg.type === 'choose_gem_draft') {
    if (applyGemDraftChoice(currentPlayer, msg.optionId || msg.gemId)) {
      if (currentPlayer.lastAutoSupportMsg) {
        sendCraftFeedback(ws, true, currentPlayer.lastAutoSupportMsg);
        addRoomChat(currentRoom, 'Gem Link', `✨ ${currentPlayer.name}: ${currentPlayer.lastAutoSupportMsg}`, '#38d9a9');
      }
      sendPrivateProfile(currentPlayer);
    }
    return true;
  }
  if (msg.type === 'reroll_draft' || msg.type === 'reroll_gem_draft') {
    if (!currentPlayer.pendingDrafts || currentPlayer.pendingDrafts.length === 0) return true;
    const cost = getDraftRerollCost(currentPlayer);
    const isRun = currentRoom.state === 'RUN';
    const availableGold = isRun ? (currentPlayer.runGold || 0) : (currentPlayer.gold || 0);
    if (availableGold < cost) {
      sendCraftFeedback(ws, false, `Need ${cost} ${isRun ? 'Run Gold' : 'Stash Gold'} to reroll Draft choices!`);
      return true;
    }
    if (isRun) currentPlayer.runGold -= cost;
    else currentPlayer.gold -= cost;
    currentPlayer.draftRerolls = (currentPlayer.draftRerolls || 0) + 1;
    currentPlayer.pendingDrafts[0].choices = generateGemDraftOptions(currentPlayer);
    pushPlayerFloatingText(currentRoom, currentPlayer, `REROLLED! (-${cost}G)`, `DRAFT REROLLED! (-${cost}G)`, '#ffd43b', 17, false, 'lightning');
    sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'buy_skill_tome') {
    const cost = getSkillTomeCost(currentPlayer);
    const totalPts = Math.max(0, (currentPlayer.passives ? currentPlayer.passives.length - 1 : 0) + (currentPlayer.passivePoints || 0));
    if (totalPts >= 45 || (currentPlayer.gold || 0) < cost) return true;
    currentPlayer.gold -= cost;
    currentPlayer.passivePoints = (currentPlayer.passivePoints || 0) + 1;
    if (currentPlayer.currencies) {
      currentPlayer.currencies._bonusTreePts = (Number(currentPlayer.currencies._bonusTreePts) || 0) + 1;
    }
    recalcPlayer(currentPlayer, false);
    sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'move_support_gem' || msg.type === 'equip_support_gem') {
    const { fromType, fromSlot, fromIdx, toSlot, toSupIdx } = msg;
    const targetSlot = currentPlayer.gemLinks[toSlot];
    if (!targetSlot || !targetSlot.activeGem) return true;
    const targetActDef = GameData.SKILL_GEMS[targetSlot.activeGem.id];
    const hasSwapTarget = typeof toSupIdx === 'number' && toSupIdx >= 0 && targetSlot.supports[toSupIdx];

    if (fromType === 'slot') {
      const srcSlot = currentPlayer.gemLinks[fromSlot];
      if (!srcSlot || !srcSlot.supports[fromIdx]) return true;
      if (fromSlot === toSlot) {
        if (hasSwapTarget && fromIdx !== toSupIdx) {
          [srcSlot.supports[fromIdx], srcSlot.supports[toSupIdx]] = [srcSlot.supports[toSupIdx], srcSlot.supports[fromIdx]];
          syncSkillRingsFromGemLinks(currentPlayer); recalcPlayer(currentPlayer, false); sendPrivateProfile(currentPlayer);
        }
        return true;
      }
      const candidate = srcSlot.supports[fromIdx];
      if (!canSupportLinkToActive(targetActDef, GameData.SKILL_GEMS[candidate.id])) return true;
      if (hasSwapTarget) {
        const displaced = targetSlot.supports[toSupIdx];
        const srcActDef = srcSlot.activeGem ? GameData.SKILL_GEMS[srcSlot.activeGem.id] : null;
        if (!canSupportLinkToActive(srcActDef, GameData.SKILL_GEMS[displaced.id])) return true;
        if (targetSlot.supports.some((s, i) => i !== toSupIdx && s.id === candidate.id)) return true;
        if (srcSlot.supports.some((s, i) => i !== fromIdx && s.id === displaced.id)) return true;
        srcSlot.supports[fromIdx] = displaced;
        targetSlot.supports[toSupIdx] = candidate;
      } else {
        if (targetSlot.supports.length >= targetSlot.maxSupports || targetSlot.supports.some(s => s.id === candidate.id)) return true;
        srcSlot.supports.splice(fromIdx, 1);
        targetSlot.supports.push(candidate);
      }
      syncSkillRingsFromGemLinks(currentPlayer); recalcPlayer(currentPlayer, false); sendPrivateProfile(currentPlayer);
    } else if (fromType === 'reserve') {
      const rEntry = currentPlayer.supportReserve[fromIdx];
      if (!rEntry) return true;
      const supObj = { id: rEntry.gemId, level: rEntry.level || 1 };
      if (!canSupportLinkToActive(targetActDef, GameData.SKILL_GEMS[supObj.id])) return true;
      if (hasSwapTarget) {
        if (targetSlot.supports.some((s, i) => i !== toSupIdx && s.id === supObj.id)) return true;
        const displaced = targetSlot.supports[toSupIdx];
        targetSlot.supports[toSupIdx] = supObj;
        currentPlayer.supportReserve[fromIdx] = { id: uid('sup'), gemId: displaced.id, level: displaced.level || 1 };
      } else {
        if (targetSlot.supports.length >= targetSlot.maxSupports || targetSlot.supports.some(s => s.id === supObj.id)) return true;
        currentPlayer.supportReserve.splice(fromIdx, 1);
        targetSlot.supports.push(supObj);
      }
      syncSkillRingsFromGemLinks(currentPlayer); recalcPlayer(currentPlayer, false); sendPrivateProfile(currentPlayer);
    }
    return true;
  }
  if (msg.type === 'toss_support_gem' || msg.type === 'drop_support_gem') {
    // Support gem right-click deletion disabled per player UX design
    return true;
  }
  if (msg.type === 'unslot_support_gem' || msg.type === 'unequip_support_gem') {
    const { slotIndex, supIdx } = msg;
    const slot = currentPlayer.gemLinks[slotIndex];
    if (!slot || !slot.supports[supIdx]) return true;
    const removed = slot.supports.splice(supIdx, 1)[0];
    currentPlayer.supportReserve.push({ id: uid('sup'), gemId: removed.id, level: removed.level || 1 });
    syncSkillRingsFromGemLinks(currentPlayer); recalcPlayer(currentPlayer, false); sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'allocate_passive' || msg.type === 'allocate_passive_path') {
    const targetId = msg.targetNodeId || msg.nodeId;
    if (!targetId || !GameData.PASSIVE_NODES[targetId] || currentPlayer.passives.includes(targetId) || (currentPlayer.passivePoints || 0) <= 0) return true;
    const path = findShortestPassivePathToNode(currentPlayer.passives, targetId);
    if (!path || path.length === 0) return true;
    for (const stepId of path.slice(0, currentPlayer.passivePoints)) {
      if (!currentPlayer.passives.includes(stepId) && currentPlayer.passivePoints > 0) {
        currentPlayer.passives.push(stepId);
        currentPlayer.passivePoints--;
      }
    }
    recalcPlayer(currentPlayer, false); sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'refund_passive') {
    const nodeId = msg.nodeId;
    const cls = GameData.CLASSES[currentPlayer.classId] || GameData.CLASSES.Marauder;
    if (!currentPlayer.passives.includes(nodeId) || !canRemovePassiveNode(currentPlayer.passives, nodeId, cls.startNode)) return true;
    currentPlayer.passives = currentPlayer.passives.filter(n => n !== nodeId);
    currentPlayer.passivePoints++;
    recalcPlayer(currentPlayer, false); sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'reset_passive_tree') {
    const cls = GameData.CLASSES[currentPlayer.classId] || GameData.CLASSES.Marauder;
    const startNode = cls.startNode;
    const refundedCount = Math.max(0, (currentPlayer.passives || []).filter(n => n !== startNode).length);
    if (refundedCount > 0) {
      currentPlayer.passives = [startNode];
      currentPlayer.passivePoints = (currentPlayer.passivePoints || 0) + refundedCount;
      recalcPlayer(currentPlayer, false); sendPrivateProfile(currentPlayer);
    }
    return true;
  }
  if (msg.type === 'equip_item') {
    const invIdx = resolveInventoryIndex(currentPlayer, msg);
    const item = currentPlayer.inventory[invIdx];
    if (!item) return true;

    if (item.slot === 'flask' || item.flaskId) {
      ensureFlaskBeltArrays(currentPlayer);
      let targetSlot = typeof msg.beltSlot === 'number' && msg.beltSlot >= 0 && msg.beltSlot < 5
        ? msg.beltSlot
        : currentPlayer.flaskBelt.findIndex(s => !s);
      if (targetSlot < 0) targetSlot = 0;
      equipFlaskFromInventorySlot(currentPlayer, invIdx, targetSlot);
      return true;
    }

    const slot = item.slot;
    const prevEquipped = currentPlayer.equipment[slot];
    currentPlayer.equipment[slot] = item;
    if (prevEquipped) currentPlayer.inventory[invIdx] = prevEquipped;
    else currentPlayer.inventory.splice(invIdx, 1);
    recalcPlayer(currentPlayer, false);
    sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'equip_flask_slot' || msg.type === 'assign_flask_belt') {
    const slotIdx = typeof msg.slotIndex === 'number' ? Math.max(0, Math.min(4, Math.floor(msg.slotIndex))) : 0;
    const invIdx = resolveInventoryIndex(currentPlayer, msg);
    equipFlaskFromInventorySlot(currentPlayer, invIdx, slotIdx);
    return true;
  }
  if (msg.type === 'swap_flask_slots' || msg.type === 'swap_flask_belt') {
    ensureFlaskBeltArrays(currentPlayer);
    const fromSlot = Math.max(0, Math.min(4, Math.floor(Number(msg.fromSlot) || 0)));
    const toSlot = Math.max(0, Math.min(4, Math.floor(Number(msg.toSlot) || 0)));
    if (fromSlot !== toSlot) {
      const belt = currentPlayer.flaskBelt;
      const meta = currentPlayer.flaskBeltItems;
      const chg = currentPlayer.flaskSlotCharges;
      const tmr = currentPlayer.flaskSlotTimers;
      [belt[fromSlot], belt[toSlot]] = [belt[toSlot], belt[fromSlot]];
      [meta[fromSlot], meta[toSlot]] = [meta[toSlot], meta[fromSlot]];
      [chg[fromSlot], chg[toSlot]] = [chg[toSlot], chg[fromSlot]];
      [tmr[fromSlot], tmr[toSlot]] = [tmr[toSlot], tmr[fromSlot]];
      recalcPlayer(currentPlayer, false);
      sendPrivateProfile(currentPlayer);
    }
    return true;
  }
  if (msg.type === 'unequip_flask_slot' || msg.type === 'unassign_flask_belt') {
    ensureFlaskBeltArrays(currentPlayer);
    const slotIdx = Math.max(0, Math.min(4, Math.floor(Number(msg.slotIndex) || 0)));
    const fId = currentPlayer.flaskBelt[slotIdx];
    const prevMeta = currentPlayer.flaskBeltItems[slotIdx] || null;
    if (!fId || currentPlayer.inventory.length >= 50) return true;
    currentPlayer.flaskBelt[slotIdx] = null;
    currentPlayer.flaskBeltItems[slotIdx] = null;
    currentPlayer.flaskSlotCharges[slotIdx] = 0;
    currentPlayer.flaskSlotTimers[slotIdx] = 0;
    currentPlayer.inventory.push(buildFlaskItem(fId, null, prevMeta || false));
    recalcPlayer(currentPlayer, false);
    sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'unequip_item') {
    const slot = msg.slot;
    const item = slot ? currentPlayer.equipment[slot] : null;
    if (!item || currentPlayer.inventory.length >= 50) return true;
    currentPlayer.equipment[slot] = null;
    currentPlayer.inventory.push(item);
    recalcPlayer(currentPlayer, false); sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'drop_item' || msg.type === 'drop_inventory_item' || msg.type === 'delete_item') {
    let item = null;
    const invIdx = resolveInventoryIndex(currentPlayer, msg);
    if (invIdx >= 0 && currentPlayer.inventory[invIdx]) {
      item = currentPlayer.inventory.splice(invIdx, 1)[0];
    } else if (msg.itemId) {
      for (const s of GameData.GEAR_SLOTS) {
        if (currentPlayer.equipment[s] && currentPlayer.equipment[s].id === msg.itemId) {
          item = currentPlayer.equipment[s]; currentPlayer.equipment[s] = null;
          recalcPlayer(currentPlayer, false); break;
        }
      }
    } else if (msg.slot && currentPlayer.equipment[msg.slot]) {
      item = currentPlayer.equipment[msg.slot]; currentPlayer.equipment[msg.slot] = null;
      recalcPlayer(currentPlayer, false);
    }
    if (!item) return true;
    if (msg.type === 'delete_item') {
      sendPrivateProfile(currentPlayer); return true;
    }

    const dx = Math.round(currentPlayer.x + (Math.random() - 0.5) * 45);
    const dy = Math.round(currentPlayer.y + (Math.random() - 0.5) * 45);
    const isFlask = item.slot === 'flask' || Boolean(item.flaskId);
    currentRoom.groundDrops.push({
      id: uid('drop'), x: dx, y: dy, dropType: isFlask ? 'flask' : 'gear', kind: isFlask ? 'flask' : 'item',
      flaskId: isFlask ? (item.flaskId || 'life') : undefined, item, label: item.name,
      rarity: isFlask ? 'flask' : item.rarity, droppedByPlayer: true, ttl: 180
    });
    pushPlayerFloatingText(currentRoom, currentPlayer, `DROPPED: ${item.name}`, `DROPPED: ${item.name}`, '#e2e8f0', 15);
    sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'use_currency' || msg.type === 'craft_item') {
    const currencyId = msg.currencyId || msg.orb;
    let targetLocation = msg.targetLocation;
    let slotOrIdx = msg.slotOrIdx;
    if (!targetLocation && msg.itemId) {
      const invIdx = resolveInventoryIndex(currentPlayer, msg);
      if (invIdx >= 0) {
        targetLocation = 'inventory'; slotOrIdx = invIdx;
      } else {
        for (const s of GameData.GEAR_SLOTS) {
          if (currentPlayer.equipment[s] && currentPlayer.equipment[s].id === msg.itemId) {
            targetLocation = 'equipment'; slotOrIdx = s; break;
          }
        }
      }
    }
    const res = applyCurrencyToItem(currentPlayer, currencyId, targetLocation, slotOrIdx);
    sendCraftFeedback(ws, res.ok, res.ok ? res.msg : res.reason);
    sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'salvage_item' || msg.type === 'sell_item') {
    const invIdx = resolveInventoryIndex(currentPlayer, msg);
    const item = currentPlayer.inventory[invIdx];
    if (!item) return true;
    currentPlayer.inventory.splice(invIdx, 1);

    const isRun = currentRoom.state === 'RUN';
    const res = awardSalvageShards(currentPlayer, item, isRun);

    if (!Array.isArray(currentPlayer.buybackItems)) currentPlayer.buybackItems = [];
    currentPlayer.buybackItems.unshift({ item, price: Math.max(10, res.goldGain * 2) });
    if (currentPlayer.buybackItems.length > 6) currentPlayer.buybackItems.pop();

    const summary = `${res.shardsText}${res.orbsText ? ` (${res.orbsText})` : ''} +${res.goldGain}G`;
    sendCraftFeedback(ws, true, `Salvaged ${item.name}: ${summary}`);
    pushPlayerFloatingText(currentRoom, currentPlayer, `SALVAGED: ${res.shardsText}`, `SALVAGED: ${summary}`, '#ffd43b', 15);
    sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'buy_vendor_item') {
    if (!Array.isArray(currentPlayer.vendorStock) || currentPlayer.vendorStock.length === 0) {
      generatePlayerVendorStock(currentPlayer, currentPlayer.bestTier || 1);
    }
    const stockId = msg.stockId || msg.itemId;
    const entry = (currentPlayer.vendorStock || []).find(e => e && (e.stockId === stockId || (e.item && e.item.id === stockId)));
    if (!entry || entry.sold || !entry.item) return true;
    const isRun = currentRoom.state === 'RUN';
    const availGold = isRun ? (currentPlayer.runGold || 0) : (currentPlayer.gold || 0);
    if (availGold < entry.cost) {
      sendCraftFeedback(ws, false, `Need ${entry.cost} ${isRun ? 'Run Gold' : 'Gold'} to purchase ${entry.item.name}!`);
      return true;
    }
    if (currentPlayer.inventory.length >= 50) {
      sendCraftFeedback(ws, false, 'Character Inventory is full (50/50)! Deposit to Stash [S] or salvage items first.');
      return true;
    }
    if (isRun) currentPlayer.runGold -= entry.cost;
    else currentPlayer.gold -= entry.cost;
    entry.sold = true;
    currentPlayer.inventory.push(entry.item);
    sendCraftFeedback(ws, true, `Purchased ${entry.item.name} for ${entry.cost} Gold!`);
    sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'buyback_item') {
    if (!Array.isArray(currentPlayer.buybackItems)) currentPlayer.buybackItems = [];
    const targetId = msg.buybackId || msg.itemId;
    const bIdx = currentPlayer.buybackItems.findIndex(b => b && b.item && b.item.id === targetId);
    if (bIdx < 0) return true;
    const entry = currentPlayer.buybackItems[bIdx];
    const isRun = currentRoom.state === 'RUN';
    const availGold = isRun ? (currentPlayer.runGold || 0) : (currentPlayer.gold || 0);
    if (availGold < entry.price) {
      sendCraftFeedback(ws, false, `Need ${entry.price} Gold to buy back ${entry.item.name}!`);
      return true;
    }
    if (currentPlayer.inventory.length >= 50) {
      sendCraftFeedback(ws, false, 'Character Inventory is full (50/50)!');
      return true;
    }
    if (isRun) currentPlayer.runGold -= entry.price;
    else currentPlayer.gold -= entry.price;
    currentPlayer.buybackItems.splice(bIdx, 1);
    currentPlayer.inventory.push(entry.item);
    sendCraftFeedback(ws, true, `Bought back ${entry.item.name} for ${entry.price} Gold!`);
    sendPrivateProfile(currentPlayer);
    return true;
  }
  return false;
}

const exportsObj = { ensureFlaskBeltArrays, equipFlaskFromInventorySlot, handleInventoryAndProgressionMessage };
Object.assign(global, exportsObj);
module.exports = exportsObj;
