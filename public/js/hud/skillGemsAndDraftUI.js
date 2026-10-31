// Client Module: Inventory Flask Rack, Bottom Skill Links Bar, Divine Gem Draft & Gem Links Window
(function () {
  with (window.__POS_CTX__) {
  window.__POS_CTX__.selectedSupportGem = null;

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
        const slotMeta = (Array.isArray(myProfile.flaskBeltItems) && myProfile.flaskBeltItems[i]) || null;
        const maxChg = (slotMeta && slotMeta.maxCharges) || f.maxCharges;
        const useCost = (slotMeta && slotMeta.cost) || f.cost;
        const fName = (slotMeta && slotMeta.name) || f.name;
        const rawChg = typeof slotCharges[i] === 'number' ? slotCharges[i] : (chargesById[f.id] ?? maxChg);
        const cur = isMagebloodActive ? maxChg : rawChg;
        const pct = isMagebloodActive ? 100 : Math.min(100, Math.round((cur / maxChg) * 100));
        const shortLabel = f.name.replace(' Flask', '').toUpperCase();
        const ttFlaskItem = {
          id: `belt_flask_${i}`, flaskId: f.id, name: fName, baseName: f.name,
          slot: 'flask', rarity: 'flask', maxCharges: maxChg, cost: useCost,
          duration: (slotMeta && slotMeta.duration) || f.duration,
          mods: (slotMeta && slotMeta.mods) || [], affixes: [{ text: f.desc }]
        };

        cell.innerHTML = `
          <span class="inv-flask-slot-key">[${keyNum}]</span>
          <div style="transform:scale(0.68);margin-top:-3px">${getFlaskSvg(f.id, pct, f.color)}</div>
          <span class="inv-flask-slot-name">${shortLabel}</span>
        `;
        cell.addEventListener('mouseenter', (ev) => showItemTooltip(ev, ttFlaskItem, false));
        cell.addEventListener('mouseleave', hideTooltip);
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

  // Divine Gem Font Altar — Wave / Level-Up / Upgrade Chest Draft Banner
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
      if (isBoon) iconHtml = getBoonSvg(ch.color || '#f5d37a');
      else if (kind === 'link_expand') iconHtml = getCurrencySvg('alchemy');
      else if (kind === 'active_gem' && ch.gemId) iconHtml = getSkillSvg(ch.gemId);
      else iconHtml = getGemSvg(ch.color, isSup);

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
    const selSup = window.__POS_CTX__.selectedSupportGem;

    (myProfile.gemLinks || []).forEach((slotObj, sIdx) => {
      const row = document.createElement('div');
      row.className = 'gem-slot-row';
      if (selSup) row.style.cursor = 'pointer';

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
            const isPicked = selSup && selSup.fromType === 'slot' && selSup.fromSlot === sIdx && selSup.fromIdx === i;
            const pickStyle = isPicked ? 'box-shadow:0 0 10px #ffd43b;border:2px solid #ffd43b;' : '';
            chainHtml += `<div class="gem-socket-orb orb-${supDef.color}" data-unslot="${i}" style="${pickStyle}">${supDef.short}</div>`;
          } else {
            const emptyStyle = selSup ? 'border-color:#ffd43b;box-shadow:0 0 6px rgba(255,212,59,0.5);' : '';
            chainHtml += `<div class="gem-socket-orb orb-empty" style="${emptyStyle}" title="Click to Socket Selected Support Gem"></div>`;
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
          const supIdx = Number(orb.dataset.unslot);
          const supEntry = curSups[supIdx];
          const supDef = supEntry ? GameData.SKILL_GEMS[supEntry.id] : null;
          if (supDef && typeof showSupportGemTooltip === 'function') {
            orb.addEventListener('mouseenter', (ev) => showSupportGemTooltip(ev, supDef, supEntry.level || 1));
            orb.addEventListener('mouseleave', hideTooltip);
          }
          orb.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const curSel = window.__POS_CTX__.selectedSupportGem;
            if (!curSel) {
              window.__POS_CTX__.selectedSupportGem = {
                fromType: 'slot', fromSlot: sIdx, fromIdx: supIdx,
                gemId: supEntry.id, level: supEntry.level || 1
              };
              selectedReserveSupIdx = null;
              renderGemLinksWindow();
            } else if (curSel.fromType === 'slot' && curSel.fromSlot === sIdx && curSel.fromIdx === supIdx) {
              window.__POS_CTX__.selectedSupportGem = null;
              selectedReserveSupIdx = null;
              ws.send(JSON.stringify({ type: 'unslot_support_gem', slotIndex: sIdx, supIdx }));
            } else {
              ws.send(JSON.stringify({
                type: 'move_support_gem',
                fromType: curSel.fromType,
                fromSlot: curSel.fromSlot,
                fromIdx: curSel.fromIdx,
                toSlot: sIdx,
                toSupIdx: supIdx
              }));
              window.__POS_CTX__.selectedSupportGem = null;
              selectedReserveSupIdx = null;
            }
          });
          orb.addEventListener('contextmenu', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            window.__POS_CTX__.selectedSupportGem = null;
            selectedReserveSupIdx = null;
            hideTooltip();
            ws.send(JSON.stringify({ type: 'toss_support_gem', fromType: 'slot', slotIndex: sIdx, supIdx }));
          });
        });

        row.addEventListener('click', () => {
          const curSel = window.__POS_CTX__.selectedSupportGem;
          if (curSel) {
            ws.send(JSON.stringify({
              type: 'move_support_gem',
              fromType: curSel.fromType,
              fromSlot: curSel.fromSlot,
              fromIdx: curSel.fromIdx,
              toSlot: sIdx
            }));
            window.__POS_CTX__.selectedSupportGem = null;
            selectedReserveSupIdx = null;
          }
        });
      }

      board.appendChild(row);
    });

    const reserveGrid = document.getElementById('supportReserveGrid');
    reserveGrid.innerHTML = '';
    reserveGrid.onclick = (ev) => {
      const curSel = window.__POS_CTX__.selectedSupportGem;
      if (curSel && curSel.fromType === 'slot' && ev.target === reserveGrid) {
        ws.send(JSON.stringify({ type: 'unslot_support_gem', slotIndex: curSel.fromSlot, supIdx: curSel.fromIdx }));
        window.__POS_CTX__.selectedSupportGem = null;
        selectedReserveSupIdx = null;
      }
    };
    const reserve = myProfile.supportReserve || [];
    if (reserve.length === 0) {
      const msg = selSup && selSup.fromType === 'slot'
        ? 'Click here to Unslot Picked Support Gem into Reserve!'
        : 'No unlinked Support Gems in reserve.';
      reserveGrid.innerHTML = `<div style="grid-column:1/-1;color:#827563;font-size:0.86rem;cursor:pointer">${msg}</div>`;
      if (selSup && selSup.fromType === 'slot') {
        reserveGrid.firstElementChild.addEventListener('click', () => {
          ws.send(JSON.stringify({ type: 'unslot_support_gem', slotIndex: selSup.fromSlot, supIdx: selSup.fromIdx }));
          window.__POS_CTX__.selectedSupportGem = null;
          selectedReserveSupIdx = null;
        });
      }
    } else {
      reserve.forEach((rEntry, rIdx) => {
        const supDef = GameData.SKILL_GEMS[rEntry.gemId];
        if (!supDef) return;
        const isSel = selSup && selSup.fromType === 'reserve' && selSup.fromIdx === rIdx;
        const card = document.createElement('div');
        card.className = `reserve-gem-card ${isSel ? 'selected' : ''}`;
        card.innerHTML = `
          ${getGemSvg(supDef.color, true)}
          <div style="flex:1">
            <div class="text-gem" style="font-family:var(--font-serif);font-size:0.84rem;font-weight:700">${supDef.name} (Lv.${rEntry.level || 1})</div>
            <div style="font-size:0.74rem;color:#9e8d73">${isSel ? 'Selected — Click Skill Row to Link' : 'L-Click: Pick Up • R-Click: Toss'}</div>
          </div>
          <button class="poe-chisel-btn sm-btn toss-sup-btn" type="button" style="padding:2px 6px;font-size:0.66rem;color:#ff8787;border-color:#7a2e2e" title="Toss / Discard Support Gem">✕ TOSS</button>
        `;
        if (typeof showSupportGemTooltip === 'function') {
          card.addEventListener('mouseenter', (ev) => showSupportGemTooltip(ev, supDef, rEntry.level || 1));
          card.addEventListener('mouseleave', hideTooltip);
        }
        card.querySelector('.toss-sup-btn')?.addEventListener('click', (ev) => {
          ev.stopPropagation();
          window.__POS_CTX__.selectedSupportGem = null;
          selectedReserveSupIdx = null;
          hideTooltip();
          ws.send(JSON.stringify({ type: 'toss_support_gem', fromType: 'reserve', fromIdx: rIdx }));
        });
        card.addEventListener('click', () => {
          if (isSel) {
            window.__POS_CTX__.selectedSupportGem = null;
            selectedReserveSupIdx = null;
          } else {
            window.__POS_CTX__.selectedSupportGem = {
              fromType: 'reserve', fromIdx: rIdx, gemId: rEntry.gemId, level: rEntry.level || 1
            };
            selectedReserveSupIdx = rIdx;
          }
          renderGemLinksWindow();
        });
        card.addEventListener('contextmenu', (ev) => {
          ev.preventDefault();
          window.__POS_CTX__.selectedSupportGem = null;
          selectedReserveSupIdx = null;
          hideTooltip();
          ws.send(JSON.stringify({ type: 'toss_support_gem', fromType: 'reserve', fromIdx: rIdx }));
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
          pill.innerHTML = `<span><strong>${bDef.name}</strong> ${e.stacks > 1 ? `(x${e.stacks})` : ''}</span><span style="color:#9ec5ff;font-size:0.8rem">${bDef.desc}</span>`;
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
