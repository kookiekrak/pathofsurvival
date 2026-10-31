// Server Module: WebSocket Connection & Client Message Handlers
const GameData = require('../public/shared/gameData.js');
// =========================================================================
// WEBSOCKET MESSAGE HANDLERS
// =========================================================================
wss.on('connection', (ws) => {
  let currentRoom = null;
  let currentPlayer = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.type === 'join') {
      const roomCode = ((msg.roomCode || 'ORIATH').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'ORIATH').slice(0, 8);
      let room = rooms.get(roomCode);
      if (!room) room = createRoom(roomCode, msg.roomName);

      if (currentRoom && currentPlayer) {
        saveCharacterToDb(currentPlayer);
        currentRoom.players.delete(currentPlayer.id);
      }

      currentRoom = room;
      currentPlayer = createPlayer(ws, msg.name, msg.classId, msg.accountId, msg.characterId);
      room.players.set(currentPlayer.id, currentPlayer);

      ws.send(JSON.stringify({ type: 'chat_history', log: room.chatLog }));
      addRoomChat(room, 'Party', `${currentPlayer.name} (Lv.${currentPlayer.level} ${currentPlayer.classId}) joined the instance.`, '#63a4ff');
      sendPrivateProfile(currentPlayer);
      return;
    }

    if (!currentRoom || !currentPlayer) return;

    if (msg.type === 'input') {
      currentPlayer.input = {
        up: !!msg.up,
        down: !!msg.down,
        left: !!msg.left,
        right: !!msg.right,
        firing: !!msg.firing
      };
      if (typeof msg.aimX === 'number' && typeof msg.aimY === 'number') {
        currentPlayer.aimX = msg.aimX;
        currentPlayer.aimY = msg.aimY;
      }
    } else if (msg.type === 'use_vaal') {
      triggerVaalSkill(currentRoom, currentPlayer);
    } else if (msg.type === 'buy_upgrade_chest' || msg.type === 'interact_chest') {
      if (currentRoom.state === 'RUN') {
        tryBuyUpgradeChest(currentRoom, currentPlayer, msg.chestId || msg.id || null);
      }
    } else if (msg.type === 'dash') {
      if (!currentPlayer.dead && currentPlayer.dashCooldown <= 0) {
        const hasSevenLeague = currentPlayer.stats && currentPlayer.stats.sevenLeagueDash > 0;
        currentPlayer.dashCooldown = hasSevenLeague ? 1.4 : 2.6;
        currentPlayer.dashTimer = 0.22;
        const len = Math.hypot(currentPlayer.aimX, currentPlayer.aimY) || 1;
        currentPlayer.dashDirX = currentPlayer.aimX / len;
        currentPlayer.dashDirY = currentPlayer.aimY / len;
        currentRoom.fxEvents.push({
          kind: 'nova',
          x: Math.round(currentPlayer.x),
          y: Math.round(currentPlayer.y),
          r: hasSevenLeague ? 56 : 42,
          color: hasSevenLeague ? '#74c0fc' : '#ff6b4a'
        });
      }
    } else if (msg.type === 'flask') {
      if (currentPlayer.dead) return;
      if (!Array.isArray(currentPlayer.flaskBelt) || currentPlayer.flaskBelt.length !== 5) {
        currentPlayer.flaskBelt = ['life', null, null, null, null];
      }
      if (!Array.isArray(currentPlayer.flaskSlotCharges) || currentPlayer.flaskSlotCharges.length !== 5) {
        currentPlayer.flaskSlotCharges = currentPlayer.flaskBelt.map(fId => {
          const fDef = fId ? GameData.FLASKS.find(f => f.id === fId) : null;
          return fDef ? fDef.maxCharges : 0;
        });
      }
      if (!Array.isArray(currentPlayer.flaskSlotTimers) || currentPlayer.flaskSlotTimers.length !== 5) {
        currentPlayer.flaskSlotTimers = [0, 0, 0, 0, 0];
      }

      let slotIdx = typeof msg.slotIndex === 'number' ? Math.max(0, Math.min(4, Math.floor(msg.slotIndex))) : -1;
      if (slotIdx < 0 && msg.flaskId) {
        // Find a belt slot containing msg.flaskId that has enough charges (or first matching slot)
        slotIdx = currentPlayer.flaskBelt.findIndex((fId, idx) => {
          if (fId !== msg.flaskId) return false;
          const def = GameData.FLASKS.find(f => f.id === fId);
          return def && (currentPlayer.flaskSlotCharges[idx] || 0) >= def.cost;
        });
        if (slotIdx < 0) {
          slotIdx = currentPlayer.flaskBelt.indexOf(msg.flaskId);
        }
      }
      if (slotIdx < 0 || slotIdx > 4) return;

      const flaskId = currentPlayer.flaskBelt[slotIdx];
      if (!flaskId) return;
      const fDef = GameData.FLASKS.find(f => f.id === flaskId);
      if (!fDef) return;
      const curCharges = currentPlayer.flaskSlotCharges[slotIdx] ?? (currentPlayer.flaskCharges[flaskId] || 0);
      if (curCharges < fDef.cost) return;

      if (flaskId === 'life') {
        if (currentPlayer.hp >= currentPlayer.maxHp) return;
        currentPlayer.flaskSlotCharges[slotIdx] = Math.max(0, curCharges - fDef.cost);
        currentPlayer.flaskCharges.life = currentPlayer.flaskSlotCharges[slotIdx];
        currentPlayer.hp = Math.min(currentPlayer.maxHp, currentPlayer.hp + Math.round(currentPlayer.maxHp * 0.45));
      } else {
        currentPlayer.flaskSlotCharges[slotIdx] = Math.max(0, curCharges - fDef.cost);
        currentPlayer.flaskCharges[flaskId] = currentPlayer.flaskSlotCharges[slotIdx];
        currentPlayer.flaskSlotTimers[slotIdx] = fDef.duration;
        currentPlayer.activeFlasks[flaskId] = fDef.duration;
        if (flaskId === 'quartz') {
          currentPlayer.es = Math.min(currentPlayer.maxEs, currentPlayer.es + Math.round(currentPlayer.maxEs * 0.4));
        } else if (flaskId === 'amethyst') {
          currentPlayer.hp = Math.min(currentPlayer.maxHp, currentPlayer.hp + Math.round(currentPlayer.maxHp * 0.2));
          currentPlayer.es = Math.min(currentPlayer.maxEs, currentPlayer.es + Math.round(currentPlayer.maxEs * 0.2));
        }
        recalcPlayer(currentPlayer, false);
      }
      sendPrivateProfile(currentPlayer);
    } else if (msg.type === 'pickup_drop' || msg.type === 'pickup_loot') {
      // Explicit click-to-pickup for Ground Gear (or Currency)
      const targetId = msg.dropId || msg.lootId || msg.id;
      const drop = currentRoom.groundDrops.find(d => d.id === targetId);
      if (!drop || currentPlayer.dead) return;
      if (dist(currentPlayer.x, currentPlayer.y, drop.x, drop.y) <= 135) {
        const idx = currentRoom.groundDrops.indexOf(drop);
        if (drop.dropType === 'currency') {
          currentPlayer.currencies[drop.currencyId] = (currentPlayer.currencies[drop.currencyId] || 0) + 1;
          currentRoom.groundDrops.splice(idx, 1);
          sendPrivateProfile(currentPlayer);
        } else if (drop.dropType === 'flask') {
          currentRoom.groundDrops.splice(idx, 1);
          pickupGroundFlask(currentRoom, currentPlayer, drop);
        } else if (currentPlayer.inventory.length < 32) {
          currentPlayer.inventory.push(drop.item);
          currentRoom.groundDrops.splice(idx, 1);
          sendPrivateProfile(currentPlayer);
        }
      } else {
        // Walk toward the clicked item and pick it up on arrival!
        currentPlayer.targetDropId = drop.id;
      }
    } else if (msg.type === 'interact_world' || msg.type === 'activate_strongbox') {
      const targetId = msg.id || msg.boxId;
      if (targetId && Array.isArray(currentRoom.upgradeChests)) {
        const chestMatch = currentRoom.upgradeChests.find(c => c.id === targetId && !c.opened);
        if (chestMatch) {
          tryBuyUpgradeChest(currentRoom, currentPlayer, chestMatch.id);
          return;
        }
      }
      let it = currentRoom.interactables.find(o => o.id === targetId && !o.used);
      if (!it && msg.type === 'activate_strongbox') {
        it = currentRoom.interactables.find(o => !o.used && o.kind === 'strongbox' && dist(currentPlayer.x, currentPlayer.y, o.x, o.y) <= 115);
      }
      if (!it || currentPlayer.dead) return;
      if (dist(currentPlayer.x, currentPlayer.y, it.x, it.y) > 115) return;
      activateInteractable(currentRoom, currentPlayer, it);
    } else if (msg.type === 'pick_gem_draft' || msg.type === 'select_draft') {
      if (applyGemDraftChoice(currentPlayer, msg.optionId || msg.gemId)) {
        sendPrivateProfile(currentPlayer);
      }
    } else if (msg.type === 'move_support_gem') {
      // Move a support gem between Active Skill Slots or Support Reserve in the Gem Links Panel
      const { fromType, fromSlot, fromIdx, toSlot } = msg;
      const targetSlot = currentPlayer.gemLinks[toSlot];
      if (!targetSlot || !targetSlot.activeGem || targetSlot.supports.length >= targetSlot.maxSupports) return;

      let supObj = null;
      if (fromType === 'reserve') {
        const rEntry = currentPlayer.supportReserve[fromIdx];
        if (!rEntry) return;
        if (targetSlot.supports.some(s => s.id === rEntry.gemId)) return;
        currentPlayer.supportReserve.splice(fromIdx, 1);
        supObj = { id: rEntry.gemId, level: rEntry.level || 1 };
      } else if (fromType === 'slot') {
        const srcSlot = currentPlayer.gemLinks[fromSlot];
        if (!srcSlot || !srcSlot.supports[fromIdx]) return;
        const candidate = srcSlot.supports[fromIdx];
        if (targetSlot.supports.some(s => s.id === candidate.id)) return;
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
          return;
        }
        targetSlot.supports.push(supObj);
        syncSkillRingsFromGemLinks(currentPlayer);
        recalcPlayer(currentPlayer, false);
        sendPrivateProfile(currentPlayer);
      }
    } else if (msg.type === 'unslot_support_gem') {
      const { slotIndex, supIdx } = msg;
      const slot = currentPlayer.gemLinks[slotIndex];
      if (!slot || !slot.supports[supIdx]) return;
      const removed = slot.supports.splice(supIdx, 1)[0];
      currentPlayer.supportReserve.push({ id: uid('sup'), gemId: removed.id, level: removed.level || 1 });
      syncSkillRingsFromGemLinks(currentPlayer);
      recalcPlayer(currentPlayer, false);
      sendPrivateProfile(currentPlayer);
    } else if (msg.type === 'allocate_passive' || msg.type === 'allocate_passive_path') {
      const targetId = msg.targetNodeId || msg.nodeId;
      if (!targetId || !GameData.PASSIVE_NODES[targetId] || currentPlayer.passives.includes(targetId)) return;
      if ((currentPlayer.passivePoints || 0) <= 0) return;
      const path = findShortestPassivePathToNode(currentPlayer.passives, targetId);
      if (!path || path.length === 0) return;

      const stepsToAlloc = path.slice(0, currentPlayer.passivePoints);
      for (const stepId of stepsToAlloc) {
        if (!currentPlayer.passives.includes(stepId) && currentPlayer.passivePoints > 0) {
          currentPlayer.passives.push(stepId);
          currentPlayer.passivePoints--;
        }
      }
      recalcPlayer(currentPlayer, false);
      sendPrivateProfile(currentPlayer);
    } else if (msg.type === 'refund_passive') {
      // Rogue-lite Free Skill Tree Refund: Right-clicking any removable node refunds it for FREE!
      const nodeId = msg.nodeId;
      const cls = GameData.CLASSES[currentPlayer.classId] || GameData.CLASSES.Marauder;
      if (!currentPlayer.passives.includes(nodeId)) return;
      if (!canRemovePassiveNode(currentPlayer.passives, nodeId, cls.startNode)) return;

      currentPlayer.passives = currentPlayer.passives.filter(n => n !== nodeId);
      currentPlayer.passivePoints++;
      recalcPlayer(currentPlayer, false);
      sendPrivateProfile(currentPlayer);
    } else if (msg.type === 'reset_passive_tree') {
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
    } else if (msg.type === 'equip_item') {
      let invIdx = typeof msg.invIdx === 'number' ? msg.invIdx : -1;
      if (invIdx < 0 && msg.itemId) {
        invIdx = currentPlayer.inventory.findIndex(i => i && i.id === msg.itemId);
      }
      const item = currentPlayer.inventory[invIdx];
      if (!item) return;

      if (item.slot === 'flask' || item.flaskId) {
        if (!Array.isArray(currentPlayer.flaskBelt) || currentPlayer.flaskBelt.length !== 5) {
          currentPlayer.flaskBelt = ['life', null, null, null, null];
        }
        if (!Array.isArray(currentPlayer.flaskSlotCharges) || currentPlayer.flaskSlotCharges.length !== 5) {
          currentPlayer.flaskSlotCharges = [15, 0, 0, 0, 0];
        }
        const fId = item.flaskId || 'life';
        const fDef = GameData.FLASKS.find(f => f.id === fId) || GameData.FLASKS[0];
        let targetSlot = typeof msg.beltSlot === 'number' && msg.beltSlot >= 0 && msg.beltSlot < 5
          ? msg.beltSlot
          : currentPlayer.flaskBelt.findIndex(s => !s);
        if (targetSlot < 0) targetSlot = 0;

        const prevFlaskId = currentPlayer.flaskBelt[targetSlot];
        currentPlayer.flaskBelt[targetSlot] = fDef.id;
        currentPlayer.flaskSlotCharges[targetSlot] = fDef.maxCharges;
        if (!currentPlayer.unlockedFlasks.includes(fDef.id)) {
          currentPlayer.unlockedFlasks.push(fDef.id);
        }
        if (prevFlaskId) {
          currentPlayer.inventory[invIdx] = buildFlaskItem(prevFlaskId);
        } else {
          currentPlayer.inventory.splice(invIdx, 1);
        }
        recalcPlayer(currentPlayer, false);
        sendPrivateProfile(currentPlayer);
        return;
      }

      const slot = item.slot;
      const prevEquipped = currentPlayer.equipment[slot];
      currentPlayer.equipment[slot] = item;
      if (prevEquipped) {
        currentPlayer.inventory[invIdx] = prevEquipped;
      } else {
        currentPlayer.inventory.splice(invIdx, 1);
      }
      recalcPlayer(currentPlayer, false);
      sendPrivateProfile(currentPlayer);
    } else if (msg.type === 'equip_flask_slot') {
      if (!Array.isArray(currentPlayer.flaskBelt) || currentPlayer.flaskBelt.length !== 5) {
        currentPlayer.flaskBelt = ['life', null, null, null, null];
      }
      if (!Array.isArray(currentPlayer.flaskSlotCharges) || currentPlayer.flaskSlotCharges.length !== 5) {
        currentPlayer.flaskSlotCharges = [15, 0, 0, 0, 0];
      }
      const slotIdx = typeof msg.slotIndex === 'number' ? Math.max(0, Math.min(4, Math.floor(msg.slotIndex))) : 0;
      const invIdx = typeof msg.invIdx === 'number' ? msg.invIdx : -1;
      const item = currentPlayer.inventory[invIdx];
      if (!item || (item.slot !== 'flask' && !item.flaskId)) return;

      const fDef = GameData.FLASKS.find(f => f.id === item.flaskId) || GameData.FLASKS[0];
      const prevFlaskId = currentPlayer.flaskBelt[slotIdx];
      currentPlayer.flaskBelt[slotIdx] = fDef.id;
      currentPlayer.flaskSlotCharges[slotIdx] = fDef.maxCharges;
      if (!currentPlayer.unlockedFlasks.includes(fDef.id)) {
        currentPlayer.unlockedFlasks.push(fDef.id);
      }
      if (prevFlaskId) {
        currentPlayer.inventory[invIdx] = buildFlaskItem(prevFlaskId);
      } else {
        currentPlayer.inventory.splice(invIdx, 1);
      }
      recalcPlayer(currentPlayer, false);
      sendPrivateProfile(currentPlayer);
    } else if (msg.type === 'swap_flask_slots') {
      if (!Array.isArray(currentPlayer.flaskBelt) || currentPlayer.flaskBelt.length !== 5) {
        currentPlayer.flaskBelt = ['life', null, null, null, null];
      }
      if (!Array.isArray(currentPlayer.flaskSlotCharges) || currentPlayer.flaskSlotCharges.length !== 5) {
        currentPlayer.flaskSlotCharges = [15, 0, 0, 0, 0];
      }
      if (!Array.isArray(currentPlayer.flaskSlotTimers) || currentPlayer.flaskSlotTimers.length !== 5) {
        currentPlayer.flaskSlotTimers = [0, 0, 0, 0, 0];
      }
      const fromSlot = Math.max(0, Math.min(4, Math.floor(Number(msg.fromSlot) || 0)));
      const toSlot = Math.max(0, Math.min(4, Math.floor(Number(msg.toSlot) || 0)));
      if (fromSlot !== toSlot) {
        const tmpId = currentPlayer.flaskBelt[fromSlot];
        currentPlayer.flaskBelt[fromSlot] = currentPlayer.flaskBelt[toSlot];
        currentPlayer.flaskBelt[toSlot] = tmpId;

        const tmpChg = currentPlayer.flaskSlotCharges[fromSlot];
        currentPlayer.flaskSlotCharges[fromSlot] = currentPlayer.flaskSlotCharges[toSlot];
        currentPlayer.flaskSlotCharges[toSlot] = tmpChg;

        const tmpTmr = currentPlayer.flaskSlotTimers[fromSlot];
        currentPlayer.flaskSlotTimers[fromSlot] = currentPlayer.flaskSlotTimers[toSlot];
        currentPlayer.flaskSlotTimers[toSlot] = tmpTmr;

        recalcPlayer(currentPlayer, false);
        sendPrivateProfile(currentPlayer);
      }
    } else if (msg.type === 'unequip_flask_slot') {
      if (!Array.isArray(currentPlayer.flaskBelt) || currentPlayer.flaskBelt.length !== 5) return;
      const slotIdx = Math.max(0, Math.min(4, Math.floor(Number(msg.slotIndex) || 0)));
      const fId = currentPlayer.flaskBelt[slotIdx];
      if (!fId || currentPlayer.inventory.length >= 32) return;
      currentPlayer.flaskBelt[slotIdx] = null;
      currentPlayer.flaskSlotCharges[slotIdx] = 0;
      currentPlayer.flaskSlotTimers[slotIdx] = 0;
      currentPlayer.inventory.push(buildFlaskItem(fId));
      recalcPlayer(currentPlayer, false);
      sendPrivateProfile(currentPlayer);
    } else if (msg.type === 'unequip_item') {
      const slot = msg.slot;
      const item = slot ? currentPlayer.equipment[slot] : null;
      if (!item || currentPlayer.inventory.length >= 32) return;
      currentPlayer.equipment[slot] = null;
      currentPlayer.inventory.push(item);
      recalcPlayer(currentPlayer, false);
      sendPrivateProfile(currentPlayer);
    } else if (msg.type === 'drop_item') {
      // Drop Gear or Flask onto Ground so Other Players Can Inspect & Pick It Up to Trade!
      let item = null;
      if (typeof msg.invIdx === 'number' && currentPlayer.inventory[msg.invIdx]) {
        item = currentPlayer.inventory.splice(msg.invIdx, 1)[0];
      } else if (msg.itemId) {
        const invIdx = currentPlayer.inventory.findIndex(i => i && i.id === msg.itemId);
        if (invIdx >= 0) {
          item = currentPlayer.inventory.splice(invIdx, 1)[0];
        } else {
          for (const s of GameData.GEAR_SLOTS) {
            if (currentPlayer.equipment[s] && currentPlayer.equipment[s].id === msg.itemId) {
              item = currentPlayer.equipment[s];
              currentPlayer.equipment[s] = null;
              recalcPlayer(currentPlayer, false);
              break;
            }
          }
        }
      } else if (msg.slot && currentPlayer.equipment[msg.slot]) {
        item = currentPlayer.equipment[msg.slot];
        currentPlayer.equipment[msg.slot] = null;
        recalcPlayer(currentPlayer, false);
      }
      if (!item) return;

      const dx = Math.round(currentPlayer.x + (Math.random() - 0.5) * 45);
      const dy = Math.round(currentPlayer.y + (Math.random() - 0.5) * 45);
      if (item.slot === 'flask' || item.flaskId) {
        currentRoom.groundDrops.push({
          id: uid('drop'),
          x: dx,
          y: dy,
          dropType: 'flask',
          kind: 'flask',
          flaskId: item.flaskId || 'life',
          label: item.name,
          rarity: 'flask',
          ttl: 180
        });
      } else {
        currentRoom.groundDrops.push({
          id: uid('drop'),
          x: dx,
          y: dy,
          dropType: 'gear',
          kind: 'item',
          item,
          label: item.name,
          rarity: item.rarity,
          ttl: 180
        });
      }
      currentRoom.fxEvents.push({
        kind: 'dmg_num',
        x: Math.round(currentPlayer.x),
        y: Math.round(currentPlayer.y - 24),
        val: `DROPPED: ${item.name}`,
        text: `DROPPED: ${item.name}`,
        color: '#e2e8f0',
        size: 15,
        crit: false,
        dtype: 'loot'
      });
      sendPrivateProfile(currentPlayer);
    } else if (msg.type === 'use_currency' || msg.type === 'craft_item') {
      const currencyId = msg.currencyId || msg.orb;
      let targetLocation = msg.targetLocation;
      let slotOrIdx = msg.slotOrIdx;
      if (!targetLocation && msg.itemId) {
        const invIdx = currentPlayer.inventory.findIndex(i => i && i.id === msg.itemId);
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
      ws.send(JSON.stringify({
        type: 'craft_feedback',
        ok: res.ok,
        msg: res.ok ? res.msg : res.reason
      }));
      sendPrivateProfile(currentPlayer);
    } else if (msg.type === 'salvage_item' || msg.type === 'sell_item') {
      let invIdx = typeof msg.invIdx === 'number' ? msg.invIdx : -1;
      if (invIdx < 0 && msg.itemId) {
        invIdx = currentPlayer.inventory.findIndex(i => i && i.id === msg.itemId);
      }
      const item = currentPlayer.inventory[invIdx];
      if (!item) return;
      currentPlayer.inventory.splice(invIdx, 1);

      const ilvl = Math.max(1, Math.floor(item.ilvl || item.itemLevel || 1));
      let goldGain = Math.round(3 + ilvl);
      if (item.rarity === 'unique') {
        goldGain = Math.round(30 + ilvl * 4);
      } else if (item.rarity === 'rare') {
        goldGain = Math.round(14 + ilvl * 2.5);
      } else if (item.rarity === 'magic') {
        goldGain = Math.round(6 + ilvl * 1.5);
      }

      if (!Array.isArray(currentPlayer.buybackItems)) currentPlayer.buybackItems = [];
      currentPlayer.buybackItems.unshift({ item, price: goldGain });
      if (currentPlayer.buybackItems.length > 8) {
        currentPlayer.buybackItems.pop();
      }

      currentPlayer.gold = (currentPlayer.gold || 0) + goldGain;
      currentRoom.fxEvents.push({
        kind: 'dmg_num',
        x: Math.round(currentPlayer.x),
        y: Math.round(currentPlayer.y - 26),
        val: `SOLD: +${goldGain}G`,
        text: `SOLD TO BLACK MARKET: +${goldGain} GOLD`,
        color: '#facc15',
        size: 16,
        crit: false,
        dtype: 'loot'
      });
      sendPrivateProfile(currentPlayer);
    } else if (msg.type === 'buyback_item') {
      if (!Array.isArray(currentPlayer.buybackItems)) currentPlayer.buybackItems = [];
      const targetId = msg.buybackId || msg.itemId;
      const bIdx = currentPlayer.buybackItems.findIndex(b => b && b.item && b.item.id === targetId);
      if (bIdx < 0) return;
      const entry = currentPlayer.buybackItems[bIdx];
      if ((currentPlayer.gold || 0) < entry.price) {
        ws.send(JSON.stringify({
          type: 'craft_feedback',
          ok: false,
          msg: `Need ${entry.price} Stash Gold to buy back ${entry.item.name}!`
        }));
        return;
      }
      if (currentPlayer.inventory.length >= 32) {
        ws.send(JSON.stringify({
          type: 'craft_feedback',
          ok: false,
          msg: 'Inventory is full (32/32)!'
        }));
        return;
      }
      currentPlayer.gold -= entry.price;
      currentPlayer.buybackItems.splice(bIdx, 1);
      currentPlayer.inventory.push(entry.item);
      ws.send(JSON.stringify({
        type: 'craft_feedback',
        ok: true,
        msg: `Bought back ${entry.item.name} for ${entry.price} Gold!`
      }));
      sendPrivateProfile(currentPlayer);
    } else if (msg.type === 'reroll_draft') {
      if (!currentPlayer.pendingDrafts || currentPlayer.pendingDrafts.length === 0) return;
      const cost = getDraftRerollCost(currentPlayer);
      const isRun = currentRoom.state === 'RUN';
      const availableGold = isRun ? (currentPlayer.runGold || 0) : (currentPlayer.gold || 0);
      if (availableGold < cost) {
        ws.send(JSON.stringify({
          type: 'craft_feedback',
          ok: false,
          msg: `Need ${cost} ${isRun ? 'Run Gold' : 'Stash Gold'} to reroll Draft choices!`
        }));
        return;
      }
      if (isRun) {
        currentPlayer.runGold -= cost;
      } else {
        currentPlayer.gold -= cost;
      }
      currentPlayer.draftRerolls = (currentPlayer.draftRerolls || 0) + 1;
      currentPlayer.pendingDrafts[0].choices = generateGemDraftOptions(currentPlayer);
      currentRoom.fxEvents.push({
        kind: 'dmg_num',
        x: Math.round(currentPlayer.x),
        y: Math.round(currentPlayer.y - 28),
        val: `REROLLED! (-${cost}G)`,
        text: `DRAFT REROLLED! (-${cost}G)`,
        color: '#ffd43b',
        size: 17,
        crit: false,
        dtype: 'lightning'
      });
      sendPrivateProfile(currentPlayer);
    } else if (msg.type === 'gamble_item') {
      const cat = msg.category || 'weapon';
      const gCosts = getGambleCosts(currentRoom, currentPlayer);
      const cost = cat === 'weapon'
        ? gCosts.weapon
        : cat === 'body'
          ? (gCosts.body || gCosts.armour)
          : cat === 'jewelry'
            ? gCosts.jewelry
            : gCosts.armour;
      if ((currentPlayer.gold || 0) < cost) {
        ws.send(JSON.stringify({
          type: 'craft_feedback',
          ok: false,
          msg: `Need ${cost} Stash Gold to gamble ${cat.toUpperCase()}!`
        }));
        return;
      }
      if (currentPlayer.inventory.length >= 32) {
        ws.send(JSON.stringify({
          type: 'craft_feedback',
          ok: false,
          msg: 'Inventory is full (32/32)! Open Black Market & Right-Click items to sell.'
        }));
        return;
      }
      currentPlayer.gold -= cost;
      const slotPool = cat === 'weapon'
        ? ['weapon']
        : cat === 'body'
          ? ['body']
          : cat === 'jewelry'
            ? ['ring', 'amulet', 'belt']
            : ['boots', 'helm', 'gloves'];
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
      currentRoom.fxEvents.push({
        kind: 'dmg_num',
        x: Math.round(currentPlayer.x),
        y: Math.round(currentPlayer.y - 28),
        val: `GAMBLED: ${item.name.toUpperCase()}`,
        text: `GAMBLED [${rarity.toUpperCase()}]: ${item.name}`,
        color: rarity === 'unique' ? '#ff922b' : rarity === 'rare' ? '#ffd43b' : '#74c0fc',
        size: 17,
        crit: rarity !== 'magic',
        dtype: 'loot'
      });
      ws.send(JSON.stringify({
        type: 'craft_feedback',
        ok: true,
        msg: `Gambled ${rarity.toUpperCase()} ${item.name} (ilvl ${gCosts.ilvl})${autoEquipped ? ' — Auto-Equipped!' : '!'}`
      }));
      sendPrivateProfile(currentPlayer);
    } else if (msg.type === 'toggle_ready') {
      currentPlayer.ready = !currentPlayer.ready;
      sendPrivateProfile(currentPlayer);
      addRoomChat(
        currentRoom,
        'Lobby',
        `${currentPlayer.name} is ${currentPlayer.ready ? 'READY' : 'PREPARING'}.`,
        currentPlayer.ready ? '#69db7c' : '#ffd43b'
      );
      // If all players in the Hideout are ready, launch the selected Atlas Map automatically!
      if (currentRoom.state === 'HIDEOUT' && currentRoom.players.size > 0) {
        const allReady = Array.from(currentRoom.players.values()).every(p => p.ready);
        if (allReady) {
          startAtlasRun(currentRoom, currentRoom.selectedMapId);
        }
      }
    } else if (msg.type === 'select_map') {
      if (GameData.ATLAS_MAPS.some(m => m.id === msg.mapId)) {
        currentRoom.selectedMapId = msg.mapId;
        for (const p of currentRoom.players.values()) {
          p.currentMapId = msg.mapId;
          sendPrivateProfile(p);
        }
        const mDef = GameData.ATLAS_MAPS.find(m => m.id === msg.mapId);
        addRoomChat(currentRoom, 'Map Device', `${currentPlayer.name} selected ${mDef.name}.`, '#f2c76e');
      }
    } else if (msg.type === 'start_map' || msg.type === 'open_map') {
      if (currentRoom.state === 'HIDEOUT') {
        startAtlasRun(currentRoom, msg.mapId || currentRoom.selectedMapId || 'strand');
      }
    } else if (msg.type === 'return_hideout') {
      if (currentRoom.state === 'RUN') {
        returnToHideout(currentRoom, 'Extracted to Sanctuary Hideout', 'All loot, Skill Points, and Run Gold banked to Stash!');
      }
    } else if (msg.type === 'chat') {
      const text = String(msg.text || '').trim().slice(0, 140);
      if (text) {
        addRoomChat(currentRoom, currentPlayer.name, text, '#ffffff');
      }
    }
  });

  ws.on('close', () => {
    if (currentRoom && currentPlayer) {
      saveCharacterToDb(currentPlayer);
      currentRoom.players.delete(currentPlayer.id);
      addRoomChat(currentRoom, 'Party', `${currentPlayer.name} left the instance.`, '#868e96');
      if (currentRoom.players.size === 0 && currentRoom.state === 'RUN') {
        returnToHideout(currentRoom);
      }
    }
  });
});
module.exports = {};
