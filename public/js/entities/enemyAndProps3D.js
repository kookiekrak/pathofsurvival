// Client Module: 3D Pooled Enemy Meshes, Ground Hazards, Shrines & Chayula Breach Rings
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

  function applyEnemyRarityStyle(ent, m) {
    const targetH = m.rarity === 'boss' ? 54 : m.rarity === 'rare' ? 37 : m.rarity === 'magic' ? 31 : 25;
    const finalScale = targetH / (ent.natH || 2.0);
    if (ent.model) {
      ent.model.scale.setScalar(finalScale);
      ent.model.position.y = -(ent.minY || 0) * finalScale;
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

    // Distinct 3D Monster Archetypes + Pinnacle Boss Models
    const archCfg = MONSTER_MODEL_MAP[m.t] || MONSTER_MODEL_MAP.skeleton;
    let modelKey = archCfg.modelKey, wepKey = archCfg.wepKey, shieldKey = archCfg.shieldKey;

    if (m.b === 'dummy') {
      modelKey = 'Knight'; wepKey = null; shieldKey = null;
    } else if (m.rarity === 'boss') {
      const bName = String(m.name || '');
      if (bName.includes('Exarch')) { modelKey = 'Monster_Mech'; wepKey = null; shieldKey = null; }
      else if (bName.includes('Eater')) { modelKey = 'Monster_AlienLarge'; wepKey = null; shieldKey = null; }
      else if (bName.includes('Maven')) { modelKey = 'Monster_AlienFlying'; wepKey = null; shieldKey = null; }
      else if (bName.includes('Sirus')) { modelKey = 'Knight'; wepKey = null; shieldKey = null; }
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
      const targetH = m.rarity === 'boss' ? 54 : m.rarity === 'rare' ? 37 : m.rarity === 'magic' ? 31 : 25;
      const finalScale = targetH / natH;
      model.scale.setScalar(finalScale);
      model.position.y = -minY * finalScale;

      if (wepKey) attachSkeletonWeapon(model, wepKey, shieldKey);
      if (modelKey === 'Knight') configureCharacterWeapons(model);

      // Share a single cloned material per enemy instance instead of cloning 12 separate materials per bone!
      let sharedInstanceMat = null;
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.castShadow = false;
          child.receiveShadow = false;
          if (!sharedInstanceMat) {
            sharedInstanceMat = child.material.clone();
            materials.push(sharedInstanceMat);
          }
          child.material = sharedInstanceMat;
        }
      });

      group.add(model);

      mixer = new THREE.AnimationMixer(model);
      const animPrefs = m.b === 'dummy'
        ? ['Idle', '2H_Melee_Idle']
        : ['Run', 'Gallop', 'Flying', 'Walk', 'Running_A', 'Idle'];
      const clip = findClip(gltf.animations, animPrefs);
      if (clip) {
        const action = mixer.clipAction(clip);
        action.timeScale = m.b === 'dummy' ? 0.8 : 1.25;
        action.play();
      }
    }

    const rarityRing = new THREE.Mesh(
      sharedProjGeos.ring,
      new THREE.MeshBasicMaterial({ color: m.rarity === 'boss' ? 0xff3b3b : 0xffd43b, side: THREE.DoubleSide, transparent: true, opacity: 0.72 })
    );
    rarityRing.rotation.x = -Math.PI / 2;
    rarityRing.position.y = 1.2;
    rarityRing.visible = false;
    group.add(rarityRing);

    const crownHalo = new THREE.Mesh(
      sharedProjGeos.fxTorus,
      new THREE.MeshBasicMaterial({ color: 0xffd43b, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    crownHalo.rotation.x = Math.PI / 2;
    crownHalo.visible = false;
    group.add(crownHalo);

    ent = {
      id: m.id, poolKey, b: m.b, group, model, natH, minY, mixer, materials, rarityRing, crownHalo,
      lastRarity: null, lastType: null, lastChilled: false, targetX: m.x, targetZ: m.y, yaw: 0, rarity: m.rarity, radius: m.r
    };
    applyEnemyRarityStyle(ent, m);
    enemyEntities.set(m.id, ent);
    return ent;
  }

  // Telegraphed Ground Hazards (Vaal Flameblast / Molten Mortar / Boss Slam / Soak Circles)
  function getOrCreateHazard3D(haz) {
    let ent = hazardEntities.get(haz.id);
    if (ent) return ent;

    const group = new THREE.Group();
    group.position.set(haz.x, 1.5, haz.y);
    const isSoak = haz.kind === 'soak';

    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(haz.r * 0.92, haz.r, 40),
      new THREE.MeshBasicMaterial({ color: isSoak ? 0xffd43b : 0xff3b3b, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    outerRing.rotation.x = -Math.PI / 2;

    const innerFill = new THREE.Mesh(
      new THREE.CircleGeometry(haz.r, 40),
      new THREE.MeshBasicMaterial({ color: isSoak ? 0x51cf66 : 0xff2222, side: THREE.DoubleSide, transparent: true, opacity: 0.42 })
    );
    innerFill.rotation.x = -Math.PI / 2;
    innerFill.scale.setScalar(0.1);

    group.add(outerRing, innerFill);
    hazardsGroup.add(group);

    ent = { id: haz.id, group, innerFill, haz };
    hazardEntities.set(haz.id, ent);
    return ent;
  }

  // 3D Map Interactables (Shrines, Strongboxes & Breach Hand Clasps)
  function getOrCreateInteractable3D(it) {
    let ent = interactableEntities.get(it.id);
    if (ent) {
      ent.data = it;
      return ent;
    }

    const group = new THREE.Group();
    group.position.set(it.x, 0, it.y);

    const isBreach = it.kind === 'breach' || (it.id && String(it.id).includes('breach'));
    const col = new THREE.Color(it.color || (isBreach ? '#d946ef' : '#ffd43b'));

    if (isBreach) {
      // Glowing Purple/Crimson Chayula Breach Clasp & Pulsing Rift Torus
      const clasp = new THREE.Mesh(
        new THREE.OctahedronGeometry(14, 1),
        new THREE.MeshStandardMaterial({
          color: 0xd946ef,
          emissive: 0x9333ea,
          emissiveIntensity: 1.4,
          metalness: 0.7,
          roughness: 0.2
        })
      );
      clasp.position.y = 22;
      group.add(clasp);

      const breachTorus = new THREE.Mesh(
        new THREE.TorusGeometry(26, 2.2, 12, 36),
        new THREE.MeshBasicMaterial({
          color: 0xe879f9,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      breachTorus.rotation.x = Math.PI / 2;
      breachTorus.position.y = 3.0;
      group.add(breachTorus);
    } else if (it.kind === 'essence') {
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(18, 0),
        new THREE.MeshStandardMaterial({ color: 0x3bc9db, emissive: 0x1098ad, emissiveIntensity: 1.3, metalness: 0.5, roughness: 0.15, transparent: true, opacity: 0.9 })
      );
      crystal.scale.set(0.85, 2.1, 0.85);
      crystal.position.y = 26;
      group.add(crystal);
    } else {
      const modelKey = (it.kind === 'shrine' || it.kind === 'ritual') ? 'shrine' : 'chest_gold';
      const gltf = ASSETS.models[modelKey];
      if (gltf) {
        const m = gltf.scene.clone(true);
        const natH = (gltf.userData && gltf.userData.naturalHeight) || 1.5;
        const targetH = (it.kind === 'shrine' || it.kind === 'ritual') ? 48 : 26;
        m.scale.setScalar(targetH / natH);
        group.add(m);
      }
    }

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(24, 30, 32),
      new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 1.5;
    group.add(ring);

    interactablesGroup.add(group);
    ent = { id: it.id, group, data: it, isBreach };
    interactableEntities.set(it.id, ent);
    return ent;
  }

  // 3D PoE Expanding Chayula Breach Ring
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

    // Center Chayula Void Anchor
    const anchor = new THREE.Mesh(
      new THREE.OctahedronGeometry(16, 1),
      new THREE.MeshStandardMaterial({
        color: 0xd946ef,
        emissive: 0xa21caf,
        emissiveIntensity: 1.6,
        metalness: 0.75,
        roughness: 0.2
      })
    );
    anchor.position.y = 26;
    group.add(anchor);

    // Expanding Outer Ring Group (unit radius scaled by b.r)
    const ringGroup = new THREE.Group();
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.025, 12, 64),
      new THREE.MeshBasicMaterial({
        color: 0xe879f9,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    torus.rotation.x = Math.PI / 2;
    torus.position.y = 4.0;

    const groundBand = new THREE.Mesh(
      new THREE.RingGeometry(0.91, 1.01, 64),
      new THREE.MeshBasicMaterial({
        color: 0xc026d3,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.48,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    groundBand.rotation.x = -Math.PI / 2;
    groundBand.position.y = 1.6;

    const innerFill = new THREE.Mesh(
      new THREE.CircleGeometry(0.92, 48),
      new THREE.MeshBasicMaterial({
        color: 0x701a75,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.14,
        depthWrite: false
      })
    );
    innerFill.rotation.x = -Math.PI / 2;
    innerFill.position.y = 1.1;

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
    enemyPoolByKey, applyEnemyRarityStyle, releaseEnemy3D, getOrCreateEnemy3D,
    getOrCreateHazard3D, getOrCreateInteractable3D, getOrCreateBreachRing3D
  });
  }
})();
