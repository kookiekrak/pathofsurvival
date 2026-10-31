// Server Network Module: WebSocket Connection Lifecycle, Room Switching, Combat Input & World Interactions
const GameData = global.GameData || require('../../public/shared/gameData.js');

function switchPlayerRoom(ws, msg, connState) {
  let roomCode = ((msg.roomCode || 'ORIATH').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'ORIATH').slice(0, 8);
  let room = rooms.get(roomCode);
  if (!room) room = createRoom(roomCode, msg.roomName);

  // ORIATH is an uncapped Public Town Hub; other party instances cap at 6 players
  if (roomCode !== 'ORIATH' && room.players.size >= 6 && (!connState.currentPlayer || !room.players.has(connState.currentPlayer.id))) {
    ws.send(JSON.stringify({
      type: 'announcement',
      title: 'Party Instance Full (6/6)',
      subtitle: 'Redirected to Oriath Public Sanctuary Town Hub.',
      color: '#ffd43b'
    }));
    roomCode = 'ORIATH';
    room = rooms.get('ORIATH') || createRoom('ORIATH', 'Oriath Public Sanctuary');
  }

  if (connState.currentRoom && connState.currentPlayer) {
    saveCharacterToDb(connState.currentPlayer);
    connState.currentRoom.players.delete(connState.currentPlayer.id);
  }

  connState.currentRoom = room;
  connState.currentPlayer = createPlayer(ws, msg.name, msg.classId, msg.accountId, msg.characterId);
  room.players.set(connState.currentPlayer.id, connState.currentPlayer);

  ws.send(JSON.stringify({ type: 'chat_history', log: room.chatLog }));
  addRoomChat(room, 'Party', `${connState.currentPlayer.name} (Lv.${connState.currentPlayer.level} ${connState.currentPlayer.classId}) joined the instance.`, '#63a4ff');
  sendPrivateProfile(connState.currentPlayer);
}

// =========================================================================
// WEBSOCKET MESSAGE HANDLERS
// =========================================================================
wss.on('connection', (ws) => {
  const connState = {
    currentRoom: null,
    currentPlayer: null
  };

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.type === 'join' || msg.type === 'join_room' || msg.type === 'switch_character') {
      if (msg.type === 'switch_character' && !msg.roomCode && connState.currentRoom) {
        msg.roomCode = connState.currentRoom.code;
      }
      switchPlayerRoom(ws, msg, connState);
      return;
    }

    const currentRoom = connState.currentRoom;
    const currentPlayer = connState.currentPlayer;
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
    } else if (msg.type === 'use_vaal' || msg.type === 'vaal_skill') {
      triggerVaalSkill(currentRoom, currentPlayer);
    } else if (msg.type === 'buy_upgrade_chest' || msg.type === 'interact_chest') {
      if (currentRoom.state === 'RUN') {
        tryBuyUpgradeChest(currentRoom, currentPlayer, msg.chestId || msg.id || null);
      }
    } else if (msg.type === 'dash' || msg.type === 'manual_skill') {
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
    } else if (msg.type === 'flask' || msg.type === 'use_flask') {
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
      const slotMeta = (Array.isArray(currentPlayer.flaskBeltItems) && currentPlayer.flaskBeltItems[slotIdx]) || null;
      const useCost = (slotMeta && slotMeta.cost) || fDef.cost;
      const dur = (slotMeta && slotMeta.duration) || fDef.duration;
      const curCharges = currentPlayer.flaskSlotCharges[slotIdx] ?? (currentPlayer.flaskCharges[flaskId] || 0);
      if (curCharges < useCost) return;

      if (flaskId === 'life') {
        if (currentPlayer.hp >= currentPlayer.maxHp) return;
        currentPlayer.flaskSlotCharges[slotIdx] = Math.max(0, curCharges - useCost);
        currentPlayer.flaskCharges.life = currentPlayer.flaskSlotCharges[slotIdx];
        currentPlayer.hp = Math.min(currentPlayer.maxHp, currentPlayer.hp + Math.round(currentPlayer.maxHp * 0.45));
      } else {
        currentPlayer.flaskSlotCharges[slotIdx] = Math.max(0, curCharges - useCost);
        currentPlayer.flaskCharges[flaskId] = currentPlayer.flaskSlotCharges[slotIdx];
        currentPlayer.flaskSlotTimers[slotIdx] = dur;
        currentPlayer.activeFlasks[flaskId] = dur;
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
    } else if (msg.type === 'toggle_ready') {
      if (currentRoom.code === 'ORIATH') {
        ws.send(JSON.stringify({
          type: 'announcement',
          title: 'Oriath Public Town Hub',
          subtitle: 'Maps cannot be opened in Oriath Town! Travel to your Personal Hideout [M] to open Atlas Portals.',
          color: '#ffd43b'
        }));
        return;
      }
      if (currentPlayer.deadHardcore) {
        ws.send(JSON.stringify({
          type: 'announcement',
          title: '💀 Fallen Hardcore Exile',
          subtitle: 'Fallen Hardcore characters cannot enter Atlas Maps. Switch characters or create a new Exile!',
          color: '#ff4d4d'
        }));
        return;
      }
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
        const allReady = Array.from(currentRoom.players.values()).every(p => p.ready && !p.deadHardcore);
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
    } else if (msg.type === 'start_map' || msg.type === 'open_map' || msg.type === 'start_atlas_map') {
      if (currentRoom.code === 'ORIATH') {
        ws.send(JSON.stringify({
          type: 'announcement',
          title: 'Oriath Public Town Hub',
          subtitle: 'Maps cannot be opened in Oriath Town! Travel to your Personal Hideout to launch maps.',
          color: '#ffd43b'
        }));
        return;
      }
      if (currentPlayer.deadHardcore) {
        ws.send(JSON.stringify({
          type: 'announcement',
          title: '💀 Fallen Hardcore Exile',
          subtitle: 'Fallen Hardcore characters cannot enter Atlas Maps. Switch characters or create a new Exile!',
          color: '#ff4d4d'
        }));
        return;
      }
      if (currentRoom.state === 'HIDEOUT') {
        startAtlasRun(currentRoom, msg.mapId || currentRoom.selectedMapId || 'strand');
      }
    } else if (msg.type === 'start_raid') {
      if (currentRoom.code === 'ORIATH') {
        ws.send(JSON.stringify({
          type: 'announcement',
          title: 'Oriath Public Town Hub',
          subtitle: 'Pinnacle Raids cannot be opened in Oriath Town! Travel to your Personal Hideout to launch raids.',
          color: '#ffd43b'
        }));
        return;
      }
      if (currentPlayer.deadHardcore) {
        ws.send(JSON.stringify({
          type: 'announcement',
          title: '💀 Fallen Hardcore Exile',
          subtitle: 'Fallen Hardcore characters cannot enter Pinnacle Boss Raids!',
          color: '#ff4d4d'
        }));
        return;
      }
      if (currentRoom.state === 'HIDEOUT') {
        startPinnacleBossRaid(currentRoom, msg.raidId);
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
    } else {
      handleInventoryAndProgressionMessage(ws, msg, currentRoom, currentPlayer);
    }
  });

  ws.on('close', () => {
    const currentRoom = connState.currentRoom;
    const currentPlayer = connState.currentPlayer;
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

const exportsObj = { switchPlayerRoom };
Object.assign(global, exportsObj);
module.exports = exportsObj;
