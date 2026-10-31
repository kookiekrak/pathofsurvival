// Path of Survival 3D — Modular Client Entrypoint & Shared Context Loader
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

const canvas = document.getElementById("gameCanvas");
const overlayCanvas = document.getElementById("hudOverlayCanvas");
const minimapCanvas = document.getElementById("minimapCanvas");
const treeCanvas = document.getElementById("passiveTreeCanvas");

window.__POS_CTX__ = {
  THREE,
  GLTFLoader,
  SkeletonUtils,
  GameData: window.GameData,
  canvas,
  overlayCanvas,
  overlayCtx: overlayCanvas.getContext("2d"),
  minimapCanvas,
  minimapCtx: minimapCanvas.getContext("2d"),
  treeCanvas,
  treeCtx: treeCanvas.getContext("2d"),
  ws: null,
  myPlayerId: null,
  myProfile: null,
  worldState: {
    roomCode: "ORIATH",
    roomName: "Sanctuary Hideout",
    mode: "HIDEOUT",
    mapId: "strand",
    wave: 1,
    maxWaves: 10,
    waveProgress: 0,
    runTimer: 0,
    runDuration: 240,
    portalsOpen: false,
    players: [],
    enemies: [],
    projectiles: [],
    hazards: [],
    interactables: [],
    upgradeChests: [],
    drops: []
  },
  selectedClassId: "Marauder",
  selectedMapId: "strand",
  activeCurrencyId: null,
  selectedReserveSupIdx: null,
  keys: { up: false, down: false, left: false, right: false },
  mouseDownLeft: false,
  mouseClientX: window.innerWidth / 2,
  mouseClientY: window.innerHeight / 2,
  mouseNdc: new THREE.Vector2(0, 0),
  mouseWorldPoint: new THREE.Vector3(0, 0, -100),
  camZoom: 1.0,
  camTargetX: 0,
  camTargetZ: 80,
  dropHitBoxes: [],
  interactableHitBoxes: [],
  upgradeChestHitBoxes: [],
  hoveredGroundDrop: null,
  currentEnvKey: "",
  mapDevicePortalGroup: null,
  extractionPortalMesh: null,
  myAccountId: "global",
  selectedCharacterId: null,
  savedCharactersCache: [],
  charFlowMode: "select"
};

const CLIENT_MODULES = [
  "/js/sceneAndEnv3D.js",
  "/js/entities3D.js",
  "/js/svgAndLobby.js",
  "/js/hudAndInventory.js",
  "/js/passiveTreeAndMap.js",
  "/js/inputAndRenderLoop.js"
];

function loadScriptSequential(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

(async () => {
  for (const modUrl of CLIENT_MODULES) {
    await loadScriptSequential(modUrl);
  }
  const ctx = window.__POS_CTX__;
  ctx.initLoginScreen();
  setInterval(() => {
    const lobbyEl = document.getElementById("lobbyModal");
    if (lobbyEl && !lobbyEl.classList.contains("hidden")) {
      ctx.fetchActiveRooms();
    }
  }, 3000);
  ctx.loadAll3DAssets();
  requestAnimationFrame(ctx.renderLoop);
})();
