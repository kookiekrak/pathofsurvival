// Server World Module: Atlas Map Launch & Sanctuary Hideout Extraction/Gold Banking
const GameData = global.GameData || require('../../public/shared/gameData.js');

function startAtlasRun(room, mapId) {
  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === mapId) || GameData.ATLAS_MAPS[0];
  room.selectedMapId = mapDef.id;
  room.isRaidEncounter = false;
  room.raidId = null;
  room.state = 'RUN';
  room.wave = 1;
  room.waveProgress = 0;
  room.runTimer = 0;
  room.runDuration = mapDef.durationSec;
  room.spawnAccumulator = 0;
  room.bossSpawned = false;
  room.lastBossWave = 0;
  room.portalsOpen = false;
  room.deliriumTimer = 0;
  room.deliriumKills = 0;
  room.enemies.clear();
  room.projectiles = [];
  room.groundDrops = [];
  room.hazards = [];
  room.activeBreaches = [];
  room.raidBeams = [];
  room.raidSanctuary = null;
  room.fxEvents = [];
  populateMapInteractables(room);

  for (const p of room.players.values()) {
    p.ready = false;
    p.dead = false;
    p.reviveProgress = 0;
    p.hhStacks = 0;
    p.hhTimer = 0;
    p.shrineBuffTimer = 0;
    p.targetDropId = null;
    p.targetChestId = null;
    p.lohBudget = 6;
    p.vaalSouls = 0;
    p.vaalLockTimer = 0;
    for (const f of GameData.FLASKS) {
      p.flaskCharges[f.id] = (p.unlockedFlasks || ['life']).includes(f.id) ? f.maxCharges : 0;
      p.activeFlasks[f.id] = 0;
    }
    if (Array.isArray(p.flaskBelt)) {
      p.flaskSlotCharges = p.flaskBelt.map(fId => {
        const fDef = fId ? GameData.FLASKS.find(f => f.id === fId) : null;
        return fDef ? fDef.maxCharges : 0;
      });
      p.flaskSlotTimers = [0, 0, 0, 0, 0];
    }
    // Rogue-lite per-run reset of Run Level, Skills & Run Stat Upgrades!
    p.currentMapId = mapDef.id;
    resetPlayerRunSkills(p);
    recalcPlayer(p, true);
    // Reset In-Run Gold to Starting Run Gold from Rogue-lite Skill Tree (Stash Gold remains safely in Hideout!)
    const treeStartGold = (p.stats && p.stats.startingGold) || 25;
    p.startingRunGold = 25 + treeStartGold;
    p.runGold = p.startingRunGold;
    p.earnedRunGold = 0;
    p.nextChestCost = getNextChestCost(p, room);
    p.x = randInt(-40, 40);
    p.y = randInt(-40, 40);
    p.graceTimer = 1.2;
    p.hitGraceTimer = 0;
    p.afkAnchorX = p.x;
    p.afkAnchorY = p.y;
    p.afkTimer = 0;

    sendPrivateProfile(p);
  }

  // Spawn initial monster packs around the perimeter (scales with Map Tier so higher tiers pressure immediately!)
  const initialPacks = 1 + Math.floor(((mapDef.tier || 1) - 1) * 0.6);
  for (let i = 0; i < initialPacks; i++) {
    spawnMonsterPack(room);
  }

  addRoomChat(room, 'Atlas', `Opened portals to ${mapDef.name}! Spend Run Gold on Golden Chests [E] & Draft Rerolls!`, '#ffd147');
  broadcastRoomEvent(room, {
    type: 'announcement',
    title: mapDef.name,
    subtitle: `Wave 1 Started! Earn Run Gold for Golden Chests & Rerolls!`,
    color: '#ffd147'
  });
}

function returnToHideout(room, reasonTitle, reasonSub) {
  room.state = 'HIDEOUT';
  room.wave = 1;
  room.waveProgress = 0;
  room.enemies.clear();
  room.projectiles = [];
  room.groundDrops = [];
  room.hazards = [];
  room.interactables = [];
  room.upgradeChests = [];
  room.activeBreaches = [];
  room.raidBeams = [];
  room.raidSanctuary = null;
  room.fxEvents = [];

  for (const p of room.players.values()) {
    p.runGold = 0;
    p.startingRunGold = 0;
    p.earnedRunGold = 0;
    p.ready = false;
    p.dead = false;
    p.reviveProgress = 0;
    p.hhStacks = 0;
    p.hhTimer = 0;
    p.shrineBuffTimer = 0;
    p.targetDropId = null;
    p.targetChestId = null;
    for (const f of GameData.FLASKS) {
      p.flaskCharges[f.id] = (p.unlockedFlasks || ['life']).includes(f.id) ? f.maxCharges : 0;
      p.activeFlasks[f.id] = 0;
    }
    if (Array.isArray(p.flaskBelt)) {
      p.flaskSlotCharges = p.flaskBelt.map(fId => {
        const fDef = fId ? GameData.FLASKS.find(f => f.id === fId) : null;
        return fDef ? fDef.maxCharges : 0;
      });
      p.flaskSlotTimers = [0, 0, 0, 0, 0];
    }
    // Rogue-lite reset of in-run skills & stat boons on return to Hideout!
    resetPlayerRunSkills(p);
    recalcPlayer(p, true);
    p.x = randInt(-90, 90);
    p.y = randInt(50, 150);
    sendPrivateProfile(p);
  }

  broadcastRoomEvent(room, {
    type: 'announcement',
    title: reasonTitle || 'Returned to Sanctuary Hideout',
    subtitle: reasonSub || 'Craft Gear with Orbs [I], allocate Skill Tree Points [P], and prepare for your next Atlas Map!',
    color: '#63a4ff'
  });
}

const exportsObj = { startAtlasRun, returnToHideout };
Object.assign(global, exportsObj);
module.exports = exportsObj;
