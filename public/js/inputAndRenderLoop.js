// Client Module: Keyboard/Mouse Raycasting Input, 60FPS WebGL Render Loop, Overhead Plates & Minimap
(function () {
  with (window.__POS_CTX__) {
  // =========================================================================
  // KEYBOARD, MOUSE HOVER DELTA TOOLTIP, LEFT-CLICK HOLD & INTERACTIONS
  // =========================================================================
  window.addEventListener('keydown', (ev) => {
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
    const k = ev.key.toLowerCase();

    if (k === 'enter') {
      chatInput.focus();
      return;
    }

    if (k === 'w' || k === 'arrowup') keys.up = true;
    if (k === 's' || k === 'arrowdown') keys.down = true;
    if (k === 'a' || k === 'arrowleft') keys.left = true;
    if (k === 'd' || k === 'arrowright') keys.right = true;

    if (k === 'i' || k === 'b') toggleDrawer('inventoryDrawer');
    if (k === 'c' || k === 'g') toggleDrawer('gemsDrawer');
    if (k === 'v') toggleDrawer('blackMarketDrawer');
    if (k === 'p') toggleDrawer('passiveTreeModal');
    if (k === 'm') toggleDrawer('mapDeviceModal');
    if (k === 'l' && myPlayerId) toggleDrawer('lobbyModal');
    if (k === 'r' && ws) {
      ws.send(JSON.stringify({ type: 'use_vaal' }));
    }
    if (k === 'e' && ws) {
      const me = worldState.players.find(p => p.id === myPlayerId);
      const px = me ? me.x : camTargetX;
      const pz = me ? me.y : camTargetZ;
      let handled = false;
      for (const ch of (worldState.upgradeChests || [])) {
        if (!ch.opened && Math.hypot(ch.x - px, ch.y - pz) <= 115) {
          triggerBuyUpgradeChest(ch.id);
          handled = true;
          break;
        }
      }
      if (!handled) {
        for (const it of (worldState.interactables || [])) {
          if (!it.used && Math.hypot(it.x - px, it.y - pz) <= 115) {
            ws.send(JSON.stringify({ type: 'interact_world', id: it.id }));
            handled = true;
            break;
          }
        }
      }
    }
    if (k === 'tab') {
      ev.preventDefault();
      document.querySelector('.minimap-frame').classList.toggle('expanded');
    }
    // Wave Gem & Run Boon Draft Hotkeys F1 / F2 / F3 / F4
    if (['f1', 'f2', 'f3', 'f4'].includes(k) && myProfile && myProfile.pendingDrafts && myProfile.pendingDrafts.length > 0) {
      ev.preventDefault();
      const idx = Number(k.slice(1)) - 1;
      const choice = myProfile.pendingDrafts[0].choices[idx];
      if (choice && ws) {
        ws.send(JSON.stringify({ type: 'pick_gem_draft', optionId: choice.optionId }));
      }
      return;
    }

    if (ev.key === 'F4' && ws) {
      ev.preventDefault();
      ws.send(JSON.stringify({ type: 'toggle_ready' }));
    }

    // 5-Slot Customizable Flask Belt Hotkeys (1-5 or Q for Life Flask)
    if (['1', '2', '3', '4', '5'].includes(k) && ws) {
      const slotIndex = Number(k) - 1;
      const invOpen = !document.getElementById('inventoryDrawer').classList.contains('hidden');
      if (invOpen && typeof window.__POS_CTX__.hoveredInventoryFlaskIdx === 'number' && window.__POS_CTX__.hoveredInventoryFlaskIdx >= 0) {
        ws.send(JSON.stringify({
          type: 'equip_flask_slot',
          invIdx: window.__POS_CTX__.hoveredInventoryFlaskIdx,
          slotIndex
        }));
      } else {
        ws.send(JSON.stringify({ type: 'flask', slotIndex }));
      }
    } else if (k === 'q' && ws) {
      ws.send(JSON.stringify({ type: 'flask', flaskId: 'life' }));
    }

    if (k === 'escape') {
      if (activeCurrencyId) {
        activeCurrencyId = null;
        if (typeof renderCurrencyBench === 'function' && myProfile) renderCurrencyBench();
      }
      document.getElementById('inventoryDrawer').classList.add('hidden');
      document.getElementById('gemsDrawer').classList.add('hidden');
      document.getElementById('blackMarketDrawer')?.classList.add('hidden');
      document.getElementById('passiveTreeModal').classList.add('hidden');
      document.getElementById('mapDeviceModal').classList.add('hidden');
      document.getElementById('classSwitchModal')?.classList.add('hidden');
      if (typeof renderStashInventory === 'function' && myProfile) renderStashInventory();
      hideTooltip();
    }
    if (k === ' ' && ws) {
      ev.preventDefault();
      ws.send(JSON.stringify({ type: 'dash' }));
    }
    sendInputState();
  });

  window.addEventListener('keyup', (ev) => {
    const k = ev.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') keys.up = false;
    if (k === 's' || k === 'arrowdown') keys.down = false;
    if (k === 'a' || k === 'arrowleft') keys.left = false;
    if (k === 'd' || k === 'arrowright') keys.right = false;
    sendInputState();
  });

  function updateMouseWorldRaycast(clientX, clientY) {
    mouseClientX = clientX;
    mouseClientY = clientY;
    mouseNdc.x = (clientX / window.innerWidth) * 2 - 1;
    mouseNdc.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouseNdc, camera);
    raycaster.ray.intersectPlane(groundPlaneMath, mouseWorldPoint);
  }

  canvas.addEventListener('mousedown', (ev) => {
    if (ev.button === 0) {
      mouseDownLeft = true;
      updateMouseWorldRaycast(ev.clientX, ev.clientY);
      sendInputState();
    }
  });

  window.addEventListener('mouseup', (ev) => {
    if (ev.button === 0 && mouseDownLeft) {
      mouseDownLeft = false;
      sendInputState();
    }
  });

  canvas.addEventListener('mousemove', (ev) => {
    updateMouseWorldRaycast(ev.clientX, ev.clientY);
    checkGroundDropHover(ev.clientX, ev.clientY);
    sendInputState();
  });

  function checkGroundDropHover(mx, my) {
    let foundDrop = null;
    for (const box of dropHitBoxes) {
      if (mx >= box.x && mx <= box.x + box.w && my >= box.y && my <= box.y + box.h) {
        foundDrop = box.drop;
        break;
      }
    }
    hoveredGroundDrop = foundDrop;
    if (foundDrop && foundDrop.dt === 'gear' && foundDrop.item) {
      canvas.style.cursor = 'pointer';
      tooltipEl.innerHTML = renderItemTooltipHTML(foundDrop.item, true, 'Left-Click to Walk & Pick Up into Stash');
      tooltipEl.classList.remove('hidden');
      positionTooltip(mx, my);
    } else if (foundDrop) {
      canvas.style.cursor = 'pointer';
      hideTooltip();
    } else {
      canvas.style.cursor = 'crosshair';
      // Only hide tooltip if we aren't hovering a UI drawer
      if (
        document.getElementById('inventoryDrawer').classList.contains('hidden') &&
        document.getElementById('gemsDrawer').classList.contains('hidden')
      ) {
        hideTooltip();
      }
    }
  }

  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const factor = ev.deltaY > 0 ? 1.08 : 0.92;
    camZoom = Math.max(0.55, Math.min(1.65, camZoom * factor));
  }, { passive: false });

  canvas.addEventListener('click', (ev) => {
    updateMouseWorldRaycast(ev.clientX, ev.clientY);

    // 1. Check if player clicked a Ground Loot Label
    for (const box of dropHitBoxes) {
      if (ev.clientX >= box.x && ev.clientX <= box.x + box.w && ev.clientY >= box.y && ev.clientY <= box.y + box.h) {
        if (ws) ws.send(JSON.stringify({ type: 'pickup_drop', dropId: box.drop.id }));
        hideTooltip();
        return;
      }
    }

    // 2. Check if player clicked a Shrine, Strongbox, or Breach Label
    for (const ibox of interactableHitBoxes) {
      if (ev.clientX >= ibox.x && ev.clientX <= ibox.x + ibox.w && ev.clientY >= ibox.y && ev.clientY <= ibox.y + ibox.h) {
        if (ws) ws.send(JSON.stringify({ type: 'interact_world', id: ibox.it.id }));
        return;
      }
    }

    // 2b. Check if player clicked an Upgrade Chest Label
    for (const cbox of upgradeChestHitBoxes) {
      if (ev.clientX >= cbox.x && ev.clientX <= cbox.x + cbox.w && ev.clientY >= cbox.y && ev.clientY <= cbox.y + cbox.h) {
        triggerBuyUpgradeChest(cbox.ch.id);
        return;
      }
    }

    const wx = mouseWorldPoint.x;
    const wz = mouseWorldPoint.z;

    // 3. Check 3D World distance to Ground Drops, Shrines, Strongboxes, Upgrade Chests, or Map Device
    for (const d of worldState.drops) {
      if (Math.hypot(wx - d.x, wz - d.y) < 38 && ws) {
        ws.send(JSON.stringify({ type: 'pickup_drop', dropId: d.id }));
        return;
      }
    }
    for (const it of (worldState.interactables || [])) {
      if (Math.hypot(wx - it.x, wz - it.y) < 60 && ws) {
        ws.send(JSON.stringify({ type: 'interact_world', id: it.id }));
        return;
      }
    }
    for (const ch of (worldState.upgradeChests || [])) {
      if (Math.hypot(wx - ch.x, wz - ch.y) < 60 && ws) {
        triggerBuyUpgradeChest(ch.id);
        return;
      }
    }

    if (worldState.mode === 'HIDEOUT') {
      if (Math.hypot(wx - 0, wz - 0) < 95) {
        toggleDrawer('mapDeviceModal');
      } else if (Math.hypot(wx - (-140), wz - (-90)) < 65 || Math.hypot(wx - 140, wz - (-90)) < 65) {
        toggleDrawer('inventoryDrawer');
      }
    } else if (worldState.mode === 'RUN' && worldState.portalsOpen && Math.hypot(wx - 0, wz - 0) < 95) {
      ws.send(JSON.stringify({ type: 'return_hideout' }));
    }
  });

  function sendInputState() {
    if (!ws || ws.readyState !== 1) return;
    const me = worldState.players.find(p => p.id === myPlayerId);
    const px = me ? me.x : camTargetX;
    const pz = me ? me.y : camTargetZ;
    const aimX = mouseWorldPoint.x - px;
    const aimY = mouseWorldPoint.z - pz;
    ws.send(JSON.stringify({
      type: 'input',
      up: keys.up,
      down: keys.down,
      left: keys.left,
      right: keys.right,
      firing: mouseDownLeft,
      aimX,
      aimY
    }));
  }

  // =========================================================================
  // 60 FPS 3D WEBGL + 2D PROJECTED HUD & MINIMAP RENDER LOOP
  // =========================================================================
  const projVec = new THREE.Vector3();

  function projectToScreen(wx, wy, wz) {
    projVec.set(wx, wy, wz);
    projVec.project(camera);
    if (projVec.z > 1) return null;
    return {
      x: (projVec.x * 0.5 + 0.5) * overlayCanvas.width,
      y: (-projVec.y * 0.5 + 0.5) * overlayCanvas.height
    };
  }

  function drawStrokedText(ctx, text, x, y, fillStyle, strokeStyle = '#000000', lineWidth = 3.5) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fillStyle;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  let lastFrameTime = performance.now();
  function renderLoop(now) {
    const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    const me = worldState.players.find(p => p.id === myPlayerId) || worldState.players[0];
    if (me) {
      camTargetX += (me.x - camTargetX) * 0.16;
      camTargetZ += (me.y - camTargetZ) * 0.16;
    }

    // 3/4 Angled Action-RPG Camera so full 3D bodies, capes, and weapons are clearly visible
    camera.position.set(camTargetX, 235 * camZoom, camTargetZ + 310 * camZoom);
    camera.lookAt(camTargetX, 14, camTargetZ);

    dirLight.position.set(camTargetX + 180, 420, camTargetZ + 220);
    dirLight.target.position.set(camTargetX, 0, camTargetZ);
    playerLight.position.set(camTargetX, 52, camTargetZ);

    for (const ent of playerEntities.values()) {
      ent.group.position.x += (ent.targetX - ent.group.position.x) * 0.34;
      ent.group.position.z += (ent.targetZ - ent.group.position.z) * 0.34;
      let diff = ent.yaw - ent.group.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      ent.group.rotation.y += diff * 0.25;

      if (ent.esMesh.visible && !worldState.paused) ent.esMesh.rotation.y += dt * 1.6;
      if (ent.mixer && !worldState.paused) ent.mixer.update(dt);
    }

    renderLoop._frameMod3 = ((renderLoop._frameMod3 || 0) + 1) % 3;
    let eIdx = 0;
    for (const ent of enemyEntities.values()) {
      ent.group.position.x += (ent.targetX - ent.group.position.x) * 0.3;
      ent.group.position.z += (ent.targetZ - ent.group.position.z) * 0.3;

      const dxCam = Math.abs(ent.group.position.x - camTargetX);
      const dzCam = Math.abs(ent.group.position.z - camTargetZ);
      const isVisibleOnScreen = dxCam < 440 && dzCam < 380;
      if (ent.group.visible !== isVisibleOnScreen) {
        ent.group.visible = isVisibleOnScreen;
      }
      if (!isVisibleOnScreen) continue;

      let diff = ent.yaw - ent.group.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      ent.group.rotation.y += diff * 0.22;

      if (ent.mixer && !worldState.paused && ((eIdx++ % 3) === renderLoop._frameMod3)) {
        ent.mixer.update(dt * 3);
      }
    }

    for (const ent of projEntities.values()) {
      if (ent.spinSpeed && !worldState.paused) {
        ent.mesh.rotation.y += dt * ent.spinSpeed;
      }
    }
    for (const ent of dropEntities.values()) {
      ent.itemMesh.rotation.y += dt * 1.6;
    }
    for (const ent of interactableEntities.values()) {
      if (ent.breachTorus) {
        ent.breachTorus.rotation.z += dt * 1.4;
      }
    }
    for (const ent of upgradeChestEntities.values()) {
      if (ent.halo) {
        ent.halo.rotation.z += dt * 1.2;
      }
    }
    for (const ent of breachRingEntities.values()) {
      if (ent.anchor) {
        ent.anchor.rotation.y += dt * 2.2;
      }
    }
    if (mapDevicePortalGroup) {
      mapDevicePortalGroup.rotation.y = now * 0.00035;
    }

    for (let i = active3DFx.length - 1; i >= 0; i--) {
      const fx = active3DFx[i];
      fx.life -= dt;
      if (fx.life <= 0) {
        fxGroup.remove(fx.group);
        dispose3DFx(fx);
        active3DFx.splice(i, 1);
        continue;
      }
      const alpha = fx.life / fx.maxLife;
      if (fx.kind === 'nova') {
        if (fx.ownerId && (fx.sub === 'cyclone' || fx.sub === 'blade_vortex')) {
          const ownerEnt = playerEntities.get(fx.ownerId);
          if (ownerEnt) {
            fx.group.position.x = ownerEnt.group.position.x;
            fx.group.position.z = ownerEnt.group.position.z;
          }
        }
        const curR = fx.maxR * (1.05 - alpha * 0.75);
        fx.torus.scale.setScalar(curR);
        fx.discRing.scale.setScalar(curR);
        fx.torusMat.opacity = alpha * 0.92;
        fx.ringMat.opacity = alpha * 0.34;
        if (fx.spinGroup) {
          fx.spinGroup.rotation.y += dt * (fx.sub === 'cyclone' ? 18 : fx.sub === 'blade_vortex' ? 14 : 0);
        }
      } else if (fx.kind === 'arc') {
        fx.lineMat.opacity = alpha;
      } else if (fx.kind === 'burst') {
        fx.mat.opacity = alpha;
        for (const p of fx.parts) {
          p.vy -= 210 * dt;
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y = Math.max(2, p.mesh.position.y + p.vy * dt);
          p.mesh.position.z += p.vz * dt;
        }
      }
    }

    renderer.render(scene, camera);
    drawProjectedHudOverlay(dt);
    drawMinimapRadar();

    requestAnimationFrame(renderLoop);
  }

  function drawProjectedHudOverlay(dt) {
    const w = overlayCanvas.width;
    const h = overlayCanvas.height;
    overlayCtx.clearRect(0, 0, w, h);
    dropHitBoxes = [];
    interactableHitBoxes = [];
    upgradeChestHitBoxes = [];

    // Helper: returns true ONLY when the element exists in the DOM and does NOT have the 'hidden' class
    const isElVisible = (id) => {
      const el = document.getElementById(id);
      return Boolean(el && !el.classList.contains('hidden'));
    };

    // Skip 2D world overlay plates when any fullscreen modal is open
    const modalOpen =
      isElVisible('loginModal') ||
      isElVisible('lobbyModal') ||
      isElVisible('passiveTreeModal') ||
      isElVisible('mapDeviceModal');
    if (modalOpen) return;

    // Helper to prevent 2D world plates from drawing over or bleeding behind HUD panels & open drawers
    const gemsDrawerOpen = isElVisible('gemsDrawer');
    const rightDrawerOpen = isElVisible('inventoryDrawer');
    const draftBannerOpen = isElVisible('gemDraftBanner');

    const isPlateInHudZone = (rx, ry, tw, bh) => {
      // Top-left Party & Gold HUD
      if (rx < 305 && ry < 154) return true;
      // Top-right Zone & Minimap HUD
      if (rx + tw > w - 210 && ry < 310) return true;
      if (rx + tw > w - 340 && ry < 95) return true;
      // Top-center Boss Health Plaque area
      if (rx + tw > w / 2 - 250 && rx < w / 2 + 250 && ry < 64) return true;
      // Top-center Gem Draft Banner when active
      if (draftBannerOpen && rx + tw > w / 2 - 430 && rx < w / 2 + 430 && ry < 330) return true;
      // Bottom Globes, Flasks, Skills & XP Bar HUD
      if (ry + bh > h - 185) return true;
      // Open Left / Right Drawers
      if (gemsDrawerOpen && rx < 450) return true;
      if (rightDrawerOpen && rx + tw > w - 495) return true;
      return false;
    };

    if (worldState.mode === 'HIDEOUT') {
      const mdPos = projectToScreen(0, 56, 0);
      if (mdPos) {
        overlayCtx.font = '700 15px Cinzel, serif';
        overlayCtx.textAlign = 'center';
        const txt = 'TEMPLAR MAP DEVICE [M]';
        const tw = overlayCtx.measureText(txt).width + 22;
        const rx = mdPos.x - tw / 2;
        const ry = mdPos.y - 16;
        if (!isPlateInHudZone(rx, ry, tw, 24)) {
          overlayCtx.fillStyle = 'rgba(6, 5, 4, 0.88)';
          overlayCtx.strokeStyle = '#c8a258';
          overlayCtx.lineWidth = 1.5;
          overlayCtx.fillRect(rx, ry, tw, 24);
          overlayCtx.strokeRect(rx, ry, tw, 24);
          drawStrokedText(overlayCtx, txt, mdPos.x, mdPos.y + 1, '#f4e4b8', '#000000', 3.5);
        }
      }
      const stashPos = projectToScreen(-140, 0, -58);
      if (stashPos) {
        overlayCtx.font = '700 14px Cinzel, serif';
        overlayCtx.textAlign = 'center';
        const txt = 'STASH & CRAFTING [I]';
        const tw = overlayCtx.measureText(txt).width + 20;
        const rx = stashPos.x - tw / 2;
        const ry = stashPos.y - 11;
        if (!isPlateInHudZone(rx, ry, tw, 22)) {
          overlayCtx.fillStyle = 'rgba(6, 5, 4, 0.86)';
          overlayCtx.strokeStyle = '#8b6f43';
          overlayCtx.lineWidth = 1.2;
          overlayCtx.fillRect(rx, ry, tw, 22);
          overlayCtx.strokeRect(rx, ry, tw, 22);
          drawStrokedText(overlayCtx, txt, stashPos.x, stashPos.y + 5, '#dfcf99', '#000000', 3.5);
        }
      }
    } else if (worldState.portalsOpen) {
      const extPos = projectToScreen(0, 62, 0);
      if (extPos) {
        overlayCtx.font = '700 15px Cinzel, serif';
        overlayCtx.textAlign = 'center';
        const txt = 'ORIATH PORTAL [CLICK TO RETURN]';
        const tw = overlayCtx.measureText(txt).width + 22;
        const rx = extPos.x - tw / 2;
        const ry = extPos.y - 16;
        if (!isPlateInHudZone(rx, ry, tw, 24)) {
          overlayCtx.fillStyle = 'rgba(8, 12, 28, 0.9)';
          overlayCtx.strokeStyle = '#74c0fc';
          overlayCtx.lineWidth = 1.5;
          overlayCtx.fillRect(rx, ry, tw, 24);
          overlayCtx.strokeRect(rx, ry, tw, 24);
          drawStrokedText(overlayCtx, txt, extPos.x, extPos.y + 1, '#a5d8ff', '#000000', 3.5);
        }
      }
    }

    // Telegraphed Ground Hazard Labels (Vaal Flameblast / Molten Mortar)
    for (const haz of (worldState.hazards || [])) {
      const pos = projectToScreen(haz.x, 10, haz.y);
      if (!pos) continue;
      overlayCtx.font = '700 14px Cinzel, serif';
      overlayCtx.textAlign = 'center';
      drawStrokedText(overlayCtx, haz.title.toUpperCase(), pos.x, pos.y, '#ff6b6b', '#000000', 3.5);
    }

    // Active Expanding Breach Rings World Plate
    for (const b of (worldState.breaches || [])) {
      const pos = projectToScreen(b.x, 48, b.y);
      if (!pos) continue;
      overlayCtx.font = '700 14px Cinzel, serif';
      overlayCtx.textAlign = 'center';
      const txt = `CHAYULA BREACH RING (${b.rem}S • ${b.kills || 0} SLAIN)`;
      const tw = overlayCtx.measureText(txt).width + 22;
      const rx = Math.round(pos.x - tw / 2);
      const ry = Math.round(pos.y - 14);
      if (!isPlateInHudZone(rx, ry, tw, 24)) {
        overlayCtx.fillStyle = 'rgba(34, 6, 44, 0.92)';
        overlayCtx.strokeStyle = '#e879f9';
        overlayCtx.lineWidth = 1.6;
        overlayCtx.fillRect(rx, ry, tw, 24);
        overlayCtx.strokeRect(rx, ry, tw, 24);
        drawStrokedText(overlayCtx, txt, pos.x, ry + 17, '#f5d0fe', '#000000', 3.5);
      }
    }

    // Shrines, Strongboxes & Breach Clasps World Plates
    overlayCtx.font = '700 14px Cinzel, serif';
    for (const it of (worldState.interactables || [])) {
      const basePos = projectToScreen(it.x, 0, it.y);
      const pos = projectToScreen(it.x, 42, it.y);
      if (!pos || !basePos) continue;
      if (basePos.x < 16 || basePos.x > w - 16 || basePos.y < 16 || basePos.y > h - 175) continue;
      const isBreach = it.kind === 'breach';
      const text = (it.label || (isBreach ? 'BREACH HAND CLASP [E]' : 'SHRINE')).toUpperCase();
      const tw = overlayCtx.measureText(text).width + 24;
      const bh = 25;
      const rx = Math.max(12, Math.min(w - tw - 12, Math.round(pos.x - tw / 2)));
      // If top of shrine is near the top HUD / boss bar, place the plate just below the shrine base
      let ry = Math.round(pos.y - 14);
      if (ry < 66 || isPlateInHudZone(rx, ry, tw, bh)) {
        ry = Math.round(basePos.y + 10);
      }
      if (isPlateInHudZone(rx, ry, tw, bh)) continue;
      const cx = Math.round(rx + tw / 2);

      overlayCtx.fillStyle = isBreach ? 'rgba(28, 6, 36, 0.94)' : 'rgba(6, 5, 4, 0.94)';
      overlayCtx.strokeStyle = isBreach ? '#da77f2' : '#9c7c4c';
      overlayCtx.lineWidth = 1.5;
      overlayCtx.fillRect(rx, ry, tw, bh);
      overlayCtx.strokeRect(rx, ry, tw, bh);
      overlayCtx.textAlign = 'center';
      drawStrokedText(
        overlayCtx,
        text,
        cx,
        ry + 17,
        isBreach ? '#f3d9fa' : '#f4e4b8',
        '#000000',
        3.5
      );

      interactableHitBoxes.push({ x: rx, y: ry, w: tw, h: bh, it });
    }

    // Scaling Gold Upgrade Chests World Plates
    const fallbackChestCost = myProfile && myProfile.nextChestCost ? myProfile.nextChestCost : 60;
    overlayCtx.font = '700 14px Cinzel, serif';
    for (const ch of (worldState.upgradeChests || [])) {
      if (ch.opened) continue;
      const basePos = projectToScreen(ch.x, 0, ch.y);
      const pos = projectToScreen(ch.x, 44, ch.y);
      if (!pos || !basePos) continue;
      if (basePos.x < 16 || basePos.x > w - 16 || basePos.y < 16 || basePos.y > h - 175) continue;
      const cost = ch.cost || fallbackChestCost;
      const text = (ch.label || `GOLDEN CHEST [E / CLICK] (${cost} GOLD)`).toUpperCase();
      const tw = overlayCtx.measureText(text).width + 24;
      const bh = 25;
      const rx = Math.max(12, Math.min(w - tw - 12, Math.round(pos.x - tw / 2)));
      let ry = Math.round(pos.y - 14);
      if (ry < 66 || isPlateInHudZone(rx, ry, tw, bh)) {
        ry = Math.round(basePos.y + 10);
      }
      if (isPlateInHudZone(rx, ry, tw, bh)) continue;
      const cx = Math.round(rx + tw / 2);

      overlayCtx.fillStyle = 'rgba(32, 22, 6, 0.95)';
      overlayCtx.strokeStyle = '#ffd43b';
      overlayCtx.lineWidth = 1.6;
      overlayCtx.fillRect(rx, ry, tw, bh);
      overlayCtx.strokeRect(rx, ry, tw, bh);
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
      const tw = drop._cachedTw || (drop._cachedTw = overlayCtx.measureText(labelText).width + 24);
      const bh = 25;
      const rx = Math.round(pos.x - tw / 2);
      const ry = Math.round(pos.y - 13);
      if (isPlateInHudZone(rx, ry, tw, bh)) continue;

      overlayCtx.fillStyle = st.bg;
      overlayCtx.strokeStyle = isHovered ? '#ffffff' : st.border;
      overlayCtx.lineWidth = isHovered ? 2.4 : (drop.t0 || drop.rarity === 'divine' ? 2.2 : 1.4);
      overlayCtx.fillRect(rx, ry, tw, bh);
      overlayCtx.strokeRect(rx, ry, tw, bh);
      overlayCtx.textAlign = 'center';
      drawStrokedText(overlayCtx, labelText, pos.x, ry + 17, st.text, st.stroke || '#000000', 3.5);

      dropHitBoxes.push({ x: rx, y: ry, w: tw, h: bh, drop });
    }

    // Track Featured Enemy for PoE 1 Top-Center Monster Health Plaque
    let featuredEnemy = null;
    let bestCursorDist = 140;

    // Overhead Enemy Health Bars (PoE 1 style: only draw for Rare/Boss or Damaged enemies to avoid 100+ bar clutter & canvas lag)
    for (const m of worldState.enemies) {
      const ent = enemyEntities.get(m.id);
      const ex = ent ? ent.group.position.x : m.x;
      const ez = ent ? ent.group.position.z : m.y;

      const cursorDist = Math.hypot(mouseWorldPoint.x - ex, mouseWorldPoint.z - ez);
      if (cursorDist < bestCursorDist) {
        bestCursorDist = cursorDist;
        featuredEnemy = m;
      } else if (!featuredEnemy && (m.rarity === 'boss' || m.rarity === 'rare')) {
        featuredEnemy = m;
      }

      if (m.hp >= m.maxHp && m.rarity !== 'boss' && m.rarity !== 'rare') continue;

      const topY = m.rarity === 'boss' ? 76 : m.rarity === 'rare' ? 48 : 38;
      const pos = projectToScreen(ex, topY, ez);
      if (!pos) continue;

      const bw = m.rarity === 'boss' ? 92 : m.rarity === 'rare' ? 56 : 38;
      const bh = m.rarity === 'boss' ? 8 : 6;
      const hpRatio = Math.max(0, m.hp / Math.max(1, m.maxHp));
      const bx = Math.round(pos.x - bw / 2);
      const by = Math.round(pos.y);
      if (isPlateInHudZone(bx, by, bw, bh)) continue;

      overlayCtx.fillStyle = '#050303';
      overlayCtx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
      overlayCtx.fillStyle = '#a61b12';
      overlayCtx.fillRect(bx, by, Math.round(bw * hpRatio), bh);
      overlayCtx.strokeStyle = m.rarity === 'boss' ? '#af6025' : m.rarity === 'rare' ? '#d4be3b' : '#4d3b28';
      overlayCtx.lineWidth = 1.2;
      overlayCtx.strokeRect(bx - 1, by - 1, bw + 2, bh + 2);
    }

    // Authentic PoE 1 Top-Center Monster Nameplate & Modifier Plaque
    if (featuredEnemy) {
      const barW = featuredEnemy.rarity === 'boss' ? 380 : 300;
      const barH = 24;
      const bx = Math.round(w / 2 - barW / 2);
      const by = 8;
      const hpRatio = Math.max(0, featuredEnemy.hp / Math.max(1, featuredEnemy.maxHp));

      const nameColor = featuredEnemy.rarity === 'boss'
        ? '#ff922b'
        : featuredEnemy.rarity === 'rare'
          ? '#ffff77'
          : featuredEnemy.rarity === 'magic'
            ? '#99b4ff'
            : '#f0eae1';

      overlayCtx.fillStyle = 'rgba(6, 4, 4, 0.94)';
      overlayCtx.fillRect(bx, by, barW, barH);
      overlayCtx.fillStyle = '#7d0f0a';
      overlayCtx.fillRect(bx + 1, by + 1, Math.round((barW - 2) * hpRatio), barH - 2);
      overlayCtx.strokeStyle = '#8b6f43';
      overlayCtx.lineWidth = 1.8;
      overlayCtx.strokeRect(bx, by, barW, barH);

      overlayCtx.font = '700 15px Cinzel, serif';
      overlayCtx.textAlign = 'center';
      drawStrokedText(overlayCtx, featuredEnemy.name.toUpperCase(), w / 2, by + 17, nameColor, '#000000', 3.5);

      if (featuredEnemy.mods && featuredEnemy.mods.length > 0) {
        overlayCtx.font = '700 13px Cinzel, serif';
        drawStrokedText(overlayCtx, featuredEnemy.mods.join(' • '), w / 2, by + barH + 16, '#a5d8ff', '#000000', 3.5);
      }
    }

    // Player Nameplates & Active Buffs
    for (const p of worldState.players) {
      const ent = playerEntities.get(p.id);
      const px = ent ? ent.group.position.x : p.x;
      const pz = ent ? ent.group.position.z : p.y;
      const pos = projectToScreen(px, 46, pz);
      if (!pos) continue;

      overlayCtx.font = '700 14px Cinzel, serif';
      overlayCtx.textAlign = 'center';
      const hhTag = p.hhStacks > 0 ? ` [HH x${p.hhStacks}]` : '';
      const shrTag = p.shrineBuff ? ` [${p.shrineBuff.toUpperCase()}]` : '';
      const nameStr = `${p.name}${hhTag}${shrTag}`;
      const tw = overlayCtx.measureText(nameStr).width + 14;
      overlayCtx.fillStyle = 'rgba(5, 4, 4, 0.78)';
      overlayCtx.fillRect(pos.x - tw / 2, pos.y - 13, tw, 18);
      drawStrokedText(
        overlayCtx,
        nameStr,
        pos.x,
        pos.y + 1,
        p.id === myPlayerId ? '#f4e4b8' : '#e0e0e0',
        '#000000',
        3.5
      );

      if (p.dead) {
        drawStrokedText(
          overlayCtx,
          `SLAIN — REVIVING (${Math.round(p.reviveProgress * 100)}%)`,
          pos.x,
          pos.y + 18,
          '#ff6b6b',
          '#000000',
          3.5
        );
      }
    }

    // Floating Damage Numbers (Large, High-Contrast with Thick Outlines)
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.life -= dt;
      ft.yOffset += 36 * dt;
      if (ft.life <= 0) {
        floatingTexts.splice(i, 1);
        continue;
      }
      const pos = projectToScreen(ft.x, ft.yOffset, ft.z);
      if (!pos || isPlateInHudZone(pos.x - 20, pos.y - 16, 40, 20)) continue;

      overlayCtx.save();
      overlayCtx.globalAlpha = ft.life / ft.maxLife;
      overlayCtx.font = ft.crit ? '800 22px Cinzel, serif' : '700 16px Cinzel, serif';
      overlayCtx.textAlign = 'center';
      const color = ft.dtype === 'player_hit'
        ? '#ff5252'
        : ft.dtype === 'evade'
          ? '#dfcf99'
          : ft.crit
            ? '#ffe066'
            : '#ffffff';
      drawStrokedText(overlayCtx, ft.crit ? `${ft.text}!` : `${ft.text}`, pos.x, pos.y, color, '#000000', 4);
      overlayCtx.restore();
    }
  }

  // Corner Minimap Radar (Player-Centered Tactical Radar with Directional Edge Pips)
  function drawMinimapRadar() {
    const mw = minimapCanvas.width;
    const mh = minimapCanvas.height;
    minimapCtx.clearRect(0, 0, mw, mh);

    const radarRange = worldState.mode === 'HIDEOUT' ? 520 : 880;
    const ox = worldState.mode === 'HIDEOUT' ? 0 : camTargetX;
    const oz = worldState.mode === 'HIDEOUT' ? 0 : camTargetZ;
    const pad = 8;

    const toMap = (wx, wz, clampToEdge = false) => {
      let dx = (wx - ox) / radarRange;
      let dz = (wz - oz) / radarRange;
      if (clampToEdge) {
        const maxAxis = Math.max(Math.abs(dx), Math.abs(dz));
        if (maxAxis > 1) {
          dx /= maxAxis;
          dz /= maxAxis;
        }
      }
      return {
        x: (dx * 0.5 + 0.5) * (mw - pad * 2) + pad,
        y: (dz * 0.5 + 0.5) * (mh - pad * 2) + pad,
        inside: Math.abs(dx) <= 1 && Math.abs(dz) <= 1
      };
    };

    // Subtle PoE Terrain Grid & Tactical Rings
    minimapCtx.strokeStyle = 'rgba(94, 73, 48, 0.25)';
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(5, 5, mw - 10, mh - 10);
    minimapCtx.beginPath();
    minimapCtx.arc(mw / 2, mh / 2, (mw - 20) * 0.28, 0, Math.PI * 2);
    minimapCtx.stroke();

    // Center Portal / Map Device
    const center = toMap(0, 0, true);
    minimapCtx.fillStyle = worldState.portalsOpen ? '#74c0fc' : '#dfcf99';
    minimapCtx.beginPath();
    minimapCtx.arc(center.x, center.y, 3.2, 0, Math.PI * 2);
    minimapCtx.fill();

    // Shrines, Strongboxes & Breaches (clamped to radar edge if distant)
    for (const it of (worldState.interactables || [])) {
      const p = toMap(it.x, it.y, true);
      minimapCtx.fillStyle = it.kind === 'breach' ? '#da77f2' : it.kind === 'shrine' ? '#69db7c' : '#a38d6d';
      minimapCtx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
    }

    // Active Expanding Breach Rings on Minimap
    for (const b of (worldState.breaches || [])) {
      const p = toMap(b.x, b.y, true);
      const mapR = Math.max(4, ((b.r || 120) / radarRange) * (mw - pad * 2) * 0.5);
      minimapCtx.strokeStyle = '#e879f9';
      minimapCtx.lineWidth = 1.6;
      minimapCtx.beginPath();
      minimapCtx.arc(p.x, p.y, mapR, 0, Math.PI * 2);
      minimapCtx.stroke();
    }

    // Gold Upgrade Chests (clamped to radar edge if distant)
    for (const ch of (worldState.upgradeChests || [])) {
      if (ch.opened) continue;
      const p = toMap(ch.x, ch.y, true);
      minimapCtx.fillStyle = '#ffd43b';
      minimapCtx.fillRect(p.x - 3, p.y - 3, 6, 6);
    }

    // Ground Gear & Flask Drops
    for (const d of worldState.drops) {
      if (d.dt !== 'gear' && d.dt !== 'flask') continue;
      const p = toMap(d.x, d.y, false);
      if (!p.inside) continue;
      minimapCtx.fillStyle = d.dt === 'flask' ? '#38d9a9' : d.rarity === 'unique' ? '#af6025' : d.rarity === 'rare' ? '#ffff77' : '#8888ff';
      minimapCtx.beginPath();
      minimapCtx.arc(p.x, p.y, d.dt === 'flask' ? 3.2 : 2.5, 0, Math.PI * 2);
      minimapCtx.fill();
    }

    // Enemies
    for (const m of worldState.enemies) {
      const isBoss = m.rarity === 'boss';
      const p = toMap(m.x, m.y, isBoss);
      if (!p.inside && !isBoss) continue;
      minimapCtx.fillStyle = isBoss ? '#ff4d4d' : m.rarity === 'rare' ? '#ffff77' : '#c92a2a';
      const r = isBoss ? 4.5 : m.rarity === 'rare' ? 3.0 : 1.8;
      minimapCtx.beginPath();
      minimapCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
      minimapCtx.fill();
    }

    // Players (PoE White/Gold Cross)
    for (const pl of worldState.players) {
      const p = toMap(pl.x, pl.y, true);
      minimapCtx.strokeStyle = pl.id === myPlayerId ? '#fff3bf' : '#8888ff';
      minimapCtx.lineWidth = 2.0;
      minimapCtx.beginPath();
      minimapCtx.moveTo(p.x - 4.5, p.y);
      minimapCtx.lineTo(p.x + 4.5, p.y);
      minimapCtx.moveTo(p.x, p.y - 4.5);
      minimapCtx.lineTo(p.x, p.y + 4.5);
      minimapCtx.stroke();
    }
  }
    Object.assign(window.__POS_CTX__, { updateMouseWorldRaycast, checkGroundDropHover, sendInputState, projVec, projectToScreen, drawStrokedText, renderLoop, drawProjectedHudOverlay, drawMinimapRadar });
  }
})();
