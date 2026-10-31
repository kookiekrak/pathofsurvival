// Server Combat Module: Active Skill Setup Execution & Vaal Ultimate Triggers
const GameData = global.GameData || require('../../public/shared/gameData.js');

function triggerSkillSetup(room, player, exec) {
  const active = exec.active;
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

  // 6. Molten Strike (Immediate melee hit + 3+ lobbed magma projectiles)
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
      room.fxEvents.push({
        kind: 'nova',
        x: Math.round(player.x + Math.cos(baseAngle) * 28),
        y: Math.round(player.y + Math.sin(baseAngle) * 28),
        r: 44,
        color: '#ff6b4a'
      });
    }
  }

  const count = Math.max(1, exec.projCount);
  const spreadTotal = Math.min(Math.PI * 0.85, (count - 1) * 0.16);
  const behavior = active.id === 'lightning_arrow' ? 'lightning_arrow' : active.behavior;

  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : -spreadTotal / 2 + (spreadTotal / (count - 1)) * i;
    const ang = baseAngle + offset;
    const speed = active.projSpeed || 520;

    room.projectiles.push({
      id: uid('prj'),
      ownerId: player.id,
      skillId: active.id,
      behavior,
      damageType: active.damageType,
      x: player.x,
      y: player.y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      speed,
      radius: behavior === 'sunder_wave' ? exec.radius : 11,
      aoeRadius: exec.radius,
      chainsLeft: behavior === 'lightning_arrow' ? Math.max(2, exec.chains) : exec.chains,
      pierceLeft: behavior === 'lightning_arrow' ? Math.max(2, exec.pierceCount || 0) : (exec.pierceCount || 0),
      duration: active.duration || 0.85,
      maxDuration: active.duration || 0.85,
      exec,
      hitIds: new Set()
    });
  }
}

function triggerVaalSkill(room, player) {
  if (player.dead || (player.vaalSouls || 0) < 45) return false;
  player.vaalSouls = 0;

  const cls = GameData.CLASSES[player.classId] || GameData.CLASSES.Marauder;
  const vaalId = cls.vaalSkill || 'vaal_cyclone';
  const vaalDef = (GameData.VAAL_SKILLS && GameData.VAAL_SKILLS[vaalId]) || {
    id: vaalId,
    name: `Vaal ${cls.name} Cataclysm`,
    damageType: player.classId === 'Witch' ? 'lightning' : player.classId === 'Templar' ? 'fire' : 'physical',
    color: cls.glow || cls.color || '#ff6b4a'
  };

  const setups = GameData.getPlayerGemSetups(player.gemLinks);
  const baseExec = setups.length > 0
    ? buildSkillExecution(player, setups[0])
    : {
        active: { id: vaalId, damageType: vaalDef.damageType || 'physical' },
        dmgMin: 35,
        dmgMax: 60,
        critChance: 20,
        critMulti: 1.75,
        lifeOnHit: 5,
        radius: 90
      };

  const vaalExec = {
    ...baseExec,
    dmgMin: Math.round(baseExec.dmgMin * 3.5),
    dmgMax: Math.round(baseExec.dmgMax * 3.5),
    radius: 85
  };

  // 1. Emit 3 concentric shockwave novas
  const novaColor = vaalDef.color || cls.glow || '#ff6b4a';
  for (const r of [110, 185, 260]) {
    room.fxEvents.push({
      kind: 'nova',
      x: Math.round(player.x),
      y: Math.round(player.y),
      r,
      color: novaColor
    });
  }

  // 2. Damage & stun/freeze all enemies within 260 units for 3.5x skill damage
  for (const m of Array.from(room.enemies.values())) {
    if (dist(player.x, player.y, m.x, m.y) <= 260 + m.radius) {
      m.chillTimer = Math.max(m.chillTimer || 0, 3.0);
      m.actionTimer = Math.max(m.actionTimer || 0, 2.5);
      const { dmg, isCrit } = rollSkillDamage(vaalExec);
      damageEnemy(room, m, dmg, isCrit, player, vaalExec.lifeOnHit, vaalDef.damageType || 'physical');
    }
  }

  // 3. Spawn a massive screen-clearing ring of 16 projectiles
  const ringCount = 16;
  for (let i = 0; i < ringCount; i++) {
    const ang = (Math.PI * 2 * i) / ringCount;
    const speed = 560;
    room.projectiles.push({
      id: uid('prj'),
      ownerId: player.id,
      skillId: baseExec.active ? baseExec.active.id : 'fireball',
      behavior: 'fireball_explode',
      damageType: vaalDef.damageType || 'fire',
      x: player.x,
      y: player.y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      speed,
      radius: 14,
      aoeRadius: 65,
      chainsLeft: 1,
      pierceLeft: 1,
      duration: 1.05,
      maxDuration: 1.05,
      exec: vaalExec,
      hitIds: new Set()
    });
  }

  player.atkSeq = (player.atkSeq || 0) + 1;
  sendPrivateProfile(player);
  return true;
}

const exportsObj = { triggerSkillSetup, triggerVaalSkill };
Object.assign(global, exportsObj);
module.exports = exportsObj;
