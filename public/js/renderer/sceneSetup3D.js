// Client Module: Three.js WebGL Scene, Camera, Lighting & 3D Asset Preloader
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

  Object.assign(window.__POS_CTX__, {
    renderer, scene, camera, raycaster, groundPlaneMath,
    hemiLight, dirLight, dCam, playerLight,
    envGroup, interactablesGroup, hazardsGroup, playersGroup, enemiesGroup, projectilesGroup, dropsGroup, fxGroup,
    ASSETS, gltfLoader, texLoader, MODEL_MANIFEST, TEXTURE_MANIFEST, loadAll3DAssets
  });
  }
})();
