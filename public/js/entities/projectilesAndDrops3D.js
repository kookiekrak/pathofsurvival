// Client Module: 3D Upgrade Chests, Shared Geometries, Projectiles & NeverSink Loot Filter Audio
(function () {
  with (window.__POS_CTX__) {
  // 3D PoE 2 Scaling Gold Upgrade Chests
  function getOrCreateUpgradeChest3D(ch) {
    let ent = upgradeChestEntities.get(ch.id);
    if (ent) {
      ent.data = ch;
      ent.group.visible = !ch.opened;
      return ent;
    }

    const group = new THREE.Group();
    group.position.set(ch.x, 0, ch.y);

    const gltf = ASSETS.models.chest_gold;
    if (gltf) {
      const m = gltf.scene.clone(true);
      const natH = (gltf.userData && gltf.userData.naturalHeight) || 1.5;
      m.scale.setScalar(28 / natH);
      m.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.emissive = new THREE.Color(0x5c3d08);
        }
      });
      group.add(m);
    }

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(22, 29, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffd43b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 1.6;
    group.add(ring);

    const chestLight = new THREE.PointLight(0xffd43b, 2.2, 160);
    chestLight.position.set(0, 26, 0);
    group.add(chestLight);

    interactablesGroup.add(group);
    ent = { id: ch.id, group, ring, data: ch };
    upgradeChestEntities.set(ch.id, ent);
    return ent;
  }

  const sharedProjGeos = {
    sphere: new THREE.SphereGeometry(1, 12, 12),
    octa: new THREE.OctahedronGeometry(1, 0),
    icosa: new THREE.IcosahedronGeometry(1, 0),
    cone: new THREE.ConeGeometry(1, 2.4, 6),
    shaft: new THREE.CylinderGeometry(0.18, 0.18, 3.2, 8),
    disc: new THREE.CylinderGeometry(1, 1, 0.22, 18),
    ring: new THREE.RingGeometry(0.55, 1.0, 20),
    fxTorus: new THREE.TorusGeometry(1, 0.045, 8, 28),
    fxRing: new THREE.RingGeometry(0.45, 0.98, 24),
    cycloneSlash0: new THREE.TorusGeometry(0.65, 0.025, 6, 22, Math.PI * 1.35),
    cycloneSlash1: new THREE.TorusGeometry(0.87, 0.025, 6, 22, Math.PI * 1.35),
    dropBottleBody: new THREE.CylinderGeometry(4.5, 5.8, 11, 10),
    dropBottleNeck: new THREE.CylinderGeometry(2.0, 2.6, 4.5, 8),
    dropBottleCork: new THREE.CylinderGeometry(2.3, 2.3, 2.2, 8),
    dropOrb: new THREE.OctahedronGeometry(7, 0),
    dropRing: new THREE.RingGeometry(7, 12, 20),
    dropBeam: new THREE.CylinderGeometry(1.4, 5.0, 1, 10, 1, true)
  };
  const sharedGeoSet = new Set(Object.values(sharedProjGeos));

  function dispose3DFx(fx) {
    if (!fx) return;
    if (fx.torusMat) fx.torusMat.dispose();
    if (fx.ringMat) fx.ringMat.dispose();
    if (fx.lineMat) fx.lineMat.dispose();
    if (fx.mat) fx.mat.dispose();
    if (fx.customGeo) fx.customGeo.dispose();
  }

  function cleanupEntity3D(ent) {
    if (!ent) return;
    if (ent.mixer) {
      ent.mixer.stopAllAction();
      if (ent.group) ent.mixer.uncacheRoot(ent.group);
    }
    if (ent.group) {
      ent.group.traverse((child) => {
        if (child.geometry && !sharedGeoSet.has(child.geometry) && child.userData && child.userData.ownGeo) {
          child.geometry.dispose();
        }
        if (child.material && !(child.isSkinnedMesh)) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m && m.dispose && m.dispose());
          } else if (child.material.dispose) {
            child.material.dispose();
          }
        }
      });
    }
  }

  function getOrCreateProjectile3D(prj) {
    let ent = projEntities.get(prj.id);
    if (ent) return ent;

    if (prj.s !== 'enemy_bolt' && typeof playSkillSfx === 'function') {
      const sfxSub = (prj.s === 'tornado_shot' || prj.s === 'toxic_rain' || prj.s === 'lightning_arrow')
        ? 'bow'
        : (prj.dt === 'lightning' || prj.s === 'spark' || prj.s === 'ball_lightning')
          ? 'lightning'
          : (prj.dt === 'cold' || prj.s === 'glacial_cascade' || prj.s === 'eye_of_winter')
            ? 'cold'
            : (prj.s === 'spectral_throw' || prj.s === 'ethereal_knives')
              ? 'cyclone'
              : 'fire';
      playSkillSfx('proj', sfxSub);
    }

    const colorMap = {
      physical: 0xf4d58d,
      fire: 0xff6b35,
      cold: 0x74c0fc,
      lightning: 0x70b8ff
    };
    const col = colorMap[prj.dt] || 0xffd43b;

    const group = new THREE.Group();
    const yHeight = (prj.s === 'sunder' || prj.s === 'volcanic_fissure' || prj.s === 'glacial_cascade') ? 2.5 : 16;
    group.position.set(prj.x, yHeight, prj.y);

    const mesh = new THREE.Group();
    let spinSpeed = 0;

    if (prj.s === 'sunder' || prj.s === 'volcanic_fissure' || prj.s === 'glacial_cascade') {
      const isIce = prj.s === 'glacial_cascade';
      const rockMat = new THREE.MeshStandardMaterial({
        color: isIce ? 0x4dabf7 : 0x704225,
        emissive: isIce ? 0x1c7ed6 : 0xe8590c,
        emissiveIntensity: 1.15,
        roughness: isIce ? 0.25 : 0.6
      });
      const offsets = [
        { x: 0, z: 6, h: 11.5, rx: 0.36, rz: 0 },
        { x: -6.5, z: 1.5, h: 9.2, rx: 0.28, rz: 0.22 },
        { x: 6.5, z: 1.5, h: 9.2, rx: 0.28, rz: -0.22 },
        { x: -12.5, z: -3.5, h: 6.8, rx: 0.2, rz: 0.38 },
        { x: 12.5, z: -3.5, h: 6.8, rx: 0.2, rz: -0.38 }
      ];
      for (const o of offsets) {
        const spike = new THREE.Mesh(sharedProjGeos.cone, rockMat);
        spike.scale.set(3.8, o.h * 0.52, 3.8);
        spike.position.set(o.x, o.h * 0.45, o.z);
        spike.rotation.set(o.rx, 0, o.rz);
        mesh.add(spike);
      }
      const crackMat = new THREE.MeshBasicMaterial({
        color: isIce ? 0x74c0fc : 0xff6b35,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const crackRing = new THREE.Mesh(sharedProjGeos.ring, crackMat);
      crackRing.rotation.x = -Math.PI / 2;
      crackRing.scale.set(18, 12, 1);
      crackRing.position.y = 0.6;
      mesh.add(crackRing);
    } else if (prj.s === 'tornado_shot' || prj.s === 'lightning_arrow' || prj.s === 'toxic_rain') {
      const isLightning = prj.s === 'lightning_arrow' || prj.dt === 'lightning';
      const arrowCol = prj.s === 'toxic_rain' ? 0x94d82d : (isLightning ? 0x74c0fc : 0xffe066);
      const shaftMat = new THREE.MeshBasicMaterial({ color: arrowCol });
      const shaft = new THREE.Mesh(sharedProjGeos.shaft, shaftMat);
      shaft.rotation.x = Math.PI / 2;
      shaft.scale.set(6.5, 9.2, 6.5);
      mesh.add(shaft);

      const tipMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const tip = new THREE.Mesh(sharedProjGeos.cone, tipMat);
      tip.rotation.x = Math.PI / 2;
      tip.scale.set(5.2, 4.5, 5.2);
      tip.position.z = 16.5;
      mesh.add(tip);

      const wakeMat = new THREE.MeshBasicMaterial({
        color: arrowCol,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const wake = new THREE.Mesh(sharedProjGeos.cone, wakeMat);
      wake.rotation.x = -Math.PI / 2;
      wake.scale.set(6.5, 10.5, 6.5);
      wake.position.z = -9.5;
      mesh.add(wake);

      const chevron = new THREE.Mesh(sharedProjGeos.ring, wakeMat);
      chevron.rotation.x = -Math.PI / 2;
      chevron.scale.set(11.5, 16.0, 1);
      chevron.position.set(0, -1, 2);
      mesh.add(chevron);
    } else if (prj.s === 'fireball' || prj.s === 'molten_strike') {
      // Blazing magma core + wireframe flame corona + trailing fire wake
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xfff3bf });
      const core = new THREE.Mesh(sharedProjGeos.sphere, coreMat);
      const rScale = prj.s === 'fireball' ? 6.5 : 5.2;
      core.scale.setScalar(rScale);
      mesh.add(core);

      const shellMat = new THREE.MeshBasicMaterial({
        color: 0xff6b35,
        wireframe: true,
        transparent: true,
        opacity: 0.85
      });
      const shell = new THREE.Mesh(sharedProjGeos.icosa, shellMat);
      shell.scale.setScalar(rScale * 1.45);
      mesh.add(shell);

      const tailMat = new THREE.MeshBasicMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const tail = new THREE.Mesh(sharedProjGeos.cone, tailMat);
      tail.rotation.x = -Math.PI / 2;
      tail.scale.set(rScale * 0.95, rScale * 1.2, rScale * 0.95);
      tail.position.z = -rScale * 1.4;
      mesh.add(tail);
      spinSpeed = 10;
    } else if (prj.s === 'spectral_throw' || prj.s === 'blade_vortex' || prj.s === 'ethereal_knives') {
      if (ASSETS.models.wep_blade) {
        const blade = ASSETS.models.wep_blade.scene.clone(true);
        blade.scale.setScalar(prj.s === 'ethereal_knives' ? 10.5 : 13.5);
        blade.rotation.x = Math.PI / 2;
        mesh.add(blade);
      }
      const discMat = new THREE.MeshBasicMaterial({
        color: prj.s === 'blade_vortex' ? 0x69db7c : (prj.s === 'ethereal_knives' ? 0x63e6be : 0xffe8a3),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const sawRing = new THREE.Mesh(sharedProjGeos.ring, discMat);
      sawRing.rotation.x = -Math.PI / 2;
      sawRing.scale.setScalar(prj.s === 'ethereal_knives' ? 9 : 13);
      mesh.add(sawRing);
      spinSpeed = prj.s === 'ethereal_knives' ? 8 : 20;
    } else if (prj.s === 'ball_lightning' || prj.s === 'eye_of_winter' || prj.s === 'divine_ire') {
      const orbCol = prj.s === 'eye_of_winter' ? 0x74c0fc : (prj.s === 'divine_ire' ? 0xffd43b : 0x4dabf7);
      const core = new THREE.Mesh(sharedProjGeos.sphere, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      core.scale.setScalar(7.5);
      const shell = new THREE.Mesh(sharedProjGeos.icosa, new THREE.MeshBasicMaterial({ color: orbCol, wireframe: true, transparent: true, opacity: 0.9 }));
      shell.scale.setScalar(11.5);
      mesh.add(core, shell);
      spinSpeed = 16;
    } else if (prj.s === 'spark') {
      const sparkMat = new THREE.MeshBasicMaterial({ color: 0x99e9f2 });
      const s1 = new THREE.Mesh(sharedProjGeos.octa, sparkMat);
      s1.scale.set(2.5, 6.5, 2.5);
      s1.rotation.x = Math.PI / 2;
      const s2 = new THREE.Mesh(sharedProjGeos.octa, sparkMat);
      s2.scale.set(6.5, 2.5, 2.5);
      mesh.add(s1, s2);
      spinSpeed = 22;
    } else if (prj.s === 'enemy_bolt') {
      const eCol = prj.dt === 'fire' ? 0xff4d4d : prj.dt === 'cold' ? 0x4dabf7 : 0xf06595;
      const coreMat = new THREE.MeshBasicMaterial({ color: eCol });
      const core = new THREE.Mesh(sharedProjGeos.octa, coreMat);
      core.scale.setScalar(Math.max(5.5, (prj.r || 8) * 0.75));
      mesh.add(core);
      spinSpeed = 12;
    } else {
      const mat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 2.0,
        roughness: 0.2
      });
      const orb = new THREE.Mesh(sharedProjGeos.sphere, mat);
      orb.scale.setScalar(Math.max(5.5, (prj.r || 10) * 0.65));
      mesh.add(orb);
    }
    group.add(mesh);

    // Compact Additive Glowing Sprite Halo (capped so large AoE projectiles never create huge blobs)
    const haloTex = ASSETS.textures.spark || ASSETS.textures.disc;
    if (haloTex) {
      const haloMat = new THREE.SpriteMaterial({
        map: haloTex,
        color: col,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const halo = new THREE.Sprite(haloMat);
      const haloSize = prj.s === 'sunder' ? 26 : Math.min(34, Math.max(18, (prj.r || 10) * 1.9));
      halo.scale.set(haloSize, haloSize, 1);
      group.add(halo);
    }

    projectilesGroup.add(group);

    ent = { id: prj.id, skillId: prj.s, group, mesh, yHeight, spinSpeed, trailTimer: 0 };
    projEntities.set(prj.id, ent);
    return ent;
  }

  // =========================================================================
  // AUTHENTIC NEVERSINK / FILTERBLADE LOOT FILTER DROP SOUNDS (AlertSound 1-6)
  // =========================================================================
  const neversinkAudioPool = {};
  const lastSoundTimeById = {};
  for (let sId = 1; sId <= 6; sId++) {
    neversinkAudioPool[sId] = [];
    for (let k = 0; k < 3; k++) {
      const a = new Audio(`/assets/sounds/AlertSound${sId}.mp3`);
      a.preload = 'auto';
      neversinkAudioPool[sId].push(a);
    }
  }

  function playNeverSinkLootSound(drop) {
    if (!drop || window.__POS_CTX__.sfxMuted) return;
    const cId = drop.currencyId || null;
    const isT0 = Boolean(
      drop.t0 ||
      drop.rarity === 'unique' ||
      drop.rarity === 'divine' ||
      cId === 'divine' ||
      cId === 'exalted'
    );
    // Cut all drop SFX for low-tier items; only play the T0 drop sound (AlertSound6)!
    if (!isT0) return;

    const soundId = 6;
    const vol = 1.0;
    const now = performance.now();
    if (now - (lastSoundTimeById[soundId] || 0) < 75) return;
    lastSoundTimeById[soundId] = now;

    const pool = neversinkAudioPool[soundId];
    if (pool && pool.length > 0) {
      const clip = pool.find(a => a.paused || a.ended) || pool[0];
      try {
        clip.currentTime = 0;
        clip.volume = vol;
        const p = clip.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch {}
    }
  }

  Object.assign(window.__POS_CTX__, {
    getOrCreateUpgradeChest3D, sharedProjGeos, sharedGeoSet,
    dispose3DFx, cleanupEntity3D, getOrCreateProjectile3D,
    neversinkAudioPool, lastSoundTimeById, playNeverSinkLootSound
  });
  }
})();
