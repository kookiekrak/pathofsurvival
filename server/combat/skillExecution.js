// Server Combat Module: Active Skill Setup Execution & Vaal Ultimate Triggers
const GameData = global.GameData || require('../../public/shared/gameData.js');

const HEAVY_AOE_SKILLS = new Set([
  'ball_lightning', 'fireball', 'glacial_cascade', 'volcanic_fissure', 'sunder', 'eye_of_winter', 'molten_strike'
]);

const _baseBuildSkillExecution = global.buildSkillExecution;
function buildSkillExecution(player, setup) {
  const exec = typeof _baseBuildSkillExecution === 'function' ? _baseBuildSkillExecution(player, setup) : {};
  if (exec && exec.active) {
    const maxProj = HEAVY_AOE_SKILLS.has(exec.active.id) ? 4 : 6;
    exec.projCount = Math.min(maxProj, Math.max(1, exec.projCount || 1));
  }
  return exec;
}

function spawnProjectile(room, prj) {
  if (room.projectiles.length >= 42) {
    room.projectiles.shift();
  }
  room.projectiles.push(prj);
}

function triggerSkillSetup(room, player, exec) {
  const active = exec.active;
  const maxProj = HEAVY_AOE_SKILLS.has(active.id) ? 4 : 6;
  exec.projCount = Math.min(maxProj, Math.max(1, exec.projCount || 1));
  const isFiringLmb = !!(player.input && player.input.firing);
  // Auto-aim only acquires monsters within visible screen distance (330 units) so players never shoot off-screen into HUD corners!
  const nearest = findNearestEnemy(room, player.x, player.y, 330);

  // When holding LMB (Focus-Fire), aim directly along cursor; otherwise auto-aim at nearest visible enemy!
  let baseAngle = Math.atan2(player.aimY || -1, player.aimX || 0);
  if (!isFiringLmb && nearest) {
    baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  }

  if (active.behavior !== 'rf_aura') {
    player.atkSeq = (player.atkSeq || 0) + 1;
    player.lastAtkAngle = +baseAngle.toFixed(2);
  }

  // 1. Righteous Fire Aura
  if (active.behavior === 'rf_aura' || active.id === 'righteous_fire') {
    for (const m of room.enemies.values()) {
      const hitR = exec.radius + m.radius;
      if (Math.abs(player.x - m.x) > hitR || Math.abs(player.y - m.y) > hitR) continue;
      if (dist(player.x, player.y, m.x, m.y) <= hitR) {
        const { dmg, isCrit } = rollSkillDamage(exec);
        damageEnemy(room, m, dmg, isCrit, player, exec.lifeOnHit, 'fire');
      }
    }
    return;
  }

  // 2. Ice Nova (Large cold nova that chills/freezes enemies for 2.5s)
  if (active.behavior === 'ice_nova_ring' || active.id === 'ice_nova') {
    for (const m of room.enemies.values()) {
      const hitR = exec.radius + m.radius;
      if (Math.abs(player.x - m.x) > hitR || Math.abs(player.y - m.y) > hitR) continue;
      if (dist(player.x, player.y, m.x, m.y) <= hitR) {
        const { dmg, isCrit } = rollSkillDamage(exec);
        m.chillTimer = Math.max(m.chillTimer || 0, 2.5);
        damageEnemy(room, m, dmg, isCrit, player, exec.lifeOnHit, 'cold');
      }
    }
    room.fxEvents.push({
      kind: 'nova',
      sub: 'ice_nova',
      ownerId: player.id,
      x: Math.round(player.x),
      y: Math.round(player.y),
      r: exec.radius,
      color: '#74c0fc'
    });
    return;
  }

  // 3. Cyclone (360-degree spinning physical melee sweep around player)
  if (active.behavior === 'cyclone_spin' || active.id === 'cyclone') {
    const spinRadius = Math.max(85, exec.radius);
    for (const m of room.enemies.values()) {
      const hitR = spinRadius + m.radius;
      if (Math.abs(player.x - m.x) > hitR || Math.abs(player.y - m.y) > hitR) continue;
      if (dist(player.x, player.y, m.x, m.y) <= hitR) {
        const { dmg, isCrit } = rollSkillDamage(exec);
        damageEnemy(room, m, dmg, isCrit, player, exec.lifeOnHit, active.damageType || 'physical');
      }
    }
    room.fxEvents.push({
      kind: 'nova',
      sub: 'cyclone',
      ownerId: player.id,
      x: Math.round(player.x),
      y: Math.round(player.y),
      r: spinRadius,
      color: '#ffa94d'
    });
    return;
  }

  // 4. Blade Vortex (360-degree rapid physical blade pulse + orbiting slash fx)
  if (active.behavior === 'blade_vortex' || active.behavior === 'bv_aura' || active.id === 'blade_vortex') {
    const bvRadius = Math.max(92, exec.radius);
    for (const m of room.enemies.values()) {
      const hitR = bvRadius + m.radius;
      if (Math.abs(player.x - m.x) > hitR || Math.abs(player.y - m.y) > hitR) continue;
      if (dist(player.x, player.y, m.x, m.y) <= hitR) {
        const { dmg, isCrit } = rollSkillDamage(exec);
        damageEnemy(room, m, dmg, isCrit, player, exec.lifeOnHit, 'physical');
      }
    }
    room.fxEvents.push({
      kind: 'nova',
      sub: 'blade_vortex',
      ownerId: player.id,
      x: Math.round(player.x),
      y: Math.round(player.y),
      r: bvRadius,
      color: '#66d9e8'
    });
    return;
  }

  // 5. Arc (Chaining lightning bolt)
  if (active.behavior === 'arc_chain' || active.id === 'arc') {
    if (!nearest) return;
    const hitSet = new Set();
    let currTarget = nearest;
    let prevX = player.x;
    let prevY = player.y;
    const points = [[Math.round(prevX), Math.round(prevY)]];
    const totalChains = 1 + exec.chains;

    for (let c = 0; c < totalChains && currTarget; c++) {
      points.push([Math.round(currTarget.x), Math.round(currTarget.y)]);
      hitSet.add(currTarget.id);
      const { dmg, isCrit } = rollSkillDamage(exec);
      damageEnemy(room, currTarget, dmg, isCrit, player, exec.lifeOnHit, 'lightning');
      currTarget = findNearestEnemy(room, currTarget.x, currTarget.y, 280, hitSet);
    }

    room.fxEvents.push({
      kind: 'arc',
      points
    });
    return;
  }

  // 6. Glacial Cascade (4 erupting ice bursts in a line forward with chill + knockback)
  if (active.behavior === 'glacial_cascade' || active.id === 'glacial_cascade') {
    const burstR = Math.max(54, Math.round(exec.radius * 0.9));
    for (const dStep of [65, 130, 195, 260]) {
      const bx = player.x + Math.cos(baseAngle) * dStep;
      const by = player.y + Math.sin(baseAngle) * dStep;
      room.fxEvents.push({ kind: 'nova', sub: 'ice_nova', x: Math.round(bx), y: Math.round(by), r: burstR, color: '#74c0fc' });
      for (const m of Array.from(room.enemies.values())) {
        if (dist(bx, by, m.x, m.y) <= burstR + m.radius) {
          m.chillTimer = Math.max(m.chillTimer || 0, 2.8);
          const { dmg, isCrit } = rollSkillDamage(exec);
          damageEnemy(room, m, dmg, isCrit, player, exec.lifeOnHit, 'cold');
        }
      }
    }
    return;
  }

  // 7. Toxic Rain (Rains down spore pods around target point that snare & burst in chaos blooms)
  if (active.behavior === 'toxic_rain' || active.id === 'toxic_rain') {
    const center = nearest ? { x: nearest.x, y: nearest.y } : { x: player.x + Math.cos(baseAngle) * 195, y: player.y + Math.sin(baseAngle) * 195 };
    const podCount = Math.max(3, exec.projCount);
    const podR = Math.max(58, Math.round(exec.radius * 0.85));
    for (let pIdx = 0; pIdx < podCount; pIdx++) {
      const pAng = (Math.PI * 2 * pIdx) / podCount;
      const px = center.x + Math.cos(pAng) * 46;
      const py = center.y + Math.sin(pAng) * 46;
      room.fxEvents.push({ kind: 'nova', x: Math.round(px), y: Math.round(py), r: podR, color: '#82c91e' });
      for (const m of Array.from(room.enemies.values())) {
        if (dist(px, py, m.x, m.y) <= podR + m.radius) {
          m.chillTimer = Math.max(m.chillTimer || 0, 2.6);
          const { dmg, isCrit } = rollSkillDamage(exec);
          damageEnemy(room, m, dmg, isCrit, player, exec.lifeOnHit, 'physical');
        }
      }
    }
    return;
  }

  // 8. Volcanic Fissure (Target magma geyser + radial volcanic boulders)
  if (active.behavior === 'volcanic_fissure' || active.id === 'volcanic_fissure') {
    const geyser = nearest ? { x: nearest.x, y: nearest.y } : { x: player.x + Math.cos(baseAngle) * 165, y: player.y + Math.sin(baseAngle) * 165 };
    const gR = Math.max(66, exec.radius);
    room.fxEvents.push({ kind: 'nova', x: Math.round(geyser.x), y: Math.round(geyser.y), r: gR, color: '#ff6b35' });
    for (const m of Array.from(room.enemies.values())) {
      if (dist(geyser.x, geyser.y, m.x, m.y) <= gR + m.radius) {
        const { dmg, isCrit } = rollSkillDamage(exec);
        damageEnemy(room, m, dmg, isCrit, player, exec.lifeOnHit, 'fire');
      }
    }
    const lobCount = Math.min(4, Math.max(2, exec.projCount));
    const lobCastHits = new Map();
    for (let k = 0; k < lobCount; k++) {
      const lAng = (Math.PI * 2 * k) / lobCount + 0.3;
      spawnProjectile(room, {
        id: uid('prj'), ownerId: player.id, skillId: 'molten_strike', behavior: 'molten_lob',
        damageType: 'fire', x: geyser.x, y: geyser.y, vx: Math.cos(lAng) * 280, vy: Math.sin(lAng) * 280,
        speed: 280, radius: 11, aoeRadius: 56, chainsLeft: 0, pierceLeft: 0, duration: 0.42, maxDuration: 0.42, exec, hitIds: new Set(), castHits: lobCastHits
      });
    }
    return;
  }

  // 9. Flicker Strike (Shadow-teleports across up to 3 nearby enemies, cleaving around each impact)
  if (active.behavior === 'flicker_strike' || active.id === 'flicker_strike') {
    if (!nearest) return;
    const struckSet = new Set();
    let cur = nearest;
    const slashR = Math.max(68, exec.radius);
    for (let s = 0; s < 3 && cur; s++) {
      struckSet.add(cur.id);
      room.fxEvents.push({ kind: 'chain', x1: Math.round(player.x), y1: Math.round(player.y), x2: Math.round(cur.x), y2: Math.round(cur.y), color: '#63e6be' });
      room.fxEvents.push({ kind: 'nova', sub: 'blade_vortex', x: Math.round(cur.x), y: Math.round(cur.y), r: slashR, color: '#38d9a9' });
      player.x = Math.max(-ARENA_HALF + 45, Math.min(ARENA_HALF - 45, Math.round(cur.x + randInt(-22, 22))));
      player.y = Math.max(-ARENA_HALF + 45, Math.min(ARENA_HALF - 45, Math.round(cur.y + randInt(-22, 22))));
      player.graceTimer = Math.max(player.graceTimer || 0, 0.32);
      for (const m of Array.from(room.enemies.values())) {
        if (dist(cur.x, cur.y, m.x, m.y) <= slashR + m.radius) {
          const { dmg, isCrit } = rollSkillDamage(exec);
          damageEnemy(room, m, dmg, isCrit, player, exec.lifeOnHit, 'physical');
        }
      }
      cur = findNearestEnemy(room, player.x, player.y, 240, struckSet);
    }
    return;
  }

  // 10. Divine Ire (Crackling aura tendrils + searing high-energy beam along aim line)
  if (active.behavior === 'divine_ire' || active.id === 'divine_ire') {
    const beamLen = 340;
    const endX = Math.round(player.x + Math.cos(baseAngle) * beamLen);
    const endY = Math.round(player.y + Math.sin(baseAngle) * beamLen);
    room.fxEvents.push({ kind: 'nova', x: Math.round(player.x), y: Math.round(player.y), r: 85, color: '#ffd43b' });
    room.fxEvents.push({ kind: 'chain', x1: Math.round(player.x), y1: Math.round(player.y), x2: endX, y2: endY, color: '#ffe066' });
    room.fxEvents.push({ kind: 'nova', x: endX, y: endY, r: 68, color: '#74c0fc' });
    const cosA = Math.cos(baseAngle);
    const sinA = Math.sin(baseAngle);
    for (const m of Array.from(room.enemies.values())) {
      const dx = m.x - player.x;
      const dy = m.y - player.y;
      const proj = dx * cosA + dy * sinA;
      const perp = Math.abs(-dx * sinA + dy * cosA);
      if (dist(player.x, player.y, m.x, m.y) <= 95 + m.radius || (proj >= 0 && proj <= beamLen && perp <= 38 + m.radius)) {
        const { dmg, isCrit } = rollSkillDamage(exec);
        damageEnemy(room, m, dmg, isCrit, player, exec.lifeOnHit, 'lightning');
      }
    }
    return;
  }

  // 11. Molten Strike (Immediate melee hit + lobbed magma projectiles)
  if (active.behavior === 'molten_lob' || active.id === 'molten_strike') {
    const meleeRange = Math.max(78, exec.radius + 28);
    let hitAnyMelee = false;
    for (const m of Array.from(room.enemies.values())) {
      if (dist(player.x, player.y, m.x, m.y) <= meleeRange + m.radius) {
        const { dmg, isCrit } = rollSkillDamage(exec);
        damageEnemy(room, m, dmg, isCrit, player, exec.lifeOnHit, 'fire');
        hitAnyMelee = true;
      }
    }
    if (hitAnyMelee) {
      room.fxEvents.push({ kind: 'nova', x: Math.round(player.x + Math.cos(baseAngle) * 28), y: Math.round(player.y + Math.sin(baseAngle) * 28), r: 44, color: '#ff6b4a' });
    }
  }

  const count = Math.max(1, exec.projCount);
  const spreadTotal = Math.min(Math.PI * 0.85, (count - 1) * 0.16);
  let behavior = active.id === 'lightning_arrow' ? 'lightning_arrow' : active.behavior;
  if (exec.returnProj && behavior === 'standard') behavior = 'boomerang';
  const castHits = new Map();

  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : -spreadTotal / 2 + (spreadTotal / (count - 1)) * i;
    const ang = baseAngle + offset;
    const speed = active.projSpeed || 520;
    const dur = exec.returnProj ? Math.max(1.1, active.duration || 0.85) : (active.duration || 0.85);

    spawnProjectile(room, {
      id: uid('prj'), ownerId: player.id, skillId: active.id, behavior, damageType: active.damageType,
      x: player.x, y: player.y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, speed,
      radius: behavior === 'sunder_wave' ? exec.radius : (behavior === 'ball_lightning' || behavior === 'eye_of_winter' ? 16 : 11),
      aoeRadius: exec.radius,
      chainsLeft: behavior === 'lightning_arrow' ? Math.max(2, exec.chains) : exec.chains,
      pierceLeft: (behavior === 'ball_lightning' || behavior === 'eye_of_winter') ? 99 : (behavior === 'lightning_arrow' ? Math.max(2, exec.pierceCount || 0) : (exec.pierceCount || 0)),
      duration: dur, maxDuration: dur, pulseCd: 0.28, exec, hitIds: new Set(), castHits
    });
  }
}

function triggerVaalSkill(room, player) {
  if (player.dead || (player.vaalSouls || 0) < 60 || (player.vaalLockTimer || 0) > 0) return false;
  player.vaalSouls = 0;
  player.vaalLockTimer = 8.0; // 8-Second PoE Soul Gain Prevention Window

  const cls = GameData.CLASSES[player.classId] || GameData.CLASSES.Marauder;
  const vaalId = cls.vaalSkill || 'vaal_cyclone';
  const vaalDef = (GameData.VAAL_SKILLS && GameData.VAAL_SKILLS[vaalId]) || {
    id: vaalId, name: `Vaal ${cls.name} Cataclysm`,
    damageType: player.classId === 'Witch' ? 'lightning' : player.classId === 'Templar' ? 'fire' : 'physical',
    color: cls.glow || cls.color || '#ff6b4a'
  };

  const setups = GameData.getPlayerGemSetups(player.gemLinks);
  const baseExec = setups.length > 0
    ? buildSkillExecution(player, setups[0])
    : { active: { id: vaalId, damageType: vaalDef.damageType || 'physical' }, dmgMin: 35, dmgMax: 60, critChance: 20, critMulti: 1.75, lifeOnHit: 5, radius: 90 };

  const vaalExec = {
    ...baseExec, dmgMin: Math.round(baseExec.dmgMin * 2.4), dmgMax: Math.round(baseExec.dmgMax * 2.4),
    radius: 75, isVaal: true
  };

  const novaColor = vaalDef.color || cls.glow || '#ff6b4a';
  for (const r of [105, 175, 245]) {
    room.fxEvents.push({ kind: 'nova', x: Math.round(player.x), y: Math.round(player.y), r, color: novaColor });
  }

  // Class-specific Vaal Righteous Fire sacrifice & Vaal Cyclone vacuum
  if (vaalId === 'vaal_righteous_fire') {
    player.hp = Math.max(1, Math.round(player.hp * 0.85));
    player.es = Math.round((player.es || 0) * 0.85);
  }

  // Damage & stun nearby enemies within 245 units with High-Monster-Density Falloff (caps at 18 targets)
  let hits = 0;
  for (const m of Array.from(room.enemies.values())) {
    const d = dist(player.x, player.y, m.x, m.y);
    if (d <= 245 + m.radius) {
      if (vaalId === 'vaal_cyclone' && m.rarity !== 'boss' && !m.isRaidPylon && d > 48) {
        const pullAng = Math.atan2(player.y - m.y, player.x - m.x);
        m.x += Math.cos(pullAng) * Math.min(65, d - 42);
        m.y += Math.sin(pullAng) * Math.min(65, d - 42);
      }
      m.chillTimer = Math.max(m.chillTimer || 0, 2.5);
      m.actionTimer = Math.max(m.actionTimer || 0, 1.8);
      const falloff = 1 / (1 + Math.max(0, hits - 8) * 0.15);
      const { dmg, isCrit } = rollSkillDamage(vaalExec);
      damageEnemy(room, m, Math.max(1, Math.round(dmg * falloff)), isCrit, player, vaalExec.lifeOnHit, vaalDef.damageType || 'physical', false, true);
      if (++hits >= 18) break;
    }
  }

  // Spawn 8 non-chaining Vaal projectiles (flagged isVaalProj so they cannot generate Vaal souls)
  const ringCount = 8;
  for (let i = 0; i < ringCount; i++) {
    const ang = (Math.PI * 2 * i) / ringCount;
    const speed = 520;
    spawnProjectile(room, {
      id: uid('prj'), ownerId: player.id, skillId: baseExec.active ? baseExec.active.id : 'fireball',
      behavior: 'standard', isVaalProj: true, damageType: vaalDef.damageType || 'fire',
      x: player.x, y: player.y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, speed,
      radius: 13, aoeRadius: 48, chainsLeft: 0, pierceLeft: 1, duration: 0.78, maxDuration: 0.78,
      exec: vaalExec, hitIds: new Set()
    });
  }

  player.atkSeq = (player.atkSeq || 0) + 1;
  sendPrivateProfile(player);
  return true;
}

const exportsObj = { buildSkillExecution, spawnProjectile, triggerSkillSetup, triggerVaalSkill };
Object.assign(global, exportsObj);
module.exports = exportsObj;
