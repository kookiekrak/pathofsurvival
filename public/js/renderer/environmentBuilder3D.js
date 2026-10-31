// Client Module: 3D Biome Environment Builder (Hideout, Pinnacle Boss Crucible Arenas & 6000x6000 Wraeclast Maps)
(function () {
  with (window.__POS_CTX__) {
  currentEnvKey = '';
  mapDevicePortalGroup = null;
  extractionPortalMesh = null;

  function placePropByHeight(modelKey, x, z, targetHeight, rotY = 0, yOffset = 0) {
    const gltf = ASSETS.models[modelKey];
    if (!gltf) return null;
    const clone = gltf.scene.clone(true);
    const natH = (gltf.userData && gltf.userData.naturalHeight) || 2.0;
    const scale = targetHeight / natH;
    clone.scale.setScalar(scale);
    const minY = (gltf.userData && gltf.userData.minY) || 0;
    clone.position.set(x, -minY * scale + yOffset, z);
    clone.rotation.y = rotY;
    envGroup.add(clone);
    return clone;
  }

  function seededRand(seed) {
    let s = Math.max(1, (Number(seed) | 0) ^ 0x6d2b79f5);
    return () => {
      s = Math.imul(s ^ (s >>> 15), s | 1);
      s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
      return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Bespoke 3D Pinnacle Boss Crucible Arena Builder (Searing Exarch, Eater of Worlds, The Maven, Sirus)
  function buildPinnacleRaidCrucible(raidId) {
    const RAID_R = 560;
    const raidThemes = {
      raid_searing_exarch: {
        bg: 0x160503, hemi: 0xff922b, ground: 0x2b0a05, dir: 0xffb86c,
        outerCol: 0xc92a2a, outerEm: 0xff4d29, outerTex: 'lava_diff',
        floorCol: 0x181010, floorTex: 'brick_diff', rimCol: 0xff6b2b, rimEm: 0xd9480f
      },
      raid_eater_of_worlds: {
        bg: 0x041118, hemi: 0x66d9e8, ground: 0x061a24, dir: 0x99e9f2,
        outerCol: 0x061a24, outerEm: 0x0b4f6c, outerTex: 'strand_diff',
        floorCol: 0x0b1d26, floorTex: 'marble_diff', rimCol: 0x22b8cf, rimEm: 0x0c8599
      },
      raid_maven_crucible: {
        bg: 0x0b071a, hemi: 0xd0bfff, ground: 0x140d2b, dir: 0xf3d9fa,
        outerCol: 0x0b071a, outerEm: 0x1f1147, outerTex: 'marble_diff',
        floorCol: 0x141024, floorTex: 'marble_diff', rimCol: 0xe599f7, rimEm: 0x9c36b5
      },
      raid_sirus_awakener: {
        bg: 0x1a0508, hemi: 0xff8787, ground: 0x29090e, dir: 0xffa8a8,
        outerCol: 0x1a0508, outerEm: 0x4a0810, outerTex: 'lava_diff',
        floorCol: 0x170d10, floorTex: 'brick_diff', rimCol: 0xe03131, rimEm: 0x8a1111
      }
    };
    const rt = raidThemes[raidId] || raidThemes.raid_sirus_awakener;
    scene.background = new THREE.Color(rt.bg);
    scene.fog = new THREE.FogExp2(rt.bg, 0.00045);
    hemiLight.color.setHex(rt.hemi);
    hemiLight.groundColor.setHex(rt.ground);
    dirLight.color.setHex(rt.dir);
    dirLight.intensity = 1.85;

    // 1. Outer Void / Lava / Abyssal Backdrop Plane (8000x8000 at y = -6)
    const outTex = ASSETS.textures[rt.outerTex] || null;
    if (outTex) outTex.repeat.set(70, 70);
    const outerBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(8000, 8000, 16, 16),
      new THREE.MeshStandardMaterial({ map: outTex, color: rt.outerCol, emissive: rt.outerEm, emissiveIntensity: 0.55, roughness: 0.8 })
    );
    outerBackdrop.rotation.x = -Math.PI / 2;
    outerBackdrop.position.y = -6;
    envGroup.add(outerBackdrop);

    // 2. Inner Circular Crucible Platform (CylinderGeometry at y = -4)
    const flTex = ASSETS.textures[rt.floorTex] || ASSETS.textures.brick_diff;
    const flBump = ASSETS.textures.brick_bump;
    if (flTex) flTex.repeat.set(16, 16);
    if (flBump) flBump.repeat.set(16, 16);
    const cruciblePlatform = new THREE.Mesh(
      new THREE.CylinderGeometry(RAID_R, RAID_R + 28, 8, 48),
      new THREE.MeshStandardMaterial({ map: flTex || null, bumpMap: flBump || null, bumpScale: 2.0, color: rt.floorCol, roughness: 0.56, metalness: 0.34 })
    );
    cruciblePlatform.position.y = -4;
    cruciblePlatform.receiveShadow = true;
    envGroup.add(cruciblePlatform);

    // 3. Ornate Boundary Rim Torus (rotated flat at y = 3)
    const rimTorus = new THREE.Mesh(
      new THREE.TorusGeometry(RAID_R, 10, 12, 64),
      new THREE.MeshStandardMaterial({ color: rt.rimCol, emissive: rt.rimEm, emissiveIntensity: 0.75, metalness: 0.82, roughness: 0.25 })
    );
    rimTorus.rotation.x = Math.PI / 2;
    rimTorus.position.y = 3;
    envGroup.add(rimTorus);

    // 4. Boss-Specific Crucible Architecture, Runes & Perimeter Monuments
    if (raidId === 'raid_searing_exarch') {
      for (const r of [160, 320, 480]) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(r - 5, r + 5, 48), new THREE.MeshBasicMaterial({ color: 0xff6b2b, side: THREE.DoubleSide, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; ring.position.y = 0.8; envGroup.add(ring);
      }
      const orbGeo = new THREE.SphereGeometry(12, 16, 16);
      const orbMat = new THREE.MeshStandardMaterial({ color: 0xff922b, emissive: 0xff4d29, emissiveIntensity: 1.6 });
      for (let i = 0; i < 12; i++) {
        const ang = (Math.PI * 2 * i) / 12, px = Math.cos(ang) * 545, pz = Math.sin(ang) * 545;
        placePropByHeight('pillar', px, pz, 110, -ang);
        const orb = new THREE.Mesh(orbGeo, orbMat); orb.position.set(px, 116, pz); envGroup.add(orb);
      }
    } else if (raidId === 'raid_eater_of_worlds') {
      for (const r of [150, 310, 470]) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(r - 4, r + 4, 48), new THREE.MeshBasicMaterial({ color: 0x3bc9db, side: THREE.DoubleSide, transparent: true, opacity: 0.58, blending: THREE.AdditiveBlending, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; ring.position.y = 0.8; envGroup.add(ring);
      }
      const spireGeo = new THREE.ConeGeometry(14, 115, 6);
      const spireMat = new THREE.MeshStandardMaterial({ color: 0x1098ad, emissive: 0x0c8599, emissiveIntensity: 1.1, metalness: 0.7, roughness: 0.25 });
      for (let i = 0; i < 12; i++) {
        const ang = (Math.PI * 2 * i) / 12, px = Math.cos(ang) * 545, pz = Math.sin(ang) * 545;
        placePropByHeight('column', px, pz, 88, -ang);
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.set(px * 0.98, 56, pz * 0.98); spire.lookAt(0, 130, 0); envGroup.add(spire);
      }
    } else if (raidId === 'raid_maven_crucible') {
      const starGeo = new THREE.OctahedronGeometry(11, 0);
      const starMat = new THREE.MeshStandardMaterial({ color: 0xf3d9fa, emissive: 0xda77f2, emissiveIntensity: 1.4 });
      for (let i = 0; i < 8; i++) {
        const ang = (Math.PI * 2 * i) / 8 + Math.PI / 8, px = Math.cos(ang) * 545, pz = Math.sin(ang) * 545;
        placePropByHeight('arch_gate', px, pz, 106, -ang + Math.PI / 2, 8);
        const star = new THREE.Mesh(starGeo, starMat); star.position.set(px, 118, pz); envGroup.add(star);
      }
      // 4 Permanent Color-Coded Memory Quadrant Pads etched into the floor
      const pads = [
        { x: 0, z: -220, col: 0x74c0fc }, // NORTH (Cyan/Ice)
        { x: 220, z: 0, col: 0xffd43b },  // EAST  (Gold/Solar)
        { x: 0, z: 220, col: 0x69db7c },  // SOUTH (Emerald/Life)
        { x: -220, z: 0, col: 0xda77f2 }  // WEST  (Violet/Void)
      ];
      const padDiscGeo = new THREE.CircleGeometry(125, 36);
      const padRingGeo = new THREE.RingGeometry(118, 126, 36);
      for (const p of pads) {
        const disc = new THREE.Mesh(padDiscGeo, new THREE.MeshBasicMaterial({ color: p.col, side: THREE.DoubleSide, transparent: true, opacity: 0.24, depthWrite: false }));
        disc.rotation.x = -Math.PI / 2; disc.position.set(p.x, 0.9, p.z);
        const ring = new THREE.Mesh(padRingGeo, new THREE.MeshBasicMaterial({ color: p.col, side: THREE.DoubleSide, transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, 1.2, p.z);
        envGroup.add(disc, ring);
      }
    } else {
      const barGeo = new THREE.PlaneGeometry(880, 18);
      const barMat = new THREE.MeshBasicMaterial({ color: 0xe03131, side: THREE.DoubleSide, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, depthWrite: false });
      for (let i = 0; i < 4; i++) {
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.rotation.x = -Math.PI / 2; bar.rotation.z = (Math.PI * i) / 4; bar.position.y = 0.8; envGroup.add(bar);
      }
      const centerCrossRing = new THREE.Mesh(new THREE.RingGeometry(115, 130, 40), new THREE.MeshBasicMaterial({ color: 0xffb833, side: THREE.DoubleSide, transparent: true, opacity: 0.65 }));
      centerCrossRing.rotation.x = -Math.PI / 2; centerCrossRing.position.y = 1.0; envGroup.add(centerCrossRing);

      const stormGeo = new THREE.SphereGeometry(18, 16, 16);
      const stormMat = new THREE.MeshBasicMaterial({ color: 0xe03131, transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending, depthWrite: false });
      for (let i = 0; i < 10; i++) {
        const ang = (Math.PI * 2 * i) / 10, px = Math.cos(ang) * 545, pz = Math.sin(ang) * 545;
        placePropByHeight('wall_arched', px, pz, 98, -ang + Math.PI / 2);
        const orb = new THREE.Mesh(stormGeo, stormMat); orb.position.set(px * 0.93, 82, pz * 0.93); envGroup.add(orb);
      }
    }
  }

  function rebuildBiomeEnvironment(mode, mapId, mapSeed = 1) {
    if (!ASSETS.ready) return;
    const isOriathTown = mode === 'HIDEOUT' && worldState && worldState.roomCode === 'ORIATH';
    const isRaid = !!(worldState && worldState.isRaid);
    const raidId = (worldState && worldState.raidId) || '';
    const envKey = mode === 'HIDEOUT' ? (isOriathTown ? 'HIDEOUT_TOWN' : 'HIDEOUT') : `${mode}_${mapId}_${mapSeed}_${isRaid}:${raidId}`;
    if (envKey === currentEnvKey) return;
    currentEnvKey = envKey;

    while (envGroup.children.length > 0) envGroup.remove(envGroup.children[0]);
    mapDevicePortalGroup = null;
    extractionPortalMesh = null;

    if (mode === 'RUN' && isRaid) {
      buildPinnacleRaidCrucible(raidId);
      return;
    }

    if (mode === 'HIDEOUT') {
      scene.background = new THREE.Color(isOriathTown ? 0x0c111a : 0x09080c);
      scene.fog = new THREE.FogExp2(isOriathTown ? 0x0c111a : 0x09080c, 0.00055);
      hemiLight.color.setHex(isOriathTown ? 0xe3f2fd : 0xd8e2ff);
      hemiLight.groundColor.setHex(0x211914);
      dirLight.color.setHex(isOriathTown ? 0xfff3bf : 0xffdf9e);
      dirLight.intensity = 1.6;

      const bound = 550;
      const diffTex = isOriathTown ? (ASSETS.textures.marble_diff || ASSETS.textures.brick_diff) : ASSETS.textures.brick_diff;
      const bumpTex = ASSETS.textures.brick_bump, roughTex = ASSETS.textures.brick_rough;
      if (diffTex) diffTex.repeat.set(18, 18);
      if (bumpTex) bumpTex.repeat.set(18, 18);
      if (roughTex) roughTex.repeat.set(18, 18);

      const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(bound * 2, bound * 2, 32, 32), new THREE.MeshStandardMaterial({
        map: diffTex || null, bumpMap: bumpTex || null, bumpScale: 2.5, roughnessMap: roughTex || null,
        color: isOriathTown ? 0x6e685f : 0x5a5046, roughness: 0.72, metalness: 0.1
      }));
      floorMesh.rotation.x = -Math.PI / 2; floorMesh.receiveShadow = true; envGroup.add(floorMesh);

      const daisPlinth = new THREE.Mesh(new THREE.CylinderGeometry(58, 66, 6, 8), new THREE.MeshStandardMaterial({
        map: diffTex || null, bumpMap: bumpTex || null, bumpScale: 1.8, color: 0x2b241d, metalness: 0.35, roughness: 0.65
      }));
      daisPlinth.position.set(0, 3, 0); daisPlinth.receiveShadow = true; daisPlinth.castShadow = true; envGroup.add(daisPlinth);

      const brassTrim = new THREE.Mesh(new THREE.CylinderGeometry(60, 62, 2, 8), new THREE.MeshStandardMaterial({
        color: isOriathTown ? 0x74c0fc : 0xb89448, metalness: 0.85, roughness: 0.28
      }));
      brassTrim.position.set(0, 5.2, 0); envGroup.add(brassTrim);

      placePropByHeight('floor_grate', 0, 0, 14, 0, 4);
      placePropByHeight('shrine', 0, 0, 28, 0, 5);

      const runeVortex = new THREE.Mesh(new THREE.CircleGeometry(42, 32), new THREE.MeshBasicMaterial({
        map: ASSETS.textures.disc || ASSETS.textures.spark || null, color: isOriathTown ? 0x4dabf7 : 0xffb833,
        transparent: true, opacity: 0.68, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      }));
      runeVortex.rotation.x = -Math.PI / 2; runeVortex.position.set(0, 6.3, 0); envGroup.add(runeVortex);

      mapDevicePortalGroup = new THREE.Group();
      envGroup.add(mapDevicePortalGroup);

      const portalFrameGeo = new THREE.TorusGeometry(15, 1.4, 12, 32);
      const portalFrameMat = new THREE.MeshStandardMaterial({ color: 0xc8a458, emissive: 0x6e4711, emissiveIntensity: 0.55, metalness: 0.88, roughness: 0.22 });
      const portalCoreGeo = new THREE.CircleGeometry(14, 28);
      const portalCoreMat = new THREE.MeshBasicMaterial({
        map: ASSETS.textures.disc || null, color: 0x3bc9db, transparent: true, opacity: 0.78,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      });

      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI * 2 * i) / 6, px = Math.cos(ang) * 82, pz = Math.sin(ang) * 82;
        placePropByHeight('pillar', px * 1.07, pz * 1.07, 56, -ang + Math.PI / 2, 0);
        if (isOriathTown) { placePropByHeight('banner', px * 1.12, pz * 1.12, 48, -ang + Math.PI / 2, 8); continue; }
        const pHolder = new THREE.Group();
        pHolder.position.set(px, 23, pz); pHolder.lookAt(0, 23, 0);
        const arch = new THREE.Mesh(portalFrameGeo, portalFrameMat); arch.scale.set(0.72, 1.38, 1);
        const core = new THREE.Mesh(portalCoreGeo, portalCoreMat); core.scale.set(0.72, 1.38, 1);
        pHolder.add(arch, core);
        if (ASSETS.textures.spark) {
          const sp = new THREE.Sprite(new THREE.SpriteMaterial({
            map: ASSETS.textures.spark, color: 0xffd43b, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false
          }));
          sp.scale.set(28, 38, 1); pHolder.add(sp);
        }
        mapDevicePortalGroup.add(pHolder);
      }

      const mapDeviceLight = new THREE.PointLight(0xffb833, 2.6, 260);
      mapDeviceLight.position.set(0, 44, 0); envGroup.add(mapDeviceLight);

      for (let i = 0; i < 8; i++) {
        const ang = (Math.PI * 2 * i) / 8 + Math.PI / 8, px = Math.cos(ang) * 340, pz = Math.sin(ang) * 340;
        placePropByHeight('pillar', px, pz, 88, -ang);
        placePropByHeight('torch', px * 0.92, pz * 0.92, 22, -ang, 32);
        if (i % 2 === 0) {
          const tLight = new THREE.PointLight(0xff8833, 1.4, 240);
          tLight.position.set(px * 0.88, 46, pz * 0.88); envGroup.add(tLight);
        }
      }

      placePropByHeight('chest_gold', -140, -90, 24, 0.5);
      placePropByHeight('shrine', -180, -110, 42, 0.4);
      placePropByHeight('chest_gold', 140, -90, 24, -0.5);
      placePropByHeight('barrel', 180, -110, 34, -0.3);
      placePropByHeight('floor_grate', 0, -250, 10, 0, -3);
      placePropByHeight('wall_arched', -95, -410, 92, 0);
      placePropByHeight('wall_arched', 0, -410, 92, 0);
      placePropByHeight('wall_arched', 95, -410, 92, 0);
      placePropByHeight('banner', -65, -395, 58, 0, 12);
      placePropByHeight('banner', 65, -395, 58, 0, 12);
      return;
    }

    // MASSIVE 6000x6000 WRAECLAST RUN ARENA (ARENA_HALF = 3000)
    const bound = 3000;
    const biomeThemes = {
      strand:            { bg: 0x0a131c, hemi: 0xa5d8ff, ground: 0x1b2631, dir: 0xd0ebff, floor: 0x6c7a89, tex: 'strand_diff', ringColor: 0x3bc9db },
      submerged_cavern:  { bg: 0x071422, hemi: 0x74c0fc, ground: 0x102233, dir: 0xa5d8ff, floor: 0x4b657d, tex: 'strand_diff', ringColor: 0x4dabf7 },
      glacier_summit:    { bg: 0x0b1826, hemi: 0xc5f6fa, ground: 0x182b3b, dir: 0xe3fafc, floor: 0x86a6ba, tex: 'marble_diff', ringColor: 0x66d9e8 },
      fetid_pool:        { bg: 0x09160e, hemi: 0x8ce99a, ground: 0x132619, dir: 0xb2f2bb, floor: 0x496b52, tex: 'strand_diff', ringColor: 0x51cf66 },
      toxic_sewer:       { bg: 0x0b1709, hemi: 0x94d82d, ground: 0x162411, dir: 0xc0eb75, floor: 0x526b3d, tex: 'brick_diff',  ringColor: 0x82c91e },
      imperial_gardens:  { bg: 0x0c1a12, hemi: 0x96f2d7, ground: 0x172b1f, dir: 0xc3fae8, floor: 0x567863, tex: 'marble_diff', ringColor: 0x38d9a9 },
      vaal_pyramid:      { bg: 0x181008, hemi: 0xffec99, ground: 0x2b1d0e, dir: 0xffd43b, floor: 0x7d623b, tex: 'brick_diff',  ringColor: 0xfcc419 },
      sarn_ruins:        { bg: 0x1a120a, hemi: 0xffd8a8, ground: 0x2e2012, dir: 0xffec99, floor: 0x856a47, tex: 'brick_diff',  ringColor: 0xffa94d },
      crimson_temple:    { bg: 0x17080c, hemi: 0xffa8a8, ground: 0x2b0f14, dir: 0xff8787, floor: 0x8a4b52, tex: 'brick_diff',  ringColor: 0xff6b6b },
      blood_aqueduct:    { bg: 0x1a090d, hemi: 0xff8787, ground: 0x2e1116, dir: 0xffa8a8, floor: 0x823d45, tex: 'brick_diff',  ringColor: 0xfa5252 },
      caldera_of_ash:    { bg: 0x1c0b06, hemi: 0xff922b, ground: 0x331409, dir: 0xffb86c, floor: 0x8c4a2b, tex: 'lava_diff',   ringColor: 0xff6b2b },
      alluring_abyss:    { bg: 0x1c0712, hemi: 0xf783ac, ground: 0x2e0c1d, dir: 0xffa8c5, floor: 0x7d3554, tex: 'marble_diff', ringColor: 0xe64980 },
      defiled_cathedral: { bg: 0x0d1021, hemi: 0xbac8ff, ground: 0x191d36, dir: 0xdbe4ff, floor: 0x5c6482, tex: 'marble_diff', ringColor: 0x748ffc },
      lunaris_temple:    { bg: 0x0b1224, hemi: 0x91a7ff, ground: 0x141f3b, dir: 0xbac8ff, floor: 0x4f5f8a, tex: 'marble_diff', ringColor: 0x5c7cfa },
      synthete_cortex:   { bg: 0x091326, hemi: 0x66d9e8, ground: 0x122240, dir: 0x99e9f2, floor: 0x49688f, tex: 'marble_diff', ringColor: 0x22b8cf },
      shaper_realm:      { bg: 0x110821, hemi: 0xd0bfff, ground: 0x24123b, dir: 0xffe066, floor: 0x845ef7, tex: 'lava_diff',   ringColor: 0xcc5de8 }
    };
    const mapObj = (GameData.ATLAS_MAPS || []).find(m => m.id === mapId);
    const th = biomeThemes[mapId] || (mapObj && biomeThemes[mapObj.biome]) || biomeThemes.shaper_realm;
    scene.background = new THREE.Color(th.bg);
    scene.fog = new THREE.FogExp2(th.bg, 0.00055);
    hemiLight.color.setHex(th.hemi);
    hemiLight.groundColor.setHex(th.ground);
    dirLight.color.setHex(th.dir);
    dirLight.intensity = 1.6;

    const tex = ASSETS.textures[th.tex] || ASSETS.textures.brick_diff, bump = ASSETS.textures.brick_bump;
    if (tex) tex.repeat.set(60, 60);
    if (bump) bump.repeat.set(60, 60);
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(bound * 2, bound * 2, 48, 48), new THREE.MeshStandardMaterial({
      map: tex || null, bumpMap: bump || null, bumpScale: 2.6, color: th.floor, roughness: 0.72, metalness: 0.14
    }));
    floorMesh.rotation.x = -Math.PI / 2; floorMesh.receiveShadow = true; envGroup.add(floorMesh);

    const sanctumRing = new THREE.Mesh(new THREE.RingGeometry(188, 202, 48), new THREE.MeshBasicMaterial({ color: th.ringColor, side: THREE.DoubleSide, transparent: true, opacity: 0.42 }));
    sanctumRing.rotation.x = -Math.PI / 2; sanctumRing.position.y = 1.2; envGroup.add(sanctumRing);

    for (let i = -bound; i <= bound; i += 300) {
      placePropByHeight('pillar', i, -bound, 98, 0);
      placePropByHeight('pillar', i, bound, 98, Math.PI);
      placePropByHeight('pillar', -bound, i, 98, Math.PI / 2);
      placePropByHeight('pillar', bound, i, 98, -Math.PI / 2);
    }

    const rng = seededRand(mapSeed + (mapId ? mapId.charCodeAt(0) * 137 : 17));
    const biomePropPools = {
      strand:            [['tree_dead', 115], ['column', 64], ['rubble', 38], ['pillar', 84], ['torch', 24]],
      fetid_pool:        [['tree_dead', 120], ['post_skull', 66], ['crypt', 110], ['rubble', 36], ['torch', 24]],
      vaal_pyramid:      [['arch_gate', 108], ['column', 74], ['pillar', 90], ['torch', 26], ['rubble', 36]],
      crimson_temple:    [['arch_gate', 104], ['pillar', 92], ['banner', 62], ['column', 70], ['torch', 26]],
      defiled_cathedral: [['wall_arched', 98], ['pillar', 88], ['crypt', 118], ['banner', 60], ['torch', 25]],
      shaper_realm:      [['crypt', 124], ['arch_gate', 106], ['post_skull', 82], ['pillar', 94], ['banner', 62]]
    };
    const pool = biomePropPools[mapId] || biomePropPools.shaper_realm;
    const clusterCount = 18 + Math.floor(rng() * 7);
    for (let c = 0; c < clusterCount; c++) {
      const ang = rng() * Math.PI * 2, rad = 220 + rng() * 1030;
      const [mainKey, mainH] = pool[Math.floor(rng() * pool.length)];
      placePropByHeight(mainKey, Math.cos(ang) * rad, Math.sin(ang) * rad, mainH * (0.88 + rng() * 0.26), rng() * Math.PI * 2);
      if (rng() < 0.72) {
        const satAng = ang + (rng() - 0.5) * 0.45, satR = Math.max(195, rad + (rng() - 0.5) * 90);
        const [satKey, satH] = pool[Math.floor(rng() * pool.length)];
        placePropByHeight(satKey, Math.cos(satAng) * satR, Math.sin(satAng) * satR, satH * 0.85, rng() * Math.PI * 2);
      }
    }
    for (let k = 0; k < 28; k++) {
      const ang = rng() * Math.PI * 2, rad = 1280 + rng() * 1250, [pKey, pH] = pool[k % pool.length];
      placePropByHeight(pKey, Math.cos(ang) * rad, Math.sin(ang) * rad, pH * (0.9 + rng() * 0.25), rng() * Math.PI * 2);
    }
  }

  Object.assign(window.__POS_CTX__, { placePropByHeight, buildPinnacleRaidCrucible, rebuildBiomeEnvironment });
  }
})();
