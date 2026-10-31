// Client Module: 3D Rigged Characters, Monsters, Projectiles, Interactables, Drops & 3D FX
(function () {
  with (window.__POS_CTX__) {
  // =========================================================================
  // 3D RIGGED CHARACTER, MONSTER, HAZARD & INTERACTABLE MANAGERS
  // =========================================================================
  const playerEntities = new Map();
  const enemyEntities = new Map();
  const projEntities = new Map();
  const hazardEntities = new Map();
  const interactableEntities = new Map();
  const upgradeChestEntities = new Map();
  const breachRingEntities = new Map();
  const dropEntities = new Map();
  const active3DFx = [];
  const floatingTexts = [];

  function findClip(animations, preferredNames) {
    if (!animations || animations.length === 0) return null;
    for (const name of preferredNames) {
      const found = animations.find((a) => a.name === name);
      if (found) return found;
    }
    return animations[0];
  }

  function configureCharacterWeapons(root, classId = null) {
    const allWeaponNodes = new Set([
      '1H_Axe_Offhand', 'Barbarian_Round_Shield', '1H_Axe', 'Mug',
      'Knife_Offhand', '1H_Crossbow', 'Knife', 'Throwable',
      'Spellbook', '2H_Staff',
      '1H_Sword_Offhand', 'Rectangle_Shield', 'Round_Shield', 'Spike_Shield', '1H_Sword'
    ]);

    // Keep signature 3D weapons visible for each of the 7 PoE 1 Classes!
    const keepVisible = new Set();
    if (classId === 'Marauder') {
      keepVisible.add('1H_Axe');
      keepVisible.add('1H_Axe_Offhand');
    } else if (classId === 'Ranger') {
      keepVisible.add('1H_Crossbow');
      keepVisible.add('Knife_Offhand');
    } else if (classId === 'Witch') {
      keepVisible.add('2H_Staff');
      keepVisible.add('Spellbook');
    } else if (classId === 'Duelist') {
      keepVisible.add('1H_Sword');
      keepVisible.add('1H_Sword_Offhand');
    } else if (classId === 'Templar') {
      keepVisible.add('2H_Staff');
      keepVisible.add('Round_Shield');
    } else if (classId === 'Shadow') {
      keepVisible.add('Knife');
      keepVisible.add('Knife_Offhand');
    } else if (classId === 'Scion') {
      keepVisible.add('1H_Sword');
      keepVisible.add('Spellbook');
    }

    root.traverse((node) => {
      if (allWeaponNodes.has(node.name)) {
        node.visible = keepVisible.has(node.name);
      }
    });
  }

  function attachSkeletonWeapon(root, wepKey, shieldKey = null) {
    let handR = null;
    let handL = null;
    root.traverse((node) => {
      if (node.name === 'handslot.r') handR = node;
      if (node.name === 'handslot.l') handL = node;
    });
    if (handR && ASSETS.models[wepKey]) {
      handR.add(ASSETS.models[wepKey].scene.clone(true));
    }
    if (handL && shieldKey && ASSETS.models[shieldKey]) {
      handL.add(ASSETS.models[shieldKey].scene.clone(true));
    }
  }

  const CLASS_3D_CONFIG = {
    Marauder: {
      modelKey: 'Marauder',
      scale: 16.5,
      emissiveHex: 0x260805,
      atkAnims: ['2H_Melee_Attack_Chop', '2H_Melee_Attack_Spin', '1H_Melee_Attack_Slice_Diagonal']
    },
    Ranger: {
      modelKey: 'Ranger',
      scale: 15.8,
      emissiveHex: 0x061f0d,
      atkAnims: ['2H_Ranged_Shoot', '1H_Ranged_Shoot']
    },
    Witch: {
      modelKey: 'Witch',
      scale: 15.6,
      emissiveHex: 0x07152e,
      atkAnims: ['Spellcast_Shoot', 'Spellcast_Raise']
    },
    Duelist: {
      modelKey: 'Knight',
      scale: 16.0,
      emissiveHex: 0x291204,
      atkAnims: ['2H_Melee_Attack_Spin', '1H_Melee_Attack_Slice_Horizontal', '1H_Melee_Attack_Chop']
    },
    Templar: {
      modelKey: 'Witch',
      scale: 16.2,
      emissiveHex: 0x2b2007,
      extraShield: 'wep_shield',
      atkAnims: ['Spellcast_Raise', 'Spellcast_Shoot', '1H_Melee_Attack_Chop']
    },
    Shadow: {
      modelKey: 'Ranger',
      scale: 15.6,
      emissiveHex: 0x062126,
      atkAnims: ['1H_Melee_Attack_Slice_Diagonal', '1H_Melee_Attack_Stab', '1H_Ranged_Shoot']
    },
    Scion: {
      modelKey: 'Knight',
      scale: 15.8,
      emissiveHex: 0x29210e,
      extraWeaponL: 'wep_staff',
      atkAnims: ['1H_Melee_Attack_Slice_Diagonal', 'Spellcast_Shoot', '2H_Melee_Attack_Spin']
    }
  };

  function getOrCreatePlayer3D(p) {
    let ent = playerEntities.get(p.id);
    if (ent && ent.classId === p.classId) return ent;
    if (ent) {
      playersGroup.remove(ent.group);
      playerEntities.delete(p.id);
    }

    const group = new THREE.Group();
    group.position.set(p.x, 0, p.y);
    playersGroup.add(group);

    let mixer = null;
    const actions = {};
    const cfg = CLASS_3D_CONFIG[p.classId] || CLASS_3D_CONFIG.Marauder;
    const gltf = ASSETS.models[cfg.modelKey] || ASSETS.models[p.classId] || ASSETS.models.Marauder;

    if (gltf) {
      const model = SkeletonUtils.clone(gltf.scene);
      model.scale.setScalar(cfg.scale || 16);
      model.position.y = 0;
      configureCharacterWeapons(model, p.classId);
      if (cfg.extraShield) attachSkeletonWeapon(model, null, cfg.extraShield);
      if (cfg.extraWeaponL) attachSkeletonWeapon(model, null, cfg.extraWeaponL);

      model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.emissive = new THREE.Color(cfg.emissiveHex || 0x111111);
        }
      });

      group.add(model);

      mixer = new THREE.AnimationMixer(model);
      const idleClip = findClip(gltf.animations, ['Idle', '2H_Melee_Idle']);
      const runClip = findClip(gltf.animations, ['Running_A', 'Running_B']);
      const dashClip = findClip(gltf.animations, ['Dodge_Forward']);
      const deathClip = findClip(gltf.animations, ['Death_A_Pose', 'Death_A']);
      const atkClip = findClip(gltf.animations, cfg.atkAnims);

      if (idleClip) actions.idle = mixer.clipAction(idleClip);
      if (runClip) actions.run = mixer.clipAction(runClip);
      if (dashClip) actions.dash = mixer.clipAction(dashClip);
      if (deathClip) {
        actions.death = mixer.clipAction(deathClip);
        actions.death.setLoop(THREE.LoopOnce, 1);
        actions.death.clampWhenFinished = true;
      }
      if (atkClip) {
        actions.atk = mixer.clipAction(atkClip);
        actions.atk.setLoop(THREE.LoopOnce, 1);
        actions.atk.timeScale = 1.65;
      }
      if (actions.idle) actions.idle.play();
    }

    const cls = (GameData.CLASSES && GameData.CLASSES[p.classId]) || { color: '#c92a2a' };
    const footRing = new THREE.Mesh(
      new THREE.RingGeometry(14, 17, 32),
      new THREE.MeshBasicMaterial({ color: cls.color, side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
    );
    footRing.rotation.x = -Math.PI / 2;
    footRing.position.y = 1.0;
    group.add(footRing);

    // 3D Righteous Fire Aura
    const rfGroup = new THREE.Group();
    const rfDisc = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 1, 48),
      new THREE.MeshBasicMaterial({
        color: 0xff5511,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    rfDisc.rotation.x = -Math.PI / 2;
    rfDisc.position.y = 1.6;

    const rfRim = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.025, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0xffb833 })
    );
    rfRim.rotation.x = Math.PI / 2;
    rfRim.position.y = 2.2;
    rfGroup.add(rfDisc, rfRim);
    rfGroup.visible = false;
    group.add(rfGroup);

    // Subtle Flat Ground Arcane Energy Shield Ward Ring (No wireframe sphere cage!)
    const esMesh = new THREE.Group();
    const esOuterRing = new THREE.Mesh(
      new THREE.RingGeometry(17.5, 20.5, 36),
      new THREE.MeshBasicMaterial({
        color: 0x3bc9db,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    esOuterRing.rotation.x = -Math.PI / 2;
    const esInnerRing = new THREE.Mesh(
      new THREE.RingGeometry(14, 15.2, 24),
      new THREE.MeshBasicMaterial({
        color: 0x99e9f2,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    esInnerRing.rotation.x = -Math.PI / 2;
    esMesh.add(esOuterRing, esInnerRing);
    esMesh.position.y = 1.6;
    esMesh.visible = false;
    group.add(esMesh);

    ent = {
      id: p.id,
      classId: p.classId,
      group,
      mixer,
      actions,
      activeBaseAction: actions.idle || null,
      lastAtkSeq: p.atkSeq || 0,
      rfGroup,
      rfDisc,
      rfRim,
      esMesh,
      targetX: p.x,
      targetZ: p.y,
      yaw: 0
    };
    playerEntities.set(p.id, ent);
    return ent;
  }

  function switchBaseAction(ent, nextAction) {
    if (!nextAction || ent.activeBaseAction === nextAction) return;
    if (ent.activeBaseAction) {
      ent.activeBaseAction.fadeOut(0.14);
    }
    nextAction.reset().fadeIn(0.14).play();
    ent.activeBaseAction = nextAction;
  }

  const enemyPoolByKey = new Map();

  function applyEnemyRarityStyle(ent, m) {
    const rarityScale = m.rarity === 'boss' ? 28 : m.rarity === 'rare' ? 19.5 : m.rarity === 'magic' ? 16.5 : 14.5;
    if (ent.model) {
      ent.model.scale.setScalar(rarityScale);
    }
    if (ent.lastRarity !== m.rarity) {
      ent.lastRarity = m.rarity;
      const emHex = m.rarity === 'boss' ? 0x661111 : m.rarity === 'rare' ? 0x4a3605 : m.rarity === 'magic' ? 0x0b2244 : 0x000000;
      for (const mat of ent.materials) {
        if (mat.emissive) mat.emissive.setHex(emHex);
      }
      if (ent.rarityRing) {
        if (m.rarity === 'rare' || m.rarity === 'boss') {
          ent.rarityRing.visible = true;
          ent.rarityRing.scale.setScalar(m.r || 18);
          ent.rarityRing.material.color.setHex(m.rarity === 'boss' ? 0xff3b3b : 0xffd43b);
        } else {
          ent.rarityRing.visible = false;
        }
      }
    }
  }

  function releaseEnemy3D(ent) {
    if (!ent) return;
    ent.group.visible = false;
    if (ent.poolKey && ent.b !== 'dummy') {
      let pool = enemyPoolByKey.get(ent.poolKey);
      if (!pool) {
        pool = [];
        enemyPoolByKey.set(ent.poolKey, pool);
      }
      if (pool.length < 85) {
        pool.push(ent);
        return;
      }
    }
    enemiesGroup.remove(ent.group);
    cleanupEntity3D(ent);
  }

  function getOrCreateEnemy3D(m) {
    let ent = enemyEntities.get(m.id);
    if (ent) return ent;

    // Cohesive Dark-Fantasy KayKit 3D Monster Models + Bound 3D Weapons
    let modelKey = 'Skeleton_Warrior';
    let wepKey = 'wep_blade';
    let shieldKey = 'wep_shield';

    if (m.b === 'dummy') {
      modelKey = 'Knight';
      wepKey = null;
      shieldKey = null;
    } else if (m.t === 'cultist') {
      modelKey = 'Skeleton_Mage';
      wepKey = 'wep_staff';
      shieldKey = null;
    } else if (m.t === 'goatman') {
      modelKey = 'Skeleton_Rogue';
      wepKey = 'wep_axe';
      shieldKey = null;
    } else if (m.t === 'rhoa') {
      modelKey = 'Skeleton_Rogue';
      wepKey = 'wep_blade';
      shieldKey = 'wep_blade';
    } else if (m.t === 'devourer') {
      modelKey = 'Skeleton_Minion';
      wepKey = 'wep_axe';
      shieldKey = 'wep_blade';
    } else if (m.t === 'kitava_herald' || m.rarity === 'boss') {
      modelKey = 'Skeleton_Warrior';
      wepKey = 'wep_axe';
      shieldKey = 'wep_shield';
    }

    const poolKey = `${modelKey}_${wepKey || 'none'}_${shieldKey || 'none'}`;
    const pool = enemyPoolByKey.get(poolKey);
    if (pool && pool.length > 0 && m.b !== 'dummy') {
      ent = pool.pop();
      ent.id = m.id;
      ent.b = m.b;
      ent.rarity = m.rarity;
      ent.radius = m.r;
      ent.targetX = m.x;
      ent.targetZ = m.y;
      ent.group.position.set(m.x, 0, m.y);
      ent.group.visible = true;
      if (ent.lastChilled) {
        ent.lastChilled = false;
        for (const mat of ent.materials) {
          mat.color.setHex(0xffffff);
        }
      }
      applyEnemyRarityStyle(ent, m);
      enemyEntities.set(m.id, ent);
      return ent;
    }

    const group = new THREE.Group();
    group.position.set(m.x, 0, m.y);
    enemiesGroup.add(group);

    let mixer = null;
    let model = null;
    const materials = [];
    const gltf = ASSETS.models[modelKey] || ASSETS.models.Skeleton_Warrior;

    if (gltf) {
      model = SkeletonUtils.clone(gltf.scene);
      const rarityScale = m.rarity === 'boss' ? 28 : m.rarity === 'rare' ? 19.5 : m.rarity === 'magic' ? 16.5 : 14.5;
      model.scale.setScalar(rarityScale);
      model.position.y = 0;

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
        : m.t === 'cultist'
          ? ['Running_B', 'Running_A']
          : ['Running_A', 'Running_C', 'Walking_A'];
      const clip = findClip(gltf.animations, animPrefs);
      if (clip) {
        const action = mixer.clipAction(clip);
        action.timeScale = m.b === 'dummy' ? 0.8 : 1.25;
        action.play();
      }
    }

    const rarityRing = new THREE.Mesh(
      sharedProjGeos.ring,
      new THREE.MeshBasicMaterial({
        color: m.rarity === 'boss' ? 0xff3b3b : 0xffd43b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72
      })
    );
    rarityRing.rotation.x = -Math.PI / 2;
    rarityRing.position.y = 1.2;
    rarityRing.visible = false;
    group.add(rarityRing);

    ent = {
      id: m.id,
      poolKey,
      b: m.b,
      group,
      model,
      mixer,
      materials,
      rarityRing,
      lastRarity: null,
      lastChilled: false,
      targetX: m.x,
      targetZ: m.y,
      yaw: 0,
      rarity: m.rarity,
      radius: m.r
    };
    applyEnemyRarityStyle(ent, m);
    enemyEntities.set(m.id, ent);
    return ent;
  }

  // Telegraphed Ground Hazards (Vaal Flameblast / Molten Mortar / Boss Slam)
  function getOrCreateHazard3D(haz) {
    let ent = hazardEntities.get(haz.id);
    if (ent) return ent;

    const group = new THREE.Group();
    group.position.set(haz.x, 1.5, haz.y);

    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(haz.r * 0.92, haz.r, 40),
      new THREE.MeshBasicMaterial({ color: 0xff3b3b, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    outerRing.rotation.x = -Math.PI / 2;

    const innerFill = new THREE.Mesh(
      new THREE.CircleGeometry(haz.r, 40),
      new THREE.MeshBasicMaterial({ color: 0xff2222, side: THREE.DoubleSide, transparent: true, opacity: 0.42 })
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
    } else {
      const modelKey = it.kind === 'shrine' ? 'shrine' : 'chest_gold';
      const gltf = ASSETS.models[modelKey];
      if (gltf) {
        const m = gltf.scene.clone(true);
        const natH = (gltf.userData && gltf.userData.naturalHeight) || 1.5;
        const targetH = it.kind === 'shrine' ? 46 : 26;
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

    const colorMap = {
      physical: 0xf4d58d,
      fire: 0xff6b35,
      cold: 0x74c0fc,
      lightning: 0x70b8ff
    };
    const col = colorMap[prj.dt] || 0xffd43b;

    const group = new THREE.Group();
    const yHeight = prj.s === 'sunder' ? 2.5 : 16;
    group.position.set(prj.x, yHeight, prj.y);

    const mesh = new THREE.Group();
    let spinSpeed = 0;

    if (prj.s === 'sunder') {
      // Jagged 5-spike tectonic fault wave + glowing magma fissure (spawns cascading shockwave rings along its path!)
      const rockMat = new THREE.MeshStandardMaterial({
        color: 0x704225,
        emissive: 0xe8590c,
        emissiveIntensity: 1.15,
        roughness: 0.6
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
        color: 0xff6b35,
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
    } else if (prj.s === 'tornado_shot' || prj.s === 'lightning_arrow') {
      // High-visibility glowing arrow shaft + broadhead tip + horizontal wind/lightning chevron along +Z
      const isLightning = prj.s === 'lightning_arrow' || prj.dt === 'lightning';
      const arrowCol = isLightning ? 0x74c0fc : 0xffe066;
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
    } else if (prj.s === 'spectral_throw' || prj.s === 'blade_vortex') {
      if (ASSETS.models.wep_blade) {
        const blade = ASSETS.models.wep_blade.scene.clone(true);
        blade.scale.setScalar(13.5);
        blade.rotation.x = Math.PI / 2;
        mesh.add(blade);
      }
      const discMat = new THREE.MeshBasicMaterial({
        color: prj.s === 'blade_vortex' ? 0x69db7c : 0xffe8a3,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const sawRing = new THREE.Mesh(sharedProjGeos.ring, discMat);
      sawRing.rotation.x = -Math.PI / 2;
      sawRing.scale.setScalar(13);
      mesh.add(sawRing);
      spinSpeed = 20;
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
    if (!drop) return;
    let soundId = 0;
    let vol = 0.78;
    const cId = drop.currencyId || null;
    const isT0 = Boolean(drop.t0 || drop.rarity === 'divine' || cId === 'divine' || cId === 'exalted');

    if (isT0) {
      // AlertSound 6: Iconic NeverSink T0 / Divine Orb / Exalted Orb / Mageblood SHWING!
      soundId = 6;
      vol = 1.0;
    } else if (drop.rarity === 'unique') {
      // AlertSound 3: NeverSink Unique Item Drop Gong
      soundId = 3;
      vol = 0.90;
    } else if (drop.dt === 'flask' || drop.rarity === 'flask') {
      // AlertSound 4: NeverSink Utility Flask Drop
      soundId = 4;
      vol = 0.82;
    } else if (cId === 'chaos' || cId === 'alchemy' || drop.rarity === 'currency_high') {
      // AlertSound 2: NeverSink Chaos / Alchemy Currency Drop
      soundId = 2;
      vol = 0.86;
    } else if (drop.rarity === 'rare') {
      const ilvl = (drop.item && drop.item.ilvl) || 1;
      // AlertSound 5 for High-ilvl Rare Gear, AlertSound 1 for standard Rare Gear
      soundId = ilvl >= 12 ? 5 : 1;
      vol = ilvl >= 12 ? 0.82 : 0.72;
    } else if (drop.dt === 'currency' || drop.rarity === 'currency') {
      // AlertSound 1: NeverSink Crafting Currency Drop
      soundId = 1;
      vol = 0.68;
    }

    if (!soundId) return;
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
    // Hard-cap active 3D FX at 28 so massive AoE packs never cause WebGL memory/drawcall lag
    while (active3DFx.length >= 28) {
      const oldest = active3DFx.shift();
      if (oldest) {
        fxGroup.remove(oldest.group);
        dispose3DFx(oldest);
      }
    }

    if (f.kind === 'nova' || f.kind === 'level_up') {
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
    if (active3DFx.length >= 24) return;
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

  // =========================================================================
  // RESIZE, LOBBY BROWSER & PARTY CONNECTION
  // =========================================================================
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

    Object.assign(window.__POS_CTX__, { playerEntities, enemyEntities, projEntities, hazardEntities, interactableEntities, upgradeChestEntities, breachRingEntities, dropEntities, active3DFx, floatingTexts, findClip, configureCharacterWeapons, attachSkeletonWeapon, CLASS_3D_CONFIG, getOrCreatePlayer3D, switchBaseAction, getOrCreateEnemy3D, releaseEnemy3D, getOrCreateHazard3D, getOrCreateInteractable3D, getOrCreateBreachRing3D, getOrCreateUpgradeChest3D, sharedProjGeos, dispose3DFx, cleanupEntity3D, getOrCreateProjectile3D, getOrCreateDrop3D, spawn3DFxEvent, spawnDeathBurst3D, resizeCanvases });
  }
})();
