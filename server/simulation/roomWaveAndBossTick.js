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
    const mapTier = activeMapDef ? (activeMapDef.tier || 1) : 1;
    const tierDensity = activeMapDef ? (activeMapDef.packDensity || 1.0) : 1.0;
    const modPackMult = 1 + ((room.mapModStats && room.mapModStats.packSize) || 0) / 100;
    const aliveList = Array.isArray(alivePlayers) && alivePlayers.length > 0
      ? alivePlayers
      : Array.from(room.players.values()).filter(p => !p.dead);
    let bossAlive = Array.from(room.enemies.values()).some(e => e.rarity === 'boss');

    room.runTimer += dt;
    if (!room.isRaidEncounter && !bossAlive) {
      room.waveProgress = Math.min(100, (room.waveProgress || 0) + 0.65 * dt);
    }

    if (room.waveProgress >= 100 && !room.isRaidEncounter && !bossAlive) {
      room.wave++;
      room.waveProgress = 0;
      spawnMonsterPack(room);
      spawnMonster(room, false, null, 'rare');
      if (room.wave % 3 === 0) {
        spawnMonster(room, false, null, 'rare', 'gilded_goblin');
        addRoomChat(room, 'Perandus', '🪙 A Perandus Treasure Hoarder has appeared! Slay it before it escapes for a loot jackpot!', '#fcc419');
      }

      broadcastRoomEvent(room, {
        type: 'announcement',
        title: `Wave ${room.wave} Unleashed!`,
        subtitle: 'Monster life, damage, and projectile volley intensity have scaled up!',
        color: '#ffa94d'
      });
    }

    // Active Delirium Mirror Fog Countdown, Fractured Ambush Waves & Single End-of-Fog Reward
    if ((room.deliriumTimer || 0) > 0) {
      room.deliriumTimer -= dt;
      room.deliriumWaveCd = (room.deliriumWaveCd || 6) - dt;
      if (room.deliriumWaveCd <= 0 && room.deliriumTimer > 2.0 && !room.isRaidEncounter && !bossAlive && aliveList.length > 0) {
        room.deliriumWaveCd = 7.5;
        const anchor = pick(aliveList);
        const ang = Math.random() * Math.PI * 2;
        const ax = Math.max(-ARENA_HALF + 80, Math.min(ARENA_HALF - 80, Math.round(anchor.x + Math.cos(ang) * 420)));
        const ay = Math.max(-ARENA_HALF + 80, Math.min(ARENA_HALF - 80, Math.round(anchor.y + Math.sin(ang) * 420)));
        spawnMonster(room, false, { x: ax, y: ay }, 'magic', null, true);
        spawnMonster(room, false, { x: ax + 45, y: ay - 35 }, 'normal', null, true);
      }
      if (room.deliriumTimer <= 0) {
        const dTier = Math.max(1, room.deliriumTier || 1);
        room.deliriumTimer = 0;
        room.deliriumTier = 0;
        const anchor = pick(aliveList) || { x: 0, y: 0 };
        const dropIlvl = (mapTier - 1) * 3 + 3;
        const delRarity = dTier >= 3 ? 'rare' : (Math.random() < 0.55 ? 'rare' : 'magic');
        const delBonus = ((mapDef && mapDef.lootRarityBonus) || 0) + dTier * 15;
        spawnGroundDrop(room, anchor.x, anchor.y, 'gear', delRarity, dropIlvl, delBonus);
        if (dTier >= 5 || (dTier >= 3 && Math.random() < 0.40)) {
          spawnCurrencyDrop(room, anchor.x + randInt(-24, 24), anchor.y + randInt(-24, 24), null, delBonus);
        }
        addRoomChat(room, 'Delirium', `The Delirium Fog dissipated — Tier ${dTier} Simulacrum Reward dropped (+${dTier * 15}% Delirium Rarity)!`, '#dee2e6');
        broadcastRoomEvent(room, {
          type: 'announcement',
          title: `DELIRIUM FOG DISSIPATED — TIER ${dTier} REWARD!`,
          subtitle: `Simulacrum Reward dropped at your location (+${dTier * 15}% Rarity)!`,
          color: '#dee2e6'
        });
      }
    }

    // Active 3-Wave Blood Ritual Encounter Progression
    if (room.activeRitual) {
      const rit = room.activeRitual;
      const anyRitualMobAlive = Array.from(room.enemies.values()).some(m => m && m.isRitualMob === true && m.hp > 0);
      if (!anyRitualMobAlive) {
        if (rit.wave < rit.maxWaves) {
          rit.wave++;
          spawnRitualWave(room);
          room.fxEvents.push({ kind: 'nova', x: Math.round(rit.x), y: Math.round(rit.y), r: 185, color: '#ff4d6d' });
          broadcastRoomEvent(room, {
            type: 'announcement',
            title: `BLOOD RITUAL — WAVE ${rit.wave} OF ${rit.maxWaves}!`,
            subtitle: 'More Blood Offerings have manifested inside the Ritual Circle!',
            color: '#ff4d6d'
          });
        } else {
          // Wave 3 Cleared — Complete Ritual!
          room.fxEvents.push({ kind: 'nova', x: Math.round(rit.x), y: Math.round(rit.y), r: 240, color: '#ff4d6d' });
          for (const p of room.players.values()) {
            if (!p.dead) {
              p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.35));
              p.es = p.maxEs;
              p.runGold = (p.runGold || 0) + 60;
              p.earnedRunGold = (p.earnedRunGold || 0) + 60;
              queueGemDraft(p, 'BLOOD RITUAL TRIBUTE — PICK 1 BOON');
              sendPrivateProfile(p);
            }
          }
          const dropIlvl = (mapTier - 1) * 3 + 3;
          spawnCurrencyDrop(room, rit.x - 16, rit.y, null, 340 + mapTier * 25);
          const ritRarity = Math.random() < 0.015 ? 'unique' : 'rare';
          spawnGroundDrop(room, rit.x + 16, rit.y + 12, 'gear', ritRarity, dropIlvl, 350 + mapTier * 30);
          addRoomChat(room, 'Ritual', 'Blood Ritual Complete! All 3 waves vanquished — Tribute Loot & Boon Draft unleashed!', '#ff4d6d');
          broadcastRoomEvent(room, {
            type: 'announcement',
            title: 'BLOOD RITUAL COMPLETE — TRIBUTE UNLEASHED!',
            subtitle: '+35% Life, Full ES, Tribute Boon Draft & High-Rarity Orbs/Gear Dropped!',
            color: '#ff4d6d'
          });
          room.activeRitual = null;
        }
      }
    }

    // Spawn an Atlas Map Boss every 5 waves (Wave 5, 10, 15, 20...) or when initial timer elapses
    const shouldSpawnWaveBoss = (!room.isRaidEncounter && room.wave % 5 === 0 && room.waveProgress >= 85 && room.lastBossWave !== room.wave);
    const shouldSpawnTimerBoss = (!room.isRaidEncounter && room.runTimer >= room.runDuration && !room.bossSpawned);
    if (shouldSpawnWaveBoss || shouldSpawnTimerBoss) {
      spawnMapBoss(room);
      bossAlive = true;
    }

    // Only recycle extreme off-map stragglers (> 950 units away) to the far off-screen perimeter (440-560 units); NEVER jump mobs onto players!
    if (aliveList.length > 0 && !room.isRaidEncounter) {
      for (const m of room.enemies.values()) {
        if (m.rarity === 'boss' || m.isRitualMob) continue;
        let minPlayerDist = Infinity;
        for (const pl of aliveList) {
          const d = dist(m.x, m.y, pl.x, pl.y);
          if (d < minPlayerDist) minPlayerDist = d;
        }
        if (minPlayerDist > 950) {
          const anchor = pick(aliveList);
          const ang = Math.random() * Math.PI * 2;
          const rDist = randInt(440, 560);
          m.x = Math.max(-ARENA_HALF + 70, Math.min(ARENA_HALF - 70, Math.round(anchor.x + Math.cos(ang) * rDist)));
          m.y = Math.max(-ARENA_HALF + 70, Math.min(ARENA_HALF - 70, Math.round(anchor.y + Math.sin(ang) * rDist)));
        }
      }
    }

    // Update Active Expanding Breach Rings
    if (Array.isArray(room.activeBreaches) && room.activeBreaches.length > 0) {
      for (let bi = room.activeBreaches.length - 1; bi >= 0; bi--) {
        const b = room.activeBreaches[bi];
        b.elapsed = (b.elapsed || 0) + dt;
        b.duration -= dt;
        b.radius = Math.min(b.maxRadius || 240, b.radius + 95 * dt);
        b.spawnTimer = (b.spawnTimer || 0) - dt;

        if (b.spawnTimer <= 0 && b.duration > 0 && !bossAlive && !room.isRaidEncounter) {
          b.spawnTimer = 1.6;
          b.wavesSpawned = (b.wavesSpawned || 0) + 1;
          const swarmerCount = randInt(2, 3);
          for (let k = 0; k < swarmerCount; k++) {
            const ang = (Math.PI * 2 * k) / swarmerCount + (Math.random() - 0.5) * 0.45 + b.wavesSpawned * 0.37;
            const ringDist = Math.round(b.radius * (0.86 + Math.random() * 0.14));
            const bx = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(b.x + Math.cos(ang) * ringDist)));
            const by = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(b.y + Math.sin(ang) * ringDist)));
            spawnMonster(room, false, { x: bx, y: by, exact: true }, 'normal', null, true);
          }
          if (b.wavesSpawned % 3 === 0) {
            const rAng = Math.random() * Math.PI * 2;
            const rx = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(b.x + Math.cos(rAng) * b.radius)));
            const ry = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(b.y + Math.sin(rAng) * b.radius)));
            spawnMonster(room, false, { x: rx, y: ry, exact: true }, 'rare', null, true);
          }
        }

        if (b.duration <= 0) {
          room.fxEvents.push({
            kind: 'nova', x: Math.round(b.x), y: Math.round(b.y),
            r: Math.round(b.radius * 0.65), color: '#cc5de8'
          });
          const dropIlvl = (mapTier - 1) * 3 + 3;
          if (Math.random() < 0.45) {
            spawnCurrencyDrop(room, b.x - 14, b.y, null, 220 + mapTier * 20);
          }
          spawnGroundDrop(room, b.x + 14, b.y, 'gear', Math.random() < 0.01 ? 'unique' : 'rare', dropIlvl, 240 + mapTier * 20);
          addRoomChat(room, 'Breach', `The Breach collapsed back into the Void (${b.kills || 0} Breach monsters slain)!`, '#cc5de8');
          room.activeBreaches.splice(bi, 1);
        }
      }
    }

    // Continuous monster pack spawning + Floor Refill (scaled by Map Tier & Wave so T1 W1 is approachable for new characters)!
    if (!room.isRaidEncounter && !bossAlive) {
      const minTargetPop = Math.min(48, 14 + mapTier * 2 + room.wave * 3);
      let safety = 0;
      while (room.enemies.size < minTargetPop && safety++ < 6) {
        if (spawnMonsterPack(room) <= 0) break;
      }
      const deliriumBoost = (room.deliriumTimer || 0) > 0 ? 1.15 : 1.0;
      const baseSpawnRate = (0.75 + room.wave * 0.10 + (room.players.size - 1) * 0.30) * Math.sqrt(tierDensity) * modPackMult;
      room.spawnAccumulator += dt * baseSpawnRate * deliriumBoost;

      while (room.spawnAccumulator >= 1) {
        room.spawnAccumulator -= 1;
        if (room.enemies.size < MAX_ACTIVE_ENEMIES) {
          spawnMonsterPack(room);
        }
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
