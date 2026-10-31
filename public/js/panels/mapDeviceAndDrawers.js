// Client Module: Atlas Map Device Modal, Drawer Toggles & HUD Micro-Menu Controls
(function () {
  with (window.__POS_CTX__) {
  // Atlas Map Device Modal
  window.__POS_CTX__.selectedRaidId = null;

  function initMapDeviceModal() {
    const grid = document.getElementById('atlasMapGrid');
    if (!grid) return;
    grid.innerHTML = '';

    for (const m of GameData.ATLAS_MAPS) {
      const isSel = !selectedRaidId && m.id === selectedMapId;
      const card = document.createElement('div');
      card.className = `map-card ${isSel ? 'selected' : ''}`;
      const hpMult = (m.monsterScale || 1).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
      const dmgMult = (m.dmgScale || 1).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
      const armorVal = m.monsterArmor || 0;
      const dropBonus = (m.lootQuantity || 100) - 100;
      const rarityBonus = m.lootRarityBonus || 0;
      const baseIlvl = (m.tier - 1) * 3 + 1;
      const tierColor = m.tier >= 11 ? '#ff6b6b' : m.tier >= 6 ? '#ffd43b' : '#dee2e6';
      const tierCat = m.tier >= 11 ? 'RED' : m.tier >= 6 ? 'YELLOW' : 'WHITE';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div class="map-tier-badge" style="margin:0;color:${tierColor}">${tierCat} TIER ${m.tier}</div>
          <span style="font-size:0.72rem;color:#f2c76e;font-weight:700">ilvl ${baseIlvl}+</span>
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
        selectedRaidId = null;
        if (ws) ws.send(JSON.stringify({ type: 'select_map', mapId: m.id }));
        initMapDeviceModal();
      });
      grid.appendChild(card);
    }

    for (const r of (GameData.PINNACLE_RAID_BOSSES || [])) {
      const isSel = selectedRaidId === r.id;
      const card = document.createElement('div');
      card.className = `map-card ${isSel ? 'selected' : ''}`;
      card.style.borderColor = isSel ? '#ffd43b' : '#c92a2a';
      card.style.background = isSel
        ? 'linear-gradient(180deg, #3b1212 0%, #170606 100%)'
        : 'linear-gradient(180deg, #240a0a 0%, #0d0404 100%)';
      const dropBonus = (r.lootQuantity || 100) - 100;
      const rarityBonus = r.lootRarityBonus || 0;
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div class="map-tier-badge" style="margin:0;background:#5c1111;border-color:#ff6b6b;color:#ffe3e3">PINNACLE RAID • T${r.tier}</div>
          <span style="font-size:0.74rem;color:#ffd43b;font-weight:700">${r.recGear || 'Pinnacle Raid'}</span>
        </div>
        <h3 style="margin:0 0 4px;font-size:0.98rem;color:#ffa8a8">${r.name} <span style="font-size:0.72rem;color:#e8c26b;font-weight:400">• 3-Phase Boss</span></h3>
        <div class="map-stat-line" style="margin-bottom:3px;color:#ffd8a8;font-size:0.76rem">
          ${r.mechanicsDesc || 'Multi-Phase Pinnacle Raid Mechanics'}
        </div>
        <div class="map-stat-line" style="margin:0;color:#69db7c;font-size:0.78rem">
          Drops: +${dropBonus}% Qty • +${rarityBonus}% Rarity • Guaranteed Unique/Orbs
        </div>
      `;
      card.addEventListener('click', () => {
        selectedRaidId = r.id;
        selectedMapId = null;
        initMapDeviceModal();
      });
      grid.appendChild(card);
    }

    const launchBtn = document.getElementById('launchMapBtn');
    if (launchBtn) {
      const isTown = worldState && worldState.roomCode === 'ORIATH';
      launchBtn.textContent = isTown
        ? 'TRAVEL TO PERSONAL HIDEOUT (MAPS DISABLED IN ORIATH TOWN)'
        : selectedRaidId
          ? 'LAUNCH PINNACLE BOSS RAID'
          : 'ACTIVATE MAP DEVICE';
    }

    const craftBar = document.getElementById('mapCraftingBar');
    if (craftBar) {
      if (selectedRaidId) {
        craftBar.innerHTML = `<span style="color:#ffa8a8;font-size:0.78rem">Pinnacle Boss Raids have fixed 3-Phase mechanics and cannot be modified with Currency Orbs.</span>`;
      } else {
        const mDef = GameData.ATLAS_MAPS.find(m => m.id === (selectedMapId || 'strand')) || GameData.ATLAS_MAPS[0];
        const cm = (worldState && worldState.craftedMap && worldState.craftedMap.mapId === mDef.id)
          ? worldState.craftedMap
          : { mapId: mDef.id, rarity: 'normal', mods: [] };
        const mods = Array.isArray(cm.mods) ? cm.mods : [];
        const rarCol = cm.rarity === 'rare' ? '#ffd43b' : cm.rarity === 'magic' ? '#74c0fc' : '#dee2e6';
        let bQuant = 0, bRar = 0, bPack = 0;
        for (const md of mods) {
          bQuant += md.quant || 0;
          bRar += md.rarity || 0;
          bPack += md.packSize || 0;
        }
        const cur = (myProfile && myProfile.currencies) || {};
        const modText = mods.length > 0
          ? mods.map(md => `<span style="color:#74c0fc">${md.name}</span>`).join(' • ')
          : `<span style="color:#9e8d73">Uncrafted Normal Map (Rolls 1–2 random mods on launch, or craft with Orbs for higher Quantity!)</span>`;
        const bonusTag = mods.length > 0
          ? `<span style="color:#69db7c;font-weight:700;margin-left:6px">[+${bQuant}% Qty • +${bRar}% Rarity • +${bPack}% Pack Size]</span>`
          : '';
        const orbBtns = [
          ['transmute', 'TRN', 'Normal → Magic (1-2 Mods)'],
          ['alteration', 'ALT', 'Reroll Magic Map'],
          ['alchemy', 'ALC', 'Normal → Rare (4 Mods)'],
          ['chaos', 'CHA', 'Reroll Rare Map (4-5 Mods)'],
          ['exalted', 'EXA', '+1 Mod to Rare Map (Max 6)'],
          ['scour', 'SCR', 'Scour Map to Normal (0 Mods)']
        ].map(([orbKey, shortLbl, tip]) => {
          const cKey = orbKey === 'scour' ? 'regret' : orbKey;
          const cnt = cur[cKey] || 0;
          return `<button class="poe-chisel-btn sm-btn map-orb-btn" data-orb="${orbKey}" style="padding:2px 7px;font-size:0.7rem;opacity:${cnt > 0 ? 1 : 0.45}" title="${tip} (${cnt} left)" type="button">${shortLbl} (${cnt})</button>`;
        }).join('');
        craftBar.innerHTML = `
          <div style="flex:1;min-width:260px;font-size:0.74rem;line-height:1.25">
            <div><strong style="color:${rarCol};font-family:var(--font-serif)">${mDef.name.toUpperCase()} (${(cm.rarity || 'normal').toUpperCase()})</strong>${bonusTag}</div>
            <div style="margin-top:2px">${modText}</div>
          </div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">${orbBtns}</div>
        `;
        craftBar.querySelectorAll('.map-orb-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (ws) ws.send(JSON.stringify({ type: 'craft_map', orb: btn.dataset.orb }));
          });
        });
      }
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
    if (selectedRaidId) {
      ws.send(JSON.stringify({ type: 'start_raid', raidId: selectedRaidId }));
    } else {
      ws.send(JSON.stringify({ type: 'start_map', mapId: selectedMapId || 'strand' }));
    }
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
    // Left Drawer (Account Stash, Character/Gems, OR Run Vendor) and Right Drawer (Character Inventory) can be open simultaneously!
    if (id === 'inventoryDrawer' || id === 'stashDrawer' || id === 'gemsDrawer' || id === 'blackMarketDrawer') {
      document.getElementById('passiveTreeModal').classList.add('hidden');
      document.getElementById('mapDeviceModal').classList.add('hidden');
      document.getElementById('lobbyModal')?.classList.add('hidden');
      if (id !== 'inventoryDrawer' && isHidden) {
        for (const leftId of ['stashDrawer', 'gemsDrawer', 'blackMarketDrawer']) {
          if (leftId !== id) document.getElementById(leftId)?.classList.add('hidden');
        }
      }
      el.classList.toggle('hidden', !isHidden);
      if (typeof renderStashInventory === 'function' && myProfile) {
        renderStashInventory();
      }
      hideTooltip();
      return;
    }

    document.getElementById('inventoryDrawer').classList.add('hidden');
    document.getElementById('stashDrawer')?.classList.add('hidden');
    document.getElementById('gemsDrawer').classList.add('hidden');
    document.getElementById('blackMarketDrawer')?.classList.add('hidden');
    document.getElementById('leaderboardModal')?.classList.add('hidden');
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
      } else if (id === 'leaderboardModal') {
        fetchLeaderboard();
      } else if (id === 'mapDeviceModal') {
        initMapDeviceModal();
      }
    }
  }

  let leaderboardFilter = 'hc_all';
  let cachedLeaderboardRows = [];

  function renderLeaderboardRows() {
    const tbody = document.getElementById('leaderboardTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const tabIds = {
      hc_all: 'lbTabHcAll',
      hc_alive: 'lbTabHcAlive',
      hc_fallen: 'lbTabHcFallen',
      standard: 'lbTabStandard'
    };
    for (const [k, btnId] of Object.entries(tabIds)) {
      const btn = document.getElementById(btnId);
      if (btn) {
        const active = leaderboardFilter === k;
        btn.style.borderColor = active ? '#ffd43b' : '#4a3b28';
        btn.style.color = active ? '#ffd43b' : (k.startsWith('hc') ? '#ff8787' : '#d8ccb8');
      }
    }

    const filtered = cachedLeaderboardRows.filter(r => {
      if (leaderboardFilter === 'hc_all') return r.league === 'Hardcore';
      if (leaderboardFilter === 'hc_alive') return r.league === 'Hardcore' && !r.deadHardcore;
      if (leaderboardFilter === 'hc_fallen') return r.league === 'Hardcore' && r.deadHardcore;
      return r.league !== 'Hardcore';
    });

    if (filtered.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="7" style="text-align:center;color:#9e8d73;padding:18px">No Exiles recorded in this ladder bracket yet. Create a Hardcore character to claim Rank #1!</td>`;
      tbody.appendChild(tr);
      return;
    }

    filtered.forEach((r, idx) => {
      const rank = idx + 1;
      const rankBadge = rank === 1 ? '👑 #1' : rank === 2 ? '🥈 #2' : rank === 3 ? '🥉 #3' : `#${rank}`;
      const xpPct = r.xpNext > 0 ? Math.min(99, Math.floor((r.xp / r.xpNext) * 100)) : 0;
      const clsDef = (GameData.CLASSES && GameData.CLASSES[r.classId]) || { color: '#e8c26b' };
      const bestT = Math.max(1, r.bestTier || 1);
      const tCol = bestT >= 17 ? '#da77f2' : bestT >= 11 ? '#ff6b6b' : bestT >= 6 ? '#ffd43b' : '#dee2e6';
      const tLabel = bestT >= 17 ? `UBER T${bestT}` : bestT >= 11 ? `RED T${bestT}` : bestT >= 6 ? `YELLOW T${bestT}` : `WHITE T${bestT}`;
      const statusHtml = r.league === 'Hardcore'
        ? (r.deadHardcore
          ? `<span style="color:#ff4d4d;font-weight:700">💀 FALLEN${r.slainInZone ? ` (${r.slainInZone})` : ''}</span>`
          : `<span style="color:#69db7c;font-weight:700">🟢 ALIVE (HC)</span>`)
        : `<span style="color:#78c2ad">⚔️ STANDARD</span>`;
      const tr = document.createElement('tr');
      if (r.deadHardcore) tr.style.opacity = '0.78';
      tr.innerHTML = `
        <td><strong style="color:${rank <= 3 ? '#ffd43b' : '#c8b38a'}">${rankBadge}</strong></td>
        <td><strong style="color:${r.deadHardcore ? '#ff8787' : '#f4ece1'}">${r.name}</strong></td>
        <td><span style="color:${clsDef.color || '#e8c26b'}">${r.classId}</span></td>
        <td><strong>Lv. ${r.level}</strong> <span style="font-size:0.74rem;color:#9e8d73">(${xpPct}% XP)</span></td>
        <td><strong style="color:${tCol}">${tLabel}</strong> <span style="font-size:0.72rem;color:#9e8d73">• Score ${r.level + bestT}</span></td>
        <td><span style="color:#ffd43b">${r.bossKills || 0} Bosses</span> <span style="font-size:0.74rem;color:#9e8d73">• ${r.uniqueCount || 0} Uniques</span></td>
        <td>${statusHtml}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  async function fetchLeaderboard(filterOverride) {
    if (filterOverride) leaderboardFilter = filterOverride;
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      cachedLeaderboardRows = Array.isArray(data.leaderboard) ? data.leaderboard : [];
      renderLeaderboardRows();
    } catch {}
  }

  document.getElementById('openLeaderboardFromSelectBtn')?.addEventListener('click', () => {
    document.getElementById('leaderboardModal')?.classList.remove('hidden');
    fetchLeaderboard('hc_all');
  });
  document.getElementById('openLeaderboardHudBtn')?.addEventListener('click', () => toggleDrawer('leaderboardModal'));
  document.getElementById('refreshLeaderboardBtn')?.addEventListener('click', () => fetchLeaderboard());
  document.getElementById('lbTabHcAll')?.addEventListener('click', () => { leaderboardFilter = 'hc_all'; renderLeaderboardRows(); });
  document.getElementById('lbTabHcAlive')?.addEventListener('click', () => { leaderboardFilter = 'hc_alive'; renderLeaderboardRows(); });
  document.getElementById('lbTabHcFallen')?.addEventListener('click', () => { leaderboardFilter = 'hc_fallen'; renderLeaderboardRows(); });
  document.getElementById('lbTabStandard')?.addEventListener('click', () => { leaderboardFilter = 'standard'; renderLeaderboardRows(); });

  document.getElementById('toggleInventoryBtn').addEventListener('click', () => toggleDrawer('inventoryDrawer'));
  document.getElementById('toggleStashBtn')?.addEventListener('click', () => toggleDrawer('stashDrawer'));
  document.getElementById('toggleBlackMarketBtn')?.addEventListener('click', () => toggleDrawer('blackMarketDrawer'));
  document.getElementById('toggleGemsBtn').addEventListener('click', () => toggleDrawer('gemsDrawer'));
  document.getElementById('toggleTreeBtn').addEventListener('click', () => toggleDrawer('passiveTreeModal'));
  document.getElementById('toggleMapDeviceBtn').addEventListener('click', () => toggleDrawer('mapDeviceModal'));
  document.getElementById('switchClassBtn')?.addEventListener('click', () => {
    document.getElementById('inventoryDrawer').classList.add('hidden');
    document.getElementById('stashDrawer')?.classList.add('hidden');
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
