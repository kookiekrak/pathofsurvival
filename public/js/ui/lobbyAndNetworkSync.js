// Client Module: Multiplayer Party Lobby, WebSocket Connection, Chat & World Entity Sync
(function () {
  with (window.__POS_CTX__) {
  function openLobbyModal() {
    document.getElementById('lobbyModal')?.classList.remove('hidden');
    fetchActiveRooms();
  }

  function closeLobbyModal() {
    document.getElementById('lobbyModal')?.classList.add('hidden');
    renderSelectedClassSummary();
    if (!myPlayerId) {
      document.getElementById('loginModal')?.classList.remove('hidden');
    }
  }

  async function fetchActiveRooms() {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      const tbody = document.getElementById('roomBrowserBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      for (const r of data.rooms) {
        const tr = document.createElement('tr');
        const isTown = r.code === 'ORIATH' || r.isTown;
        const stateText = isTown ? 'Public Town Hub (No Map Runs)' : (r.state === 'HIDEOUT' ? 'Sanctuary Hideout' : `Map Wave ${r.wave}`);
        const countText = isTown ? `${r.playerCount} Online (∞)` : `${r.playerCount} / ${r.maxPlayers || 6}`;
        tr.innerHTML = `
          <td><strong style="color:var(--poe-gold)">${r.code}</strong></td>
          <td>${r.roomName || r.code}</td>
          <td>${countText}</td>
          <td>${stateText}</td>
          <td><button class="poe-chisel-btn" type="button">JOIN</button></td>
        `;
        tr.querySelector('button').addEventListener('click', () => {
          document.getElementById('roomCodeInput').value = r.code;
          document.getElementById('roomNameInput').value = r.roomName || r.code;
          renderSelectedClassSummary();
          if (myPlayerId && myProfile) {
            connectAndJoin(myProfile.name, r.code, r.roomName, myProfile.classId, myProfile.characterId);
          } else {
            closeLobbyModal();
          }
        });
        tbody.appendChild(tr);
      }
    } catch {}
  }

  document.getElementById('refreshRoomsBtn')?.addEventListener('click', fetchActiveRooms);

  document.getElementById('openLobbyFromCreateBtn')?.addEventListener('click', () => {
    document.getElementById('loginModal')?.classList.add('hidden');
    openLobbyModal();
  });

  document.getElementById('backToCharCreateBtn')?.addEventListener('click', closeLobbyModal);
  document.getElementById('closeLobbyModalBtn')?.addEventListener('click', closeLobbyModal);

  document.getElementById('joinCustomRoomBtn')?.addEventListener('click', () => {
    const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase() || 'ORIATH';
    const roomName = document.getElementById('roomNameInput').value.trim() || `${roomCode} Instance`;
    renderSelectedClassSummary();
    if (myPlayerId && myProfile) {
      connectAndJoin(myProfile.name, roomCode, roomName, myProfile.classId, myProfile.characterId);
    } else {
      closeLobbyModal();
    }
  });

  document.getElementById('enterWraeclastBtn')?.addEventListener('click', submitCreateCharacter);

  function connectAndJoin(name, roomCode, roomName, classId, characterId = null) {
    if (ws) {
      ws._manualClose = true;
      try { ws.close(); } catch {}
      ws = null;
    }
    clearTimeout(connectAndJoin._reconnTimer);
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${proto}//${location.host}`);
    ws = socket;

    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({
        type: 'join', name, roomCode, roomName, classId, accountId: myAccountId, characterId
      }));
      document.getElementById('loginModal')?.classList.add('hidden');
      document.getElementById('lobbyModal')?.classList.add('hidden');
      document.getElementById('topHud').classList.remove('hidden');
      document.getElementById('bottomHud').classList.remove('hidden');
      document.getElementById('chatWidget').classList.remove('hidden');
    });

    socket.addEventListener('close', () => {
      if (socket._manualClose) return;
      connectAndJoin._reconnTimer = setTimeout(() => {
        connectAndJoin(name, roomCode, roomName, classId, characterId);
      }, 1500);
    });

    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'profile') {
        myPlayerId = msg.playerId;
        myProfile = msg;
        updateProfileUI();
      } else if (msg.type === 'state') {
        worldState = msg;
        rebuildBiomeEnvironment(worldState.mode, worldState.mapId);
        if (msg.fx && msg.fx.length > 0) {
          for (const f of msg.fx) {
            if (f.kind === 'dmg_num') {
              if (floatingTexts.length >= 32) floatingTexts.shift();
              floatingTexts.push({
                x: f.x, z: f.y, yOffset: 34, text: f.val,
                crit: f.crit, dtype: f.dtype, life: 0.72, maxLife: 0.72
              });
            } else {
              spawn3DFxEvent(f);
            }
          }
        }
        syncWorldEntities();
        updateRealtimeHud();
      } else if (msg.type === 'announcement') {
        showBanner(msg.title, msg.subtitle, msg.color);
      } else if (msg.type === 'craft_feedback') {
        const banner = document.getElementById('craftStatusBanner');
        banner.textContent = msg.msg;
        banner.style.color = msg.ok ? '#69db7c' : '#ff8787';
      } else if (msg.type === 'chat_history') {
        const box = document.getElementById('chatMessages');
        box.innerHTML = '';
        for (const entry of (msg.log || [])) appendChatLine(entry);
      } else if (msg.type === 'chat_msg') {
        appendChatLine(msg.entry);
      }
    });
  }

  function appendChatLine(entry) {
    if (!entry) return;
    const box = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-line';
    div.innerHTML = `<strong style="color:${entry.color || '#f2c76e'}">[${entry.sender}]:</strong> <span>${entry.text}</span>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  const chatInput = document.getElementById('chatInput');
  chatInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      const txt = chatInput.value.trim();
      if (txt && ws) {
        ws.send(JSON.stringify({ type: 'chat', text: txt }));
        chatInput.value = '';
      }
      chatInput.blur();
    }
  });

  function showBanner(title, sub, color = '#f2c76e') {
    const el = document.getElementById('bannerAnnouncement');
    const tEl = document.getElementById('bannerTitle');
    const sEl = document.getElementById('bannerSub');
    tEl.textContent = title;
    tEl.style.color = color;
    sEl.textContent = sub || '';
    el.classList.remove('hidden');
    clearTimeout(showBanner._timer);
    showBanner._timer = setTimeout(() => el.classList.add('hidden'), 4000);
  }

  // =========================================================================
  // SYNC 3D ENTITIES WITH AUTHORITATIVE SERVER STATE
  // =========================================================================
  function syncWorldEntities() {
    if (!ASSETS.ready) return;

    // 1. Sync Players
    const seenPlayers = new Set();
    for (const p of worldState.players) {
      seenPlayers.add(p.id);
      const ent = getOrCreatePlayer3D(p);
      ent.targetX = p.x;
      ent.targetZ = p.y;
      ent.data = p;

      if (p.rfRadius > 0 && !p.dead) {
        ent.rfGroup.visible = true;
        ent.rfDisc.scale.setScalar(p.rfRadius);
        ent.rfRim.scale.setScalar(p.rfRadius);
      } else {
        ent.rfGroup.visible = false;
      }

      ent.esMesh.visible = p.es > 0 && !p.dead;

      if (p.atkSeq !== ent.lastAtkSeq) {
        ent.lastAtkSeq = p.atkSeq;
        if (ent.actions.atk && !p.dead) ent.actions.atk.reset().play();
        if (typeof p.atkAng === 'number') {
          ent.yaw = Math.atan2(Math.cos(p.atkAng), Math.sin(p.atkAng));
        }
      }

      const isMoving = Math.hypot(p.vx || 0, p.vy || 0) > 10;
      if (p.dead) {
        switchBaseAction(ent, ent.actions.death);
      } else if (p.dashing && ent.actions.dash) {
        switchBaseAction(ent, ent.actions.dash);
      } else if (isMoving && ent.actions.run) {
        switchBaseAction(ent, ent.actions.run);
        ent.yaw = Math.atan2(p.vx, p.vy);
      } else if (ent.actions.idle) {
        switchBaseAction(ent, ent.actions.idle);
      }
    }
    for (const [id, ent] of playerEntities.entries()) {
      if (!seenPlayers.has(id)) {
        playersGroup.remove(ent.group);
        cleanupEntity3D(ent);
        playerEntities.delete(id);
      }
    }

    // 2. Sync Enemies
    const seenEnemies = new Set();
    for (const m of worldState.enemies) {
      seenEnemies.add(m.id);
      const ent = getOrCreateEnemy3D(m);
      const dx = m.x - ent.targetX;
      const dz = m.y - ent.targetZ;
      if (Math.hypot(dx, dz) > 1.5) ent.yaw = Math.atan2(dx, dz);
      ent.targetX = m.x;
      ent.targetZ = m.y;
      ent.data = m;

      const isChilled = Boolean(m.chilled);
      if (ent.lastChilled !== isChilled) {
        ent.lastChilled = isChilled;
        for (const mat of ent.materials) {
          mat.color.setHex(isChilled ? 0x66d9e8 : 0xffffff);
        }
      }
    }
    for (const [id, ent] of enemyEntities.entries()) {
      if (!seenEnemies.has(id)) {
        spawnDeathBurst3D(
          ent.group.position.x,
          ent.group.position.z,
          ent.rarity === 'rare' ? 0xffd43b : 0xd93829
        );
        releaseEnemy3D(ent);
        enemyEntities.delete(id);
      }
    }

    // 3. Sync Projectiles
    const seenProjs = new Set();
    for (const prj of worldState.projectiles) {
      seenProjs.add(prj.id);
      const ent = getOrCreateProjectile3D(prj);
      ent.group.position.set(prj.x, ent.yHeight, prj.y);
      if (prj.vx || prj.vy) ent.group.rotation.y = Math.atan2(prj.vx, prj.vy);
    }
    for (const [id, ent] of projEntities.entries()) {
      if (!seenProjs.has(id)) {
        projectilesGroup.remove(ent.group);
        cleanupEntity3D(ent);
        projEntities.delete(id);
      }
    }

    // 4. Sync Telegraphed Ground Hazards
    const seenHaz = new Set();
    for (const h of (worldState.hazards || [])) {
      seenHaz.add(h.id);
      const ent = getOrCreateHazard3D(h);
      ent.innerFill.scale.setScalar(Math.max(0.08, h.prog));
    }
    for (const [id, ent] of hazardEntities.entries()) {
      if (!seenHaz.has(id)) {
        hazardsGroup.remove(ent.group);
        cleanupEntity3D(ent);
        hazardEntities.delete(id);
      }
    }

    // 5. Sync Map Interactables (Shrines, Strongboxes & Breaches)
    const seenInt = new Set();
    for (const it of (worldState.interactables || [])) {
      seenInt.add(it.id);
      getOrCreateInteractable3D(it);
    }
    for (const [id, ent] of interactableEntities.entries()) {
      if (!seenInt.has(id)) {
        interactablesGroup.remove(ent.group);
        cleanupEntity3D(ent);
        interactableEntities.delete(id);
      }
    }

    // 5B. Sync Scaling Gold Upgrade Chests
    const seenChests = new Set();
    for (const ch of (worldState.upgradeChests || [])) {
      if (ch.opened) continue;
      seenChests.add(ch.id);
      getOrCreateUpgradeChest3D(ch);
    }
    for (const [id, ent] of upgradeChestEntities.entries()) {
      if (!seenChests.has(id)) {
        interactablesGroup.remove(ent.group);
        cleanupEntity3D(ent);
        upgradeChestEntities.delete(id);
      }
    }

    // 5C. Sync Active Expanding PoE Breach Rings
    const seenBreaches = new Set();
    for (const b of (worldState.breaches || [])) {
      seenBreaches.add(b.id);
      getOrCreateBreachRing3D(b);
    }
    for (const [id, ent] of breachRingEntities.entries()) {
      if (!seenBreaches.has(id)) {
        interactablesGroup.remove(ent.group);
        cleanupEntity3D(ent);
        breachRingEntities.delete(id);
      }
    }

    // 6. Sync Ground Loot Drops
    const seenDrops = new Set();
    for (const d of worldState.drops) {
      seenDrops.add(d.id);
      getOrCreateDrop3D(d);
    }
    for (const [id, ent] of dropEntities.entries()) {
      if (!seenDrops.has(id)) {
        dropsGroup.remove(ent.group);
        cleanupEntity3D(ent);
        dropEntities.delete(id);
      }
    }

    // 7. Extraction Portal
    if (worldState.mode === 'RUN' && worldState.portalsOpen && !extractionPortalMesh) {
      const pGroup = new THREE.Group();
      pGroup.position.set(0, 26, 0);
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(24, 3.0, 16, 36),
        new THREE.MeshStandardMaterial({ color: 0x74c0fc, emissive: 0x1c7ed6, emissiveIntensity: 0.9 })
      );
      arch.scale.set(0.75, 1.35, 1);
      const vortex = new THREE.Mesh(
        new THREE.CircleGeometry(22, 32),
        new THREE.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.78, side: THREE.DoubleSide })
      );
      vortex.scale.set(0.75, 1.35, 1);
      pGroup.add(arch, vortex);
      envGroup.add(pGroup);
      extractionPortalMesh = pGroup;
    }
  }

  try { initLoginScreen(); } catch {}

  Object.assign(window.__POS_CTX__, {
    openLobbyModal, closeLobbyModal, fetchActiveRooms,
    connectAndJoin, appendChatLine, chatInput, showBanner, syncWorldEntities
  });
  }
})();
