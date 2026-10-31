// Client Module: 60FPS WebGL Render Loop, Animation Mixer Updates & Corner Minimap Radar
(function () {
  with (window.__POS_CTX__) {
  window.__POS_CTX__.lastFrameTime = performance.now();

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

      if (ent.bossAttachments && !worldState.paused) {
        if (ent.bossAttachments.userData && ent.bossAttachments.userData.spinGroup) {
          ent.bossAttachments.userData.spinGroup.rotation.y += dt * 1.8;
        }
        for (const r of ((ent.bossAttachments.userData && ent.bossAttachments.userData.rings) || [])) {
          r.rotation.z += dt * 1.4;
          r.rotation.y += dt * 0.7;
        }
      }
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

  Object.assign(window.__POS_CTX__, { renderLoop, drawMinimapRadar });
  }
})();
