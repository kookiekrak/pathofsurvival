// Server World Module: Atlas Map Launch & Sanctuary Hideout Extraction/Gold Banking
const GameData = global.GameData || require('../../public/shared/gameData.js');

function startAtlasRun(room, mapId) {
  const mapDef = GameData.ATLAS_MAPS.find(m => m.id === mapId) || GameData.ATLAS_MAPS[0];
  room.selectedMapId = mapDef.id;
  room.state = 'RUN';
  room.wave = 1;
  room.waveProgress = 0;
  room.runTimer = 0;
  room.runDuration = mapDef.durationSec;
  room.spawnAccumulator = 0;
  room.bossSpawned = false;
  room.lastBossWave = 0;
  room.portalsOpen = false;
  room.enemies.clear();
  room.projectiles = [];
  room.groundDrops = [];
  room.hazards = [];
  room.activeBreaches = [];
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

  addRoomChat(room, 'Atlas', `Opened portals to ${mapDef.name}! Spend Run Gold on Golden Chests [E] & Draft Rerolls — unspent earned Gold banks to your Hideout Stash!`, '#ffd147');
  broadcastRoomEvent(room, {
    type: 'announcement',
    title: mapDef.name,
    subtitle: `Wave 1 Started! Earn Run Gold for Golden Chests & Rerolls — Extract to Bank Gold to Stash!`,
    color: '#ffd147'
  });
}

function returnToHideout(room, reasonTitle, reasonSub) {
  const wasPartyWipe = room.players.size > 0 && Array.from(room.players.values()).every(p => p.dead);
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
  room.fxEvents = [];

  let totalBankedRoom = 0;
  for (const p of room.players.values()) {
    // Bank earned unspent Run Gold into persistent Stash Gold (100% on Extraction, 50% on Party Wipe!)
    const bankable = Math.max(0, Math.min(p.earnedRunGold || 0, p.runGold || 0));
    const bankedGold = wasPartyWipe ? Math.round(bankable * 0.5) : bankable;
    if (bankedGold > 0) {
      p.gold = (p.gold || 0) + bankedGold;
      totalBankedRoom = Math.max(totalBankedRoom, bankedGold);
      addRoomChat(
        room,
        'Stash',
        `${p.name} banked +${bankedGold} Run Gold into Stash Gold (${wasPartyWipe ? '50% Death Salvage' : '100% Extracted'})!`,
        '#ffd43b'
      );
    }
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

  const goldSuffix = totalBankedRoom > 0 ? ` (+${totalBankedRoom}G Banked to Stash!)` : '';
  broadcastRoomEvent(room, {
    type: 'announcement',
    title: (reasonTitle || 'Returned to Sanctuary Hideout') + goldSuffix,
    subtitle: reasonSub || 'Spend Stash Gold at the Black Market [I], craft Gear with Orbs, and allocate Skill Tree Points [P]!',
    color: '#63a4ff'
  });
}

const exportsObj = { startAtlasRun, returnToHideout };
Object.assign(global, exportsObj);
module.exports = exportsObj;
