// Server Module: Authoritative 25Hz Room Simulation Loop & Snapshot Broadcaster
const GameData = require('../public/shared/gameData.js');
// =========================================================================
// AUTHORITATIVE 25 HZ SIMULATION LOOP
// =========================================================================
const TICK_DT = 0.04;
setInterval(() => {
  for (const room of rooms.values()) {
    if (room.players.size === 0) continue;
    updateRoom(room, TICK_DT);
  }
}, 40);

function updateRoom(room, dt) {
  // Pause simulation ONLY in Singleplayer when choosing a Rogue-lite Level-Up or Chest upgrade!
  // In Multiplayer (2+ players in the room), combat never pauses!
  const isSingleplayer = room.players.size === 1;
  const isPaused = isSingleplayer && room.state === 'RUN' && Array.from(room.players.values()).some(
    p => !p.dead && p.pendingDrafts && p.pendingDrafts.length > 0
  );
  room.paused = isPaused;
  if (isPaused) {
    broadcastRoomSnapshot(room);
    return;
  }

  room.procCountThisTick = 0;
  let livingCount = 0;

  for (const p of room.players.values()) {
    if (p.dashCooldown > 0) p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    if (p.esDelayTimer > 0) p.esDelayTimer = Math.max(0, p.esDelayTimer - dt);
    if (p.graceTimer > 0) p.graceTimer = Math.max(0, p.graceTimer - dt);
    if (p.hitGraceTimer > 0) p.hitGraceTimer = Math.max(0, p.hitGraceTimer - dt);
    if ((p.acuityCd || 0) > 0) p.acuityCd = Math.max(0, p.acuityCd - dt);
    if ((p.shavNovaCd || 0) > 0) p.shavNovaCd = Math.max(0, p.shavNovaCd - dt);
    if ((p.kaomsTickCd || 0) > 0) p.kaomsTickCd = Math.max(0, p.kaomsTickCd - dt);
    if ((p.mjolnerCd || 0) > 0) p.mjolnerCd = Math.max(0, p.mjolnerCd - dt);
    if ((p.cospriCd || 0) > 0) p.cospriCd = Math.max(0, p.cospriCd - dt);

    // Tick active utility flasks (both per-slot timers and legacy activeFlasks map) & shrine buffs
    let statBuffExpired = false;
    if (Array.isArray(p.flaskSlotTimers)) {
      for (let sIdx = 0; sIdx < 5; sIdx++) {
        if ((p.flaskSlotTimers[sIdx] || 0) > 0) {
          p.flaskSlotTimers[sIdx] = Math.max(0, p.flaskSlotTimers[sIdx] - dt);
          if (p.flaskSlotTimers[sIdx] === 0) statBuffExpired = true;
        }
      }
    }
    for (const k of ['quicksilver', 'granite', 'diamond', 'quartz', 'silver', 'amethyst']) {
      if ((p.activeFlasks[k] || 0) > 0) {
        p.activeFlasks[k] = Math.max(0, p.activeFlasks[k] - dt);
        if (p.activeFlasks[k] === 0) statBuffExpired = true;
      }
    }
    if (p.shrineBuffTimer > 0) {
      p.shrineBuffTimer = Math.max(0, p.shrineBuffTimer - dt);
      if (p.shrineBuffTimer === 0) {
        p.shrineBuffType = null;
        statBuffExpired = true;
      }
    }
    if (p.hhTimer > 0) {
      p.hhTimer -= dt;
      if (p.hhTimer <= 0) {
        p.hhStacks = 0;
        statBuffExpired = true;
      }
    }
    if (statBuffExpired) recalcPlayer(p, false);

    if (p.dead) {
      for (const ally of room.players.values()) {
        if (!ally.dead && dist(p.x, p.y, ally.x, ally.y) < 70) {
          p.reviveProgress += dt * 0.45;
          if (p.reviveProgress >= 1) {
            p.dead = false;
            p.reviveProgress = 0;
            p.hp = Math.round(p.maxHp * 0.55);
            p.es = p.maxEs;
          }
        }
      }
      continue;
    }

    livingCount++;

    // Regenerate Life (small passive regen), refill Life-on-Hit cap budget (max 24 HP/sec), & Energy Shield
    p.lohBudget = Math.min(6, (p.lohBudget || 0) + 24 * dt);
    p.hp = Math.min(p.maxHp, p.hp + (p.stats.lifeRegen || 1.5) * dt);
    if (p.maxEs > 0) {
      if (p.stats && p.stats.shavronneWard > 0) {
        p.es = Math.min(p.maxEs, p.es + p.maxEs * 0.12 * dt);
      } else if (p.esDelayTimer <= 0) {
        p.es = Math.min(p.maxEs, p.es + p.maxEs * 0.25 * dt);
      }
    }

    // Kaom's Heart Molten Caldera Aura (Pulses Fire Damage equal to 18% of Max Life/sec to nearby enemies)
    if (p.stats && p.stats.kaomsFireBonus > 0 && (p.kaomsTickCd || 0) <= 0) {
      p.kaomsTickCd = 0.4;
      const burnDmg = Math.max(4, Math.round(p.maxHp * 0.18 * 0.4 * (1 + (p.stats.eleDmgPct || 0) / 100)));
      for (const m of Array.from(room.enemies.values())) {
        if (dist(p.x, p.y, m.x, m.y) <= 115 + m.radius) {
          damageEnemy(room, m, burnDmg, false, p, 0, 'fire');
        }
      }
    }

    // Movement / Flame Dash
    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      p.x += p.dashDirX * 840 * dt;
      p.y += p.dashDirY * 840 * dt;
    } else {
      let ix = (p.input.right ? 1 : 0) - (p.input.left ? 1 : 0);
      let iy = (p.input.down ? 1 : 0) - (p.input.up ? 1 : 0);
      const len = Math.hypot(ix, iy);
      if (len > 0) {
        ix /= len;
        iy /= len;
        p.targetDropId = null; // Manual WASD cancels walk-to-loot / walk-to-chest
        p.targetChestId = null;
      } else if (p.targetChestId && Array.isArray(room.upgradeChests)) {
        const tChest = room.upgradeChests.find(c => c.id === p.targetChestId && !c.opened);
        if (tChest) {
          const d = dist(p.x, p.y, tChest.x, tChest.y);
          if (d <= 105) {
            p.targetChestId = null;
            tryBuyUpgradeChest(room, p, tChest.id);
          } else {
            ix = (tChest.x - p.x) / d;
            iy = (tChest.y - p.y) / d;
          }
        } else {
          p.targetChestId = null;
        }
      } else if (p.targetDropId) {
        // Walk toward clicked ground gear item if not within pickup range yet
        const tDrop = room.groundDrops.find(d => d.id === p.targetDropId);
        if (tDrop) {
          const d = dist(p.x, p.y, tDrop.x, tDrop.y);
          if (d > 75) {
            ix = (tDrop.x - p.x) / d;
            iy = (tDrop.y - p.y) / d;
          }
        } else {
          p.targetDropId = null;
        }
      }

      const moveSpd = p.stats.finalMoveSpeed || 215;
      p.vx = ix * moveSpd;
      p.vy = iy * moveSpd;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    const bound = room.state === 'HIDEOUT' ? HIDEOUT_HALF - 24 : ARENA_HALF - 32;
    p.x = Math.max(-bound, Math.min(bound, p.x));
    p.y = Math.max(-bound, Math.min(bound, p.y));

    // Loot Pickup Rules:
    // - Currency Orbs & Utility Flasks auto-pickup when walking closely over them (56 units), or when clicked.
    // - GEAR NEVER AUTO-PICKUPS! Gear is ONLY picked up when explicitly clicked by a player (`p.targetDropId === drop.id`).
    for (let i = room.groundDrops.length - 1; i >= 0; i--) {
      const drop = room.groundDrops[i];
      const d = dist(p.x, p.y, drop.x, drop.y);
      if (drop.dropType === 'currency' && d <= 52) {
        p.currencies[drop.currencyId] = (p.currencies[drop.currencyId] || 0) + 1;
        room.groundDrops.splice(i, 1);
        sendPrivateProfile(p);
      } else if (drop.dropType === 'flask' && (d <= 56 || (p.targetDropId === drop.id && d <= 125))) {
        if (p.targetDropId === drop.id) p.targetDropId = null;
        room.groundDrops.splice(i, 1);
        pickupGroundFlask(room, p, drop);
      } else if (drop.dropType === 'gear' && p.targetDropId === drop.id && d <= 125) {
        p.targetDropId = null;
        if (p.inventory.length < 32) {
          p.inventory.push(drop.item);
          room.groundDrops.splice(i, 1);
          sendPrivateProfile(p);
        }
      }
    }

    // Trigger Automated Linked Skills from the player's Gem Link Board (or manual LMB Focus-Fire)!
    const setups = GameData.getPlayerGemSetups(p.gemLinks);
    const hasVisibleEnemy = findNearestEnemy(room, p.x, p.y, 330) !== null;
    const canFire = hasVisibleEnemy || !!(p.input && p.input.firing);
    for (let idx = 0; idx < setups.length; idx++) {
      const setup = setups[idx];
      const key = `slot_${setup.slotIndex}_${setup.active.id}`;
      const exec = buildSkillExecution(p, setup);
      p.skillTimers[key] = (p.skillTimers[key] || 0) - dt;
      if (p.skillTimers[key] <= 0 && canFire) {
        p.skillTimers[key] = exec.cooldown;
        triggerSkillSetup(room, p, exec);
        if (exec.repeatCount > 0) {
          triggerSkillSetup(room, p, exec);
        }
      }
    }
  }

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

  // Update Telegraphed Ground Hazards (Frontal Tank Smashes, Rare/Boss Sunder Waves & Boss Leaps)
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
      room.hazards.splice(i, 1);
    }
  }

  // Endless Wave Progression (Kill-Driven + Time-Driven) & Uncapped Infinite Pack Spawning
  if (room.state === 'RUN') {
    if (livingCount === 0 && room.players.size > 0) {
      returnToHideout(room, 'Party Slain', 'Your XP and collected Gear have been secured in your Hideout stash.');
      return;
    }

    const activeMapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];
    const packDensityMult = activeMapDef ? (activeMapDef.packDensity || 1.0) : 1.0;

    room.runTimer += dt;
    room.waveProgress = Math.min(100, (room.waveProgress || 0) + 2.2 * dt);

    if (room.waveProgress >= 100) {
      room.wave++;
      room.waveProgress = 0;
      // Spawn an immediate elite pack and a League Encounter on wave transition
      spawnMonsterPack(room);
      spawnMonster(room, false, null, 'rare');
      spawnWaveLeagueEncounter(room);

      broadcastRoomEvent(room, {
        type: 'announcement',
        title: `Wave ${room.wave} Unleashed!`,
        subtitle: 'Endless horde density and pack strength have increased!',
        color: '#ffa94d'
      });
    }

    // Spawn an Atlas Map Boss every 5 waves (Wave 5, 10, 15, 20...) or when initial timer elapses
    const shouldSpawnWaveBoss = (room.wave % 5 === 0 && room.waveProgress >= 40 && room.lastBossWave !== room.wave);
    const shouldSpawnTimerBoss = (room.runTimer >= room.runDuration && !room.bossSpawned);
    if (shouldSpawnWaveBoss || shouldSpawnTimerBoss) {
      room.bossSpawned = true;
      room.lastBossWave = room.wave;
      spawnMonster(room, true);
      const mapDef = GameData.ATLAS_MAPS.find(m => m.id === room.selectedMapId) || GameData.ATLAS_MAPS[0];
      broadcastRoomEvent(room, {
        type: 'announcement',
        title: `Map Boss: ${mapDef.bossName} (Wave ${room.wave})`,
        subtitle: 'Slay the Map Boss to open the Extraction Portal at (0, 0)!',
        color: '#ff4d4d'
      });
    }

    // Recycle straggler non-boss monsters that wandered > 720 units from all living players so packs never stall off-screen!
    const aliveList = Array.from(room.players.values()).filter(p => !p.dead);
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

    // Update Active Expanding Breach Rings (continuous ring expansion + monster surge along ring edge!)
    if (Array.isArray(room.activeBreaches) && room.activeBreaches.length > 0) {
      for (let bi = room.activeBreaches.length - 1; bi >= 0; bi--) {
        const b = room.activeBreaches[bi];
        b.elapsed = (b.elapsed || 0) + dt;
        b.duration -= dt;
        b.radius = Math.min(b.maxRadius || 480, 95 + b.elapsed * 24);
        b.spawnTimer = (b.spawnTimer || 0) - dt;

        if (b.spawnTimer <= 0 && b.duration > 0) {
          b.spawnTimer = 1.1;
          b.wavesSpawned = (b.wavesSpawned || 0) + 1;

          // Spawn 7 to 10 Breach monsters along the expanding Breach Ring perimeter!
          const swarmerCount = randInt(6, 8);
          for (let k = 0; k < swarmerCount; k++) {
            const ang = (Math.PI * 2 * k) / swarmerCount + (Math.random() - 0.5) * 0.45 + b.wavesSpawned * 0.37;
            const ringDist = Math.round(b.radius * (0.86 + Math.random() * 0.18));
            const bx = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(b.x + Math.cos(ang) * ringDist)));
            const by = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(b.y + Math.sin(ang) * ringDist)));
            spawnMonster(room, false, { x: bx, y: by, exact: true }, 'normal', null, true);
          }

          // 1-2 Magic Breach Elites on every ring pulse
          const magicCount = Math.random() < 0.5 ? 2 : 1;
          for (let mIdx = 0; mIdx < magicCount; mIdx++) {
            const mAng = Math.random() * Math.PI * 2;
            const mDist = Math.round(b.radius * 0.94);
            const mx = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(b.x + Math.cos(mAng) * mDist)));
            const my = Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, Math.round(b.y + Math.sin(mAng) * mDist)));
            spawnMonster(room, false, { x: mx, y: my, exact: true }, 'magic', null, true);
          }

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
          if ((b.kills || 0) >= 12 && Math.random() < 0.65) {
            spawnGroundDrop(room, b.x, b.y, 'currency');
          }
          addRoomChat(room, 'Breach', `The Breach collapsed back into the Void (${b.kills || 0} Breach monsters slain)!`, '#cc5de8');
          room.activeBreaches.splice(bi, 1);
        }
      }
    }

    // Endless monster spawning scaled by Map Tier packDensity (supports up to 150 active enemies on screen)!
    const lowDensityBoost = nearbyMonsters < 8 ? 0.95 : 0;
    room.spawnAccumulator += dt * (0.55 + room.wave * 0.085 + (room.players.size - 1) * 0.16 + lowDensityBoost) * packDensityMult;

    while (room.spawnAccumulator >= 1) {
      room.spawnAccumulator -= 1;
      if (room.enemies.size < 150) {
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

  // Update Projectiles
  for (let i = room.projectiles.length - 1; i >= 0; i--) {
    const prj = room.projectiles[i];
    prj.duration -= dt;
    if (prj.duration <= 0) {
      if (prj.behavior === 'tornado_burst') {
        const secCount = 6;
        room.fxEvents.push({
          kind: 'nova',
          x: Math.round(prj.x),
          y: Math.round(prj.y),
          r: 56,
          color: '#ffe066'
        });
        for (let s = 0; s < secCount; s++) {
          const ang = (Math.PI * 2 * s) / secCount;
          room.projectiles.push({
            ...prj,
            id: uid('prj'),
            behavior: 'standard',
            vx: Math.cos(ang) * 540,
            vy: Math.sin(ang) * 540,
            duration: 0.42,
            maxDuration: 0.42,
            hitIds: new Set()
          });
        }
      } else if (prj.behavior === 'molten_lob') {
        // Lobbed magma spheres always detonate on landing!
        const owner = room.players.get(prj.ownerId);
        const splashRadius = prj.aoeRadius || 68;
        room.fxEvents.push({
          kind: 'nova',
          x: Math.round(prj.x),
          y: Math.round(prj.y),
          r: splashRadius,
          color: '#ff6b4a'
        });
        for (const m of room.enemies.values()) {
          if (dist(prj.x, prj.y, m.x, m.y) <= splashRadius + m.radius) {
            const { dmg, isCrit } = rollSkillDamage(prj.exec);
            damageEnemy(room, m, dmg, isCrit, owner, prj.exec ? prj.exec.lifeOnHit : 0, 'fire');
          }
        }
      }
      room.projectiles.splice(i, 1);
      continue;
    }

    if (prj.behavior === 'boomerang') {
      const half = prj.maxDuration * 0.5;
      if (prj.duration < half && !prj.reversed) {
        prj.reversed = true;
        prj.vx = -prj.vx;
        prj.vy = -prj.vy;
        prj.hitIds.clear();
      }
    } else if (prj.behavior === 'spark_erratic') {
      const jitter = (Math.random() - 0.5) * 0.6;
      const curAng = Math.atan2(prj.vy, prj.vx) + jitter;
      prj.vx = Math.cos(curAng) * prj.speed;
      prj.vy = Math.sin(curAng) * prj.speed;
    }

    prj.x += prj.vx * dt;
    prj.y += prj.vy * dt;

    if (prj.ownerId === 'enemy') {
      for (const p of room.players.values()) {
        if (!p.dead && dist(prj.x, prj.y, p.x, p.y) <= prj.radius + 16) {
          applyDamageToPlayer(room, p, prj.damage, 'elemental');
          room.projectiles.splice(i, 1);
          break;
        }
      }
      continue;
    }

    const owner = room.players.get(prj.ownerId);
    for (const m of room.enemies.values()) {
      if (prj.hitIds.has(m.id)) continue;
      const hitR = prj.radius + m.radius;
      if (Math.abs(prj.x - m.x) > hitR || Math.abs(prj.y - m.y) > hitR) continue;
      if (dist(prj.x, prj.y, m.x, m.y) <= hitR) {
        prj.hitIds.add(m.id);
        const { dmg, isCrit } = rollSkillDamage(prj.exec);
        damageEnemy(room, m, dmg, isCrit, owner, prj.exec.lifeOnHit, prj.damageType);

        if ((prj.behavior === 'fireball_explode' || prj.behavior === 'molten_lob') && prj.hitIds.size <= 2) {
          if (room.fxEvents.length < 22) {
            room.fxEvents.push({
              kind: 'nova',
              x: Math.round(m.x),
              y: Math.round(m.y),
              r: prj.aoeRadius,
              color: prj.damageType === 'fire' ? '#ff6b4a' : '#d99b66'
            });
          }
          let splashHits = 0;
          for (const other of room.enemies.values()) {
            if (other.id === m.id) continue;
            const splashR = prj.aoeRadius + other.radius;
            if (Math.abs(m.x - other.x) > splashR || Math.abs(m.y - other.y) > splashR) continue;
            if (dist(m.x, m.y, other.x, other.y) <= splashR) {
              const splash = rollSkillDamage(prj.exec);
              damageEnemy(room, other, Math.round(splash.dmg * 0.75), splash.isCrit, owner, 0, prj.damageType, true);
              if (++splashHits >= 8) break;
            }
          }
        } else if (prj.behavior === 'lightning_arrow' && prj.hitIds.size <= 2) {
          // Lightning Arrow shocks target and arcs lightning bolts to 2 nearby enemies within 240 units!
          m.shockTimer = Math.max(m.shockTimer || 0, 4.0);
          let arcs = 0;
          for (const other of room.enemies.values()) {
            if (other.id === m.id) continue;
            if (Math.abs(m.x - other.x) > 240 || Math.abs(m.y - other.y) > 240) continue;
            if (dist(m.x, m.y, other.x, other.y) <= 240) {
              other.shockTimer = Math.max(other.shockTimer || 0, 3.0);
              const arcRoll = rollSkillDamage(prj.exec);
              damageEnemy(room, other, Math.round(arcRoll.dmg * 0.7), arcRoll.isCrit, owner, 0, 'lightning', true);
              if (room.fxEvents.length < 22) {
                room.fxEvents.push({
                  kind: 'chain',
                  x1: Math.round(m.x),
                  y1: Math.round(m.y),
                  x2: Math.round(other.x),
                  y2: Math.round(other.y),
                  color: '#70b8ff'
                });
              }
              arcs++;
              if (arcs >= 2) break;
            }
          }
        }

        if (prj.behavior === 'tornado_burst' && prj.hitIds.size === 1) {
          // Tornado Shot pierces 35 units into the pack and then bursts into 6 secondary arrows right on the enemies!
          prj.duration = Math.min(prj.duration, 0.06);
        }

        if (prj.chainsLeft > 0) {
          prj.chainsLeft--;
          const nextTarget = findNearestEnemy(room, m.x, m.y, 260, prj.hitIds);
          if (nextTarget) {
            const ang = Math.atan2(nextTarget.y - prj.y, nextTarget.x - prj.x);
            prj.vx = Math.cos(ang) * prj.speed;
            prj.vy = Math.sin(ang) * prj.speed;
          }
        } else if ((prj.pierceLeft || 0) > 0) {
          prj.pierceLeft--;
        } else if (prj.behavior !== 'sunder_wave' && prj.behavior !== 'boomerang' && prj.behavior !== 'tornado_burst') {
          room.projectiles.splice(i, 1);
          break;
        }
      }
    }
  }

  // Update Enemies: Anti-Straggler Repositioning & Varied Directional Archetype / Rare / Boss Skills
  const livingPlayers = Array.from(room.players.values()).filter(p => !p.dead);
  for (const m of room.enemies.values()) {
    if (m.behavior === 'dummy' || livingPlayers.length === 0) continue;

    if (m.chillTimer > 0) m.chillTimer = Math.max(0, m.chillTimer - dt);
    if (m.shockTimer > 0) m.shockTimer = Math.max(0, m.shockTimer - dt);
    if (m.buffTimer > 0) m.buffTimer = Math.max(0, m.buffTimer - dt);
    if (m.hitTimer > 0) m.hitTimer = Math.max(0, m.hitTimer - dt);
    if (m.pauseTimer > 0) m.pauseTimer = Math.max(0, m.pauseTimer - dt);

    const chillMult = m.chillTimer > 0 ? 0.65 : 1.0;
    const buffSpeedMult = m.buffTimer > 0 ? 1.35 : 1.0;

    let target = livingPlayers[0];
    let bestD = dist(m.x, m.y, target.x, target.y);
    for (let i = 1; i < livingPlayers.length; i++) {
      const d = dist(m.x, m.y, livingPlayers[i].x, livingPlayers[i].y);
      if (d < bestD) {
        bestD = d;
        target = livingPlayers[i];
      }
    }

    // Anti-Straggler Teleport: reposition monsters that fall > 820 units behind the party,
    // placing them 410-520 units ahead (just outside camera view)!
    if (bestD > 820 && m.rarity !== 'boss' && m.rarity !== 'unique') {
      const moveHeading = Math.hypot(target.vx || 0, target.vy || 0) > 20
        ? Math.atan2(target.vy, target.vx) + (Math.random() - 0.5) * 1.1
        : Math.random() * Math.PI * 2;
      const teleDist = randInt(410, 520);
      let tx = Math.max(-ARENA_HALF + 70, Math.min(ARENA_HALF - 70, Math.round(target.x + Math.cos(moveHeading) * teleDist)));
      let ty = Math.max(-ARENA_HALF + 70, Math.min(ARENA_HALF - 70, Math.round(target.y + Math.sin(moveHeading) * teleDist)));
      for (const pl of livingPlayers) {
        const dPl = dist(tx, ty, pl.x, pl.y);
        if (dPl < 370) {
          const pAng = dPl > 1 ? Math.atan2(ty - pl.y, tx - pl.x) : Math.random() * Math.PI * 2;
          tx = Math.round(pl.x + Math.cos(pAng) * 410);
          ty = Math.round(pl.y + Math.sin(pAng) * 410);
        }
      }
      m.x = tx;
      m.y = ty;
      bestD = dist(m.x, m.y, target.x, target.y);
    }

    const ang = Math.atan2(target.y - m.y, target.x - m.x);
    let moveMult = m.pauseTimer > 0 ? 0.0 : 1.0;
    let moveAng = ang;

    // Handle active Rhoa / Charger windup & committed linear dash
    if (m.chargeWindup > 0) {
      m.chargeWindup -= dt;
      moveMult = 0;
      if (m.chargeWindup <= 0) {
        m.chargeTimer = 0.45;
      }
    } else if (m.chargeTimer > 0) {
      m.chargeTimer -= dt;
      moveAng = typeof m.chargeAngle === 'number' ? m.chargeAngle : ang;
      moveMult = 3.4;
    }

    m.actionTimer -= dt;

    // 1. MAP BOSS 4-PHASE CHOREOGRAPHED ATTACK CYCLE
    if ((m.rarity === 'boss' || m.rarity === 'unique' || m.behavior === 'boss') && m.actionTimer <= 0 && bestD < 640) {
      m.actionTimer = 3.6;
      m.bossAttackIndex = ((m.bossAttackIndex || 0) + 1) % 4;

      if (m.bossAttackIndex === 0) {
        // Phase 0: Bullet-Hell Spiral Nova (10-orb 360 ring + 5-projectile aimed cone)
        for (let k = 0; k < 10; k++) {
          const bAng = (Math.PI * 2 * k) / 10;
          room.projectiles.push({
            id: uid('eprj'),
            ownerId: 'enemy',
            skillId: 'enemy_bolt',
            behavior: 'standard',
            damageType: 'fire',
            x: m.x,
            y: m.y,
            vx: Math.cos(bAng) * 180,
            vy: Math.sin(bAng) * 180,
            speed: 180,
            radius: 11,
            damage: Math.round(m.damage * 0.85),
            duration: 3.4
          });
        }
        for (let c = -2; c <= 2; c++) {
          const cAng = ang + c * 0.14;
          room.projectiles.push({
            id: uid('eprj'),
            ownerId: 'enemy',
            skillId: 'enemy_bolt',
            behavior: 'standard',
            damageType: 'lightning',
            x: m.x,
            y: m.y,
            vx: Math.cos(cAng) * 230,
            vy: Math.sin(cAng) * 230,
            speed: 230,
            radius: 10,
            damage: Math.round(m.damage * 0.9),
            duration: 2.8
          });
        }
      } else if (m.bossAttackIndex === 1) {
        // Phase 1: Cascading Sunder Slam (4 staggered shockwaves along player line)
        m.pauseTimer = 0.8;
        const steps = [
          { d: 80, fuse: 0.7 },
          { d: 155, fuse: 0.95 },
          { d: 230, fuse: 1.2 },
          { d: 305, fuse: 1.45 }
        ];
        for (const st of steps) {
          spawnGroundHazard(
            room,
            m.x + Math.cos(ang) * st.d,
            m.y + Math.sin(ang) * st.d,
            52,
            st.fuse,
            Math.round(m.damage * 1.35),
            'Boss Sunder Slam'
          );
        }
        room.fxEvents.push({
          kind: 'dmg_num',
          x: Math.round(m.x),
          y: Math.round(m.y - 30),
          val: 'SUNDER SLAM!',
          text: 'SUNDER SLAM!',
          color: '#ff6b4a',
          size: 18,
          crit: true,
          dtype: 'fire'
        });
      } else if (m.bossAttackIndex === 2) {
        // Phase 2: Telegraphed Boss Leap Slam
        m.pauseTimer = 1.0;
        const leapX = Math.max(-ARENA_HALF + 80, Math.min(ARENA_HALF - 80, Math.round(target.x)));
        const leapY = Math.max(-ARENA_HALF + 80, Math.min(ARENA_HALF - 80, Math.round(target.y)));
        room.hazards.push({
          id: uid('haz'),
          x: leapX,
          y: leapY,
          r: 85,
          fuse: 1.25,
          maxFuse: 1.25,
          damage: Math.round(m.damage * 1.5),
          title: `${m.name} Leap Slam`,
          leapBossId: m.id,
          color: '#ff4d4d'
        });
      } else {
        // Phase 3: Summon Royal Guard + 8-Bolt Spiral
        for (let g = 0; g < 3; g++) {
          const gAng = (Math.PI * 2 * g) / 3;
          spawnMonster(
            room,
            false,
            { x: m.x + Math.cos(gAng) * 75, y: m.y + Math.sin(gAng) * 75, exact: true },
            g === 0 ? 'magic' : 'normal',
            'skeleton'
          );
        }
        for (let k = 0; k < 8; k++) {
          const bAng = (Math.PI * 2 * k) / 8 + 0.2;
          room.projectiles.push({
            id: uid('eprj'),
            ownerId: 'enemy',
            skillId: 'enemy_bolt',
            behavior: 'standard',
            damageType: 'cold',
            x: m.x,
            y: m.y,
            vx: Math.cos(bAng) * 170,
            vy: Math.sin(bAng) * 170,
            speed: 170,
            radius: 10,
            damage: Math.round(m.damage * 0.8),
            duration: 3.0
          });
        }
      }
    } else if (m.rarity === 'rare' && m.actionTimer <= 0 && bestD < 380) {
      // 2. RARE MONSTER SIGNATURE SKILLS (Every 5.0s: 8-Orb Ring, 3-Step Sunder Wave, or Frost Nova Self-Pulse)
      m.actionTimer = 5.0;
      m.rareSkillIdx = ((m.rareSkillIdx || 0) + 1) % 3;
      if (m.rareSkillIdx === 0) {
        for (let k = 0; k < 8; k++) {
          const bAng = (Math.PI * 2 * k) / 8;
          room.projectiles.push({
            id: uid('eprj'),
            ownerId: 'enemy',
            skillId: 'enemy_bolt',
            behavior: 'standard',
            damageType: 'fire',
            x: m.x,
            y: m.y,
            vx: Math.cos(bAng) * 155,
            vy: Math.sin(bAng) * 155,
            speed: 155,
            radius: 9,
            damage: Math.round(m.damage * 0.85),
            duration: 3.2
          });
        }
      } else if (m.rareSkillIdx === 1 && room.hazards.length <= 2) {
        const steps = [
          { d: 70, fuse: 0.6 },
          { d: 140, fuse: 0.9 },
          { d: 210, fuse: 1.2 }
        ];
        for (const st of steps) {
          spawnGroundHazard(
            room,
            m.x + Math.cos(ang) * st.d,
            m.y + Math.sin(ang) * st.d,
            42,
            st.fuse,
            Math.round(m.damage * 1.15),
            'Rare Sunder Cascade'
          );
        }
      } else {
        spawnGroundHazard(room, m.x, m.y, 90, 1.1, Math.round(m.damage * 1.2), 'Frost Nova Pulse');
      }
    } else if (m.actionTimer <= 0) {
      // 3. NORMAL / MAGIC ARCHETYPE SKILLS (NO ground mortars or orbital flameblasts!)
      if (m.behavior === 'charge' && bestD >= 110 && bestD <= 300) {
        // Charger (Rhoa): 0.5s windup lock, then linear dash!
        m.actionTimer = 4.5;
        m.chargeWindup = 0.5;
        m.chargeAngle = ang;
        room.fxEvents.push({
          kind: 'dmg_num',
          x: Math.round(m.x),
          y: Math.round(m.y - 22),
          val: 'CHARGING!',
          text: 'CHARGING!',
          color: '#fbbf24',
          size: 14,
          crit: false,
          dtype: 'physical'
        });
      } else if (m.behavior === 'flameblast_caster' && bestD < 340) {
        // Cultist Caster: Alternates 3-Bolt Fan Volley and Unholy Ally Empowerment (NO ground Flameblast!)
        m.actionTimer = 4.0;
        m.pauseTimer = 0.45;
        m.casterAlt = !m.casterAlt;
        if (m.casterAlt) {
          for (const offset of [-0.31, 0, 0.31]) {
            const fAng = ang + offset;
            room.projectiles.push({
              id: uid('eprj'),
              ownerId: 'enemy',
              skillId: 'enemy_bolt',
              behavior: 'standard',
              damageType: 'fire',
              x: m.x,
              y: m.y,
              vx: Math.cos(fAng) * 175,
              vy: Math.sin(fAng) * 175,
              speed: 175,
              radius: 9,
              damage: Math.round(m.damage * 0.85),
              duration: 2.8
            });
          }
        } else {
          let buffed = 0;
          for (const ally of room.enemies.values()) {
            if (ally.id !== m.id && dist(m.x, m.y, ally.x, ally.y) <= 140) {
              ally.buffTimer = 4.0;
              buffed++;
              if (buffed >= 3) break;
            }
          }
          room.fxEvents.push({
            kind: 'nova',
            x: Math.round(m.x),
            y: Math.round(m.y),
            r: 65,
            color: '#a855f7'
          });
          if (buffed === 0 && room.enemies.size < 85) {
            spawnMonster(room, false, { x: m.x + Math.cos(ang) * 42, y: m.y + Math.sin(ang) * 42, exact: true }, 'normal', 'skeleton');
          }
        }
      } else if ((m.typeId === 'devourer' || m.typeId === 'kitava_herald') && bestD <= 95) {
        // Tank (Devourer / Herald): Close-range Frontal Heavy Smash 45 units in front of the tank
        m.actionTimer = 4.2;
        m.pauseTimer = 0.8;
        if (room.hazards.length <= 3) {
          spawnGroundHazard(
            room,
            m.x + Math.cos(ang) * 45,
            m.y + Math.sin(ang) * 45,
            65,
            0.95,
            Math.round(m.damage * 1.25),
            'Heavy Slam'
          );
        }
      } else if ((m.behavior === 'ranged_kite' || m.behavior === 'mortar_leap') && bestD < 320) {
        // Ranged (Archer / Goatman): Stops briefly and fires aimed shot or 2-arrow V-split (NO ground mortars!)
        m.actionTimer = 3.8 + Math.random() * 1.2;
        m.pauseTimer = 0.35;
        if (m.behavior === 'mortar_leap') {
          for (const offset of [-0.16, 0.16]) {
            const sAng = ang + offset;
            room.projectiles.push({
              id: uid('eprj'),
              ownerId: 'enemy',
              skillId: 'enemy_bolt',
              behavior: 'standard',
              damageType: 'fire',
              x: m.x,
              y: m.y,
              vx: Math.cos(sAng) * 215,
              vy: Math.sin(sAng) * 215,
              speed: 215,
              radius: 8,
              damage: Math.round(m.damage * 0.8),
              duration: 2.4
            });
          }
        } else {
          room.projectiles.push({
            id: uid('eprj'),
            ownerId: 'enemy',
            skillId: 'enemy_bolt',
            behavior: 'standard',
            damageType: 'cold',
            x: m.x,
            y: m.y,
            vx: Math.cos(ang) * 230,
            vy: Math.sin(ang) * 230,
            speed: 230,
            radius: 8,
            damage: Math.round(m.damage * 0.85),
            duration: 2.3
          });
        }
      }
    }

    m.x += Math.cos(moveAng) * m.speed * chillMult * buffSpeedMult * moveMult * dt;
    m.y += Math.sin(moveAng) * m.speed * chillMult * buffSpeedMult * moveMult * dt;

    // Individual Monster Contact Strike (Every monster hits independently!)
    if (m.hitTimer <= 0) {
      const contactDmg = m.buffTimer > 0 ? Math.round(m.damage * 1.2) : m.damage;
      for (const p of livingPlayers) {
        if (dist(m.x, m.y, p.x, p.y) <= m.radius + 17) {
          m.hitTimer = 0.72;
          applyDamageToPlayer(room, p, contactDmg, 'physical');
          break;
        }
      }
    }
  }

  broadcastRoomSnapshot(room);
}

function broadcastRoomSnapshot(room) {
  // Broadcast Snapshot
  const snap = {
    type: 'state',
    roomCode: room.code,
    roomName: room.roomName,
    mode: room.state,
    paused: !!room.paused,
    mapId: room.selectedMapId,
    wave: room.wave,
    waveProgress: Math.round(room.waveProgress || 0),
    runTimer: Math.round(room.runTimer),
    runDuration: room.runDuration,
    portalsOpen: room.portalsOpen,
    upgradeChests: room.upgradeChests || [],
    players: Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      classId: p.classId,
      ready: p.ready,
      level: p.level,
      runLevel: p.runLevel || 1,
      x: Math.round(p.x),
      y: Math.round(p.y),
      vx: Math.round(p.vx || 0),
      vy: Math.round(p.vy || 0),
      ax: +(p.aimX || 0).toFixed(1),
      ay: +(p.aimY || 1).toFixed(1),
      dashing: p.dashTimer > 0,
      firing: !!(p.input && p.input.firing),
      atkSeq: p.atkSeq || 0,
      atkAng: p.lastAtkAngle || 0,
      hp: Math.round(p.hp),
      maxHp: p.maxHp,
      es: Math.round(p.es),
      maxEs: p.maxEs,
      vaalSouls: p.vaalSouls || 0,
      maxVaalSouls: 45,
      gold: room.state === 'RUN' ? Math.floor(p.runGold || 0) : Math.floor(p.gold || 0),
      runGold: Math.floor(p.runGold || 0),
      stashGold: Math.floor(p.gold || 0),
      nextChestCost: getNextChestCost(p, room),
      chestsOpened: p.chestsOpened || 0,
      dashCooldown: +p.dashCooldown.toFixed(1),
      hhStacks: p.hhStacks || 0,
      shrineBuff: p.shrineBuffTimer > 0 ? p.shrineBuffType : null,
      draftCount: p.pendingDrafts.length,
      kills: p.kills,
      dead: p.dead,
      reviveProgress: +p.reviveProgress.toFixed(2),
      rfRadius: getPlayerRfRadius(p)
    })),
    enemies: Array.from(room.enemies.values()).map(m => ({
      id: m.id,
      name: m.name,
      t: m.typeId,
      b: m.behavior,
      rarity: m.rarity,
      mods: m.mods,
      x: Math.round(m.x),
      y: Math.round(m.y),
      hp: m.hp,
      maxHp: m.maxHp,
      r: m.radius,
      c: m.color,
      chilled: m.chillTimer > 0
    })),
    projectiles: room.projectiles.map(prj => ({
      id: prj.id,
      s: prj.skillId,
      dt: prj.damageType,
      x: Math.round(prj.x),
      y: Math.round(prj.y),
      vx: Math.round(prj.vx),
      vy: Math.round(prj.vy),
      r: prj.radius
    })),
    hazards: room.hazards.map(h => ({
      id: h.id,
      x: h.x,
      y: h.y,
      r: h.r,
      prog: +(1 - h.fuse / h.maxFuse).toFixed(2),
      title: h.title
    })),
    interactables: room.interactables.filter(it => !it.used).map(it => ({
      id: it.id,
      kind: it.kind,
      sub: it.sub,
      label: it.label,
      color: it.color,
      x: it.x,
      y: it.y
    })),
    breaches: (room.activeBreaches || []).map(b => ({
      id: b.id,
      x: Math.round(b.x),
      y: Math.round(b.y),
      r: Math.round(b.radius),
      maxR: Math.round(b.maxRadius || 480),
      rem: +Math.max(0, b.duration).toFixed(1),
      kills: b.kills || 0
    })),
    drops: room.groundDrops.map(d => ({
      id: d.id,
      x: d.x,
      y: d.y,
      dt: d.dropType,
      kind: d.kind || (d.dropType === 'gear' ? 'item' : d.dropType === 'flask' ? 'flask' : 'currency'),
      flaskId: d.flaskId || null,
      currencyId: d.currencyId || null,
      t0: !!d.t0,
      label: d.label,
      rarity: d.rarity,
      item: d.item || null
    })),
    fx: room.fxEvents
  };

  room.fxEvents = [];
  broadcastRoomEvent(room, snap);
}

const exportsObj = { TICK_DT, updateRoom, broadcastRoomSnapshot };
Object.assign(global, exportsObj);
module.exports = exportsObj;
