// Client Module: Equipment Paper-Doll, Black Market Gambler, Currency Bench & Stash Grid
(function () {
  with (window.__POS_CTX__) {
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
          if (activeCurrencyId) {
            ev.preventDefault();
            ev.stopPropagation();
            ws.send(JSON.stringify({
              type: 'use_currency',
              currencyId: activeCurrencyId,
              targetLocation: 'equipment',
              slotOrIdx: slot
            }));
            if (!ev.shiftKey) setActiveCurrency(null);
            return;
          }
          if (ev.shiftKey) {
            hideTooltip();
            ws.send(JSON.stringify({
              type: 'drop_item',
              itemId: item.id,
              slot
            }));
          }
        });

        cell.addEventListener('contextmenu', (ev) => {
          ev.preventDefault();
          hideTooltip();
          if (activeCurrencyId) {
            setActiveCurrency(null);
            return;
          }
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

    const isRun = worldState && worldState.mode === 'RUN';
    const availGold = isRun ? (myProfile.runGold ?? 0) : (myProfile.stashGold ?? myProfile.gold ?? 0);
    const goldTypeLbl = isRun ? 'RUN GOLD' : 'GOLD';

    const stashEl = document.getElementById('bmStashGoldVal');
    if (stashEl) stashEl.textContent = `(${availGold} ${goldTypeLbl})`;
    const ilvlEl = document.getElementById('bmTierIlvlLabel');
    if (ilvlEl) ilvlEl.textContent = `6 Fixed Items / Run • Hover to Inspect`;

    const stock = Array.isArray(myProfile.vendorStock) ? myProfile.vendorStock : [];
    for (const entry of stock) {
      if (!entry || !entry.item) continue;
      const item = entry.item;
      const isSold = Boolean(entry.sold);
      const canBuy = !isSold && availGold >= entry.cost;
      const card = document.createElement('div');
      card.className = 'bm-gamble-card';
      card.style.padding = '5px 7px';
      card.style.opacity = isSold ? '0.42' : (canBuy ? '1' : '0.68');
      card.style.borderColor = isSold ? '#2b2217' : (canBuy ? '#9c7a38' : '#4a2525');
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;min-width:0">
          <div style="width:28px;height:28px;background:#050403;border:1px solid #382c1d;display:flex;align-items:center;justify-content:center;flex-shrink:0">${getGearSvg(item)}</div>
          <div style="min-width:0;flex:1">
            <div class="text-${item.rarity}" style="font-family:var(--font-serif);font-size:0.74rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.68rem;color:#9e8d73">
              <span>ilvl ${item.ilvl || 1} ${item.slot.toUpperCase()}</span>
              <strong style="color:${isSold ? '#868e96' : (canBuy ? '#ffd43b' : '#ff8787')}">${isSold ? 'SOLD' : `${entry.cost}g`}</strong>
            </div>
          </div>
        </div>
      `;
      card.addEventListener('mouseenter', (ev) => showItemTooltip(ev, item, true));
      card.addEventListener('mouseleave', hideTooltip);
      if (!isSold) {
        card.addEventListener('click', () => {
          hideTooltip();
          if (ws) ws.send(JSON.stringify({ type: 'buy_vendor_item', stockId: entry.stockId || item.id }));
        });
      }
      bar.appendChild(card);
    }

    // Render Crafting Orb Shards Progress Strip (10 Shards = +1 Full Orb)
    const shardEl = document.getElementById('shardProgressBar');
    if (shardEl) {
      const shards = myProfile.shards || (myProfile.currencies && myProfile.currencies._shards) || {};
      const shardDefs = [
        ['transmute', 'TRN', '#74c0fc'],
        ['alteration', 'ALT', '#63e6be'],
        ['alchemy', 'ALC', '#ffd43b'],
        ['chaos', 'CHA', '#f59f00'],
        ['exalted', 'EXA', '#ff922b'],
        ['divine', 'DIV', '#ff6b6b']
      ];
      shardEl.innerHTML = shardDefs
        .map(([k, lbl, col]) => `<div class="stat-pair"><span>${lbl} SHARDS</span><strong style="color:${col}">${shards[k] || 0}/10</strong></div>`)
        .join('');
    }

    // Render Buyback List (Recently Salvaged Items)
    const buybackEl = document.getElementById('buybackList');
    if (buybackEl) {
      buybackEl.innerHTML = '';
      const buybacks = (myProfile.buybackItems || []).slice(0, 3);
      if (buybacks.length === 0) {
        buybackEl.innerHTML = `<div style="color:#827563;font-size:0.74rem;padding:4px 2px">Open Inventory [I] and Right-Click any gear item while Vendor [V] is open to salvage it into Crafting Orb Shards!</div>`;
      } else {
        for (const entry of buybacks) {
          if (!entry || !entry.item) continue;
          const item = entry.item;
          const price = entry.price || 15;
          const canAfford = availGold >= price;
          const row = document.createElement('div');
          row.className = 'bm-buyback-row';
          row.style.padding = '3px 6px';
          row.innerHTML = `
            <div class="bm-buyback-left">
              <div class="bm-buyback-art" style="width:26px;height:26px">${getGearSvg(item)}</div>
              <div style="min-width:0">
                <div class="text-${item.rarity}" style="font-family:var(--font-serif);font-size:0.74rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</div>
                <div style="font-size:0.66rem;color:#9e8d73">ilvl ${item.ilvl || 1} ${item.slot.toUpperCase()}</div>
              </div>
            </div>
            <button class="poe-chisel-btn sm-btn" style="padding:2px 6px;font-size:0.68rem;color:${canAfford ? '#ffd43b' : '#ff8787'};border-color:${canAfford ? '#9c7a38' : '#4a2525'};flex-shrink:0" type="button">
              RECLAIM (${price}g)
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

  function setActiveCurrency(orbId) {
    activeCurrencyId = orbId || null;
    document.body.classList.toggle('crafting-mode-active', Boolean(activeCurrencyId));
    if (typeof renderCurrencyBench === 'function' && myProfile) renderCurrencyBench();
    if (typeof renderStashInventory === 'function' && myProfile) renderStashInventory();
  }

  // Capture-phase Right-Click: Crafting ALWAYS captures right-click first to cancel orb without triggering Stash/Inventory/Equipment actions!
  window.addEventListener('contextmenu', (ev) => {
    if (!activeCurrencyId) return;
    if (ev.target && ev.target.closest && ev.target.closest('.currency-btn')) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    hideTooltip();
    setActiveCurrency(null);
  }, true);

  function renderCurrencyBench() {
    const bar = document.getElementById('currencyBar');
    bar.innerHTML = '';

    const banner = document.getElementById('craftStatusBanner');
    if (banner) {
      if (activeCurrencyId && GameData.CURRENCIES[activeCurrencyId]) {
        const cName = GameData.CURRENCIES[activeCurrencyId].name;
        banner.textContent = `Crafting [${cName}]: L-Click Gear (Shift=Keep) • R-Click/ESC Cancel`;
        banner.style.color = '#ffd43b';
      } else {
        banner.textContent = 'Left/Right-Click Orb to Craft, then Left-Click Gear';
        banner.style.color = '#a3937c';
      }
    }

    for (const cDef of Object.values(GameData.CURRENCIES)) {
      const count = myProfile.currencies[cDef.id] || 0;
      const btn = document.createElement('button');
      btn.className = `currency-btn ${activeCurrencyId === cDef.id ? 'active-currency' : ''}`;
      btn.innerHTML = `<span class="orb-stack-num">${count}</span><div class="orb-svg-wrap">${getCurrencySvg(cDef.id)}</div><span class="orb-short-lbl">${cDef.short.toUpperCase()}</span>`;
      btn.title = `${cDef.name} (Click or Right-Click to Use): ${cDef.description}`;
      const selectOrbFn = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        setActiveCurrency(activeCurrencyId === cDef.id ? null : cDef.id);
      };
      btn.addEventListener('click', selectOrbFn);
      btn.addEventListener('contextmenu', selectOrbFn);
      bar.appendChild(btn);
    }
  }

  // Authentic PoE 1 10x5 Dark-Iron Character Inventory Bag (50 Recessed Cells) & 10x8 Persistent Account Stash (80 Cells)
  function renderAccountStashGrid() {
    const grid = document.getElementById('accountStashGrid');
    if (!grid || !myProfile) return;
    grid.innerHTML = '';
    const stash = myProfile.accountStash || [];
    const countLbl = document.getElementById('stashCountLabel');
    if (countLbl) countLbl.textContent = `(${stash.length}/80)`;

    for (let idx = 0; idx < 80; idx++) {
      const entry = stash[idx];
      const cell = document.createElement('div');
      if (!entry) {
        cell.className = 'bag-cell';
      } else {
        const isFlaskItem = entry.slot === 'flask';
        cell.className = `bag-cell occupied rarity-${entry.rarity}`;
        cell.innerHTML = `<div class="bag-cell-art">${getGearSvg(entry)}</div><span class="bag-cell-slot-tag">${isFlaskItem ? 'FLK' : entry.slot.slice(0, 3).toUpperCase()}</span>`;
        cell.addEventListener('click', (ev) => {
          ev.preventDefault();
          if (activeCurrencyId) {
            ev.stopPropagation();
            if (!isFlaskItem && ws) {
              ws.send(JSON.stringify({ type: 'use_currency', currencyId: activeCurrencyId, targetLocation: 'stash', slotOrIdx: idx }));
              if (!ev.shiftKey) setActiveCurrency(null);
            }
            return;
          }
          hideTooltip();
          if (ws) ws.send(JSON.stringify({ type: 'withdraw_stash_item', itemId: entry.id, stashIdx: idx }));
        });
        cell.addEventListener('contextmenu', (ev) => {
          ev.preventDefault();
          if (activeCurrencyId) {
            setActiveCurrency(null);
            return;
          }
          hideTooltip();
          if (ws) ws.send(JSON.stringify({ type: 'withdraw_stash_item', itemId: entry.id, stashIdx: idx }));
        });
        cell.addEventListener('mouseenter', (ev) => showItemTooltip(ev, entry, true));
        cell.addEventListener('mouseleave', hideTooltip);
      }
      grid.appendChild(cell);
    }
  }

  function renderStashInventory() {
    const grid = document.getElementById('inventoryGrid');
    grid.innerHTML = '';
    const inv = myProfile.inventory || [];
    document.getElementById('invCountLabel').textContent = `(${inv.length}/50)`;
    const isStashOpen = !document.getElementById('stashDrawer')?.classList.contains('hidden');
    const isVendorOpen = !document.getElementById('blackMarketDrawer')?.classList.contains('hidden');
    const hintEl = document.getElementById('invActionHint');
    if (hintEl) {
      hintEl.textContent = activeCurrencyId
        ? `CRAFTING [${activeCurrencyId.toUpperCase()}]: L-Click Gear to Craft (Shift=Keep) • R-Click Cancel`
        : isStashOpen
          ? 'L-Click: Equip • R-Click: Deposit to Account Stash [B]!'
          : isVendorOpen
            ? 'L-Click: Equip • R-Click: Salvage for Shards!'
            : 'L-Click: Equip • R-Click: Drop on Ground';
      hintEl.style.color = (activeCurrencyId || isStashOpen || isVendorOpen) ? '#ffd43b' : '#a3937c';
    }

    for (let idx = 0; idx < 50; idx++) {
      const entry = inv[idx];
      const cell = document.createElement('div');
      if (!entry) {
        cell.className = 'bag-cell';
        cell.addEventListener('contextmenu', (ev) => {
          ev.preventDefault();
          if (activeCurrencyId) setActiveCurrency(null);
        });
      } else {
        const isFlaskItem = entry.slot === 'flask';
        const isSelectedFlask = isFlaskItem && selectedInvFlaskIdx === idx;
        cell.className = `bag-cell occupied rarity-${entry.rarity} ${isSelectedFlask ? 'selected-flask-item' : ''}`;
        cell.innerHTML = `<div class="bag-cell-art">${getGearSvg(entry)}</div><span class="bag-cell-slot-tag">${isFlaskItem ? 'FLK' : entry.slot.slice(0, 3).toUpperCase()}</span>`;
        if (isFlaskItem) {
          cell.draggable = true;
          cell.addEventListener('dragstart', (ev) => {
            ev.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'inv_flask', invIdx: idx }));
          });
        }
        cell.addEventListener('click', (ev) => {
          // Crafting ALWAYS captures click first before Shift-deposit/drop or Equip!
          if (activeCurrencyId) {
            ev.preventDefault();
            ev.stopPropagation();
            if (!isFlaskItem) {
              ws.send(JSON.stringify({ type: 'use_currency', currencyId: activeCurrencyId, targetLocation: 'inventory', slotOrIdx: idx }));
              if (!ev.shiftKey) setActiveCurrency(null);
            }
            return;
          }
          if (ev.shiftKey) {
            hideTooltip();
            ws.send(JSON.stringify({
              type: isStashOpen ? 'deposit_stash_item' : 'drop_item',
              itemId: entry.id,
              invIdx: idx
            }));
            return;
          }
          if (isFlaskItem) {
            if (selectedBeltSlotIdx !== null) {
              ws.send(JSON.stringify({ type: 'equip_flask_slot', invIdx: idx, slotIndex: selectedBeltSlotIdx }));
              selectedBeltSlotIdx = null;
              selectedInvFlaskIdx = null;
              return;
            }
            if (selectedInvFlaskIdx === idx) {
              selectedInvFlaskIdx = null;
              ws.send(JSON.stringify({ type: 'equip_item', itemId: entry.id, invIdx: idx }));
            } else {
              selectedInvFlaskIdx = idx;
              renderFlaskBelt();
              renderStashInventory();
            }
            return;
          }
          ws.send(JSON.stringify({ type: 'equip_item', itemId: entry.id, invIdx: idx }));
        });
        cell.addEventListener('mouseenter', (ev) => {
          if (isFlaskItem) window.__POS_CTX__.hoveredInventoryFlaskIdx = idx;
          showItemTooltip(ev, entry, true);
        });
        cell.addEventListener('mouseleave', () => {
          if (window.__POS_CTX__.hoveredInventoryFlaskIdx === idx) window.__POS_CTX__.hoveredInventoryFlaskIdx = null;
          hideTooltip();
        });
        cell.addEventListener('contextmenu', (ev) => {
          ev.preventDefault();
          hideTooltip();
          if (activeCurrencyId) {
            setActiveCurrency(null);
            return;
          }
          const stashOpen = !document.getElementById('stashDrawer')?.classList.contains('hidden');
          const vendorOpen = !document.getElementById('blackMarketDrawer')?.classList.contains('hidden');
          ws.send(JSON.stringify({
            type: stashOpen ? 'deposit_stash_item' : vendorOpen ? 'salvage_item' : 'drop_item',
            itemId: entry.id,
            invIdx: idx
          }));
        });
      }
      grid.appendChild(cell);
    }
    renderAccountStashGrid();
  }

  Object.assign(window.__POS_CTX__, {
    setActiveCurrency, renderEquipmentPaperDoll, renderBlackMarketBar, renderCurrencyBench, renderStashInventory, renderAccountStashGrid
  });
  }
})();
