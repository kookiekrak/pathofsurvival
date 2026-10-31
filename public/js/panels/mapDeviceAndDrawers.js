// Client Module: Atlas Map Device Modal, Drawer Toggles & HUD Micro-Menu Controls
(function () {
  with (window.__POS_CTX__) {
  // Atlas Map Device Modal
  function initMapDeviceModal() {
    const grid = document.getElementById('atlasMapGrid');
    grid.innerHTML = '';

    for (const m of GameData.ATLAS_MAPS) {
      const card = document.createElement('div');
      card.className = `map-card ${m.id === selectedMapId ? 'selected' : ''}`;
      const hpMult = (m.monsterScale || 1).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
      const dmgMult = (m.dmgScale || 1).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
      const armorVal = m.monsterArmor || 0;
      const dropBonus = (m.lootQuantity || 100) - 100;
      const rarityBonus = m.lootRarityBonus || 0;
      const baseIlvl = (m.tier - 1) * 3 + 1;
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div class="map-tier-badge" style="margin:0">TIER ${m.tier}</div>
          <span style="font-size:0.74rem;color:#f2c76e;font-weight:700">${m.recGear || `ilvl ${baseIlvl}+`}</span>
        </div>
        <h3 style="margin:0 0 5px;font-size:0.98rem">${m.name} <span style="font-size:0.74rem;color:#9e8d73;font-weight:400">• ${m.bossName}</span></h3>
        <div class="map-stat-line" style="margin-bottom:3px;color:#ff8787;font-size:0.8rem">
          Difficulty: ${hpMult}x HP • ${dmgMult}x Dmg${armorVal > 0 ? ` • ${armorVal} Ward` : ''}
        </div>
        <div class="map-stat-line" style="margin:0;color:#69db7c;font-size:0.8rem">
          Drops: ilvl ${baseIlvl}+ • ${dropBonus > 0 ? `+${dropBonus}% Qty` : '1.0x Qty'}${rarityBonus > 0 ? ` • +${rarityBonus}% Rarity` : ''} • ${(m.goldMult || 1)}x Gold
        </div>
      `;
      card.addEventListener('click', () => {
        selectedMapId = m.id;
        if (ws) ws.send(JSON.stringify({ type: 'select_map', mapId: m.id }));
        initMapDeviceModal();
      });
      grid.appendChild(card);
    }
    const launchBtn = document.getElementById('launchMapBtn');
    if (launchBtn) {
      const isTown = worldState && worldState.roomCode === 'ORIATH';
      launchBtn.textContent = isTown
        ? 'TRAVEL TO PERSONAL HIDEOUT (MAPS DISABLED IN ORIATH TOWN)'
        : 'ACTIVATE MAP DEVICE';
    }
  }
  initMapDeviceModal();

  document.getElementById('readyToggleBtn')?.addEventListener('click', () => {
    if (worldState && worldState.roomCode === 'ORIATH' && myProfile) {
      connectAndJoin(myProfile.name, myDefaultRoomCode, `${myProfile.name}'s Hideout`, myProfile.classId, myProfile.characterId);
      return;
    }
    if (ws) ws.send(JSON.stringify({ type: 'toggle_ready' }));
  });
  document.getElementById('openBlackMarketBtn')?.addEventListener('click', () => {
    toggleDrawer('blackMarketDrawer');
  });
  document.getElementById('rerollDraftBtn')?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (ws) ws.send(JSON.stringify({ type: 'reroll_draft' }));
  });
  document.getElementById('launchMapBtn')?.addEventListener('click', () => {
    if (!ws) return;
    if (worldState && worldState.roomCode === 'ORIATH' && myProfile) {
      document.getElementById('mapDeviceModal').classList.add('hidden');
      connectAndJoin(myProfile.name, myDefaultRoomCode, `${myProfile.name}'s Hideout`, myProfile.classId, myProfile.characterId);
      setTimeout(() => showBanner('Sanctuary Hideout', 'Click the Map Device [M] to open Atlas Portals!', '#69db7c'), 350);
      return;
    }
    ws.send(JSON.stringify({ type: 'start_map', mapId: selectedMapId }));
    document.getElementById('mapDeviceModal').classList.add('hidden');
  });
  document.getElementById('extractHideoutBtn')?.addEventListener('click', () => {
    if (!ws) return;
    ws.send(JSON.stringify({ type: 'return_hideout' }));
    document.getElementById('mapDeviceModal').classList.add('hidden');
  });

  function toggleDrawer(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const isHidden = el.classList.contains('hidden');
    // Left Drawer (Character/Gems OR Black Market) and Right Drawer (Inventory) can be open simultaneously!
    // Opening a full modal (Passive Tree, Map Device, Lobby) closes docked drawers.
    if (id === 'inventoryDrawer' || id === 'gemsDrawer' || id === 'blackMarketDrawer') {
      document.getElementById('passiveTreeModal').classList.add('hidden');
      document.getElementById('mapDeviceModal').classList.add('hidden');
      document.getElementById('lobbyModal')?.classList.add('hidden');
      if (id === 'gemsDrawer' && isHidden) {
        document.getElementById('blackMarketDrawer')?.classList.add('hidden');
      } else if (id === 'blackMarketDrawer' && isHidden) {
        document.getElementById('gemsDrawer')?.classList.add('hidden');
      }
      el.classList.toggle('hidden', !isHidden);
      if (typeof renderStashInventory === 'function' && myProfile) {
        renderStashInventory();
      }
      hideTooltip();
      return;
    }

    document.getElementById('inventoryDrawer').classList.add('hidden');
    document.getElementById('gemsDrawer').classList.add('hidden');
    document.getElementById('blackMarketDrawer')?.classList.add('hidden');
    document.getElementById('passiveTreeModal').classList.add('hidden');
    document.getElementById('mapDeviceModal').classList.add('hidden');
    document.getElementById('lobbyModal')?.classList.add('hidden');
    hideTooltip();

    if (isHidden) {
      el.classList.remove('hidden');
      if (id === 'passiveTreeModal') {
        resizeCanvases();
        treeZoom = getFitTreeZoom();
        renderPassiveTree();
      } else if (id === 'lobbyModal') {
        fetchActiveRooms();
      } else if (id === 'mapDeviceModal') {
        initMapDeviceModal();
      }
    }
  }

  document.getElementById('toggleInventoryBtn').addEventListener('click', () => toggleDrawer('inventoryDrawer'));
  document.getElementById('toggleGemsBtn').addEventListener('click', () => toggleDrawer('gemsDrawer'));
  document.getElementById('toggleTreeBtn').addEventListener('click', () => toggleDrawer('passiveTreeModal'));
  document.getElementById('toggleMapDeviceBtn').addEventListener('click', () => toggleDrawer('mapDeviceModal'));
  document.getElementById('switchClassBtn')?.addEventListener('click', () => {
    document.getElementById('inventoryDrawer').classList.add('hidden');
    document.getElementById('gemsDrawer').classList.add('hidden');
    document.getElementById('blackMarketDrawer')?.classList.add('hidden');
    document.getElementById('passiveTreeModal').classList.add('hidden');
    document.getElementById('mapDeviceModal').classList.add('hidden');
    document.getElementById('lobbyModal')?.classList.add('hidden');
    charFlowMode = 'select';
    fetchSavedCharacters();
    document.getElementById('loginModal')?.classList.remove('hidden');
  });
  document.getElementById('openLobbyHudBtn')?.addEventListener('click', () => toggleDrawer('lobbyModal'));

  document.querySelectorAll('.window-close').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.close)?.classList.add('hidden');
      if (typeof renderStashInventory === 'function' && myProfile) {
        renderStashInventory();
      }
      hideTooltip();
    });
  });

  document.getElementById('dashBtn').addEventListener('click', () => {
    if (ws) ws.send(JSON.stringify({ type: 'dash' }));
  });

  document.getElementById('vaalBtn')?.addEventListener('click', () => {
    if (ws) ws.send(JSON.stringify({ type: 'use_vaal' }));
  });

  function triggerBuyUpgradeChest(preferredChestId) {
    if (!ws || !preferredChestId) return;
    ws.send(JSON.stringify({ type: 'buy_upgrade_chest', chestId: preferredChestId }));
  }

  Object.assign(window.__POS_CTX__, { initMapDeviceModal, toggleDrawer, triggerBuyUpgradeChest });
  }
})();
