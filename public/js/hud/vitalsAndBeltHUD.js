// Client Module: Real-Time HUD Vitals, Globes, Party Portraits & 5-Slot Flask Belt
(function () {
  with (window.__POS_CTX__) {
  // =========================================================================
  // REAL-TIME HUD, 5-FLASK BELT, WAVE GEM DRAFT BANNER & SPLIT GEAR / GEMS
  // =========================================================================
  function updateRealtimeHud() {
    document.getElementById('hudRoomCode').textContent = worldState.roomCode;
    const modeBadge = document.getElementById('hudModeBadge');
    const mapDef = GameData.ATLAS_MAPS.find(m => m.id === worldState.mapId) || GameData.ATLAS_MAPS[0];
    const waveTitle = document.getElementById('waveTitle');
    const waveSub = document.getElementById('waveSubInfo');
    const waveProgWrap = document.getElementById('waveProgressBarWrap');
    const switchClassBtn = document.getElementById('switchClassBtn');

    if (switchClassBtn) {
      switchClassBtn.classList.toggle('hidden', worldState.mode !== 'HIDEOUT');
    }

    if (worldState.mode === 'HIDEOUT') {
      const isTown = worldState.roomCode === 'ORIATH';
      modeBadge.textContent = isTown ? 'Public Town Hub' : 'Safe Hideout';
      waveTitle.textContent = isTown ? 'Oriath Public Town' : 'Sanctuary Hideout';
      waveSub.textContent = isTown
        ? `${worldState.players.length} Exiles in Town • Travel to Hideout to Open Maps`
        : `Selected Map: ${mapDef.name} (Tier ${mapDef.tier})`;
      if (waveProgWrap) waveProgWrap.classList.add('hidden');
    } else {
      const rem = Math.max(0, worldState.runDuration - worldState.runTimer);
      const mins = Math.floor(rem / 60);
      const secs = String(rem % 60).padStart(2, '0');
      modeBadge.textContent = `Monster Level ${67 + mapDef.tier}`;
      waveTitle.textContent = `${mapDef.name} — Wave ${worldState.wave}`;
      const delTier = worldState.deliriumTier || 1;
      const delSub = worldState.deliriumRem > 0 ? ` • DELIRIUM TIER ${delTier} (${worldState.deliriumRem}s • +${delTier * 60}% Rarity)` : '';
      const ritSub = worldState.activeRitual ? ` • BLOOD RITUAL WAVE ${worldState.activeRitual.wave}/${worldState.activeRitual.maxWaves}` : '';
      const modRarity = (worldState.mapModStats && worldState.mapModStats.rarity) || 0;
      const totalRarity = (mapDef.lootRarityBonus || 0) + modRarity + (worldState.deliriumTier || 0) * 60;
      waveSub.textContent = (worldState.portalsOpen
        ? `Boss Slain • Extraction Portal Open at (0,0) • Endless Waves Active`
        : `${mapDef.bossName} • ${mins}:${secs} • +${totalRarity}% Item Rarity`) + delSub + ritSub;

      if (waveProgWrap) {
        waveProgWrap.classList.remove('hidden');
        const rawProg = worldState.waveProgress ?? 0;
        const pct = Math.max(0, Math.min(100, Math.round(rawProg <= 1 && rawProg > 0 ? rawProg * 100 : rawProg)));
        document.getElementById('waveProgressLabel').textContent = `WAVE ${worldState.wave} (ENDLESS)`;
        document.getElementById('waveProgressPct').textContent = `${pct}%`;
        document.getElementById('waveProgressFill').style.width = `${pct}%`;
      }
    }

    // PoE 1 Vertical Party Portrait Medallions (throttled DOM creation so 25Hz ticks never recreate SVGs)
    const roster = document.getElementById('partyRoster');
    let me = null;
    const pSignature = worldState.players.map(p => `${p.id}:${p.classId}`).join('|');
    if (roster._sig !== pSignature) {
      roster._sig = pSignature;
      roster.innerHTML = '';
      for (const p of worldState.players) {
        const row = document.createElement('div');
        row.className = 'poe-party-portrait';
        row.dataset.pid = p.id;
        row.innerHTML = `
          <div class="portrait-medallion">
            ${getClassEmblemSvg(p.classId)}
            <span class="portrait-lvl-pip">${p.level}</span>
          </div>
          <div class="portrait-info">
            <div class="portrait-name-row">
              <span class="portrait-pname">${p.name}</span>
              <span class="portrait-status"></span>
            </div>
            <div class="portrait-bars">
              <div class="portrait-hp-fill"></div>
              <div class="portrait-es-fill"></div>
            </div>
          </div>
        `;
        roster.appendChild(row);
      }
    }
    const rows = roster.children;
    for (let i = 0; i < worldState.players.length; i++) {
      const p = worldState.players[i];
      if (p.id === myPlayerId) me = p;
      const row = rows[i];
      if (!row) continue;
      const hpPct = Math.max(0, Math.min(100, Math.round((p.hp / Math.max(1, p.maxHp)) * 100)));
      const esPct = p.maxEs > 0 ? Math.max(0, Math.min(100, Math.round((p.es / p.maxEs) * 100))) : 0;
      const statusText = worldState.mode === 'HIDEOUT'
        ? (p.ready ? 'READY' : 'PREPARING')
        : `${p.kills} Slain`;
      const lvlPip = row.querySelector('.portrait-lvl-pip');
      if (lvlPip && lvlPip.textContent !== String(p.level)) lvlPip.textContent = p.level;
      const stEl = row.querySelector('.portrait-status');
      if (stEl) {
        if (stEl.textContent !== statusText) stEl.textContent = statusText;
        stEl.style.color = p.ready ? '#c8b38a' : '#786a56';
      }
      const hpBar = row.querySelector('.portrait-hp-fill');
      if (hpBar) hpBar.style.width = `${hpPct}%`;
      const esBar = row.querySelector('.portrait-es-fill');
      if (esBar) esBar.style.width = `${esPct}%`;
    }

    if (me) {
      if (me.league === 'Hardcore' && modeBadge && !modeBadge.textContent.includes('HARDCORE')) {
        modeBadge.textContent += ' • HARDCORE 💀';
      }
      const lifePct = Math.max(0, Math.min(100, (me.hp / Math.max(1, me.maxHp)) * 100));
      const esPct = me.maxEs > 0 ? Math.max(0, Math.min(100, (me.es / me.maxEs) * 100)) : 0;
      document.getElementById('lifeFill').style.height = `${lifePct}%`;
      document.getElementById('esOverlay').style.height = `${esPct}%`;
      document.getElementById('lifeText').textContent = `${me.hp} / ${me.maxHp}`;
      document.getElementById('esText').textContent = me.maxEs > 0 ? `ES ${me.es}/${me.maxEs}` : '';
      document.getElementById('dashCdText').textContent = me.dashCooldown > 0 ? `${me.dashCooldown}s` : 'RDY';

      // Vaal Ultimate Socket [R]
      const vaalSouls = me.vaalSouls ?? (myProfile && myProfile.vaalSouls) ?? 0;
      const vaalMax = me.maxVaalSouls ?? me.vaalMaxSouls ?? (myProfile && myProfile.maxVaalSouls) ?? 60;
      const vaalLock = me.vaalLock || 0;
      const vaalPct = Math.max(0, Math.min(100, Math.round((vaalSouls / Math.max(1, vaalMax)) * 100)));
      const vaalBtn = document.getElementById('vaalBtn');
      const vaalFill = document.getElementById('vaalSoulFill');
      const vaalText = document.getElementById('vaalSoulText');
      if (vaalFill) vaalFill.style.height = `${vaalPct}%`;
      if (vaalText) {
        vaalText.textContent = vaalLock > 0 ? `LOCK ${Math.ceil(vaalLock)}s` : (vaalSouls >= vaalMax ? 'RDY!' : `${vaalSouls}/${vaalMax}`);
      }
      if (vaalBtn) vaalBtn.classList.toggle('vaal-ready', vaalLock <= 0 && vaalSouls >= vaalMax);

      // Gold Counter (shows Run Gold in Maps, or Stash Gold in Hideout for the Vendor!)
      const isRunMode = worldState.mode === 'RUN';
      const goldBar = document.querySelector('.poe-gold-chest-bar');
      if (goldBar) goldBar.classList.remove('hidden');
      const goldVal = isRunMode
        ? (me.runGold ?? (myProfile && myProfile.runGold) ?? 0)
        : ((myProfile && (myProfile.stashGold ?? myProfile.gold)) ?? me.gold ?? 0);
      const chestCost = me.nextChestCost ?? (myProfile && myProfile.nextChestCost) ?? 50;
      const goldEl = document.getElementById('hudGoldVal');
      const goldLbl = document.getElementById('hudGoldLbl');
      const costEl = document.getElementById('hudChestCost');
      const buyBtn = document.getElementById('buyChestBtn');
      if (goldEl) goldEl.textContent = goldVal;
      if (goldLbl) goldLbl.textContent = isRunMode ? 'RUN GOLD' : 'GOLD [V]';
      if (costEl) costEl.textContent = chestCost;
      if (buyBtn) {
        buyBtn.classList.toggle('can-afford', goldVal >= chestCost);
        buyBtn.classList.toggle('hidden', !isRunMode);
      }

      const readyBtn = document.getElementById('readyToggleBtn');
      if (readyBtn) {
        const isTown = worldState.roomCode === 'ORIATH';
        readyBtn.textContent = isTown ? 'TO HIDEOUT' : (me.ready ? 'READY [F4]' : 'READY UP [F4]');
        readyBtn.classList.toggle('is-ready', !isTown && !!me.ready);
        readyBtn.classList.toggle('hidden', worldState.mode !== 'HIDEOUT');
      }
    }

    const extractBtn = document.getElementById('extractHideoutBtn');
    if (extractBtn) {
      extractBtn.classList.toggle('hidden', worldState.mode !== 'RUN');
    }
  }

  function updateProfileUI() {
    if (!myProfile) return;

    const isRunMode = worldState && worldState.mode === 'RUN';
    const charXpPct = Math.min(100, Math.round((myProfile.xp / Math.max(1, myProfile.xpNext)) * 100));
    const runLv = myProfile.runLevel || 1;
    const runXp = myProfile.runXp || 0;
    const runXpNext = myProfile.runXpNext || 180;
    const runXpPct = Math.min(100, Math.round((runXp / Math.max(1, runXpNext)) * 100));
    const allocatedNodesCount = Math.max(0, (myProfile.passives || []).length - 1);

    const activeBarPct = isRunMode ? runXpPct : charXpPct;
    document.getElementById('xpBarFill').style.width = `${activeBarPct}%`;
    document.getElementById('xpBarText').textContent = isRunMode
      ? `ROGUE-LITE LV.${runLv} (${runXp}/${runXpNext} • ${runXpPct}%)  •  CHAR LV.${myProfile.level} ${myProfile.classId.toUpperCase()} (${charXpPct}%)  •  TREE: ${allocatedNodesCount}/45`
      : `CHAR LV.${myProfile.level} ${myProfile.classId.toUpperCase()} (${myProfile.xp}/${myProfile.xpNext} XP • ${charXpPct}%)  •  ROGUE-LITE LV.1 (PER-MAP)  •  TREE: ${allocatedNodesCount}/45`;
    document.getElementById('unspentPassiveBadge').textContent = myProfile.passivePoints;
    document.getElementById('unspentPassiveBadge').classList.toggle('hidden', myProfile.passivePoints <= 0);
    document.getElementById('treePointsCount').textContent = myProfile.passivePoints;
    const allocEl = document.getElementById('treeAllocatedCount');
    if (allocEl) allocEl.textContent = allocatedNodesCount;

    const goldBar = document.querySelector('.poe-gold-chest-bar');
    if (goldBar) goldBar.classList.remove('hidden');
    const displayGold = isRunMode ? (myProfile.runGold ?? 0) : (myProfile.stashGold ?? myProfile.gold ?? 0);
    const goldEl = document.getElementById('hudGoldVal');
    if (goldEl) goldEl.textContent = displayGold;
    const goldLbl = document.getElementById('hudGoldLbl');
    if (goldLbl) goldLbl.textContent = isRunMode ? 'RUN GOLD' : 'GOLD [V]';
    if (typeof myProfile.nextChestCost === 'number') {
      const costEl = document.getElementById('hudChestCost');
      if (costEl) costEl.textContent = myProfile.nextChestCost;
    }

    // Pending Wave Gem Draft Badge
    const draftCount = (myProfile.pendingDrafts || []).length;
    const draftBadge = document.getElementById('pendingDraftBadge');
    draftBadge.textContent = draftCount;
    draftBadge.classList.toggle('hidden', draftCount === 0);

    const s = myProfile.stats;
    document.getElementById('hudArmor').textContent = s.armor;
    document.getElementById('hudEvasion').textContent = s.evasion;
    document.getElementById('hudRes').textContent = `${s.allRes}%`;
    document.getElementById('hudCrit').textContent = `${s.finalCritChance}%`;
    document.getElementById('hudMoveSpd').textContent = `${100 + s.moveSpeedPct}%`;

    renderFlaskBelt();
    renderBottomSkillLinksBar();
    renderWaveGemDraftBanner();
    renderGemLinksWindow();
    renderEquipmentPaperDoll();
    renderBlackMarketBar();
    renderCurrencyBench();
    renderStashInventory();
    renderCharStatsSummary();
    if (!document.getElementById('passiveTreeModal').classList.contains('hidden')) {
      renderPassiveTree();
    }
    if (!document.getElementById('mapDeviceModal').classList.contains('hidden') && typeof initMapDeviceModal === 'function') {
      initMapDeviceModal();
    }
  }

  window.__POS_CTX__.selectedBeltSlotIdx = null;
  window.__POS_CTX__.selectedInvFlaskIdx = null;
  window.__POS_CTX__.hoveredInventoryFlaskIdx = null;

  function getNormalizedFlaskBelt() {
    if (myProfile && Array.isArray(myProfile.flaskBelt) && myProfile.flaskBelt.length === 5) {
      return myProfile.flaskBelt;
    }
    const unlocked = (myProfile && myProfile.unlockedFlasks) || ['life'];
    const belt = [null, null, null, null, null];
    for (let i = 0; i < Math.min(5, unlocked.length); i++) {
      belt[i] = unlocked[i] || null;
    }
    return belt;
  }

  function handleBeltSlotClick(slotIdx, isInventoryRack = false) {
    if (!ws || !myProfile) return;
    const invOpen = !document.getElementById('inventoryDrawer').classList.contains('hidden');

    // 1. If a Flask in Inventory is selected, place it directly into this Belt Slot!
    if (selectedInvFlaskIdx !== null) {
      ws.send(JSON.stringify({
        type: 'equip_flask_slot',
        invIdx: selectedInvFlaskIdx,
        slotIndex: slotIdx
      }));
      selectedInvFlaskIdx = null;
      selectedBeltSlotIdx = null;
      return;
    }

    // 2. If interacting with the Inventory Belt Rack (or HUD belt while Inventory is open), click 2 slots to swap them!
    if (isInventoryRack || invOpen) {
      if (selectedBeltSlotIdx === null) {
        selectedBeltSlotIdx = slotIdx;
        renderFlaskBelt();
      } else if (selectedBeltSlotIdx === slotIdx) {
        selectedBeltSlotIdx = null;
        renderFlaskBelt();
      } else {
        ws.send(JSON.stringify({
          type: 'swap_flask_slots',
          fromSlot: selectedBeltSlotIdx,
          toSlot: slotIdx
        }));
        selectedBeltSlotIdx = null;
      }
      return;
    }

    // 3. During combat (Inventory closed), clicking the HUD Flask Slot drinks that slot's flask!
    ws.send(JSON.stringify({ type: 'flask', slotIndex: slotIdx }));
  }

  function wireBeltSlotDragAndDrop(el, slotIdx) {
    el.draggable = true;
    el.addEventListener('dragstart', (ev) => {
      ev.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'belt_slot', slotIndex: slotIdx }));
    });
    el.addEventListener('dragover', (ev) => ev.preventDefault());
    el.addEventListener('drop', (ev) => {
      ev.preventDefault();
      if (!ws) return;
      try {
        const payload = JSON.parse(ev.dataTransfer.getData('text/plain') || '{}');
        if (payload.kind === 'belt_slot' && typeof payload.slotIndex === 'number' && payload.slotIndex !== slotIdx) {
          ws.send(JSON.stringify({ type: 'swap_flask_slots', fromSlot: payload.slotIndex, toSlot: slotIdx }));
          selectedBeltSlotIdx = null;
        } else if (payload.kind === 'inv_flask' && typeof payload.invIdx === 'number') {
          ws.send(JSON.stringify({ type: 'equip_flask_slot', invIdx: payload.invIdx, slotIndex: slotIdx }));
          selectedInvFlaskIdx = null;
          selectedBeltSlotIdx = null;
        }
      } catch {}
    });
  }

  function renderFlaskBelt() {
    const container = document.getElementById('flaskBeltContainer');
    if (!container || !myProfile) return;
    container.innerHTML = '';

    const belt = getNormalizedFlaskBelt();
    const slotCharges = Array.isArray(myProfile.flaskSlotCharges) ? myProfile.flaskSlotCharges : [];
    const slotTimers = Array.isArray(myProfile.flaskSlotTimers) ? myProfile.flaskSlotTimers : [];
    const chargesById = myProfile.flaskCharges || {};
    const activeById = myProfile.activeFlasks || {};
    const hasMageblood = Boolean(myProfile.stats && myProfile.stats.mageblood > 0);

    for (let i = 0; i < 5; i++) {
      const flaskId = belt[i];
      const f = flaskId ? GameData.FLASKS.find(fl => fl.id === flaskId) : null;
      const keyNum = String(i + 1);
      const slot = document.createElement('div');
      const isSelected = selectedBeltSlotIdx === i;

      if (!f) {
        slot.className = `flask-slot flask-locked ${isSelected ? 'selected-belt-slot' : ''}`;
        slot.innerHTML = `<span class="flask-key-num">${keyNum}</span><div class="flask-svg-wrap flask-locked-wrap"><span class="flask-lock-glyph">EMPTY</span></div><span class="flask-charges-num">SLOT ${keyNum}</span>`;
        slot.title = `Empty Belt Slot [${keyNum}] — Drag/Click any Flask from Inventory [I] or Swap Belt Slots!`;
        slot.addEventListener('click', () => handleBeltSlotClick(i, false));
        wireBeltSlotDragAndDrop(slot, i);
        container.appendChild(slot);
        continue;
      }

      const isUtility = f.id !== 'life';
      const isMagebloodActive = hasMageblood && isUtility;
      const slotMeta = (Array.isArray(myProfile.flaskBeltItems) && myProfile.flaskBeltItems[i]) || null;
      const maxChg = (slotMeta && slotMeta.maxCharges) || f.maxCharges;
      const useCost = (slotMeta && slotMeta.cost) || f.cost;
      const fName = (slotMeta && slotMeta.name) || f.name;
      const rawChg = typeof slotCharges[i] === 'number' ? slotCharges[i] : (chargesById[f.id] ?? maxChg);
      const cur = isMagebloodActive ? maxChg : rawChg;
      const pct = isMagebloodActive ? 100 : Math.min(100, Math.round((cur / maxChg) * 100));
      const isBuffActive = isMagebloodActive || (slotTimers[i] || 0) > 0 || (activeById[f.id] || 0) > 0;
      const ttFlaskItem = {
        id: `belt_flask_${i}`, flaskId: f.id, name: fName, baseName: f.name,
        slot: 'flask', rarity: 'flask', maxCharges: maxChg, cost: useCost,
        duration: (slotMeta && slotMeta.duration) || f.duration,
        mods: (slotMeta && slotMeta.mods) || [], affixes: [{ text: f.desc }]
      };

      slot.className = `flask-slot ${isBuffActive ? 'buff-active' : ''} ${isSelected ? 'selected-belt-slot' : ''}`;
      slot.innerHTML = `
        <span class="flask-key-num">${keyNum}</span>
        <div class="flask-svg-wrap">${getFlaskSvg(f.id, pct, f.color)}</div>
        <span class="flask-charges-num">${isMagebloodActive ? 'PERM' : `${cur}/${maxChg}`}</span>
        ${isBuffActive ? '<div class="flask-buff-bar"></div>' : ''}
      `;
      slot.addEventListener('mouseenter', (ev) => showItemTooltip(ev, ttFlaskItem, false));
      slot.addEventListener('mouseleave', hideTooltip);
      slot.addEventListener('click', () => handleBeltSlotClick(i, false));
      slot.addEventListener('contextmenu', (ev) => {
        const invOpen = !document.getElementById('inventoryDrawer').classList.contains('hidden');
        if (invOpen && ws) {
          ev.preventDefault();
          ws.send(JSON.stringify({ type: 'unequip_flask_slot', slotIndex: i }));
        }
      });
      wireBeltSlotDragAndDrop(slot, i);
      container.appendChild(slot);
    }

    renderInventoryFlaskBeltRack(belt, slotCharges, chargesById, hasMageblood);
  }

  Object.assign(window.__POS_CTX__, {
    updateRealtimeHud, updateProfileUI, getNormalizedFlaskBelt,
    handleBeltSlotClick, wireBeltSlotDragAndDrop, renderFlaskBelt
  });
  }
})();
