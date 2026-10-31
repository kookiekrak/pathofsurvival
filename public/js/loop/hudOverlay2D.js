// Client Module: 2D Projected World Labels, FilterBlade Ground Plates, Boss Plaque & Damage Numbers
(function () {
  with (window.__POS_CTX__) {
  function drawProjectedHudOverlay(dt) {
    const w = overlayCanvas.width, h = overlayCanvas.height;
    overlayCtx.clearRect(0, 0, w, h);
    dropHitBoxes = [];
    interactableHitBoxes = [];
    upgradeChestHitBoxes = [];

    const isElVisible = (id) => {
      const el = document.getElementById(id);
      return Boolean(el && !el.classList.contains('hidden'));
    };
    if (isElVisible('loginModal') || isElVisible('lobbyModal') || isElVisible('passiveTreeModal') || isElVisible('mapDeviceModal')) return;

    const gemsDrawerOpen = isElVisible('gemsDrawer');
    const rightDrawerOpen = isElVisible('inventoryDrawer');
    const draftBannerOpen = isElVisible('gemDraftBanner');

    const isPlateInHudZone = (rx, ry, tw, bh) => {
      if (rx < 305 && ry < 154) return true;
      if (rx + tw > w - 210 && ry < 310) return true;
      if (rx + tw > w - 340 && ry < 95) return true;
      if (rx + tw > w / 2 - 250 && rx < w / 2 + 250 && ry < 64) return true;
      if (draftBannerOpen && rx + tw > w / 2 - 430 && rx < w / 2 + 430 && ry < 330) return true;
      if (ry + bh > h - 185) return true;
      if (gemsDrawerOpen && rx < 450) return true;
      if (rightDrawerOpen && rx + tw > w - 495) return true;
      return false;
    };

    if (worldState.mode === 'HIDEOUT') {
      const mdPos = projectToScreen(0, 56, 0);
      if (mdPos) {
        overlayCtx.font = '700 15px Cinzel, serif'; overlayCtx.textAlign = 'center';
        const txt = 'TEMPLAR MAP DEVICE [M]', tw = overlayCtx.measureText(txt).width + 22;
        const rx = mdPos.x - tw / 2, ry = mdPos.y - 16;
        if (!isPlateInHudZone(rx, ry, tw, 24)) {
          overlayCtx.fillStyle = 'rgba(6, 5, 4, 0.88)'; overlayCtx.strokeStyle = '#c8a258'; overlayCtx.lineWidth = 1.5;
          overlayCtx.fillRect(rx, ry, tw, 24); overlayCtx.strokeRect(rx, ry, tw, 24);
          drawStrokedText(overlayCtx, txt, mdPos.x, mdPos.y + 1, '#f4e4b8', '#000000', 3.5);
        }
      }
      const stashPos = projectToScreen(-140, 0, -58);
      if (stashPos) {
        overlayCtx.font = '700 14px Cinzel, serif'; overlayCtx.textAlign = 'center';
        const txt = 'STASH & CRAFTING [I]', tw = overlayCtx.measureText(txt).width + 20;
        const rx = stashPos.x - tw / 2, ry = stashPos.y - 11;
        if (!isPlateInHudZone(rx, ry, tw, 22)) {
          overlayCtx.fillStyle = 'rgba(6, 5, 4, 0.86)'; overlayCtx.strokeStyle = '#8b6f43'; overlayCtx.lineWidth = 1.2;
          overlayCtx.fillRect(rx, ry, tw, 22); overlayCtx.strokeRect(rx, ry, tw, 22);
          drawStrokedText(overlayCtx, txt, stashPos.x, stashPos.y + 5, '#dfcf99', '#000000', 3.5);
        }
      }
    } else if (worldState.portalsOpen) {
      const extPos = projectToScreen(0, 62, 0);
      if (extPos) {
        overlayCtx.font = '700 15px Cinzel, serif'; overlayCtx.textAlign = 'center';
        const txt = 'ORIATH PORTAL [CLICK TO RETURN]', tw = overlayCtx.measureText(txt).width + 22;
        const rx = extPos.x - tw / 2, ry = extPos.y - 16;
        if (!isPlateInHudZone(rx, ry, tw, 24)) {
          overlayCtx.fillStyle = 'rgba(8, 12, 28, 0.9)'; overlayCtx.strokeStyle = '#74c0fc'; overlayCtx.lineWidth = 1.5;
          overlayCtx.fillRect(rx, ry, tw, 24); overlayCtx.strokeRect(rx, ry, tw, 24);
          drawStrokedText(overlayCtx, txt, extPos.x, extPos.y + 1, '#a5d8ff', '#000000', 3.5);
        }
      }
    }

    // Telegraphed Ground Hazard Labels
    for (const haz of (worldState.hazards || [])) {
      const pos = projectToScreen(haz.x, 10, haz.y);
      if (!pos) continue;
      overlayCtx.font = '700 14px Cinzel, serif'; overlayCtx.textAlign = 'center';
      drawStrokedText(overlayCtx, (haz.title || 'HAZARD').toUpperCase(), pos.x, pos.y, haz.kind === 'soak' ? '#ffd43b' : '#ff6b6b', '#000000', 3.5);
    }

    // Rotating Boss Raid Laser Beams (worldState.raidBeams)
    for (const bm of (worldState.raidBeams || [])) {
      const cPos = projectToScreen(bm.x, 12, bm.y);
      if (!cPos) continue;
      const arms = bm.arms || 4, baseAng = bm.angle ?? bm.ang ?? 0, len = bm.length || 520;
      overlayCtx.save();
      for (let a = 0; a < arms; a++) {
        const armAng = baseAng + (Math.PI * 2 * a) / arms;
        const ePos = projectToScreen(bm.x + Math.cos(armAng) * len, 12, bm.y + Math.sin(armAng) * len);
        if (!ePos) continue;
        overlayCtx.strokeStyle = bm.color || '#f03e3e'; overlayCtx.lineWidth = 6;
        overlayCtx.beginPath(); overlayCtx.moveTo(cPos.x, cPos.y); overlayCtx.lineTo(ePos.x, ePos.y); overlayCtx.stroke();
        overlayCtx.strokeStyle = '#ffffff'; overlayCtx.lineWidth = 2;
        overlayCtx.beginPath(); overlayCtx.moveTo(cPos.x, cPos.y); overlayCtx.lineTo(ePos.x, ePos.y); overlayCtx.stroke();
      }
      overlayCtx.restore();
    }

    // Maven Memory Game 2D Projected Quadrant Pad Labels & Flashing Preview Banner
    if (worldState.mavenMemory || worldState.raidId === 'raid_maven_crucible') {
      const mm = worldState.mavenMemory;
      const pads = [
        { label: 'NORTH', x: 0, z: -220, col: '#74c0fc' },
        { label: 'EAST',  x: 220, z: 0,  col: '#ffd43b' },
        { label: 'SOUTH', x: 0, z: 220,  col: '#69db7c' },
        { label: 'WEST',  x: -220, z: 0, col: '#da77f2' }
      ];
      overlayCtx.textAlign = 'center';
      for (let idx = 0; idx < pads.length; idx++) {
        const p = pads[idx], pPos = projectToScreen(p.x, 6, p.z);
        if (!pPos) continue;
        const isFlashing = mm && mm.phase === 'preview' && (mm.flashLabel === p.label || mm.flashIdx === idx);
        overlayCtx.font = isFlashing ? '800 18px Cinzel, serif' : '700 13px Cinzel, serif';
        drawStrokedText(overlayCtx, `${p.label} [PAD]`, pPos.x, pPos.y, isFlashing ? '#ffffff' : p.col, '#000000', 3.5);
        if (isFlashing) {
          overlayCtx.strokeStyle = p.col; overlayCtx.lineWidth = 3.5;
          overlayCtx.beginPath(); overlayCtx.arc(pPos.x, pPos.y - 4, 46, 0, Math.PI * 2); overlayCtx.stroke();
          const stepNum = (mm.step ?? 0) + 1;
          drawStrokedText(overlayCtx, `⚡ MEMORY STEP #${stepNum}: ${p.label} ⚡`, pPos.x, pPos.y - 26, '#ffe066', '#000000', 4);
        }
      }
      if (mm && mm.phase === 'preview' && mm.flashLabel) {
        overlayCtx.font = '800 20px Cinzel, serif';
        drawStrokedText(overlayCtx, `⚡ MEMORY STEP #${(mm.step ?? 0) + 1}: ${mm.flashLabel} ⚡`, w / 2, 112, '#ffe066', '#000000', 4.5);
      }
    }

    // Golden Sanctuary Safe Dome (worldState.raidSanctuary)
    if (worldState.raidSanctuary) {
      const s = worldState.raidSanctuary, sPos = projectToScreen(s.x, 2, s.y);
      if (sPos) {
        overlayCtx.font = '800 16px Cinzel, serif'; overlayCtx.textAlign = 'center';
        drawStrokedText(overlayCtx, `★ STAND HERE (${s.rem}s) ★`, sPos.x, sPos.y, '#69db7c', '#000000', 4);
      }
    }

    // Active Multi-Wave Blood Ritual Altar Label (worldState.activeRitual)
    if (worldState.activeRitual) {
      const rit = worldState.activeRitual, rPos = projectToScreen(rit.x, 38, rit.y);
      if (rPos) {
        overlayCtx.font = '800 15px Cinzel, serif'; overlayCtx.textAlign = 'center';
        drawStrokedText(overlayCtx, `🩸 BLOOD RITUAL WAVE ${rit.wave}/${rit.maxWaves} — SLAY OFFERINGS!`, rPos.x, rPos.y, '#ff6b6b', '#000000', 4);
      }
    }

    // Active Expanding Breach Rings World Plate
    for (const b of (worldState.breaches || [])) {
      const pos = projectToScreen(b.x, 48, b.y);
      if (!pos) continue;
      overlayCtx.font = '700 14px Cinzel, serif'; overlayCtx.textAlign = 'center';
      const txt = `CHAYULA BREACH RING (${b.rem}S • ${b.kills || 0} SLAIN)`;
      const tw = overlayCtx.measureText(txt).width + 22, rx = Math.round(pos.x - tw / 2), ry = Math.round(pos.y - 14);
      if (!isPlateInHudZone(rx, ry, tw, 24)) {
        overlayCtx.fillStyle = 'rgba(34, 6, 44, 0.92)'; overlayCtx.strokeStyle = '#e879f9'; overlayCtx.lineWidth = 1.6;
        overlayCtx.fillRect(rx, ry, tw, 24); overlayCtx.strokeRect(rx, ry, tw, 24);
        drawStrokedText(overlayCtx, txt, pos.x, ry + 17, '#f5d0fe', '#000000', 3.5);
      }
    }

    // Shrines, Strongboxes & Breach Clasps World Plates
    overlayCtx.font = '700 14px Cinzel, serif';
    for (const it of (worldState.interactables || [])) {
      const basePos = projectToScreen(it.x, 0, it.y), pos = projectToScreen(it.x, 42, it.y);
      if (!pos || !basePos) continue;
      if (basePos.x < 16 || basePos.x > w - 16 || basePos.y < 16 || basePos.y > h - 175) continue;
      const isBreach = it.kind === 'breach';
      const text = (it.label || (isBreach ? 'BREACH HAND CLASP [E]' : 'SHRINE')).toUpperCase();
      const tw = overlayCtx.measureText(text).width + 24, bh = 25;
      const rx = Math.max(12, Math.min(w - tw - 12, Math.round(pos.x - tw / 2)));
      let ry = Math.round(pos.y - 14);
      if (ry < 66 || isPlateInHudZone(rx, ry, tw, bh)) ry = Math.round(basePos.y + 10);
      if (isPlateInHudZone(rx, ry, tw, bh)) continue;
      const cx = Math.round(rx + tw / 2);

      overlayCtx.fillStyle = isBreach ? 'rgba(28, 6, 36, 0.94)' : 'rgba(6, 5, 4, 0.94)';
      overlayCtx.strokeStyle = isBreach ? '#da77f2' : '#9c7c4c'; overlayCtx.lineWidth = 1.5;
      overlayCtx.fillRect(rx, ry, tw, bh); overlayCtx.strokeRect(rx, ry, tw, bh);
      overlayCtx.textAlign = 'center';
      drawStrokedText(overlayCtx, text, cx, ry + 17, isBreach ? '#f3d9fa' : '#f4e4b8', '#000000', 3.5);
      interactableHitBoxes.push({ x: rx, y: ry, w: tw, h: bh, it });
    }

    // Scaling Gold Upgrade Chests World Plates
    const fallbackChestCost = myProfile && myProfile.nextChestCost ? myProfile.nextChestCost : 60;
    overlayCtx.font = '700 14px Cinzel, serif';
    for (const ch of (worldState.upgradeChests || [])) {
      if (ch.opened) continue;
      const basePos = projectToScreen(ch.x, 0, ch.y), pos = projectToScreen(ch.x, 44, ch.y);
      if (!pos || !basePos) continue;
      if (basePos.x < 16 || basePos.x > w - 16 || basePos.y < 16 || basePos.y > h - 175) continue;
      const cost = ch.cost || fallbackChestCost;
      const text = (ch.label || `GOLDEN CHEST [E / CLICK] (${cost} GOLD)`).toUpperCase();
      const tw = overlayCtx.measureText(text).width + 24, bh = 25;
      const rx = Math.max(12, Math.min(w - tw - 12, Math.round(pos.x - tw / 2)));
      let ry = Math.round(pos.y - 14);
      if (ry < 66 || isPlateInHudZone(rx, ry, tw, bh)) ry = Math.round(basePos.y + 10);
      if (isPlateInHudZone(rx, ry, tw, bh)) continue;
      const cx = Math.round(rx + tw / 2);

      overlayCtx.fillStyle = 'rgba(32, 22, 6, 0.95)'; overlayCtx.strokeStyle = '#ffd43b'; overlayCtx.lineWidth = 1.6;
      overlayCtx.fillRect(rx, ry, tw, bh); overlayCtx.strokeRect(rx, ry, tw, bh);
      overlayCtx.textAlign = 'center';
      drawStrokedText(overlayCtx, text, cx, ry + 17, '#ffe066', '#000000', 3.5);
      upgradeChestHitBoxes.push({ x: rx, y: ry, w: tw, h: bh, ch });
    }

    // Authentic FilterBlade / Neversink PoE 1 Ground Loot Plates
    const dropStyles = {
      t0:            { bg: 'rgba(255, 250, 245, 0.98)', border: '#e01111', text: '#ff3b3b', stroke: '#1a0000' },
      divine:        { bg: 'rgba(255, 250, 245, 0.98)', border: '#e01111', text: '#ff3b3b', stroke: '#1a0000' },
      unique:        { bg: 'rgba(38, 15, 4, 0.95)',  border: '#af6025', text: '#ff922b' },
      rare:          { bg: 'rgba(34, 30, 6, 0.95)',  border: '#ffff77', text: '#ffff77' },
      magic:         { bg: 'rgba(10, 14, 38, 0.94)', border: '#5c6bc0', text: '#99b4ff' },
      normal:        { bg: 'rgba(12, 12, 12, 0.92)', border: '#6e6e6e', text: '#e0e0e0' },
      currency:      { bg: 'rgba(26, 21, 14, 0.94)', border: '#aa9e82', text: '#dfcf99' },
      currency_high: { bg: 'rgba(42, 32, 10, 0.96)', border: '#ffd43b', text: '#ffe066' },
      flask:         { bg: 'rgba(6, 36, 28, 0.96)',  border: '#38d9a9', text: '#63e6be' }
    };
    overlayCtx.font = '700 14px Cinzel, serif';
    for (const drop of worldState.drops) {
      const pos = projectToScreen(drop.x, 22, drop.y);
      if (!pos) continue;
      const st = drop.t0 ? dropStyles.t0 : (dropStyles[drop.rarity] || dropStyles.normal);
      const isHovered = hoveredGroundDrop && hoveredGroundDrop.id === drop.id;
      const labelText = drop._upperLabel || (drop._upperLabel = drop.label.toUpperCase());
      const tw = drop._cachedTw || (drop._cachedTw = overlayCtx.measureText(labelText).width + 24), bh = 25;
      const rx = Math.round(pos.x - tw / 2), ry = Math.round(pos.y - 13);
      if (isPlateInHudZone(rx, ry, tw, bh)) continue;

      overlayCtx.fillStyle = st.bg;
      overlayCtx.strokeStyle = isHovered ? '#ffffff' : st.border;
      overlayCtx.lineWidth = isHovered ? 2.4 : (drop.t0 || drop.rarity === 'divine' ? 2.2 : 1.4);
      overlayCtx.fillRect(rx, ry, tw, bh); overlayCtx.strokeRect(rx, ry, tw, bh);
      overlayCtx.textAlign = 'center';
      drawStrokedText(overlayCtx, labelText, pos.x, ry + 17, st.text, st.stroke || '#000000', 3.5);
      dropHitBoxes.push({ x: rx, y: ry, w: tw, h: bh, drop });
    }

    // Featured Enemy & Overhead Enemy Health Bars
    let featuredEnemy = null, bestCursorDist = 140;
    for (const m of worldState.enemies) {
      const ent = enemyEntities.get(m.id);
      const ex = ent ? ent.group.position.x : m.x, ez = ent ? ent.group.position.z : m.y;
      const cursorDist = Math.hypot(mouseWorldPoint.x - ex, mouseWorldPoint.z - ez);
      if (cursorDist < bestCursorDist) { bestCursorDist = cursorDist; featuredEnemy = m; }
      else if (!featuredEnemy && (m.rarity === 'boss' || m.rarity === 'rare')) featuredEnemy = m;
      if (m.hp >= m.maxHp && m.rarity !== 'boss' && m.rarity !== 'rare') continue;

      const topY = m.rarity === 'boss' ? 76 : m.rarity === 'rare' ? 48 : 38;
      const pos = projectToScreen(ex, topY, ez);
      if (!pos) continue;

      const bw = m.rarity === 'boss' ? 92 : m.rarity === 'rare' ? 56 : 38, bh = m.rarity === 'boss' ? 8 : 6;
      const hpRatio = Math.max(0, m.hp / Math.max(1, m.maxHp));
      const bx = Math.round(pos.x - bw / 2), by = Math.round(pos.y);
      if (isPlateInHudZone(bx, by, bw, bh)) continue;

      overlayCtx.fillStyle = '#050303'; overlayCtx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
      overlayCtx.fillStyle = '#a61b12'; overlayCtx.fillRect(bx, by, Math.round(bw * hpRatio), bh);
      overlayCtx.strokeStyle = m.rarity === 'boss' ? '#af6025' : m.rarity === 'rare' ? '#d4be3b' : '#4d3b28';
      overlayCtx.lineWidth = 1.2; overlayCtx.strokeRect(bx - 1, by - 1, bw + 2, bh + 2);
    }

    if (featuredEnemy) {
      const isBoss = featuredEnemy.rarity === 'boss';
      const barW = isBoss ? 410 : 300, barH = 24, bx = Math.round(w / 2 - barW / 2), by = 8;
      const hpRatio = Math.max(0, featuredEnemy.hp / Math.max(1, featuredEnemy.maxHp));
      const nameColor = isBoss ? '#ff922b' : featuredEnemy.rarity === 'rare' ? '#ffff77' : featuredEnemy.rarity === 'magic' ? '#99b4ff' : '#f0eae1';

      overlayCtx.fillStyle = 'rgba(6, 4, 4, 0.94)'; overlayCtx.fillRect(bx, by, barW, barH);
      overlayCtx.fillStyle = featuredEnemy.invuln ? '#1098ad' : '#7d0f0a';
      overlayCtx.fillRect(bx + 1, by + 1, Math.round((barW - 2) * hpRatio), barH - 2);
      if (isBoss) {
        overlayCtx.strokeStyle = 'rgba(255, 212, 59, 0.75)'; overlayCtx.lineWidth = 1.5;
        for (const pct of [0.35, 0.70]) {
          const tx = Math.round(bx + barW * pct);
          overlayCtx.beginPath(); overlayCtx.moveTo(tx, by + 1); overlayCtx.lineTo(tx, by + barH - 1); overlayCtx.stroke();
        }
      }
      overlayCtx.strokeStyle = '#8b6f43'; overlayCtx.lineWidth = 1.8; overlayCtx.strokeRect(bx, by, barW, barH);

      overlayCtx.font = '700 15px Cinzel, serif'; overlayCtx.textAlign = 'center';
      const titleTxt = isBoss ? `${featuredEnemy.name.toUpperCase()} — PHASE ${featuredEnemy.phase || 1}/3` : featuredEnemy.name.toUpperCase();
      drawStrokedText(overlayCtx, titleTxt, w / 2, by + 17, nameColor, '#000000', 3.5);

      let subY = by + barH + 16;
      if (featuredEnemy.mods && featuredEnemy.mods.length > 0) {
        overlayCtx.font = '700 13px Cinzel, serif';
        drawStrokedText(overlayCtx, featuredEnemy.mods.join(' • '), w / 2, subY, '#a5d8ff', '#000000', 3.5);
        subY += 18;
      }
      if (featuredEnemy.castName) {
        const cbY = subY - 10, cbH = 18, cProg = Math.max(0, Math.min(1, featuredEnemy.castProg || 0));
        overlayCtx.fillStyle = 'rgba(10, 6, 16, 0.94)'; overlayCtx.fillRect(bx, cbY, barW, cbH);
        overlayCtx.fillStyle = '#d9480f'; overlayCtx.fillRect(bx + 1, cbY + 1, Math.round((barW - 2) * cProg), cbH - 2);
        overlayCtx.strokeStyle = '#ffd43b'; overlayCtx.lineWidth = 1.4; overlayCtx.strokeRect(bx, cbY, barW, cbH);
        overlayCtx.font = '700 12px Cinzel, serif';
        drawStrokedText(overlayCtx, `⚠ CASTING: ${featuredEnemy.castName.toUpperCase()}`, w / 2, cbY + 13, '#fff3bf', '#000000', 3);
      }
    }

    for (const p of worldState.players) {
      const ent = playerEntities.get(p.id);
      const px = ent ? ent.group.position.x : p.x, pz = ent ? ent.group.position.z : p.y;
      const pos = projectToScreen(px, 46, pz);
      if (!pos) continue;

      overlayCtx.font = '700 14px Cinzel, serif'; overlayCtx.textAlign = 'center';
      const hhTag = p.hhStacks > 0 ? ` [HH x${p.hhStacks}]` : '';
      const shrTag = p.shrineBuff ? ` [${p.shrineBuff.toUpperCase()}]` : '';
      const nameStr = `${p.name}${hhTag}${shrTag}`, tw = overlayCtx.measureText(nameStr).width + 14;
      overlayCtx.fillStyle = 'rgba(5, 4, 4, 0.78)'; overlayCtx.fillRect(pos.x - tw / 2, pos.y - 13, tw, 18);
      drawStrokedText(overlayCtx, nameStr, pos.x, pos.y + 1, p.id === myPlayerId ? '#f4e4b8' : '#e0e0e0', '#000000', 3.5);
      if (p.dead) drawStrokedText(overlayCtx, `SLAIN — REVIVING (${Math.round(p.reviveProgress * 100)}%)`, pos.x, pos.y + 18, '#ff6b6b', '#000000', 3.5);
    }

    if (worldState.mode !== 'HIDEOUT') { floatingTexts.length = 0; return; }
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.life -= dt; ft.yOffset += 36 * dt;
      if (ft.life <= 0) { floatingTexts.splice(i, 1); continue; }
      const pos = projectToScreen(ft.x, ft.yOffset, ft.z);
      if (!pos || isPlateInHudZone(pos.x - 20, pos.y - 16, 40, 20)) continue;
      overlayCtx.save();
      overlayCtx.globalAlpha = ft.life / ft.maxLife;
      overlayCtx.font = ft.crit ? '800 22px Cinzel, serif' : '700 16px Cinzel, serif';
      overlayCtx.textAlign = 'center';
      const color = ft.dtype === 'player_hit' ? '#ff5252' : ft.dtype === 'evade' ? '#dfcf99' : ft.crit ? '#ffe066' : '#ffffff';
      drawStrokedText(overlayCtx, ft.crit ? `${ft.text}!` : `${ft.text}`, pos.x, pos.y, color, '#000000', 4);
      overlayCtx.restore();
    }
  }

  Object.assign(window.__POS_CTX__, { drawProjectedHudOverlay });
  }
})();
