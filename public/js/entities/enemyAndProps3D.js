// Client Module: 3D Pooled Enemy Meshes, Pinnacle Boss Attachments, Ground Hazards, Shrines & Breach Rings
(function () {
  with (window.__POS_CTX__) {
  const enemyPoolByKey = new Map();

  const MONSTER_MODEL_MAP = {
    skeleton: { modelKey: 'Skeleton_Warrior', wepKey: 'wep_blade', shieldKey: 'wep_shield' },
    scarab: { modelKey: 'Monster_Spider', wepKey: null, shieldKey: null },
    archer: { modelKey: 'Skeleton_Rogue', wepKey: 'wep_blade', shieldKey: null },
    frost_sentinel: { modelKey: 'Monster_Crab', wepKey: null, shieldKey: null },
    volatile_imp: { modelKey: 'Monster_Wasp', wepKey: null, shieldKey: null },
    gilded_goblin: { modelKey: 'Skeleton_Minion', wepKey: 'wep_axe', shieldKey: null },
    rhoa: { modelKey: 'Monster_Bull', wepKey: null, shieldKey: null },
    goatman: { modelKey: 'Monster_Stag', wepKey: null, shieldKey: null },
    necromancer: { modelKey: 'Skeleton_Mage', wepKey: 'wep_staff', shieldKey: null },
    blight_spitter: { modelKey: 'Monster_Snake', wepKey: null, shieldKey: null },
    storm_herald: { modelKey: 'Monster_AlienFlying', wepKey: null, shieldKey: null },
    void_stalker: { modelKey: 'Monster_Wolf', wepKey: null, shieldKey: null },
    cultist: { modelKey: 'Monster_AlienLarge', wepKey: null, shieldKey: null },
    devourer: { modelKey: 'Monster_Raptor', wepKey: null, shieldKey: null },
    shield_juggernaut: { modelKey: 'Monster_Triceratops', wepKey: null, shieldKey: null },
    kitava_herald: { modelKey: 'Monster_Trex', wepKey: null, shieldKey: null },
    raid_pylon: { modelKey: 'Monster_AlienFlying', wepKey: null, shieldKey: null }
  };

  function cloneModelInstance(key) {
    const gltf = ASSETS.models[key] || ASSETS.models.Marauder || ASSETS.models.Knight;
    return gltf ? SkeletonUtils.clone(gltf.scene) : new THREE.Group();
  }

  // Build bespoke multi-part 3D attachments for the 4 Pinnacle Bosses + Map Bosses
  function buildBossAttachments3D(m, finalScale) {
    const bName = String(m.name || '');
    const bossAttachmentGroup = new THREE.Group();
    const spinGroup = new THREE.Group();
    const rings = [];
    bossAttachmentGroup.add(spinGroup);
    bossAttachmentGroup.userData = { spinGroup, rings };

    if (/Exarch/i.test(bName)) {
      const solarMat = new THREE.MeshStandardMaterial({ color: 0xff922b, emissive: 0xff4d29, emissiveIntensity: 1.5, metalness: 0.7, roughness: 0.2 });
      const crown = new THREE.Group();
      crown.position.set(0, 46, -8);
      crown.add(new THREE.Mesh(new THREE.TorusGeometry(22, 2.2, 12, 32), solarMat));
      const spikeGeo = new THREE.ConeGeometry(3, 16, 6);
      for (let i = 0; i < 8; i++) {
        const ang = (Math.PI * 2 * i) / 8;
        const sp = new THREE.Mesh(spikeGeo, solarMat);
        sp.position.set(Math.cos(ang) * 26, Math.sin(ang) * 26, 0);
        sp.rotation.z = ang - Math.PI / 2;
        crown.add(sp);
      }
      bossAttachmentGroup.add(crown);
      rings.push(crown);

      const wingGeo = new THREE.BoxGeometry(36, 14, 3);
      for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(wingGeo, solarMat);
        wing.position.set(side * 24, 42, -10);
        wing.rotation.z = side * 0.42; wing.rotation.y = -side * 0.28;
        bossAttachmentGroup.add(wing);
      }
      const orbGeo = new THREE.SphereGeometry(6, 14, 14);
      for (let i = 0; i < 3; i++) {
        const ang = (Math.PI * 2 * i) / 3;
        const orb = new THREE.Mesh(orbGeo, solarMat);
        orb.position.set(Math.cos(ang) * 36, 28 + (i % 2) * 8, Math.sin(ang) * 36);
        spinGroup.add(orb);
      }
    } else if (/Eater/i.test(bName)) {
      const aetherMat = new THREE.MeshStandardMaterial({ color: 0x22b8cf, emissive: 0x0c8599, emissiveIntensity: 1.4, metalness: 0.65, roughness: 0.25 });
      const tentGeo = new THREE.ConeGeometry(5.5, 42, 10);
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI * 2 * i) / 6;
        const tent = new THREE.Mesh(tentGeo, aetherMat);
        tent.position.set(Math.cos(ang) * 22, 18, Math.sin(ang) * 22);
        tent.rotation.x = Math.sin(ang) * 0.55; tent.rotation.z = -Math.cos(ang) * 0.55;
        spinGroup.add(tent);
      }
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(11, 1), aetherMat);
      core.position.set(0, 34, 0);
      spinGroup.add(core);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(24, 1.8, 12, 32), aetherMat);
      halo.rotation.x = Math.PI / 2; halo.position.set(0, 48, 0);
      bossAttachmentGroup.add(halo);
      rings.push(halo);
    } else if (/Maven/i.test(bName)) {
      const astroMat = new THREE.MeshStandardMaterial({ color: 0xf3d9fa, emissive: 0xae3ec9, emissiveIntensity: 1.35, metalness: 0.85, roughness: 0.15 });
      for (const [rad, tube, rx, ry] of [[28, 1.4, 0.5, 0.2], [22, 1.2, -0.6, 0.4], [16, 1.0, 0.2, -0.7]]) {
        const rMesh = new THREE.Mesh(new THREE.TorusGeometry(rad, tube, 12, 36), astroMat);
        rMesh.position.set(0, 38, 0); rMesh.rotation.set(rx, ry, 0);
        bossAttachmentGroup.add(rMesh); rings.push(rMesh);
      }
      const crysGeo = new THREE.OctahedronGeometry(4.5, 0);
      for (let i = 0; i < 4; i++) {
        const ang = (Math.PI * 2 * i) / 4;
        const crys = new THREE.Mesh(crysGeo, astroMat);
        crys.position.set(Math.cos(ang) * 32, 38, Math.sin(ang) * 32);
        spinGroup.add(crys);
      }
    } else if (/Sirus/i.test(bName)) {
      const apparition = cloneModelInstance('Barbarian');
      apparition.scale.setScalar((finalScale || 18) * 1.35);
      apparition.position.set(0, 22, -16);
      const appMat = new THREE.MeshStandardMaterial({ color: 0xe03131, emissive: 0xc92a2a, emissiveIntensity: 1.25, transparent: true, opacity: 0.65, depthWrite: false });
      apparition.traverse((ch) => { if (ch.isMesh) ch.material = appMat; });
      bossAttachmentGroup.add(apparition);

      const crossGroup = new THREE.Group();
      crossGroup.position.set(0, 48, -12);
      const crossMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, emissive: 0xc92a2a, emissiveIntensity: 1.5 });
      crossGroup.add(
        new THREE.Mesh(new THREE.BoxGeometry(52, 3.2, 3.2), crossMat),
        new THREE.Mesh(new THREE.BoxGeometry(3.2, 52, 3.2), crossMat),
        new THREE.Mesh(new THREE.TorusGeometry(26, 1.8, 12, 32), crossMat)
      );
      bossAttachmentGroup.add(crossGroup);
      rings.push(crossGroup);
    } else {
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd43b, emissive: 0xd9480f, emissiveIntensity: 1.1, metalness: 0.8, roughness: 0.2 });
      const halo = new THREE.Mesh(new THREE.TorusGeometry(18, 1.5, 10, 28), goldMat);
      halo.rotation.x = Math.PI / 2; halo.position.set(0, 42, 0);
      bossAttachmentGroup.add(halo); rings.push(halo);
      for (const r of [24, 32]) {
        const aura = new THREE.Mesh(new THREE.RingGeometry(r - 2, r, 32), new THREE.MeshBasicMaterial({ color: 0xff922b, side: THREE.DoubleSide, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
        aura.rotation.x = -Math.PI / 2; aura.position.y = 1.6; spinGroup.add(aura);
      }
    }
    return bossAttachmentGroup;
  }

  function disposeBossAttachments(ent) {
    if (!ent || !ent.bossAttachments) return;
    ent.group.remove(ent.bossAttachments);
    ent.bossAttachments.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    ent.bossAttachments = null;
  }

  function applyEnemyRarityStyle(ent, m) {
    const bName = String(m.name || '');
    const isPinnacle = m.rarity === 'boss' && /Exarch|Eater|Maven|Sirus/i.test(bName);
    const targetH = isPinnacle ? 74 : m.rarity === 'boss' ? 58 : m.rarity === 'rare' ? 37 : m.rarity === 'magic' ? 31 : 25;
    const finalScale = targetH / (ent.natH || 2.0);
    if (ent.model) {
      ent.model.scale.setScalar(finalScale);
      ent.model.position.y = -(ent.minY || 0) * finalScale + (/Maven/i.test(bName) ? 10 : 0);
    }
    if (m.rarity === 'boss' && !ent.bossAttachments) {
      ent.bossAttachments = buildBossAttachments3D(m, finalScale);
      ent.group.add(ent.bossAttachments);
    } else if (m.rarity !== 'boss' && ent.bossAttachments) {
      disposeBossAttachments(ent);
    }
    if (ent.lastRarity !== m.rarity || ent.lastType !== m.t) {
      ent.lastRarity = m.rarity;
      ent.lastType = m.t;
      const emHex = m.t === 'raid_pylon' ? 0x1098ad : m.t === 'gilded_goblin' ? 0x8a6d0b : m.rarity === 'boss' ? 0x661111 : m.rarity === 'rare' ? 0x4a3605 : m.rarity === 'magic' ? 0x0b2244 : 0x000000;
      for (const mat of ent.materials) if (mat.emissive) mat.emissive.setHex(emHex);
      if (ent.rarityRing) {
        ent.rarityRing.visible = m.rarity === 'rare' || m.rarity === 'boss';
        if (ent.rarityRing.visible) {
          ent.rarityRing.scale.setScalar(m.r || 18);
          ent.rarityRing.material.color.setHex(m.rarity === 'boss' ? 0xff3b3b : 0xffd43b);
        }
      }
      if (ent.crownHalo) {
        ent.crownHalo.visible = m.rarity === 'boss' || m.t === 'gilded_goblin';
        if (ent.crownHalo.visible) {
          ent.crownHalo.position.y = targetH + 6;
          ent.crownHalo.scale.setScalar(m.rarity === 'boss' ? 16 : 9);
          ent.crownHalo.material.color.setHex(m.t === 'gilded_goblin' ? 0xffd43b : 0xff5522);
        }
      }
    }
  }

  function releaseEnemy3D(ent) {
    if (!ent) return;
    disposeBossAttachments(ent);
    ent.group.visible = false;
    if (ent.poolKey && ent.b !== 'dummy') {
      let pool = enemyPoolByKey.get(ent.poolKey);
      if (!pool) { pool = []; enemyPoolByKey.set(ent.poolKey, pool); }
      if (pool.length < 85) { pool.push(ent); return; }
    }
    enemiesGroup.remove(ent.group);
    cleanupEntity3D(ent);
  }

  function getOrCreateEnemy3D(m) {
    let ent = enemyEntities.get(m.id);
    if (ent) return ent;

    const archCfg = MONSTER_MODEL_MAP[m.t] || MONSTER_MODEL_MAP.skeleton;
    let modelKey = archCfg.modelKey, wepKey = archCfg.wepKey, shieldKey = archCfg.shieldKey;
    const bName = String(m.name || '');

    if (m.b === 'dummy') {
      modelKey = 'Knight'; wepKey = null; shieldKey = null;
    } else if (m.rarity === 'boss') {
      if (/Exarch/i.test(bName)) { modelKey = 'Monster_Mech'; wepKey = null; shieldKey = null; }
      else if (/Eater/i.test(bName)) { modelKey = 'Monster_AlienLarge'; wepKey = null; shieldKey = null; }
      else if (/Maven/i.test(bName)) { modelKey = 'Monster_AlienFlying'; wepKey = null; shieldKey = null; }
      else if (/Sirus/i.test(bName)) { modelKey = 'Knight'; wepKey = null; shieldKey = null; }
    }

    const poolKey = `${modelKey}_${wepKey || 'none'}_${shieldKey || 'none'}`;
    const pool = enemyPoolByKey.get(poolKey);
    if (pool && pool.length > 0 && m.b !== 'dummy') {
      ent = pool.pop();
      ent.id = m.id; ent.b = m.b; ent.rarity = m.rarity; ent.radius = m.r;
      ent.targetX = m.x; ent.targetZ = m.y;
      ent.group.position.set(m.x, 0, m.y);
      ent.group.visible = true;
      if (ent.lastChilled) {
        ent.lastChilled = false;
        for (const mat of ent.materials) mat.color.setHex(0xffffff);
      }
      applyEnemyRarityStyle(ent, m);
      enemyEntities.set(m.id, ent);
      return ent;
    }

    const group = new THREE.Group();
    group.position.set(m.x, 0, m.y);
    enemiesGroup.add(group);

    let mixer = null, model = null, natH = 2.0, minY = 0;
    const materials = [];
    const gltf = ASSETS.models[modelKey] || ASSETS.models.Skeleton_Warrior;

    if (gltf) {
      model = SkeletonUtils.clone(gltf.scene);
      natH = (gltf.userData && gltf.userData.naturalHeight) || 2.0;
      minY = (gltf.userData && gltf.userData.minY) || 0;
      const isPinnacle = m.rarity === 'boss' && /Exarch|Eater|Maven|Sirus/i.test(bName);
      const targetH = isPinnacle ? 74 : m.rarity === 'boss' ? 58 : m.rarity === 'rare' ? 37 : m.rarity === 'magic' ? 31 : 25;
      const finalScale = targetH / natH;
      model.scale.setScalar(finalScale);
      model.position.y = -minY * finalScale + (/Maven/i.test(bName) ? 10 : 0);

      if (wepKey) attachSkeletonWeapon(model, wepKey, shieldKey);
      if (modelKey === 'Knight') configureCharacterWeapons(model);

      let sharedInstanceMat = null;
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.castShadow = false; child.receiveShadow = false;
          if (!sharedInstanceMat) { sharedInstanceMat = child.material.clone(); materials.push(sharedInstanceMat); }
          child.material = sharedInstanceMat;
        }
      });
      group.add(model);

      mixer = new THREE.AnimationMixer(model);
      const animPrefs = m.b === 'dummy' ? ['Idle', '2H_Melee_Idle'] : ['Run', 'Gallop', 'Flying', 'Walk', 'Running_A', 'Idle'];
      const clip = findClip(gltf.animations, animPrefs);
      if (clip) { const action = mixer.clipAction(clip); action.timeScale = m.b === 'dummy' ? 0.8 : 1.25; action.play(); }
    }

    const rarityRing = new THREE.Mesh(sharedProjGeos.ring, new THREE.MeshBasicMaterial({ color: m.rarity === 'boss' ? 0xff3b3b : 0xffd43b, side: THREE.DoubleSide, transparent: true, opacity: 0.72 }));
    rarityRing.rotation.x = -Math.PI / 2; rarityRing.position.y = 1.2; rarityRing.visible = false;
    group.add(rarityRing);

    const crownHalo = new THREE.Mesh(sharedProjGeos.fxTorus, new THREE.MeshBasicMaterial({ color: 0xffd43b, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    crownHalo.rotation.x = Math.PI / 2; crownHalo.visible = false;
    group.add(crownHalo);

    ent = {
      id: m.id, poolKey, b: m.b, group, model, natH, minY, mixer, materials, rarityRing, crownHalo, bossAttachments: null,
      lastRarity: null, lastType: null, lastChilled: false, targetX: m.x, targetZ: m.y, yaw: 0, rarity: m.rarity, radius: m.r
    };
    applyEnemyRarityStyle(ent, m);
    enemyEntities.set(m.id, ent);
    return ent;
  }

  function getOrCreateHazard3D(haz) {
    let ent = hazardEntities.get(haz.id);
    if (ent) return ent;
    const group = new THREE.Group();
    group.position.set(haz.x, 1.5, haz.y);
    const isSoak = haz.kind === 'soak';
    const outerRing = new THREE.Mesh(new THREE.RingGeometry(haz.r * 0.92, haz.r, 40), new THREE.MeshBasicMaterial({ color: isSoak ? 0xffd43b : 0xff3b3b, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
    outerRing.rotation.x = -Math.PI / 2;
    const innerFill = new THREE.Mesh(new THREE.CircleGeometry(haz.r, 40), new THREE.MeshBasicMaterial({ color: isSoak ? 0x51cf66 : 0xff2222, side: THREE.DoubleSide, transparent: true, opacity: 0.42 }));
    innerFill.rotation.x = -Math.PI / 2; innerFill.scale.setScalar(0.1);
    group.add(outerRing, innerFill);
    hazardsGroup.add(group);
    ent = { id: haz.id, group, innerFill, haz };
    hazardEntities.set(haz.id, ent);
    return ent;
  }

  function getOrCreateInteractable3D(it) {
    let ent = interactableEntities.get(it.id);
    if (ent) { ent.data = it; return ent; }
    const group = new THREE.Group();
    group.position.set(it.x, 0, it.y);
    const isBreach = it.kind === 'breach' || (it.id && String(it.id).includes('breach'));
    const col = new THREE.Color(it.color || (isBreach ? '#d946ef' : '#ffd43b'));

    if (isBreach) {
      const clasp = new THREE.Mesh(new THREE.OctahedronGeometry(14, 1), new THREE.MeshStandardMaterial({ color: 0xd946ef, emissive: 0x9333ea, emissiveIntensity: 1.4, metalness: 0.7, roughness: 0.2 }));
      clasp.position.y = 22;
      const breachTorus = new THREE.Mesh(new THREE.TorusGeometry(26, 2.2, 12, 36), new THREE.MeshBasicMaterial({ color: 0xe879f9, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      breachTorus.rotation.x = Math.PI / 2; breachTorus.position.y = 3.0;
      group.add(clasp, breachTorus);
    } else if (it.kind === 'essence') {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(18, 0), new THREE.MeshStandardMaterial({ color: 0x3bc9db, emissive: 0x1098ad, emissiveIntensity: 1.3, metalness: 0.5, roughness: 0.15, transparent: true, opacity: 0.9 }));
      crystal.scale.set(0.85, 2.1, 0.85); crystal.position.y = 26;
      group.add(crystal);
    } else {
      const modelKey = (it.kind === 'shrine' || it.kind === 'ritual') ? 'shrine' : 'chest_gold';
      const gltf = ASSETS.models[modelKey];
      if (gltf) {
        const m = gltf.scene.clone(true);
        const natH = (gltf.userData && gltf.userData.naturalHeight) || 1.5;
        m.scale.setScalar(((it.kind === 'shrine' || it.kind === 'ritual') ? 48 : 26) / natH);
        group.add(m);
      }
    }

    const ring = new THREE.Mesh(new THREE.RingGeometry(24, 30, 32), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.78 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 1.5;
    group.add(ring);
    interactablesGroup.add(group);
    ent = { id: it.id, group, data: it, isBreach };
    interactableEntities.set(it.id, ent);
    return ent;
  }

  function getOrCreateBreachRing3D(b) {
    let ent = breachRingEntities.get(b.id);
    if (ent) {
      ent.data = b;
      const curR = Math.max(40, b.r || 95);
      ent.ringGroup.scale.set(curR, 1, curR);
      return ent;
    }
    const group = new THREE.Group();
    group.position.set(b.x, 0, b.y);
    const anchor = new THREE.Mesh(new THREE.OctahedronGeometry(16, 1), new THREE.MeshStandardMaterial({ color: 0xd946ef, emissive: 0xa21caf, emissiveIntensity: 1.6, metalness: 0.75, roughness: 0.2 }));
    anchor.position.y = 26;
    group.add(anchor);

    const ringGroup = new THREE.Group();
    const torus = new THREE.Mesh(new THREE.TorusGeometry(1, 0.025, 12, 64), new THREE.MeshBasicMaterial({ color: 0xe879f9, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false }));
    torus.rotation.x = Math.PI / 2; torus.position.y = 4.0;
    const groundBand = new THREE.Mesh(new THREE.RingGeometry(0.91, 1.01, 64), new THREE.MeshBasicMaterial({ color: 0xc026d3, side: THREE.DoubleSide, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, depthWrite: false }));
    groundBand.rotation.x = -Math.PI / 2; groundBand.position.y = 1.6;
    const innerFill = new THREE.Mesh(new THREE.CircleGeometry(0.92, 48), new THREE.MeshBasicMaterial({ color: 0x701a75, side: THREE.DoubleSide, transparent: true, opacity: 0.14, depthWrite: false }));
    innerFill.rotation.x = -Math.PI / 2; innerFill.position.y = 1.1;

    ringGroup.add(torus, groundBand, innerFill);
    const initR = Math.max(40, b.r || 95);
    ringGroup.scale.set(initR, 1, initR);
    group.add(ringGroup);
    interactablesGroup.add(group);
    ent = { id: b.id, group, anchor, ringGroup, data: b };
    breachRingEntities.set(b.id, ent);
    return ent;
  }

  Object.assign(window.__POS_CTX__, {
    enemyPoolByKey, cloneModelInstance, buildBossAttachments3D, applyEnemyRarityStyle, releaseEnemy3D, getOrCreateEnemy3D,
    getOrCreateHazard3D, getOrCreateInteractable3D, getOrCreateBreachRing3D
  });
  }
})();
