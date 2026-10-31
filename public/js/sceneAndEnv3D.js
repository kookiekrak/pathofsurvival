// Client Module: Three.js WebGL Scene, Camera, Lighting, Asset Preloader & 3D Biome Builder
(function () {
  with (window.__POS_CTX__) {
  // =========================================================================
  // THREE.JS 3D SCENE, RENDERER, CAMERA & LIGHTING (PROPER ARPG PROPORTIONS)
  // =========================================================================
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x09080d);
  scene.fog = new THREE.FogExp2(0x09080d, 0.00065);

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 10, 5000);
  camera.position.set(0, 235, 310);
  camera.lookAt(0, 14, 0);

  const raycaster = new THREE.Raycaster();
  const groundPlaneMath = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // Lights
  const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x221c2b, 0.85);
  hemiLight.position.set(0, 600, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffe6b8, 1.7);
  dirLight.position.set(180, 420, 220);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  const dCam = 460;
  dirLight.shadow.camera.left = -dCam;
  dirLight.shadow.camera.right = dCam;
  dirLight.shadow.camera.top = dCam;
  dirLight.shadow.camera.bottom = -dCam;
  dirLight.shadow.camera.near = 60;
  dirLight.shadow.camera.far = 1300;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);
  scene.add(dirLight.target);

  const playerLight = new THREE.PointLight(0xffaa55, 2.4, 320, 1.4);
  playerLight.position.set(0, 52, 0);
  scene.add(playerLight);

  // Scene Groups
  const envGroup = new THREE.Group();
  const interactablesGroup = new THREE.Group();
  const hazardsGroup = new THREE.Group();
  const playersGroup = new THREE.Group();
  const enemiesGroup = new THREE.Group();
  const projectilesGroup = new THREE.Group();
  const dropsGroup = new THREE.Group();
  const fxGroup = new THREE.Group();
  scene.add(
    envGroup,
    interactablesGroup,
    hazardsGroup,
    playersGroup,
    enemiesGroup,
    projectilesGroup,
    dropsGroup,
    fxGroup
  );

  // =========================================================================
  // 3D ASSET PRELOADER WITH PROPORTIONAL SCALE NORMALIZATION
  // =========================================================================
  const ASSETS = {
    models: {},
    textures: {},
    ready: false
  };

  const gltfLoader = new GLTFLoader();
  const texLoader = new THREE.TextureLoader();

  const MODEL_MANIFEST = [
    ['Marauder', '/assets/models/Barbarian.glb'],
    ['Ranger', '/assets/models/Rogue_Hooded.glb'],
    ['Witch', '/assets/models/Mage.glb'],
    ['Knight', '/assets/models/Knight.glb'],
    ['Skeleton_Warrior', '/assets/models/Skeleton_Warrior.glb'],
    ['Skeleton_Rogue', '/assets/models/Skeleton_Rogue.glb'],
    ['Skeleton_Mage', '/assets/models/Skeleton_Mage.glb'],
    ['Skeleton_Minion', '/assets/models/Skeleton_Minion.glb'],
    ['wep_blade', '/assets/models/Skeleton_Blade.gltf'],
    ['wep_axe', '/assets/models/Skeleton_Axe.gltf'],
    ['wep_staff', '/assets/models/Skeleton_Staff.gltf'],
    ['wep_shield', '/assets/models/Skeleton_Shield_Large_A.gltf'],
    ['pillar', '/assets/models/pillar_decorated.glb'],
    ['column', '/assets/models/column.glb'],
    ['torch', '/assets/models/torch_lit.glb'],
    ['chest_gold', '/assets/models/chest_gold.glb'],
    ['barrel', '/assets/models/barrel_large.glb'],
    ['banner', '/assets/models/banner_red.glb'],
    ['floor_grate', '/assets/models/floor_grate.glb'],
    ['rubble', '/assets/models/rubble_large.glb'],
    ['wall_arched', '/assets/models/wall_arched.glb'],
    ['arch_gate', '/assets/models/arch_gate.gltf'],
    ['shrine', '/assets/models/shrine_candles.gltf'],
    ['tree_dead', '/assets/models/tree_dead_large.gltf'],
    ['crypt', '/assets/models/crypt.gltf'],
    ['post_skull', '/assets/models/post_skull.gltf']
  ];

  const TEXTURE_MANIFEST = [
    ['marble_diff', '/assets/textures/floor_marble_diffuse.jpg'],
    ['marble_norm', '/assets/textures/floor_marble_normal.jpg'],
    ['brick_diff', '/assets/textures/brick_diffuse.jpg'],
    ['brick_bump', '/assets/textures/brick_bump.jpg'],
    ['brick_rough', '/assets/textures/brick_roughness.jpg'],
    ['strand_diff', '/assets/textures/terrain_strand.jpg'],
    ['lava_diff', '/assets/textures/lava_tile.jpg'],
    ['spark', '/assets/textures/spark1.png'],
    ['disc', '/assets/textures/disc.png']
  ];

  async function loadAll3DAssets() {
    const total = MODEL_MANIFEST.length + TEXTURE_MANIFEST.length;
    let loaded = 0;
    const fillEl = document.getElementById('assetLoadingFill');
    const textEl = document.getElementById('assetLoadingText');

    const bumpProgress = (label) => {
      loaded++;
      const pct = Math.min(100, Math.round((loaded / total) * 100));
      if (fillEl) fillEl.style.width = `${pct}%`;
      if (textEl) textEl.textContent = `Loading 3D Assets (${pct}%): ${label}`;
    };

    const texPromises = TEXTURE_MANIFEST.map(([key, url]) =>
      new Promise((resolve) => {
        texLoader.load(
          url,
          (tex) => {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.colorSpace = THREE.SRGBColorSpace;
            ASSETS.textures[key] = tex;
            bumpProgress(key);
            resolve();
          },
          undefined,
          () => {
            bumpProgress(key);
            resolve();
          }
        );
      })
    );

    const modelPromises = MODEL_MANIFEST.map(([key, url]) =>
      new Promise((resolve) => {
        gltfLoader.load(
          url,
          (gltf) => {
            const isEnemyOrWep = key.startsWith('Skeleton_') || key.startsWith('wep_');
            gltf.scene.traverse((obj) => {
              if (obj.isMesh) {
                obj.castShadow = !isEnemyOrWep;
                obj.receiveShadow = !isEnemyOrWep;
              }
            });
            // Measure visual bounding box so we can scale every prop & character accurately!
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const size = new THREE.Vector3();
            box.getSize(size);
            gltf.userData = {
              naturalHeight: Math.max(0.5, size.y),
              minY: box.min.y
            };
            ASSETS.models[key] = gltf;
            bumpProgress(key);
            resolve();
          },
          undefined,
          () => {
            bumpProgress(key);
            resolve();
          }
        );
      })
    );

    await Promise.all([...texPromises, ...modelPromises]);
    ASSETS.ready = true;
    if (textEl) {
      textEl.textContent = 'All 3D Characters, Monsters, Shrines & Biomes Ready!';
      textEl.style.color = '#69db7c';
    }
    rebuildBiomeEnvironment(worldState.mode, worldState.mapId);
  }

  // =========================================================================
  // 3D ENVIRONMENT BUILDER (HIDEOUT & MASSIVE 6000x6000 WRAECLAST MAPS)
  // =========================================================================
  currentEnvKey = '';
  mapDevicePortalGroup = null;
  extractionPortalMesh = null;

  // Place a static 3D prop normalized to an exact target height in world units!
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

  function rebuildBiomeEnvironment(mode, mapId) {
    if (!ASSETS.ready) return;
    const key = `${mode}_${mapId}`;
    if (key === currentEnvKey) return;
    currentEnvKey = key;

    while (envGroup.children.length > 0) {
      envGroup.remove(envGroup.children[0]);
    }
    mapDevicePortalGroup = null;
    extractionPortalMesh = null;

    if (mode === 'HIDEOUT') {
      scene.background = new THREE.Color(0x09080c);
      scene.fog = new THREE.FogExp2(0x09080c, 0.0006);
      hemiLight.color.setHex(0xd8e2ff);
      hemiLight.groundColor.setHex(0x211914);
      dirLight.color.setHex(0xffdf9e);
      dirLight.intensity = 1.55;

      const bound = 550;
      const floorGeo = new THREE.PlaneGeometry(bound * 2, bound * 2, 32, 32);
      const diffTex = ASSETS.textures.brick_diff;
      const bumpTex = ASSETS.textures.brick_bump;
      const roughTex = ASSETS.textures.brick_rough;
      if (diffTex) diffTex.repeat.set(18, 18);
      if (bumpTex) bumpTex.repeat.set(18, 18);
      if (roughTex) roughTex.repeat.set(18, 18);

      const floorMat = new THREE.MeshStandardMaterial({
        map: diffTex || null,
        bumpMap: bumpTex || null,
        bumpScale: 2.5,
        roughnessMap: roughTex || null,
        color: 0x5a5046,
        roughness: 0.78,
        metalness: 0.08
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.receiveShadow = true;
      envGroup.add(floorMesh);

      // Central 3D Architectural Templar Map Device at (0, 0, 0)
      const daisPlinth = new THREE.Mesh(
        new THREE.CylinderGeometry(58, 66, 6, 8),
        new THREE.MeshStandardMaterial({
          map: diffTex || null,
          bumpMap: bumpTex || null,
          bumpScale: 1.8,
          color: 0x2b241d,
          metalness: 0.35,
          roughness: 0.65
        })
      );
      daisPlinth.position.set(0, 3, 0);
      daisPlinth.receiveShadow = true;
      daisPlinth.castShadow = true;
      envGroup.add(daisPlinth);

      const brassTrim = new THREE.Mesh(
        new THREE.CylinderGeometry(60, 62, 2, 8),
        new THREE.MeshStandardMaterial({
          color: 0xb89448,
          metalness: 0.85,
          roughness: 0.28
        })
      );
      brassTrim.position.set(0, 5.2, 0);
      envGroup.add(brassTrim);

      placePropByHeight('floor_grate', 0, 0, 14, 0, 4);
      placePropByHeight('shrine', 0, 0, 28, 0, 5);

      const runeVortexMat = new THREE.MeshBasicMaterial({
        map: ASSETS.textures.disc || ASSETS.textures.spark || null,
        color: 0xffb833,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const runeVortex = new THREE.Mesh(new THREE.CircleGeometry(42, 32), runeVortexMat);
      runeVortex.rotation.x = -Math.PI / 2;
      runeVortex.position.set(0, 6.3, 0);
      envGroup.add(runeVortex);

      // 6 Perimeter Stone Monoliths & Swirling 3D Portals around the Map Device
      mapDevicePortalGroup = new THREE.Group();
      envGroup.add(mapDevicePortalGroup);

      const portalFrameGeo = new THREE.TorusGeometry(15, 1.4, 12, 32);
      const portalFrameMat = new THREE.MeshStandardMaterial({
        color: 0xc8a458,
        emissive: 0x6e4711,
        emissiveIntensity: 0.55,
        metalness: 0.88,
        roughness: 0.22
      });
      const portalCoreGeo = new THREE.CircleGeometry(14, 28);
      const portalCoreMat = new THREE.MeshBasicMaterial({
        map: ASSETS.textures.disc || null,
        color: 0x3bc9db,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI * 2 * i) / 6;
        const px = Math.cos(ang) * 82;
        const pz = Math.sin(ang) * 82;

        // Architectural 3D Stone Monolith framing each portal
        placePropByHeight('pillar', px * 1.07, pz * 1.07, 56, -ang + Math.PI / 2, 0);

        const pHolder = new THREE.Group();
        pHolder.position.set(px, 23, pz);
        pHolder.lookAt(0, 23, 0);

        const arch = new THREE.Mesh(portalFrameGeo, portalFrameMat);
        arch.scale.set(0.72, 1.38, 1);
        const core = new THREE.Mesh(portalCoreGeo, portalCoreMat);
        core.scale.set(0.72, 1.38, 1);
        pHolder.add(arch, core);

        if (ASSETS.textures.spark) {
          const spMat = new THREE.SpriteMaterial({
            map: ASSETS.textures.spark,
            color: 0xffd43b,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          });
          const sp = new THREE.Sprite(spMat);
          sp.scale.set(28, 38, 1);
          pHolder.add(sp);
        }

        mapDevicePortalGroup.add(pHolder);
      }

      const mapDeviceLight = new THREE.PointLight(0xffb833, 2.6, 260);
      mapDeviceLight.position.set(0, 44, 0);
      envGroup.add(mapDeviceLight);

      // 8 Gothic Pillars, Torches & Warm Sanctuary Point Lights
      for (let i = 0; i < 8; i++) {
        const ang = (Math.PI * 2 * i) / 8 + Math.PI / 8;
        const px = Math.cos(ang) * 340;
        const pz = Math.sin(ang) * 340;
        placePropByHeight('pillar', px, pz, 88, -ang);
        placePropByHeight('torch', px * 0.92, pz * 0.92, 22, -ang, 32);
        if (i % 2 === 0) {
          const tLight = new THREE.PointLight(0xff8833, 1.4, 240);
          tLight.position.set(px * 0.88, 46, pz * 0.88);
          envGroup.add(tLight);
        }
      }

      // Stash Chests, Shrines, Barrels & Banners
      placePropByHeight('chest_gold', -140, -90, 24, 0.5);
      placePropByHeight('shrine', -180, -110, 42, 0.4);
      placePropByHeight('chest_gold', 140, -90, 24, -0.5);
      placePropByHeight('barrel', 180, -110, 34, -0.3);

      // Northern Sanctum behind Target Dummy (0, -250)
      placePropByHeight('floor_grate', 0, -250, 10, 0, -3);
      placePropByHeight('wall_arched', -95, -410, 92, 0);
      placePropByHeight('wall_arched', 0, -410, 92, 0);
      placePropByHeight('wall_arched', 95, -410, 92, 0);
      placePropByHeight('banner', -65, -395, 58, 0, 12);
      placePropByHeight('banner', 65, -395, 58, 0, 12);
      return;
    }

    // =========================================================================
    // MASSIVE 6000x6000 WRAECLAST RUN ARENA (ARENA_HALF = 3000)
    // =========================================================================
    const bound = 3000;
    const floorGeo = new THREE.PlaneGeometry(bound * 2, bound * 2, 48, 48);
    let floorMat;

    if (mapId === 'strand') {
      scene.background = new THREE.Color(0x0a131c);
      scene.fog = new THREE.FogExp2(0x0a131c, 0.00055);
      hemiLight.color.setHex(0xa5d8ff);
      hemiLight.groundColor.setHex(0x1b2631);
      dirLight.color.setHex(0xd0ebff);
      dirLight.intensity = 1.55;

      const tex = ASSETS.textures.strand_diff;
      if (tex) tex.repeat.set(60, 60);
      floorMat = new THREE.MeshStandardMaterial({
        map: tex || null,
        color: 0x6c7a89,
        roughness: 0.88,
        metalness: 0.05
      });
    } else if (mapId === 'crimson_temple') {
      scene.background = new THREE.Color(0x17080c);
      scene.fog = new THREE.FogExp2(0x17080c, 0.0006);
      hemiLight.color.setHex(0xffa8a8);
      hemiLight.groundColor.setHex(0x2b0f14);
      dirLight.color.setHex(0xff8787);
      dirLight.intensity = 1.6;

      const diff = ASSETS.textures.brick_diff;
      const bump = ASSETS.textures.brick_bump;
      if (diff) diff.repeat.set(65, 65);
      if (bump) bump.repeat.set(65, 65);
      floorMat = new THREE.MeshStandardMaterial({
        map: diff || null,
        bumpMap: bump || null,
        bumpScale: 3,
        color: 0x8a4b52,
        roughness: 0.7,
        metalness: 0.15
      });
    } else {
      scene.background = new THREE.Color(0x110821);
      scene.fog = new THREE.FogExp2(0x110821, 0.0006);
      hemiLight.color.setHex(0xd0bfff);
      hemiLight.groundColor.setHex(0x24123b);
      dirLight.color.setHex(0xffe066);
      dirLight.intensity = 1.65;

      const tex = ASSETS.textures.lava_diff;
      if (tex) tex.repeat.set(55, 55);
      floorMat = new THREE.MeshStandardMaterial({
        map: tex || null,
        color: 0x845ef7,
        roughness: 0.5,
        metalness: 0.3
      });
    }

    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    envGroup.add(floorMesh);

    // Perimeter Pillars around the 6000x6000 boundary
    for (let i = -bound; i <= bound; i += 300) {
      placePropByHeight('pillar', i, -bound, 98, 0);
      placePropByHeight('pillar', i, bound, 98, Math.PI);
      placePropByHeight('pillar', -bound, i, 98, Math.PI / 2);
      placePropByHeight('pillar', bound, i, 98, -Math.PI / 2);
    }

    // Procedural Ruin & Forest Landmarks across the 6000x6000 world (seeded deterministically)
    const rings = [550, 1100, 1750, 2400];
    rings.forEach((radius, rIdx) => {
      const count = 8 + rIdx * 6;
      for (let k = 0; k < count; k++) {
        const ang = (Math.PI * 2 * k) / count + rIdx * 0.37;
        const rx = Math.cos(ang) * radius;
        const rz = Math.sin(ang) * radius;

        if (mapId === 'strand') {
          placePropByHeight(k % 2 === 0 ? 'tree_dead' : 'column', rx, rz, k % 2 === 0 ? 115 : 58, k * 1.3);
          if (k % 3 === 0) placePropByHeight('rubble', rx + 42, rz + 28, 36, k);
        } else if (mapId === 'crimson_temple') {
          placePropByHeight(k % 2 === 0 ? 'arch_gate' : 'pillar', rx, rz, k % 2 === 0 ? 102 : 90, k * 0.7);
          if (k % 3 === 0) placePropByHeight('banner', rx + 30, rz - 20, 62, k);
        } else {
          placePropByHeight(k % 3 === 0 ? 'crypt' : 'post_skull', rx, rz, k % 3 === 0 ? 128 : 68, k * 0.9);
        }
      }
    });
  }

    Object.assign(window.__POS_CTX__, { renderer, scene, camera, raycaster, groundPlaneMath, hemiLight, dirLight, dCam, playerLight, envGroup, interactablesGroup, hazardsGroup, playersGroup, enemiesGroup, projectilesGroup, dropsGroup, fxGroup, ASSETS, gltfLoader, texLoader, MODEL_MANIFEST, TEXTURE_MANIFEST, loadAll3DAssets, placePropByHeight, rebuildBiomeEnvironment });
  }
})();
