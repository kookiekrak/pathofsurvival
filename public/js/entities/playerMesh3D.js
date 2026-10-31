// Client Module: 3D Rigged Player Characters, Weapons, Animations & Entity Maps
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

  Object.assign(window.__POS_CTX__, {
    playerEntities, enemyEntities, projEntities, hazardEntities,
    interactableEntities, upgradeChestEntities, breachRingEntities, dropEntities,
    active3DFx, floatingTexts,
    findClip, configureCharacterWeapons, attachSkeletonWeapon,
    CLASS_3D_CONFIG, getOrCreatePlayer3D, switchBaseAction
  });
  }
})();
