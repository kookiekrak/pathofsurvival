// Path of Survival — Modular Authoritative 3D Multiplayer Server Entrypoint
const GameData = require('./public/shared/gameData.js');
global.GameData = GameData;

// 1. Core Persistence & HTTP/WS Server
Object.assign(global, require('./server/core/db.js'));
const { PORT, httpServer } = Object.assign(global, require('./server/core/httpServer.js'));

// 2. Items, Affix Engine, Economy & Rogue-Lite Drafts
Object.assign(global, require('./server/items/affixEngine.js'));
Object.assign(global, require('./server/items/itemGenerator.js'));
Object.assign(global, require('./server/items/draftSystem.js'));
Object.assign(global, require('./server/items/craftingAndDraftApply.js'));

// 3. World State, Map Interactables, Atlas Portals & Monster/Loot Spawning
Object.assign(global, require('./server/world/playerState.js'));
Object.assign(global, require('./server/world/mapAndInteractables.js'));
Object.assign(global, require('./server/world/atlasAndPortals.js'));
Object.assign(global, require('./server/world/monsterAndLootSpawner.js'));

// 4. Combat Engine, Skill Execution, Enemy Kills & Player Defense
Object.assign(global, require('./server/combat/damageAndKills.js'));
Object.assign(global, require('./server/combat/enemyDeathHandler.js'));
Object.assign(global, require('./server/combat/skillExecution.js'));
Object.assign(global, require('./server/combat/playerDefense.js'));

// 5. Authoritative 25Hz Room Simulation Loop & Snapshot Broadcaster
Object.assign(global, require('./server/simulation/bossMavenAndSirusAI.js'));
Object.assign(global, require('./server/simulation/bossRaidEngine.js'));
Object.assign(global, require('./server/simulation/playerAndAutoCastTick.js'));
Object.assign(global, require('./server/simulation/roomWaveAndBossTick.js'));
Object.assign(global, require('./server/simulation/enemyAndProjectileTick.js'));
Object.assign(global, require('./server/simulation/snapshotBroadcaster.js'));

// 6. WebSocket Network Handlers
Object.assign(global, require('./server/net/wsInventoryAndProgression.js'));
Object.assign(global, require('./server/net/wsConnectionAndLobby.js'));

httpServer.listen(PORT, () => {
  console.log(`Path of Survival 3D server running on http://localhost:${PORT}`);
});

// Periodic 10s SQLite autosave & graceful SIGTERM/SIGINT flush so deploys never lose player progress
setInterval(() => {
  if (typeof global.flushAllCharactersToDb === 'function') global.flushAllCharactersToDb();
}, 10000);

function handleGracefulShutdown(sig) {
  console.log(`Received ${sig} — flushing all characters to SQLite before shutdown...`);
  if (typeof global.flushAllCharactersToDb === 'function') global.flushAllCharactersToDb();
  process.exit(0);
}
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
