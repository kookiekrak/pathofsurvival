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
      btn.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        activeCurrencyId = activeCurrencyId === cDef.id ? null : cDef.id;
        updateBanner();
        renderCurrencyBench();
      });
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
    const hintEl = document.getElementById('invActionHint');
    if (hintEl) {
      hintEl.textContent = 'L-Click: Equip • R-Click: Drop on Ground';
      hintEl.style.color = '#a3937c';
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
          ws.send(JSON.stringify({
            type: 'drop_inventory_item',
            itemId: entry.id,
            invIdx: idx
          }));
        });
      }
      grid.appendChild(cell);
    }
  }

  Object.assign(window.__POS_CTX__, {
    renderEquipmentPaperDoll, renderBlackMarketBar, renderCurrencyBench, renderStashInventory
  });
  }
})();
