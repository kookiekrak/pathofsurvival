// Path of Survival — Modular Authoritative 3D Multiplayer Server Entrypoint
const GameData = require('./public/shared/gameData.js');
global.GameData = GameData;

const { PORT, httpServer } = require('./server/dbAndHttp.js');
require('./server/itemsAndDrafts.js');
require('./server/worldAndSpawning.js');
require('./server/combatEngine.js');
require('./server/simulationLoop.js');
require('./server/wsHandlers.js');

httpServer.listen(PORT, () => {
  console.log(`Path of Survival 3D server running on http://localhost:${PORT}`);
});
