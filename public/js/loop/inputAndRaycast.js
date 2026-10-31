// Client Module: Keyboard Hotkeys, Mouse World Raycasting, Ground Drop Hover & Screen Projection
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

    if (k === 'i') toggleDrawer('inventoryDrawer');
    if (k === 'b') toggleDrawer('stashDrawer');
    if (k === 'v') toggleDrawer('blackMarketDrawer');
    if (k === 'c' || k === 'g') toggleDrawer('gemsDrawer');
    if (k === 'p') toggleDrawer('passiveTreeModal');
    if (k === 'm') toggleDrawer('mapDeviceModal');
    if (k === 'l' && myPlayerId) toggleDrawer('lobbyModal');
    if (k === 'h') toggleDrawer('leaderboardModal');
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
      document.getElementById('stashDrawer')?.classList.add('hidden');
      document.getElementById('blackMarketDrawer')?.classList.add('hidden');
      document.getElementById('gemsDrawer').classList.add('hidden');
      document.getElementById('leaderboardModal')?.classList.add('hidden');
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
    if (foundDrop && (foundDrop.dt === 'gear' || foundDrop.dt === 'flask') && foundDrop.item) {
      canvas.style.cursor = 'pointer';
      tooltipEl.innerHTML = renderItemTooltipHTML(foundDrop.item, true, 'Left-Click to Walk & Pick Up into Stash');
      tooltipEl.classList.remove('hidden');
      positionTooltip(mx, my);
    } else if (foundDrop) {
      canvas.style.cursor = 'pointer';
      hideTooltip();
    } else {
      canvas.style.cursor = 'crosshair';
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
      } else if (Math.hypot(wx - (-140), wz - (-90)) < 65) {
        document.getElementById('stashDrawer')?.classList.remove('hidden');
        document.getElementById('inventoryDrawer')?.classList.remove('hidden');
        if (typeof renderStashInventory === 'function' && myProfile) renderStashInventory();
      } else if (Math.hypot(wx - 140, wz - (-90)) < 65) {
        document.getElementById('blackMarketDrawer')?.classList.remove('hidden');
        document.getElementById('inventoryDrawer')?.classList.remove('hidden');
        if (typeof renderStashInventory === 'function' && myProfile) renderStashInventory();
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

  Object.assign(window.__POS_CTX__, {
    updateMouseWorldRaycast, checkGroundDropHover, sendInputState,
    projVec, projectToScreen, drawStrokedText
  });
  }
})();
