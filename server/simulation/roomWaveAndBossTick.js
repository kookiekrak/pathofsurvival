// Server Simulation Module: Wave Progression, Boss Spawning, Hazards, Breach Rings & Endless Pack Spawning
const GameData = global.GameData || require('../../public/shared/gameData.js');

function updateRoomWavesAndInteractables(room, dt, allPlayers, alivePlayers) {
  const livingCount = Array.isArray(alivePlayers)
    ? alivePlayers.length
    : Array.from(room.players.values()).filter(p => !p.dead).length;

  // Hideout Target Dummy
  if (room.state === 'HIDEOUT') {
    if (room.enemies.size === 0) {
      room.enemies.set('hideout_dummy', {
        id: 'hideout_dummy',
        name: 'Oriath Automaton Dummy',
        typeId: 'skeleton',
        rarity: 'rare',
        mods: ['DPS Target Dummy'],
        x: 0,
        y: -250,
        hp: 500000,
        maxHp: 500000,
        speed: 0,
        radius: 24,
        damage: 0,
        xp: 0,
        color: '#e6b800',
        behavior: 'dummy',
        actionTimer: 99,
        hitTimer: 0,
        chillTimer: 0
      });
    } else {
      const dummy = room.enemies.get('hideout_dummy');
      if (dummy && dummy.hp < dummy.maxHp * 0.2) {
        dummy.hp = dummy.maxHp;
      }
    }
  }

  // Update Active Boss Raid Mechanics (Rotating Beams & Golden Sanctuary Safe Domes)
  if (typeof updateBossRaidMechanics === 'function') {
    updateBossRaidMechanics(room, dt, alivePlayers);
  }

  // Update Telegraphed Ground Hazards & Raid Soak Circles
  for (let i = room.hazards.length - 1; i >= 0; i--) {
    const haz = room.hazards[i];
    haz.fuse -= dt;
    if (haz.fuse <= 0) {
      if (haz.leapBossId) {
        const leapBoss = room.enemies.get(haz.leapBossId);
        if (leapBoss && leapBoss.hp > 0) {
          leapBoss.x = haz.x;
          leapBoss.y = haz.y;
        }
      }
      if (haz.kind === 'soak') {
        const soakers = [];
        for (const p of room.players.values()) {
          if (!p.dead && dist(p.x, p.y, haz.x, haz.y) <= haz.r + 18) soakers.push(p);
        }
        if (soakers.length > 0) {
          room.fxEvents.push({ kind: 'nova', x: haz.x, y: haz.y, r: haz.r, color: '#69db7c' });
          const splitDmg = Math.max(4, Math.round((haz.damage * 0.32) / soakers.length));
          for (const sp of soakers) {
            applyDamageToPlayer(room, sp, splitDmg, 'elemental', true);
            if ((sp.vaalLockTimer || 0) <= 0) {
              sp.vaalSouls = Math.min(60, (sp.vaalSouls || 0) + 12);
            }
          }
        } else {
          room.fxEvents.push({ kind: 'nova', x: haz.x, y: haz.y, r: 340, color: '#ff3b3b' });
          for (const p of room.players.values()) {
            if (!p.dead) {
              applyDamageToPlayer(room, p, haz.damage, 'elemental', true);
            }
          }
        }
      } else {
        room.fxEvents.push({
          kind: 'nova',
          x: haz.x,
          y: haz.y,
          r: haz.r,
          color: haz.color || '#ff4d4d'
        });
        for (const p of room.players.values()) {
          if (!p.dead && dist(p.x, p.y, haz.x, haz.y) <= haz.r + 14) {
            applyDamageToPlayer(room, p, haz.damage, 'elemental', true);
          }
        }
      }
      room.hazards.splice(i, 1);
    }
  }

  // Endless Wave Progression (Kill-Driven + Time-Driven) & Uncapped Infinite Pack Spawning
  if (room.state === 'RUN') {
    if (livingCount === 0 && room.players.size > 0) {
      returnToHideout(room, 'Party Slain', 'Your XP and collected Gear have been secured in your Hideout stash.');
      return false;
    }

    const activeMapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];
    const packDensityMult = activeMapDef ? (activeMapDef.packDensity || 1.0) : 1.0;

    room.runTimer += dt;
    room.waveProgress = Math.min(100, (room.waveProgress || 0) + 2.2 * dt);

    if (room.waveProgress >= 100 && !room.isRaidEncounter) {
      room.wave++;
      room.waveProgress = 0;
      // Spawn an immediate elite pack and a League Encounter on wave transition
      spawnMonsterPack(room);
      spawnMonster(room, false, null, 'rare');
      if (room.wave % 3 === 0) {
        spawnMonster(room, false, null, 'rare', 'gilded_goblin');
        addRoomChat(room, 'Perandus', '🪙 A Perandus Treasure Hoarder has appeared! Slay it before it escapes for a loot jackpot!', '#fcc419');
      }
      spawnWaveLeagueEncounter(room);

      broadcastRoomEvent(room, {
        type: 'announcement',
        title: `Wave ${room.wave} Unleashed!`,
        subtitle: 'Endless horde density and pack strength have increased!',
        color: '#ffa94d'
      });
    }

    // Active Delirium Mirror Fog Countdown & Reward Shower
    if ((room.deliriumTimer || 0) > 0) {
      room.deliriumTimer -= dt;
      if (room.deliriumTimer <= 0) {
        room.deliriumTimer = 0;
        const dKills = room.deliriumKills || 0;
        const anchor = pick(alivePlayers) || { x: 0, y: 0 };
        const rewardOrbs = Math.min(4, 1 + Math.floor(dKills / 12));
        for (let k = 0; k < rewardOrbs; k++) {
          spawnGroundDrop(room, anchor.x + randInt(-28, 28), anchor.y + randInt(-28, 28), 'currency');
        }
        if (dKills >= 15) {
          const dropIlvl = ((activeMapDef.tier || 1) - 1) * 3 + Math.ceil((room.wave || 1) / 2) + 2;
          spawnGroundDrop(room, anchor.x, anchor.y, 'gear', 'rare', dropIlvl);
        }
        addRoomChat(room, 'Delirium', `The Delirium Fog dissipated (${dKills} Delirious monsters slain — ${rewardOrbs} Orbs dropped)!`, '#adb5bd');
      }
    }

    // Spawn an Atlas Map Boss every 5 waves (Wave 5, 10, 15, 20...) or when initial timer elapses
    const shouldSpawnWaveBoss = (!room.isRaidEncounter && room.wave % 5 === 0 && room.waveProgress >= 40 && room.lastBossWave !== room.wave);
    const shouldSpawnTimerBoss = (!room.isRaidEncounter && room.runTimer >= room.runDuration && !room.bossSpawned);
    if (shouldSpawnWaveBoss || shouldSpawnTimerBoss) {
      room.bossSpawned = true;
      room.lastBossWave = room.wave;
      spawnMonster(room, true);
      if (room.mapModStats && room.mapModStats.twinned) {
        spawnMonster(room, true);
      }
      const mapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];
      broadcastRoomEvent(room, {
        type: 'announcement',
        title: `Map Boss: ${mapDef.bossName} (Wave ${room.wave})`,
        subtitle: 'Slay the Map Boss to open the Extraction Portal at (0, 0)!',
        color: '#ff4d4d'
      });
    }

    // Recycle straggler non-boss monsters that wandered > 720 units from all living players so packs never stall off-screen!
    const aliveList = Array.isArray(alivePlayers) && alivePlayers.length > 0
      ? alivePlayers
      : Array.from(room.players.values()).filter(p => !p.dead);
    let nearbyMonsters = 0;
    if (aliveList.length > 0) {
      for (const m of room.enemies.values()) {
        let minPlayerDist = Infinity;
        for (const pl of aliveList) {
          const d = dist(m.x, m.y, pl.x, pl.y);
          if (d < minPlayerDist) minPlayerDist = d;
        }
        if (minPlayerDist <= 480) {
          nearbyMonsters++;
        } else if (m.rarity !== 'boss' && minPlayerDist > 720) {
          const anchor = pick(aliveList);
          const ang = Math.random() * Math.PI * 2;
          const rDist = randInt(395, 505);
          m.x = Math.max(-ARENA_HALF + 70, Math.min(ARENA_HALF - 70, Math.round(anchor.x + Math.cos(ang) * rDist)));
          m.y = Math.max(-ARENA_HALF + 70, Math.min(ARENA_HALF - 70, Math.round(anchor.y + Math.sin(ang) * rDist)));
        }
      }
    }

    // Update Active Expanding Breach Rings (fast expansion to 240 maxRadius + monster surge along ring edge!)
    if (Array.isArray(room.activeBreaches) && room.activeBreaches.length > 0) {
      for (let bi = room.activeBreaches.length - 1; bi >= 0; bi--) {
        const b = room.activeBreaches[bi];
        b.elapsed = (b.elapsed || 0) + dt;
        b.duration -= dt;
        b.radius = Math.min(b.maxRadius || 240, b.radius + 95 * dt);
        b.spawnTimer = (b.spawnTimer || 0) - dt;

        if (b.spawnTimer <= 0 && b.duration > 0) {
          b.spawnTimer = 1.2;
          b.wavesSpawned = (b.wavesSpawned || 0) + 1;

          // Spawn 5 to 7 Breach monsters along the Breach Ring perimeter!
          const swarmerCount = randInt(5, 7);
          for (let k = 0; k < swarmerCount; k++) {
            const ang = (Math.PI * 2 * k) / swarmerCount + (Math.random() - 0.5) * 0.45 + b.wavesSpawned * 0.37;
            const ringDist = Math.round(b.radius * (0.86 + Math.random() * 0.14));
            const bx = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(b.x + Math.cos(ang) * ringDist)));
            const by = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(b.y + Math.sin(ang) * ringDist)));
            spawnMonster(room, false, { x: bx, y: by, exact: true }, 'normal', null, true);
          }

          // 1 Magic Breach Elite on every ring pulse
          const mAng = Math.random() * Math.PI * 2;
          const mDist = Math.round(b.radius * 0.94);
          const mx = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(b.x + Math.cos(mAng) * mDist)));
          const my = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(b.y + Math.sin(mAng) * mDist)));
          spawnMonster(room, false, { x: mx, y: my, exact: true }, 'magic', null, true);

          // Spawn a Rare Breach Lord every 3rd pulse along the ring edge
          if (b.wavesSpawned % 3 === 0) {
            const rAng = Math.random() * Math.PI * 2;
            const rx = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(b.x + Math.cos(rAng) * b.radius)));
            const ry = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(b.y + Math.sin(rAng) * b.radius)));
            spawnMonster(room, false, { x: rx, y: ry, exact: true }, 'rare', null, true);
          }
        }

        if (b.duration <= 0) {
          room.fxEvents.push({
            kind: 'nova',
            x: Math.round(b.x),
            y: Math.round(b.y),
            r: Math.round(b.radius * 0.65),
            color: '#cc5de8'
          });
          const dropIlvl = ((activeMapDef.tier || 1) - 1) * 3 + Math.ceil((room.wave || 1) / 2) + 2;
          spawnGroundDrop(room, b.x - 14, b.y, 'currency');
          spawnGroundDrop(room, b.x + 14, b.y, 'gear', Math.random() < 0.008 ? 'unique' : 'rare', dropIlvl);
          addRoomChat(room, 'Breach', `The Breach collapsed back into the Void (${b.kills || 0} Breach monsters slain)!`, '#cc5de8');
          room.activeBreaches.splice(bi, 1);
        }
      }
    }

    // Endless monster spawning scaled by Map Tier packDensity (supports up to 90 active enemies on screen)!
    const deliriumBoost = (room.deliriumTimer || 0) > 0 ? 1.35 : 1.0;
    const raidRate = room.isRaidEncounter ? 0.35 : 1.0;
    const maxCap = room.isRaidEncounter ? 18 : MAX_ACTIVE_ENEMIES;
    const lowDensityBoost = (!room.isRaidEncounter && nearbyMonsters < 8) ? 0.95 : 0;
    room.spawnAccumulator += dt * (0.55 + room.wave * 0.085 + (room.players.size - 1) * 0.16 + lowDensityBoost) * packDensityMult * deliriumBoost * raidRate;

    while (room.spawnAccumulator >= 1) {
      room.spawnAccumulator -= 1;
      if (room.enemies.size < maxCap) {
        spawnMonsterPack(room);
      }
    }
  }

  // Cap active projectiles at 110 and ground drops at 60 to prevent late-run entity explosion
  if (room.projectiles.length > 110) {
    room.projectiles.splice(0, room.projectiles.length - 110);
  }
  if (room.groundDrops.length > 60) {
    const cullIdx = room.groundDrops.findIndex(d => d.rarity !== 'unique' && d.dropType !== 'flask');
    room.groundDrops.splice(cullIdx >= 0 ? cullIdx : 0, 1);
  }

  return true;
}

const exportsObj = { updateRoomWavesAndInteractables };
Object.assign(global, exportsObj);
module.exports = exportsObj;
