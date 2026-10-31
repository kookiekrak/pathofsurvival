// Server Network Module: WebSocket Handlers for Inventory, Flask Belt, Gem Links, Skill Tree, Drafts & Vendor/Crafting
const GameData = global.GameData || require('../../public/shared/gameData.js');

function ensureFlaskBeltArrays(player) {
  if (!Array.isArray(player.flaskBelt) || player.flaskBelt.length !== 5) {
    player.flaskBelt = ['life', null, null, null, null];
  }
  if (!Array.isArray(player.flaskSlotCharges) || player.flaskSlotCharges.length !== 5) {
    player.flaskSlotCharges = [15, 0, 0, 0, 0];
  }
  if (!Array.isArray(player.flaskSlotTimers) || player.flaskSlotTimers.length !== 5) {
    player.flaskSlotTimers = [0, 0, 0, 0, 0];
  }
}

function sendCraftFeedback(ws, ok, msg) {
  ws.send(JSON.stringify({ type: 'craft_feedback', ok, msg }));
}

function pushPlayerFloatingText(room, player, val, text, color, size = 16, crit = false, dtype = 'loot') {
  room.fxEvents.push({
    kind: 'dmg_num', x: Math.round(player.x), y: Math.round(player.y - 28),
    val, text, color, size, crit, dtype
  });
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
  player.flaskBelt[slotIdx] = fDef.id;
  player.flaskSlotCharges[slotIdx] = fDef.maxCharges;
  if (!player.unlockedFlasks.includes(fDef.id)) {
    player.unlockedFlasks.push(fDef.id);
  }
  if (prevFlaskId) player.inventory[invIdx] = buildFlaskItem(prevFlaskId);
  else player.inventory.splice(invIdx, 1);
  recalcPlayer(player, false);
  sendPrivateProfile(player);
  return true;
}

function handleInventoryAndProgressionMessage(ws, msg, currentRoom, currentPlayer) {
  if (msg.type === 'pick_gem_draft' || msg.type === 'select_draft' || msg.type === 'choose_gem_draft') {
    if (applyGemDraftChoice(currentPlayer, msg.optionId || msg.gemId)) {
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
    // Move a support gem between Active Skill Slots or Support Reserve in the Gem Links Panel
    const { fromType, fromSlot, fromIdx, toSlot } = msg;
    const targetSlot = currentPlayer.gemLinks[toSlot];
    if (!targetSlot || !targetSlot.activeGem || targetSlot.supports.length >= targetSlot.maxSupports) return true;

    let supObj = null;
    if (fromType === 'reserve') {
      const rEntry = currentPlayer.supportReserve[fromIdx];
      if (!rEntry || targetSlot.supports.some(s => s.id === rEntry.gemId)) return true;
      currentPlayer.supportReserve.splice(fromIdx, 1);
      supObj = { id: rEntry.gemId, level: rEntry.level || 1 };
    } else if (fromType === 'slot') {
      const srcSlot = currentPlayer.gemLinks[fromSlot];
      if (!srcSlot || !srcSlot.supports[fromIdx]) return true;
      const candidate = srcSlot.supports[fromIdx];
      if (targetSlot.supports.some(s => s.id === candidate.id)) return true;
      srcSlot.supports.splice(fromIdx, 1);
      supObj = candidate;
    }
    if (supObj) {
      const actDef = GameData.SKILL_GEMS[targetSlot.activeGem.id];
      const supDef = GameData.SKILL_GEMS[supObj.id];
      if (!canSupportLinkToActive(actDef, supDef)) {
        // Put back if incompatible with target active skill
        if (fromType === 'reserve') {
          currentPlayer.supportReserve.splice(fromIdx, 0, { id: uid('sup'), gemId: supObj.id, level: supObj.level || 1 });
        } else if (fromType === 'slot' && currentPlayer.gemLinks[fromSlot]) {
          currentPlayer.gemLinks[fromSlot].supports.splice(fromIdx, 0, supObj);
        }
        return true;
      }
      targetSlot.supports.push(supObj);
      syncSkillRingsFromGemLinks(currentPlayer);
      recalcPlayer(currentPlayer, false);
      sendPrivateProfile(currentPlayer);
    }
    return true;
  }
  if (msg.type === 'unslot_support_gem' || msg.type === 'unequip_support_gem') {
    const { slotIndex, supIdx } = msg;
    const slot = currentPlayer.gemLinks[slotIndex];
    if (!slot || !slot.supports[supIdx]) return true;
    const removed = slot.supports.splice(supIdx, 1)[0];
    currentPlayer.supportReserve.push({ id: uid('sup'), gemId: removed.id, level: removed.level || 1 });
    syncSkillRingsFromGemLinks(currentPlayer);
    recalcPlayer(currentPlayer, false);
    sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'allocate_passive' || msg.type === 'allocate_passive_path') {
    const targetId = msg.targetNodeId || msg.nodeId;
    if (!targetId || !GameData.PASSIVE_NODES[targetId] || currentPlayer.passives.includes(targetId)) return true;
    if ((currentPlayer.passivePoints || 0) <= 0) return true;
    const path = findShortestPassivePathToNode(currentPlayer.passives, targetId);
    if (!path || path.length === 0) return true;

    const stepsToAlloc = path.slice(0, currentPlayer.passivePoints);
    for (const stepId of stepsToAlloc) {
      if (!currentPlayer.passives.includes(stepId) && currentPlayer.passivePoints > 0) {
        currentPlayer.passives.push(stepId);
        currentPlayer.passivePoints--;
      }
    }
    recalcPlayer(currentPlayer, false);
    sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'refund_passive') {
    // Rogue-lite Free Skill Tree Refund: Right-clicking any removable node refunds it for FREE!
    const nodeId = msg.nodeId;
    const cls = GameData.CLASSES[currentPlayer.classId] || GameData.CLASSES.Marauder;
    if (!currentPlayer.passives.includes(nodeId)) return true;
    if (!canRemovePassiveNode(currentPlayer.passives, nodeId, cls.startNode)) return true;

    currentPlayer.passives = currentPlayer.passives.filter(n => n !== nodeId);
    currentPlayer.passivePoints++;
    recalcPlayer(currentPlayer, false);
    sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'reset_passive_tree') {
    // Rogue-lite 1-Click Free Reset of entire Skill Tree!
    const cls = GameData.CLASSES[currentPlayer.classId] || GameData.CLASSES.Marauder;
    const startNode = cls.startNode;
    const refundedCount = Math.max(0, (currentPlayer.passives || []).filter(n => n !== startNode).length);
    if (refundedCount > 0) {
      currentPlayer.passives = [startNode];
      currentPlayer.passivePoints = (currentPlayer.passivePoints || 0) + refundedCount;
      recalcPlayer(currentPlayer, false);
      sendPrivateProfile(currentPlayer);
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
      const chg = currentPlayer.flaskSlotCharges;
      const tmr = currentPlayer.flaskSlotTimers;
      [belt[fromSlot], belt[toSlot]] = [belt[toSlot], belt[fromSlot]];
      [chg[fromSlot], chg[toSlot]] = [chg[toSlot], chg[fromSlot]];
      [tmr[fromSlot], tmr[toSlot]] = [tmr[toSlot], tmr[fromSlot]];
      recalcPlayer(currentPlayer, false);
      sendPrivateProfile(currentPlayer);
    }
    return true;
  }
  if (msg.type === 'unequip_flask_slot' || msg.type === 'unassign_flask_belt') {
    if (!Array.isArray(currentPlayer.flaskBelt) || currentPlayer.flaskBelt.length !== 5) return true;
    const slotIdx = Math.max(0, Math.min(4, Math.floor(Number(msg.slotIndex) || 0)));
    const fId = currentPlayer.flaskBelt[slotIdx];
    if (!fId || currentPlayer.inventory.length >= 32) return true;
    currentPlayer.flaskBelt[slotIdx] = null;
    currentPlayer.flaskSlotCharges[slotIdx] = 0;
    currentPlayer.flaskSlotTimers[slotIdx] = 0;
    currentPlayer.inventory.push(buildFlaskItem(fId));
    recalcPlayer(currentPlayer, false);
    sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'unequip_item') {
    const slot = msg.slot;
    const item = slot ? currentPlayer.equipment[slot] : null;
    if (!item || currentPlayer.inventory.length >= 32) return true;
    currentPlayer.equipment[slot] = null;
    currentPlayer.inventory.push(item);
    recalcPlayer(currentPlayer, false);
    sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'drop_item' || msg.type === 'delete_item') {
    // Drop Gear or Flask onto Ground so Other Players Can Inspect & Pick It Up to Trade!
    let item = null;
    const invIdx = resolveInventoryIndex(currentPlayer, msg);
    if (invIdx >= 0 && currentPlayer.inventory[invIdx]) {
      item = currentPlayer.inventory.splice(invIdx, 1)[0];
    } else if (msg.itemId) {
      for (const s of GameData.GEAR_SLOTS) {
        if (currentPlayer.equipment[s] && currentPlayer.equipment[s].id === msg.itemId) {
          item = currentPlayer.equipment[s];
          currentPlayer.equipment[s] = null;
          recalcPlayer(currentPlayer, false);
          break;
        }
      }
    } else if (msg.slot && currentPlayer.equipment[msg.slot]) {
      item = currentPlayer.equipment[msg.slot];
      currentPlayer.equipment[msg.slot] = null;
      recalcPlayer(currentPlayer, false);
    }
    if (!item) return true;
    if (msg.type === 'delete_item') {
      sendPrivateProfile(currentPlayer);
      return true;
    }

    const dx = Math.round(currentPlayer.x + (Math.random() - 0.5) * 45);
    const dy = Math.round(currentPlayer.y + (Math.random() - 0.5) * 45);
    const isFlask = item.slot === 'flask' || Boolean(item.flaskId);
    currentRoom.groundDrops.push({
      id: uid('drop'), x: dx, y: dy,
      dropType: isFlask ? 'flask' : 'gear',
      kind: isFlask ? 'flask' : 'item',
      flaskId: isFlask ? (item.flaskId || 'life') : undefined,
      item: isFlask ? undefined : item,
      label: item.name,
      rarity: isFlask ? 'flask' : item.rarity,
      droppedByPlayer: true, ttl: 180
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
        targetLocation = 'inventory';
        slotOrIdx = invIdx;
      } else {
        for (const s of GameData.GEAR_SLOTS) {
          if (currentPlayer.equipment[s] && currentPlayer.equipment[s].id === msg.itemId) {
            targetLocation = 'equipment';
            slotOrIdx = s;
            break;
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

    const ilvl = Math.max(1, Math.floor(item.ilvl || item.itemLevel || 1));
    let goldGain = Math.round(3 + ilvl);
    if (item.rarity === 'unique') goldGain = Math.round(30 + ilvl * 4);
    else if (item.rarity === 'rare') goldGain = Math.round(14 + ilvl * 2.5);
    else if (item.rarity === 'magic') goldGain = Math.round(6 + ilvl * 1.5);

    if (!Array.isArray(currentPlayer.buybackItems)) currentPlayer.buybackItems = [];
    currentPlayer.buybackItems.unshift({ item, price: goldGain });
    if (currentPlayer.buybackItems.length > 8) currentPlayer.buybackItems.pop();

    currentPlayer.gold = (currentPlayer.gold || 0) + goldGain;
    pushPlayerFloatingText(currentRoom, currentPlayer, `SOLD: +${goldGain}G`, `SOLD TO BLACK MARKET: +${goldGain} GOLD`, '#facc15', 16);
    sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'buyback_item') {
    if (!Array.isArray(currentPlayer.buybackItems)) currentPlayer.buybackItems = [];
    const targetId = msg.buybackId || msg.itemId;
    const bIdx = currentPlayer.buybackItems.findIndex(b => b && b.item && b.item.id === targetId);
    if (bIdx < 0) return true;
    const entry = currentPlayer.buybackItems[bIdx];
    if ((currentPlayer.gold || 0) < entry.price) {
      sendCraftFeedback(ws, false, `Need ${entry.price} Stash Gold to buy back ${entry.item.name}!`);
      return true;
    }
    if (currentPlayer.inventory.length >= 32) {
      sendCraftFeedback(ws, false, 'Inventory is full (32/32)!');
      return true;
    }
    currentPlayer.gold -= entry.price;
    currentPlayer.buybackItems.splice(bIdx, 1);
    currentPlayer.inventory.push(entry.item);
    sendCraftFeedback(ws, true, `Bought back ${entry.item.name} for ${entry.price} Gold!`);
    sendPrivateProfile(currentPlayer);
    return true;
  }
  if (msg.type === 'gamble_item') {
    const cat = msg.category || 'weapon';
    const gCosts = getGambleCosts(currentRoom, currentPlayer);
    const cost = cat === 'weapon' ? gCosts.weapon : cat === 'body' ? (gCosts.body || gCosts.armour) : cat === 'jewelry' ? gCosts.jewelry : gCosts.armour;
    if ((currentPlayer.gold || 0) < cost) {
      sendCraftFeedback(ws, false, `Need ${cost} Stash Gold to gamble ${cat.toUpperCase()}!`);
      return true;
    }
    if (currentPlayer.inventory.length >= 32) {
      sendCraftFeedback(ws, false, 'Inventory is full (32/32)! Open Black Market & Right-Click items to sell.');
      return true;
    }
    currentPlayer.gold -= cost;
    const slotPool = cat === 'weapon' ? ['weapon'] : cat === 'body' ? ['body'] : cat === 'jewelry' ? ['ring', 'amulet', 'belt'] : ['boots', 'helm', 'gloves'];
    const chosenSlot = pick(slotPool);
    const roll = Math.random();
    const rarity = roll < 0.012 ? 'unique' : roll < 0.39 ? 'rare' : 'magic';
    const item = generateGearItem(chosenSlot, rarity, gCosts.ilvl, 0);
    let autoEquipped = false;
    if (!currentPlayer.equipment[chosenSlot]) {
      currentPlayer.equipment[chosenSlot] = item;
      autoEquipped = true;
      recalcPlayer(currentPlayer, false);
    } else {
      currentPlayer.inventory.push(item);
    }
    const col = rarity === 'unique' ? '#ff922b' : rarity === 'rare' ? '#ffd43b' : '#74c0fc';
    pushPlayerFloatingText(currentRoom, currentPlayer, `GAMBLED: ${item.name.toUpperCase()}`, `GAMBLED [${rarity.toUpperCase()}]: ${item.name}`, col, 17, rarity !== 'magic');
    sendCraftFeedback(ws, true, `Gambled ${rarity.toUpperCase()} ${item.name} (ilvl ${gCosts.ilvl})${autoEquipped ? ' — Auto-Equipped!' : '!'}`);
    sendPrivateProfile(currentPlayer);
    return true;
  }
  return false;
}

const exportsObj = { ensureFlaskBeltArrays, equipFlaskFromInventorySlot, handleInventoryAndProgressionMessage };
Object.assign(global, exportsObj);
module.exports = exportsObj;
