// Client Module: Real-Time HUD, Flask Belt, Gem Draft Banner, Inventory, Black Market & Item Tooltips
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
      modeBadge.textContent = 'Safe Zone';
      waveTitle.textContent = 'Oriath Sanctuary';
      waveSub.textContent = `Selected Map: ${mapDef.name} (Tier ${mapDef.tier})`;
      if (waveProgWrap) waveProgWrap.classList.add('hidden');
    } else {
      const rem = Math.max(0, worldState.runDuration - worldState.runTimer);
      const mins = Math.floor(rem / 60);
      const secs = String(rem % 60).padStart(2, '0');
      modeBadge.textContent = `Monster Level ${67 + mapDef.tier}`;
      waveTitle.textContent = `${mapDef.name} — Wave ${worldState.wave}`;
      waveSub.textContent = worldState.portalsOpen
        ? `Boss Slain • Extraction Portal Open at (0,0) • Endless Waves Active`
        : `${mapDef.bossName} • ${mins}:${secs} • +${mapDef.lootQuantity}% Item Quantity`;

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
      const lifePct = Math.max(0, Math.min(100, (me.hp / Math.max(1, me.maxHp)) * 100));
      const esPct = me.maxEs > 0 ? Math.max(0, Math.min(100, (me.es / me.maxEs) * 100)) : 0;
      document.getElementById('lifeFill').style.height = `${lifePct}%`;
      document.getElementById('esOverlay').style.height = `${esPct}%`;
      document.getElementById('lifeText').textContent = `${me.hp} / ${me.maxHp}`;
      document.getElementById('esText').textContent = me.maxEs > 0 ? `ES ${me.es}/${me.maxEs}` : '';
      document.getElementById('dashCdText').textContent = me.dashCooldown > 0 ? `${me.dashCooldown}s` : 'RDY';

      // Vaal Ultimate Socket [R]
      const vaalSouls = me.vaalSouls ?? (myProfile && myProfile.vaalSouls) ?? 0;
      const vaalMax = me.vaalMaxSouls ?? (myProfile && myProfile.vaalMaxSouls) ?? 45;
      const vaalPct = Math.max(0, Math.min(100, Math.round((vaalSouls / Math.max(1, vaalMax)) * 100)));
      const vaalBtn = document.getElementById('vaalBtn');
      const vaalFill = document.getElementById('vaalSoulFill');
      const vaalText = document.getElementById('vaalSoulText');
      if (vaalFill) vaalFill.style.height = `${vaalPct}%`;
      if (vaalText) vaalText.textContent = vaalSouls >= vaalMax ? 'RDY!' : `${vaalSouls}/${vaalMax}`;
      if (vaalBtn) vaalBtn.classList.toggle('vaal-ready', vaalSouls >= vaalMax);

      // Rogue-Lite Dual-Loop Gold Counter (Run Gold in Map vs Stash Gold in Hideout)
      const isRunMode = worldState.mode === 'RUN';
      const goldVal = isRunMode
        ? (me.runGold ?? me.gold ?? (myProfile && myProfile.runGold) ?? 0)
        : (me.stashGold ?? (myProfile && myProfile.gold) ?? me.gold ?? 0);
      const chestCost = me.nextChestCost ?? (myProfile && myProfile.nextChestCost) ?? 50;
      const goldEl = document.getElementById('hudGoldVal');
      const goldLbl = document.getElementById('hudGoldLbl');
      const costEl = document.getElementById('hudChestCost');
      const buyBtn = document.getElementById('buyChestBtn');
      const bmBtn = document.getElementById('openBlackMarketBtn');
      if (goldEl) goldEl.textContent = goldVal;
      if (goldLbl) {
        const stashAmt = me.stashGold ?? (myProfile && myProfile.gold) ?? 0;
        goldLbl.textContent = isRunMode ? `RUN GOLD (STASH: ${stashAmt}g)` : 'STASH GOLD';
      }
      if (costEl) costEl.textContent = chestCost;
      if (buyBtn) {
        buyBtn.classList.toggle('can-afford', goldVal >= chestCost);
        buyBtn.classList.toggle('hidden', !isRunMode);
      }
      if (bmBtn) {
        bmBtn.classList.toggle('hidden', isRunMode);
      }

      const readyBtn = document.getElementById('readyToggleBtn');
      if (readyBtn) {
        readyBtn.textContent = me.ready ? 'READY [F4]' : 'READY UP [F4]';
        readyBtn.classList.toggle('is-ready', !!me.ready);
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

    const displayGold = isRunMode ? (myProfile.runGold ?? 0) : (myProfile.gold ?? 0);
    const goldEl = document.getElementById('hudGoldVal');
    if (goldEl) goldEl.textContent = displayGold;
    const goldLbl = document.getElementById('hudGoldLbl');
    if (goldLbl) {
      goldLbl.textContent = isRunMode ? `RUN GOLD (STASH: ${myProfile.gold ?? 0}g)` : 'STASH GOLD';
    }
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
  }

  let selectedBeltSlotIdx = null;
  let selectedInvFlaskIdx = null;
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
    el.addEventListener('dragover', (ev) => {
      ev.preventDefault();
    });
    el.addEventListener('drop', (ev) => {
      ev.preventDefault();
      if (!ws) return;
      try {
        const payload = JSON.parse(ev.dataTransfer.getData('text/plain') || '{}');
        if (payload.kind === 'belt_slot' && typeof payload.slotIndex === 'number' && payload.slotIndex !== slotIdx) {
          ws.send(JSON.stringify({
            type: 'swap_flask_slots',
            fromSlot: payload.slotIndex,
            toSlot: slotIdx
          }));
          selectedBeltSlotIdx = null;
        } else if (payload.kind === 'inv_flask' && typeof payload.invIdx === 'number') {
          ws.send(JSON.stringify({
            type: 'equip_flask_slot',
            invIdx: payload.invIdx,
            slotIndex: slotIdx
          }));
          selectedInvFlaskIdx = null;
          selectedBeltSlotIdx = null;
        }
      } catch {
        // Ignore malformed drag payload
      }
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
        slot.innerHTML = `
          <span class="flask-key-num">${keyNum}</span>
          <div class="flask-svg-wrap flask-locked-wrap">
            <span class="flask-lock-glyph">EMPTY</span>
          </div>
          <span class="flask-charges-num">SLOT ${keyNum}</span>
        `;
        slot.title = `Empty Belt Slot [${keyNum}] — Drag/Click any Flask from Inventory [I] or Swap Belt Slots!`;
        slot.addEventListener('click', () => handleBeltSlotClick(i, false));
        wireBeltSlotDragAndDrop(slot, i);
        container.appendChild(slot);
        continue;
      }

      const isUtility = f.id !== 'life';
      const isMagebloodActive = hasMageblood && isUtility;
      const rawChg = typeof slotCharges[i] === 'number' ? slotCharges[i] : (chargesById[f.id] ?? f.maxCharges);
      const cur = isMagebloodActive ? f.maxCharges : rawChg;
      const pct = isMagebloodActive ? 100 : Math.min(100, Math.round((cur / f.maxCharges) * 100));
      const isBuffActive = isMagebloodActive || (slotTimers[i] || 0) > 0 || (activeById[f.id] || 0) > 0;

      slot.className = `flask-slot ${isBuffActive ? 'buff-active' : ''} ${isSelected ? 'selected-belt-slot' : ''}`;
      slot.innerHTML = `
        <span class="flask-key-num">${keyNum}</span>
        <div class="flask-svg-wrap">${getFlaskSvg(f.id, pct, f.color)}</div>
        <span class="flask-charges-num">${isMagebloodActive ? 'PERM' : `${cur}/${f.maxCharges}`}</span>
        ${isBuffActive ? '<div class="flask-buff-bar"></div>' : ''}
      `;
      slot.title = isMagebloodActive
        ? `Slot [${keyNum}] ${f.name} (MAGEBLOOD — Permanently Active at 125% Effect!): ${f.desc}`
        : `Slot [${keyNum}] ${f.name}: ${f.desc} (Open Inventory [I] to Swap/Move Slots)`;
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

  function renderInventoryFlaskBeltRack(belt, slotCharges, chargesById, hasMageblood) {
    const rack = document.getElementById('invFlaskBeltRow');
    if (!rack) return;
    rack.innerHTML = '';

    const hintEl = document.getElementById('flaskBeltHint');
    if (hintEl) {
      if (selectedInvFlaskIdx !== null) {
        hintEl.textContent = 'Click any Belt Slot [1–5] to Place Selected Flask!';
        hintEl.style.color = '#38d9a9';
      } else if (selectedBeltSlotIdx !== null) {
        hintEl.textContent = `Slot [${selectedBeltSlotIdx + 1}] Selected — Click another Slot [1–5] to Swap!`;
        hintEl.style.color = '#ffd43b';
      } else {
        hintEl.textContent = 'Drag or Click 2 Slots to Swap • R-Click: Unequip to Bag';
        hintEl.style.color = '#a3937c';
      }
    }

    for (let i = 0; i < 5; i++) {
      const flaskId = belt[i];
      const f = flaskId ? GameData.FLASKS.find(fl => fl.id === flaskId) : null;
      const keyNum = String(i + 1);
      const cell = document.createElement('div');
      const isSelected = selectedBeltSlotIdx === i;
      cell.className = `inv-flask-slot ${isSelected ? 'selected-belt-slot' : ''}`;

      if (!f) {
        cell.innerHTML = `
          <span class="inv-flask-slot-key">[${keyNum}]</span>
          <span style="font-family:var(--font-serif);font-size:0.62rem;color:#6e604c;margin-top:6px">EMPTY</span>
        `;
        cell.title = `Empty Belt Slot [${keyNum}] — Click or Drag any Flask here to equip it on Key [${keyNum}]!`;
      } else {
        const isUtility = f.id !== 'life';
        const isMagebloodActive = hasMageblood && isUtility;
        const rawChg = typeof slotCharges[i] === 'number' ? slotCharges[i] : (chargesById[f.id] ?? f.maxCharges);
        const cur = isMagebloodActive ? f.maxCharges : rawChg;
        const pct = isMagebloodActive ? 100 : Math.min(100, Math.round((cur / f.maxCharges) * 100));
        const shortLabel = f.name.replace(' Flask', '').toUpperCase();

        cell.innerHTML = `
          <span class="inv-flask-slot-key">[${keyNum}]</span>
          <div style="transform:scale(0.76);margin-top:-2px">${getFlaskSvg(f.id, pct, f.color)}</div>
          <span class="inv-flask-slot-name">${shortLabel}</span>
        `;
        cell.title = `Slot [${keyNum}] ${f.name}: ${f.desc}\n• Left-Click or Drag another Slot [1–5] to Swap\n• Right-Click to Unequip into Stash Grid`;
      }

      cell.addEventListener('click', () => handleBeltSlotClick(i, true));
      cell.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        if (f && ws) {
          selectedBeltSlotIdx = null;
          ws.send(JSON.stringify({ type: 'unequip_flask_slot', slotIndex: i }));
        }
      });
      wireBeltSlotDragAndDrop(cell, i);
      rack.appendChild(cell);
    }
  }

  function renderBottomSkillLinksBar() {
    const linksBar = document.getElementById('activeSkillLinksBar');
    linksBar.innerHTML = '';
    const setups = myProfile.skillSetups || [];
    const setupBySlot = new Map(setups.map(s => [s.slotIndex, s]));
    const bonusGemLv = (myProfile.stats && myProfile.stats.allGemLevels) || 0;

    // Render all 4 PoE Skill Socket Squares
    for (let slotIdx = 0; slotIdx < 4; slotIdx++) {
      const setup = setupBySlot.get(slotIdx);
      const cell = document.createElement('div');
      if (!setup) {
        cell.className = 'poe-skill-socket empty-skill-socket';
        cell.title = `Empty Skill Socket ${slotIdx + 1} (Draft an Active Skill Gem or press B)`;
        cell.innerHTML = `<span class="socket-key-tag">S${slotIdx + 1}</span>`;
        cell.addEventListener('click', () => toggleDrawer('gemsDrawer'));
      } else {
        cell.className = 'poe-skill-socket';
        const effLv = (setup.activeLevel || 1) + bonusGemLv;
        const pipsHtml = setup.supports
          .map(sup => `<span class="sup-pip pip-${sup.color}" title="${sup.name}"></span>`)
          .join('');
        cell.innerHTML = `
          <div class="skill-art-wrap">${getSkillSvg(setup.active.id)}</div>
          <span class="socket-key-tag">${setup.linkCount}L</span>
          <span class="socket-lvl-tag">Lv${effLv}</span>
          <div class="socket-support-pips">${pipsHtml}</div>
        `;
        cell.addEventListener('click', () => toggleDrawer('gemsDrawer'));
        cell.addEventListener('mouseenter', (e) => showGemSetupTooltip(e, setup));
        cell.addEventListener('mouseleave', hideTooltip);
      }
      linksBar.appendChild(cell);
    }
  }

  // Divine Gem Font Altar — Wave / Level-Up / Upgrade Chest Draft Banner (Supports Gems & Rogue-lite Run Boons!)
  function renderWaveGemDraftBanner() {
    const banner = document.getElementById('gemDraftBanner');
    const drafts = myProfile.pendingDrafts || [];
    if (drafts.length === 0) {
      banner.classList.add('hidden');
      return;
    }

    const current = drafts[0];
    banner.classList.remove('hidden');
    const isCoop = worldState && Array.isArray(worldState.players) && worldState.players.length > 1;
    const modeTag = isCoop ? ' (CO-OP LIVE)' : ' (PAUSED)';
    document.getElementById('draftReasonTitle').textContent = `${(current.reason || 'DIVINE DRAFT').toUpperCase()}${modeTag}`;
    document.getElementById('draftQueueBadge').textContent = `${drafts.length}`;
    const rerollCost = myProfile.rerollCost || 15;
    const rerollCostEl = document.getElementById('draftRerollCost');
    if (rerollCostEl) rerollCostEl.textContent = rerollCost;
    const rerollBtn = document.getElementById('rerollDraftBtn');
    if (rerollBtn) {
      const isRun = worldState && worldState.mode === 'RUN';
      const avail = isRun ? (myProfile.runGold ?? 0) : (myProfile.gold ?? 0);
      rerollBtn.style.opacity = avail >= rerollCost ? '1' : '0.55';
    }

    const row = document.getElementById('gemDraftChoicesRow');
    row.innerHTML = '';

    current.choices.forEach((ch, idx) => {
      const kind = ch.kind || ch.optionType || 'active_gem';
      const isBoon = kind === 'run_upgrade';
      const isSup = kind === 'support_gem';

      const card = document.createElement('div');
      card.className = `draft-card ${isBoon ? 'draft-boon' : ''}`;

      let iconHtml;
      if (isBoon) {
        iconHtml = getBoonSvg(ch.color || '#f5d37a');
      } else if (kind === 'link_expand') {
        iconHtml = getCurrencySvg('alchemy');
      } else if (kind === 'active_gem' && ch.gemId) {
        iconHtml = getSkillSvg(ch.gemId);
      } else {
        iconHtml = getGemSvg(ch.color, isSup);
      }

      card.innerHTML = `
        <div>
          <div class="draft-card-top">
            <div class="draft-gem-svg-wrap">${iconHtml}</div>
            <span class="draft-card-title">${ch.title}</span>
          </div>
          <div class="draft-card-sub">${ch.subtitle || (isBoon ? 'ROGUE-LITE RUN BOON' : '')}</div>
          <div class="draft-card-desc">${ch.desc}</div>
        </div>
        <div class="draft-hotkey">INSCRIBE [F${idx + 1}]</div>
      `;
      card.addEventListener('click', () => {
        if (ws) ws.send(JSON.stringify({ type: 'pick_gem_draft', optionId: ch.optionId }));
      });
      row.appendChild(card);
    });
  }

  // Dedicated Skill Gem Links, Support Board & Active Run Boons Window
  function renderGemLinksWindow() {
    const board = document.getElementById('gemLinksBoard');
    board.innerHTML = '';

    (myProfile.gemLinks || []).forEach((slotObj, sIdx) => {
      const row = document.createElement('div');
      row.className = 'gem-slot-row';

      const actGem = slotObj.activeGem ? GameData.SKILL_GEMS[slotObj.activeGem.id] : null;
      const maxSups = slotObj.maxSupports || 2;
      const curSups = slotObj.supports || [];

      if (!actGem) {
        row.innerHTML = `
          <div class="gem-slot-header">
            <span class="gem-active-title" style="color:#6e6252">SOCKET GROUP ${sIdx + 1} — UNALLOCATED</span>
          </div>
        `;
      } else {
        let chainHtml = `<div class="gem-socket-orb active-orb orb-${actGem.color}" title="${actGem.name}">${getGemSvg(actGem.color, false)}</div>`;
        for (let i = 0; i < maxSups; i++) {
          const supEntry = curSups[i];
          const supDef = supEntry ? GameData.SKILL_GEMS[supEntry.id] : null;
          chainHtml += `<div class="gem-link-bridge"></div>`;
          if (supDef) {
            chainHtml += `<div class="gem-socket-orb orb-${supDef.color}" data-unslot="${i}" title="${supDef.name} (Lv.${supEntry.level}) — Click to unslot to Reserve">${supDef.short}</div>`;
          } else {
            chainHtml += `<div class="gem-socket-orb orb-empty" title="Empty Linked Support Socket"></div>`;
          }
        }

        row.innerHTML = `
          <div class="gem-slot-header">
            <span class="gem-active-title">
              ${actGem.name} <span style="color:var(--poe-gold-muted);font-size:0.82rem">Lv. ${slotObj.activeGem.level}</span>
            </span>
            <span style="font-family:var(--font-serif);font-size:0.78rem;color:var(--poe-gold)">${1 + curSups.length}/${1 + maxSups} LINKED</span>
          </div>
          <div class="gem-links-chain">${chainHtml}</div>
        `;

        row.querySelectorAll('[data-unslot]').forEach(orb => {
          orb.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const supIdx = Number(orb.dataset.unslot);
            ws.send(JSON.stringify({
              type: 'unslot_support_gem',
              slotIndex: sIdx,
              supIdx
            }));
          });
        });

        row.addEventListener('click', () => {
          if (selectedReserveSupIdx !== null) {
            ws.send(JSON.stringify({
              type: 'move_support_gem',
              fromType: 'reserve',
              fromIdx: selectedReserveSupIdx,
              toSlot: sIdx
            }));
            selectedReserveSupIdx = null;
          }
        });
      }

      board.appendChild(row);
    });

    const reserveGrid = document.getElementById('supportReserveGrid');
    reserveGrid.innerHTML = '';
    const reserve = myProfile.supportReserve || [];
    if (reserve.length === 0) {
      reserveGrid.innerHTML = `<div style="grid-column:1/-1;color:#827563;font-size:0.86rem">No unlinked Support Gems in reserve.</div>`;
    } else {
      reserve.forEach((rEntry, rIdx) => {
        const supDef = GameData.SKILL_GEMS[rEntry.gemId];
        if (!supDef) return;
        const card = document.createElement('div');
        card.className = `reserve-gem-card ${selectedReserveSupIdx === rIdx ? 'selected' : ''}`;
        card.innerHTML = `
          ${getGemSvg(supDef.color, true)}
          <div>
            <div class="text-gem" style="font-family:var(--font-serif);font-size:0.84rem;font-weight:700">${supDef.name} (Lv.${rEntry.level || 1})</div>
            <div style="font-size:0.76rem;color:#9e8d73">Click to Link</div>
          </div>
        `;
        card.addEventListener('click', () => {
          selectedReserveSupIdx = selectedReserveSupIdx === rIdx ? null : rIdx;
          renderGemLinksWindow();
        });
        reserveGrid.appendChild(card);
      });
    }

    // Active Rogue-lite Run Boons List
    const boonsList = document.getElementById('runBoonsList');
    if (boonsList) {
      boonsList.innerHTML = '';
      const rawUpgrades = myProfile.runUpgrades || [];
      const entries = [];
      if (Array.isArray(rawUpgrades)) {
        for (const item of rawUpgrades) {
          const id = typeof item === 'string' ? item : item && item.id;
          const stacks = (typeof item === 'object' && item && (item.stacks || item.count || item.level)) || 1;
          if (id) entries.push({ id, stacks });
        }
      } else if (typeof rawUpgrades === 'object') {
        for (const [id, stacks] of Object.entries(rawUpgrades)) {
          if (stacks > 0) entries.push({ id, stacks });
        }
      }

      if (entries.length === 0) {
        boonsList.innerHTML = `<div style="color:#827563;font-size:0.84rem">No Run Boons active yet. Open Golden Upgrade Chests [E] or Level Up!</div>`;
      } else {
        for (const e of entries) {
          const bDef = (GameData.RUN_UPGRADES && GameData.RUN_UPGRADES[e.id]) || { name: e.id, desc: '' };
          const pill = document.createElement('div');
          pill.className = 'run-boon-pill';
          pill.innerHTML = `
            <span><strong>${bDef.name}</strong> ${e.stacks > 1 ? `(x${e.stacks})` : ''}</span>
            <span style="color:#9ec5ff;font-size:0.8rem">${bDef.desc}</span>
          `;
          boonsList.appendChild(pill);
        }
      }
    }
  }

  // Authentic PoE 1 Spatial 8-Slot Paper-Doll Layout with SVG Item Artwork
  function renderEquipmentPaperDoll() {
    const container = document.getElementById('equippedSlotsContainer');
    container.innerHTML = '';

    for (const slot of GameData.GEAR_SLOTS) {
      const item = myProfile.equipment[slot];
      const cell = document.createElement('div');
      cell.className = `pd-slot pd-slot-${slot} ${item ? 'rarity-' + item.rarity : ''}`;

      if (!item) {
        cell.innerHTML = `<span class="pd-slot-watermark">${slot.toUpperCase()}</span>`;
      } else {
        cell.innerHTML = `
          <span class="pd-slot-watermark">${slot.toUpperCase()}</span>
          <div class="pd-item-art">${getGearSvg(item)}</div>
          <div class="pd-item-caption text-${item.rarity}">${item.name}</div>
        `;

        cell.addEventListener('click', (ev) => {
          if (ev.shiftKey) {
            hideTooltip();
            ws.send(JSON.stringify({
              type: 'drop_item',
              itemId: item.id,
              slot
            }));
            return;
          }
          if (activeCurrencyId) {
            ws.send(JSON.stringify({
              type: 'use_currency',
              currencyId: activeCurrencyId,
              targetLocation: 'equipment',
              slotOrIdx: slot
            }));
          }
        });

        cell.addEventListener('contextmenu', (ev) => {
          ev.preventDefault();
          hideTooltip();
          ws.send(JSON.stringify({
            type: 'unequip_item',
            slot
          }));
        });

        cell.addEventListener('mouseenter', (ev) => showItemTooltip(ev, item, false));
        cell.addEventListener('mouseleave', hideTooltip);
      }

      container.appendChild(cell);
    }
  }

  function renderBlackMarketBar() {
    const bar = document.getElementById('blackMarketBar');
    if (!bar || !myProfile) return;
    bar.innerHTML = '';

    const stashGold = myProfile.stashGold ?? myProfile.gold ?? 0;
    const gCosts = myProfile.gambleCosts || { level: myProfile.level || 1, ilvl: myProfile.level || 1, weapon: 65, body: 55, armour: 45, jewelry: 70 };

    const stashEl = document.getElementById('bmStashGoldVal');
    if (stashEl) stashEl.textContent = `(${stashGold} STASH GOLD)`;
    const ilvlEl = document.getElementById('bmTierIlvlLabel');
    if (ilvlEl) ilvlEl.textContent = `Char Lv.${gCosts.level || myProfile.level || 1} • Rolls ilvl ${gCosts.ilvl} Gear`;

    const offers = [
      {
        label: 'MYSTERY WEAPON',
        sub: `Axes, Swords, Bows, Wands, Daggers (ilvl ${gCosts.ilvl})`,
        cost: gCosts.weapon,
        icon: '⚔️',
        title: `Gamble Mystery Weapon (ilvl ${gCosts.ilvl} • Guaranteed Magic, Rare, or Unique!) — Costs ${gCosts.weapon} Stash Gold`,
        action: () => ws && ws.send(JSON.stringify({ type: 'gamble_item', category: 'weapon' }))
      },
      {
        label: 'MYSTERY BODY ARMOUR',
        sub: `Chestplates, Brigandines, Robes (ilvl ${gCosts.ilvl})`,
        cost: gCosts.body || gCosts.armour,
        icon: '🥋',
        title: `Gamble Mystery Body Armour (ilvl ${gCosts.ilvl} • Guaranteed Magic, Rare, or Unique!) — Costs ${gCosts.body || gCosts.armour} Stash Gold`,
        action: () => ws && ws.send(JSON.stringify({ type: 'gamble_item', category: 'body' }))
      },
      {
        label: 'HELM / GLOVES / BOOTS',
        sub: `Headgear, Gauntlets, Greaves (ilvl ${gCosts.ilvl})`,
        cost: gCosts.armour,
        icon: '🛡️',
        title: `Gamble Mystery Helm, Gloves, or Boots (ilvl ${gCosts.ilvl}) — Costs ${gCosts.armour} Stash Gold`,
        action: () => ws && ws.send(JSON.stringify({ type: 'gamble_item', category: 'armour' }))
      },
      {
        label: 'JEWELRY & BELTS',
        sub: `Rings, Amulets, Heavy/Leather Belts (ilvl ${gCosts.ilvl})`,
        cost: gCosts.jewelry,
        icon: '💍',
        title: `Gamble Mystery Ring, Amulet, or Belt (ilvl ${gCosts.ilvl}) — Costs ${gCosts.jewelry} Stash Gold`,
        action: () => ws && ws.send(JSON.stringify({ type: 'gamble_item', category: 'jewelry' }))
      }
    ];

    for (const off of offers) {
      const canBuy = off.cost > 0 && stashGold >= off.cost;
      const btn = document.createElement('button');
      btn.className = 'bm-gamble-card';
      btn.style.opacity = canBuy ? '1' : '0.55';
      btn.style.borderColor = canBuy ? '#9c7a38' : '#382c1d';
      btn.innerHTML = `
        <div class="bm-gamble-top">
          <span>${off.icon} ${off.label}</span>
          <span style="color:${canBuy ? '#ffd43b' : '#ff8787'}">${off.cost}g</span>
        </div>
        <div class="bm-gamble-sub">${off.sub}</div>
      `;
      btn.title = off.title;
      btn.addEventListener('click', off.action);
      bar.appendChild(btn);
    }

    // Render Buyback List (Recently Sold Items)
    const buybackEl = document.getElementById('buybackList');
    if (buybackEl) {
      buybackEl.innerHTML = '';
      const buybacks = myProfile.buybackItems || [];
      if (buybacks.length === 0) {
        buybackEl.innerHTML = `<div style="color:#827563;font-size:0.82rem;padding:6px 2px">No recently sold items. Open Inventory [I] and Right-Click any item while Black Market is open to sell it for Gold.</div>`;
      } else {
        for (const entry of buybacks) {
          if (!entry || !entry.item) continue;
          const item = entry.item;
          const price = entry.price || computeVendorGoldPreview(item);
          const canAfford = stashGold >= price;
          const row = document.createElement('div');
          row.className = 'bm-buyback-row';
          row.innerHTML = `
            <div class="bm-buyback-left">
              <div class="bm-buyback-art">${getGearSvg(item)}</div>
              <div style="min-width:0">
                <div class="text-${item.rarity}" style="font-family:var(--font-serif);font-size:0.84rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</div>
                <div style="font-size:0.74rem;color:#9e8d73">ilvl ${item.ilvl || 1} ${item.slot.toUpperCase()}</div>
              </div>
            </div>
            <button class="poe-chisel-btn sm-btn" style="color:${canAfford ? '#ffd43b' : '#ff8787'};border-color:${canAfford ? '#9c7a38' : '#4a2525'};flex-shrink:0" type="button">
              BUYBACK (${price}g)
            </button>
          `;
          row.addEventListener('mouseenter', (ev) => showItemTooltip(ev, item, true));
          row.addEventListener('mouseleave', hideTooltip);
          row.querySelector('button')?.addEventListener('click', (ev) => {
            ev.stopPropagation();
            hideTooltip();
            if (ws) ws.send(JSON.stringify({ type: 'buyback_item', buybackId: item.id }));
          });
          buybackEl.appendChild(row);
        }
      }
    }
  }

  function renderCurrencyBench() {
    const bar = document.getElementById('currencyBar');
    bar.innerHTML = '';

    const updateBanner = () => {
      const banner = document.getElementById('craftStatusBanner');
      if (!banner) return;
      if (activeCurrencyId && GameData.CURRENCIES[activeCurrencyId]) {
        const cName = GameData.CURRENCIES[activeCurrencyId].name;
        banner.textContent = `Using ${cName} — Left-Click Gear (R-Click to Cancel)`;
        banner.style.color = '#ffd43b';
      } else {
        banner.textContent = 'Right-Click Orb to use, then Left-Click Gear';
        banner.style.color = '#a3937c';
      }
    };
    updateBanner();

    for (const cDef of Object.values(GameData.CURRENCIES)) {
      const count = myProfile.currencies[cDef.id] || 0;
      const btn = document.createElement('button');
      btn.className = `currency-btn ${activeCurrencyId === cDef.id ? 'active-currency' : ''}`;
      btn.innerHTML = `
        <span class="orb-stack-num">${count}</span>
        <div class="orb-svg-wrap">${getCurrencySvg(cDef.id)}</div>
        <span class="orb-short-lbl">${cDef.short.toUpperCase()}</span>
      `;
      btn.title = `${cDef.name} (Right-Click to Use): ${cDef.description}`;
      // Right-Click activates the Currency Orb for crafting!
      btn.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        activeCurrencyId = activeCurrencyId === cDef.id ? null : cDef.id;
        updateBanner();
        renderCurrencyBench();
      });
      // Left-Click cancels if active, or reminds player to Right-Click to use
      btn.addEventListener('click', () => {
        if (activeCurrencyId === cDef.id) {
          activeCurrencyId = null;
          updateBanner();
          renderCurrencyBench();
        } else {
          const banner = document.getElementById('craftStatusBanner');
          if (banner) {
            banner.textContent = `Right-Click ${cDef.short} Orb to pick up for crafting!`;
            banner.style.color = '#dfcf99';
          }
        }
      });
      bar.appendChild(btn);
    }
  }

  // Authentic PoE 1 8x4 Dark-Iron Grid Bag (32 Recessed Cells)
  function renderStashInventory() {
    const grid = document.getElementById('inventoryGrid');
    grid.innerHTML = '';
    const inv = myProfile.inventory || [];
    document.getElementById('invCountLabel').textContent = `(${inv.length}/32)`;
    const isBmOpen = !document.getElementById('blackMarketDrawer')?.classList.contains('hidden');
    const hintEl = document.getElementById('invActionHint');
    if (hintEl) {
      hintEl.textContent = isBmOpen
        ? 'L-Click: Equip • R-Click: Sell to Black Market (Buyback)'
        : 'L-Click: Equip • R-Click: Drop on Ground';
      hintEl.style.color = isBmOpen ? '#ffd43b' : '#a3937c';
    }

    for (let idx = 0; idx < 32; idx++) {
      const entry = inv[idx];
      const cell = document.createElement('div');
      if (!entry) {
        cell.className = 'bag-cell';
        cell.addEventListener('contextmenu', (ev) => {
          ev.preventDefault();
          if (activeCurrencyId) {
            activeCurrencyId = null;
            renderCurrencyBench();
          }
        });
      } else {
        const isFlaskItem = entry.slot === 'flask';
        const isSelectedFlask = isFlaskItem && selectedInvFlaskIdx === idx;
        cell.className = `bag-cell occupied rarity-${entry.rarity} ${isSelectedFlask ? 'selected-flask-item' : ''}`;
        cell.innerHTML = `
          <div class="bag-cell-art">${getGearSvg(entry)}</div>
          <span class="bag-cell-slot-tag">${isFlaskItem ? 'FLK' : entry.slot.slice(0, 3).toUpperCase()}</span>
        `;
        if (isFlaskItem) {
          cell.draggable = true;
          cell.addEventListener('dragstart', (ev) => {
            ev.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'inv_flask', invIdx: idx }));
          });
        }
        cell.addEventListener('click', (ev) => {
          if (ev.shiftKey) {
            hideTooltip();
            ws.send(JSON.stringify({
              type: 'drop_item',
              itemId: entry.id,
              invIdx: idx
            }));
            return;
          }
          if (isFlaskItem) {
            if (selectedBeltSlotIdx !== null) {
              ws.send(JSON.stringify({
                type: 'equip_flask_slot',
                invIdx: idx,
                slotIndex: selectedBeltSlotIdx
              }));
              selectedBeltSlotIdx = null;
              selectedInvFlaskIdx = null;
              return;
            }
            if (selectedInvFlaskIdx === idx) {
              // Second click auto-places into first empty belt slot (or slot 0)
              selectedInvFlaskIdx = null;
              ws.send(JSON.stringify({
                type: 'equip_item',
                itemId: entry.id,
                invIdx: idx
              }));
            } else {
              selectedInvFlaskIdx = idx;
              renderFlaskBelt();
              renderStashInventory();
            }
            return;
          }
          if (activeCurrencyId) {
            ws.send(JSON.stringify({
              type: 'use_currency',
              currencyId: activeCurrencyId,
              targetLocation: 'inventory',
              slotOrIdx: idx
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'equip_item',
              itemId: entry.id,
              invIdx: idx
            }));
          }
        });
        cell.addEventListener('mouseenter', (ev) => {
          if (isFlaskItem) {
            window.__POS_CTX__.hoveredInventoryFlaskIdx = idx;
          }
          showItemTooltip(ev, entry, true);
        });
        cell.addEventListener('mouseleave', () => {
          if (window.__POS_CTX__.hoveredInventoryFlaskIdx === idx) {
            window.__POS_CTX__.hoveredInventoryFlaskIdx = null;
          }
          hideTooltip();
        });
        cell.addEventListener('contextmenu', (ev) => {
          ev.preventDefault();
          hideTooltip();
          if (activeCurrencyId) {
            activeCurrencyId = null;
            renderCurrencyBench();
            return;
          }
          const bmCurrentlyOpen = !document.getElementById('blackMarketDrawer')?.classList.contains('hidden');
          if (bmCurrentlyOpen) {
            ws.send(JSON.stringify({
              type: 'sell_item',
              itemId: entry.id,
              invIdx: idx
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'drop_item',
              itemId: entry.id,
              invIdx: idx
            }));
          }
        });
      }
      grid.appendChild(cell);
    }
  }

  function renderCharStatsSummary() {
    const s = myProfile.stats;
    const box = document.getElementById('charStatsSummary');
    if (!box || !s) return;
    const hdr = document.getElementById('charSheetHeaderTitle');
    if (hdr) {
      hdr.textContent = `LV.${myProfile.level} ${myProfile.classId.toUpperCase()} (${myProfile.name.toUpperCase()})`;
    }
    const rows = [
      ['BASE DMG', s.unarmedPenalty ? 'UNARMED (-82%)' : `+${s.flatDmg || 0}`],
      ['MORE DMG', `+${s.globalDmgMulti || 0}%`],
      ['LIFE', s.maxLife],
      ['WARD ES', s.maxEs],
      ['ARMOUR', s.armor],
      ['EVASION', s.evasion],
      ['RESISTS', `${s.allRes}%`],
      ['PHYS', `+${s.physDmgPct}%`],
      ['ELE', `+${s.eleDmgPct}%`],
      ['SPELL', `+${s.spellDmgPct}%`],
      ['CRIT', `${s.finalCritChance}%`],
      ['STR/DEX/INT', `${s.str}/${s.dex}/${s.int}`]
    ];
    box.innerHTML = rows
      .map(([k, v]) => `<div class="stat-pair"><span>${k}</span><strong>${v}</strong></div>`)
      .join('');
  }

  // =========================================================================
  // AUTHENTIC POE 1 ITEM TOOLTIP WITH ILVL AFFIX CAPS, TIERS & STAT DELTAS
  // =========================================================================
  const tooltipEl = document.getElementById('floatingTooltip');

  function positionTooltip(clientX, clientY) {
    const pad = 16;
    let x = clientX + pad;
    let y = clientY + pad;
    if (x + 370 > window.innerWidth) x = clientX - 370;
    if (y + 300 > window.innerHeight) y = clientY - 280;
    tooltipEl.style.left = `${Math.max(8, x)}px`;
    tooltipEl.style.top = `${Math.max(8, y)}px`;
  }

  function computeVendorGoldPreview(item) {
    const ilvl = item.ilvl || 1;
    if (item.rarity === 'unique') return Math.round(30 + ilvl * 4);
    if (item.rarity === 'rare') return Math.round(14 + ilvl * 2.5);
    if (item.rarity === 'magic') return Math.round(6 + ilvl * 1.5);
    return Math.round(3 + ilvl);
  }

  function renderItemTooltipHTML(item, showDeltas = true, actionHint = '') {
    if (item.slot === 'flask') {
      tooltipEl.className = 'poe-tooltip tt-border-gem';
      const fDef = (GameData.FLASKS && GameData.FLASKS.find(fl => fl.id === item.flaskId)) || {};
      const desc = fDef.desc || (item.affixes && item.affixes[0] && item.affixes[0].text) || 'Utility Flask';
      return `
        <div class="tt-header tt-header-gem">
          <div class="tt-title-main">${item.name.toUpperCase()}</div>
          <div class="tt-title-base">CUSTOMIZABLE BELT FLASK (SLOTS 1–5)</div>
        </div>
        <div class="tt-body">
          <div class="tt-prop-line">Max Charges: <strong>${fDef.maxCharges || 30}</strong> • Uses <strong>${fDef.cost || 10}</strong> Charges</div>
          <div class="tt-separator"></div>
          <div class="tt-affix" style="color:#63e6be">${desc}</div>
          <div class="tt-separator"></div>
          <div class="tt-hint">Hover &amp; Press [1–5] or Click/Drag into any Belt Slot [1–5] to Equip • R-Click: Drop</div>
        </div>
      `;
    }
    tooltipEl.className = `poe-tooltip tt-border-${item.rarity}`;
    const ilvl = item.ilvl || 1;
    const tierCapLabel = ilvl >= 15
      ? 'Tier 1 (Max)'
      : ilvl >= 10
        ? 'Tier 2'
        : ilvl >= 6
          ? 'Tier 3'
          : ilvl >= 3
            ? 'Tier 4'
            : 'Tier 5';

    const impHtml = Object.entries(item.implicits || {})
      .map(([k, v]) => `<div class="tt-implicit">+${v} ${GameData.STAT_LABELS[k] || k} (implicit)</div>`)
      .join('');
    const afxHtml = (item.affixes || [])
      .map((a) => {
        let tierBadge = a.tierName || (a.tierNum ? `T${a.tierNum}` : (a.tier ? `T${a.tier}` : 'Tier'));
        if (!String(tierBadge).includes('(') && GameData.computeAffixTierRange) {
          const rInfo = GameData.computeAffixTierRange(a, ilvl);
          if (rInfo) {
            tierBadge = `${rInfo.baseTier} (${rInfo.rollMin}–${rInfo.rollMax})`;
          }
        }
        const cleanText = String(a.text || '').replace(/^\[T\d+\]\s*/i, '');
        return `<div class="tt-affix">${cleanText} <span style="color:#d6b05c;font-size:0.8rem">[${tierBadge}]</span></div>`;
      })
      .join('');
    const flavorHtml = item.flavor ? `<div class="tt-flavor">${item.flavor}</div>` : '';

    let deltasHtml = '';
    if (showDeltas && myProfile && myProfile.equipment) {
      const equipped = myProfile.equipment[item.slot];
      const deltas = GameData.compareGearItems(item, equipped);
      const eqName = equipped ? equipped.name : `Empty ${item.slot.toUpperCase()}`;
      if (deltas.length > 0) {
        const lines = deltas
          .map(d => `<div class="${d.diff > 0 ? 'delta-pos' : 'delta-neg'}">${d.formatted}</div>`)
          .join('');
        deltasHtml = `
          <div class="tt-deltas-box">
            <div class="tt-delta-title">COMPARING TO EQUIPPED: ${eqName.toUpperCase()}</div>
            ${lines}
          </div>
        `;
      } else {
        deltasHtml = `
          <div class="tt-deltas-box">
            <div class="tt-delta-title">IDENTICAL STATS TO EQUIPPED (${eqName.toUpperCase()})</div>
          </div>
        `;
      }
    }

    const goldVal = computeVendorGoldPreview(item);
    const isBmOpen = !document.getElementById('blackMarketDrawer')?.classList.contains('hidden');
    const defaultHint = showDeltas
      ? (isBmOpen
        ? `L-Click: Equip | R-Click: Sell to Black Market (+${goldVal} Gold, Buyback Available)`
        : `L-Click: Equip | R-Click: Drop on Ground (Open Black Market [V] to Sell)`)
      : `R-Click: Unequip to Bag | Shift+Click: Drop on Ground`;
    const finalHint = actionHint || defaultHint;

    const showTwoLine = item.name !== item.baseName;
    return `
      <div class="tt-header tt-header-${item.rarity}">
        <div class="tt-title-main">${item.name.toUpperCase()}</div>
        ${showTwoLine ? `<div class="tt-title-base">${item.baseName.toUpperCase()}</div>` : ''}
      </div>
      <div class="tt-body">
        <div class="tt-prop-line">Equipment Slot: <strong>${item.slot.toUpperCase()}</strong></div>
        <div class="tt-prop-line">Item Level: <strong>${ilvl}</strong> <span style="color:#d6b05c">(Caps Affixes at ${tierCapLabel})</span></div>
        <div class="tt-separator"></div>
        ${impHtml ? `${impHtml}<div class="tt-separator"></div>` : ''}
        ${afxHtml || '<div style="color:#9e9589">Unmodified Normal Item</div>'}
        ${deltasHtml}
        ${flavorHtml}
        <div class="tt-hint">${finalHint}</div>
      </div>
    `;
  }

  function showItemTooltip(ev, item, showDeltas = true) {
    tooltipEl.innerHTML = renderItemTooltipHTML(item, showDeltas);
    tooltipEl.classList.remove('hidden');
    positionTooltip(ev.clientX, ev.clientY);
  }

  function showGemSetupTooltip(ev, setup) {
    tooltipEl.className = 'poe-tooltip tt-border-gem';
    const supNames = setup.supports.map(s => `<div class="tt-affix">Supported by ${s.name} (Level ${s.level})</div>`).join('');
    tooltipEl.innerHTML = `
      <div class="tt-header tt-header-gem">
        <div class="tt-title-main">${setup.active.name.toUpperCase()}</div>
        <div class="tt-title-base">LEVEL ${setup.activeLevel} • ${setup.linkCount}-LINKED SKILL</div>
      </div>
      <div class="tt-body">
        <div class="tt-prop-line">Tags: <strong>${(setup.active.tags || []).join(', ')}</strong></div>
        <div class="tt-separator"></div>
        ${supNames || '<div style="color:#9e9589">No Linked Support Gems</div>'}
        <div class="tt-separator"></div>
        <div style="color:#dfcf99;font-size:0.9rem">${setup.active.description}</div>
      </div>
    `;
    tooltipEl.classList.remove('hidden');
    positionTooltip(ev.clientX, ev.clientY);
  }

  function hideTooltip() {
    tooltipEl.classList.add('hidden');
  }

    Object.assign(window.__POS_CTX__, { updateRealtimeHud, updateProfileUI, renderFlaskBelt, renderBottomSkillLinksBar, renderWaveGemDraftBanner, renderGemLinksWindow, renderEquipmentPaperDoll, renderBlackMarketBar, renderCurrencyBench, renderStashInventory, renderCharStatsSummary, tooltipEl, positionTooltip, computeVendorGoldPreview, renderItemTooltipHTML, showItemTooltip, showGemSetupTooltip, hideTooltip });
  }
})();
