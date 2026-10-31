// Client Module: Character Stats Sheet & PoE 1 Item / Skill Comparison Tooltips
(function () {
  with (window.__POS_CTX__) {
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
      const maxChg = item.maxCharges || fDef.maxCharges || 30;
      const costChg = item.cost || fDef.cost || 10;
      const durSec = item.duration || fDef.duration || 0;
      const modLines = Array.isArray(item.mods) ? [...item.mods] : [];
      if (modLines.length === 0) {
        if (fDef.maxCharges && maxChg > fDef.maxCharges) modLines.push(`+${maxChg - fDef.maxCharges} to Maximum Charges (Ample)`);
        if (fDef.cost && costChg < fDef.cost) modLines.push(`${Math.round((1 - costChg / fDef.cost) * 100)}% Reduced Charges Used (Chemist's)`);
        if (fDef.duration && durSec > fDef.duration) modLines.push(`+${+(durSec - fDef.duration).toFixed(1)}s Increased Flask Duration (Experimenter's)`);
        if (modLines.length === 0 && item.name && fDef.name && item.name !== fDef.name) modLines.push(`Rolled Prefix: ${item.name}`);
      }
      const modsHtml = modLines.length > 0
        ? modLines.map(m => `<div class="tt-affix" style="color:#8888ff">${m}</div>`).join('')
        : `<div class="tt-affix" style="color:#8888ff">Standard Flask Capacity & Charge Efficiency</div>`;
      return `
        <div class="tt-header tt-header-gem">
          <div class="tt-title-main">${(item.name || fDef.name || 'FLASK').toUpperCase()}</div>
          <div class="tt-title-base">CUSTOMIZABLE BELT FLASK (AUTO-TRIGGERS ON FULL CHARGES & IN COMBAT)</div>
        </div>
        <div class="tt-body">
          <div class="tt-prop-line">Max Charges: <strong>${maxChg}</strong> • Uses <strong>${costChg}</strong> Charges per Drink${durSec ? ` • Lasts <strong>${durSec}s</strong>` : ''}</div>
          <div class="tt-separator"></div>
          ${modsHtml}
          <div class="tt-separator"></div>
          <div class="tt-affix" style="color:#63e6be">${desc}</div>
          <div class="tt-prop-line" style="color:#ffd43b;font-size:0.78rem;margin-top:4px">⚡ Auto-Triggers on Full Charges & in Combat</div>
          <div class="tt-separator"></div>
          <div class="tt-hint">${actionHint || 'Hover & Press [1–5] or Click/Drag into Belt Slot [1–5] to Equip • R-Click: Unequip/Drop'}</div>
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
        ? `L-Click: Equip | R-Click: Salvage for Crafting Orb Shards & Gold`
        : `L-Click: Equip | R-Click: Drop on Ground (Open Vendor [V] to Salvage)`)
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

  function showSupportGemTooltip(ev, supDef, level = 1) {
    if (!supDef) return;
    tooltipEl.className = 'poe-tooltip tt-border-gem';
    tooltipEl.innerHTML = `
      <div class="tt-header tt-header-gem">
        <div class="tt-title-main">${supDef.name.toUpperCase()}</div>
        <div class="tt-title-base">LEVEL ${level} SUPPORT GEM (${(supDef.color || 'blue').toUpperCase()})</div>
      </div>
      <div class="tt-body">
        <div class="tt-prop-line">Support Tag: <strong>${(supDef.tags || ['Support']).join(', ')}</strong></div>
        <div class="tt-separator"></div>
        <div class="tt-affix" style="color:#63e6be">${supDef.description || supDef.desc || 'Enhances linked Active Skills.'}</div>
        <div class="tt-separator"></div>
        <div class="tt-hint">L-Click: Pick Up / Move to Another Skill • R-Click: Toss Gem</div>
      </div>
    `;
    tooltipEl.classList.remove('hidden');
    positionTooltip(ev.clientX, ev.clientY);
  }

  function hideTooltip() {
    tooltipEl.classList.add('hidden');
  }

  Object.assign(window.__POS_CTX__, {
    renderCharStatsSummary, tooltipEl, positionTooltip,
    computeVendorGoldPreview, renderItemTooltipHTML,
    showItemTooltip, showGemSetupTooltip, showSupportGemTooltip, hideTooltip
  });
  }
})();
