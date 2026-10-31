// Client Module: 3D Ground Loot Drops, Combat VFX Spawners & Canvas Resize Handler
(function () {
  with (window.__POS_CTX__) {
  function getOrCreateDrop3D(drop) {
    let ent = dropEntities.get(drop.id);
    if (ent) return ent;

    playNeverSinkLootSound(drop);

    const group = new THREE.Group();
    group.position.set(drop.x, 0, drop.y);

    const beamColors = {
      divine: 0xff2222,
      unique: 0xff8822,
      rare: 0xffd43b,
      magic: 0x5c7cfa,
      normal: 0xced4da,
      currency: 0xe6c875,
      currency_high: 0xffaa00,
      flask: 0x38d9a9
    };
    const isT0 = Boolean(drop.t0 || drop.rarity === 'divine');
    const col = isT0 ? 0xff2222 : (beamColors[drop.rarity] || 0xffffff);

    let itemMesh;
    if (drop.dt === 'flask') {
      itemMesh = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x38d9a9,
        emissive: 0x20c997,
        emissiveIntensity: 0.85,
        metalness: 0.35,
        roughness: 0.15
      });
      const bottle = new THREE.Mesh(sharedProjGeos.dropBottleBody, bodyMat);
      bottle.position.y = 5.5;
      const neck = new THREE.Mesh(sharedProjGeos.dropBottleNeck, bodyMat);
      neck.position.y = 12.2;
      const cork = new THREE.Mesh(
        sharedProjGeos.dropBottleCork,
        new THREE.MeshStandardMaterial({ color: 0xd6b05c, metalness: 0.7, roughness: 0.3 })
      );
      cork.position.y = 14.8;
      itemMesh.add(bottle, neck, cork);
      itemMesh.position.y = 2;
    } else if (drop.dt === 'gear' && ASSETS.models.chest_gold) {
      itemMesh = ASSETS.models.chest_gold.scene.clone(true);
      itemMesh.scale.setScalar(11);
      itemMesh.position.y = 2;
    } else {
      const mat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.65,
        metalness: 0.8,
        roughness: 0.2
      });
      itemMesh = new THREE.Mesh(sharedProjGeos.dropOrb, mat);
      itemMesh.position.y = 9;
    }
    group.add(itemMesh);

    if (isT0 || ['divine', 'unique', 'rare', 'currency_high', 'flask'].includes(drop.rarity)) {
      const beamHeight = isT0 ? 165 : (drop.rarity === 'unique' || drop.rarity === 'currency_high' ? 135 : 95);
      const beam = new THREE.Mesh(
        sharedProjGeos.dropBeam,
        new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: isT0 ? 0.65 : 0.42,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      beam.scale.set(1, beamHeight, 1);
      beam.position.y = beamHeight / 2;
      group.add(beam);
    }

    const ring = new THREE.Mesh(
      sharedProjGeos.dropRing,
      new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 1.0;
    group.add(ring);

    dropsGroup.add(group);
    ent = { id: drop.id, group, itemMesh, drop };
    dropEntities.set(drop.id, ent);
    return ent;
  }

  function spawn3DFxEvent(f) {
    // Hard-cap active 3D FX at 16 so massive AoE packs never cause WebGL memory/drawcall lag
    while (active3DFx.length >= 16) {
      const oldest = active3DFx.shift();
      if (oldest) {
        fxGroup.remove(oldest.group);
        dispose3DFx(oldest);
      }
    }

    if (f.kind === 'nova' || f.kind === 'level_up') {
      if (typeof playSkillSfx === 'function') {
        if (f.kind === 'level_up') playSkillSfx('level_up');
        else playSkillSfx('nova', f.sub || (f.color === '#74c0fc' ? 'cold' : 'fire'));
      }
      const col = f.kind === 'level_up' ? 0xffd43b : new THREE.Color(f.color || '#74c0fc');
      const maxR = f.kind === 'level_up' ? 75 : (f.r || 65);

      const group = new THREE.Group();
      group.position.set(f.x, 2.0, f.y);

      const torusMat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const torus = new THREE.Mesh(sharedProjGeos.fxTorus, torusMat);
      torus.rotation.x = Math.PI / 2;

      // Flat ground shockwave ring using shared geometry
      const ringMat = new THREE.MeshBasicMaterial({
        color: col,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const discRing = new THREE.Mesh(sharedProjGeos.fxRing, ringMat);
      discRing.rotation.x = -Math.PI / 2;

      group.add(torus, discRing);

      // Extra 3D flourishes for Cyclone Whirlwind, Blade Vortex, and Ice Nova using shared geometries!
      let spinGroup = null;
      if (f.sub === 'cyclone') {
        spinGroup = new THREE.Group();
        spinGroup.position.y = 14;
        for (let k = 0; k < 2; k++) {
          const slash = new THREE.Mesh(
            k === 0 ? sharedProjGeos.cycloneSlash0 : sharedProjGeos.cycloneSlash1,
            torusMat
          );
          slash.scale.setScalar(maxR);
          slash.rotation.x = Math.PI / 2 + (k === 0 ? 0.18 : -0.18);
          slash.rotation.z = k * Math.PI;
          spinGroup.add(slash);
        }
        group.add(spinGroup);
      } else if (f.sub === 'blade_vortex') {
        spinGroup = new THREE.Group();
        spinGroup.position.y = 15;
        for (let b = 0; b < 5; b++) {
          const bAng = (Math.PI * 2 * b) / 5;
          const dagger = new THREE.Mesh(sharedProjGeos.cone, torusMat);
          dagger.scale.set(2.5, 6.5, 1.2);
          dagger.rotation.x = Math.PI / 2;
          dagger.rotation.z = bAng + Math.PI / 2;
          dagger.position.set(Math.cos(bAng) * maxR * 0.68, 0, Math.sin(bAng) * maxR * 0.68);
          spinGroup.add(dagger);
        }
        group.add(spinGroup);
      } else if (f.sub === 'ice_nova') {
        spinGroup = new THREE.Group();
        for (let s = 0; s < 8; s++) {
          const sAng = (Math.PI * 2 * s) / 8;
          const shard = new THREE.Mesh(sharedProjGeos.cone, torusMat);
          shard.scale.set(3.2, 7.5, 3.2);
          shard.position.set(Math.cos(sAng) * maxR * 0.55, 7, Math.sin(sAng) * maxR * 0.55);
          shard.rotation.z = -Math.cos(sAng) * 0.35;
          shard.rotation.x = Math.sin(sAng) * 0.35;
          spinGroup.add(shard);
        }
        group.add(spinGroup);
      }

      fxGroup.add(group);
      const maxLife = f.maxLife || 0.34;
      active3DFx.push({
        kind: 'nova',
        sub: f.sub || null,
        ownerId: f.ownerId || null,
        group,
        torus,
        discRing,
        spinGroup,
        torusMat,
        ringMat,
        maxR,
        life: maxLife,
        maxLife
      });
    } else if (f.kind === 'chain' && typeof f.x1 === 'number' && typeof f.x2 === 'number') {
      if (typeof playSkillSfx === 'function') playSkillSfx('arc', 'lightning');
      const pts = [];
      const segs = 5;
      for (let s = 0; s <= segs; s++) {
        const t = s / segs;
        const jx = (s === 0 || s === segs) ? 0 : (Math.random() - 0.5) * 14;
        const jy = (s === 0 || s === segs) ? 0 : (Math.random() - 0.5) * 8;
        const jz = (s === 0 || s === segs) ? 0 : (Math.random() - 0.5) * 14;
        pts.push(new THREE.Vector3(
          f.x1 + (f.x2 - f.x1) * t + jx,
          18 + jy,
          f.y1 + (f.y2 - f.y1) * t + jz
        ));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 8, 1.8, 5, false);
      const lineMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(f.color || '#70b8ff'),
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const boltMesh = new THREE.Mesh(tubeGeo, lineMat);
      fxGroup.add(boltMesh);
      active3DFx.push({ kind: 'arc', group: boltMesh, lineMat, customGeo: tubeGeo, life: 0.25, maxLife: 0.25 });
    } else if (f.kind === 'arc' && f.points && f.points.length > 1) {
      if (typeof playSkillSfx === 'function') playSkillSfx('arc', 'lightning');
      const pts = [];
      for (let i = 0; i < f.points.length - 1; i++) {
        const [x1, z1] = f.points[i];
        const [x2, z2] = f.points[i + 1];
        const segs = 4;
        for (let s = 0; s <= segs; s++) {
          const t = s / segs;
          const jx = (s === 0 || s === segs) ? 0 : (Math.random() - 0.5) * 16;
          const jy = (s === 0 || s === segs) ? 0 : (Math.random() - 0.5) * 10;
          const jz = (s === 0 || s === segs) ? 0 : (Math.random() - 0.5) * 16;
          pts.push(new THREE.Vector3(
            x1 + (x2 - x1) * t + jx,
            20 + jy,
            z1 + (z2 - z1) * t + jz
          ));
        }
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, Math.min(20, Math.max(8, pts.length * 2)), 2.1, 5, false);
      const lineMat = new THREE.MeshBasicMaterial({
        color: 0x99e9f2,
        transparent: true,
        opacity: 0.96,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const boltMesh = new THREE.Mesh(tubeGeo, lineMat);
      fxGroup.add(boltMesh);
      active3DFx.push({ kind: 'arc', group: boltMesh, lineMat, customGeo: tubeGeo, life: 0.28, maxLife: 0.28 });
    }
  }

  function spawnDeathBurst3D(x, z, colorHex = 0xe03131) {
    if (active3DFx.length >= 14) return;
    const group = new THREE.Group();
    group.position.set(x, 14, z);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 });
    const parts = [];
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(sharedProjGeos.sphere, mat);
      m.scale.setScalar(3.2);
      const ang = (Math.PI * 2 * i) / 5;
      parts.push({
        mesh: m,
        vx: Math.cos(ang) * 85,
        vy: 45 + Math.random() * 40,
        vz: Math.sin(ang) * 85
      });
      group.add(m);
    }
    fxGroup.add(group);
    active3DFx.push({ kind: 'burst', group, mat, parts, life: 0.36, maxLife: 0.36 });
  }

  function resizeCanvases() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    overlayCanvas.width = w;
    overlayCanvas.height = h;

    if (!document.getElementById('passiveTreeModal').classList.contains('hidden')) {
      const rect = treeCanvas.parentElement.getBoundingClientRect();
      treeCanvas.width = rect.width;
      treeCanvas.height = rect.height;
      renderPassiveTree();
    }
  }
  window.addEventListener('resize', resizeCanvases);
  resizeCanvases();

  Object.assign(window.__POS_CTX__, { getOrCreateDrop3D, spawn3DFxEvent, spawnDeathBurst3D, resizeCanvases });
  }
})();
