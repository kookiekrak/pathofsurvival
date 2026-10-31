// Client Module: Inventory Flask Rack, Bottom Skill Links Bar, Divine Gem Draft & Gem Links Window
(function () {
  with (window.__POS_CTX__) {
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

  Object.assign(window.__POS_CTX__, {
    renderInventoryFlaskBeltRack, renderBottomSkillLinksBar,
    renderWaveGemDraftBanner, renderGemLinksWindow
  });
  }
})();
