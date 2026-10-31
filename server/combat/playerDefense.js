// Server Combat Module: Righteous Fire Aura Radius & Player Defense/Mitigation/Evasion
const GameData = global.GameData || require('../../public/shared/gameData.js');

function getPlayerRfRadius(player) {
  const setups = GameData.getPlayerGemSetups(player.gemLinks);
  for (const s of setups) {
    if (s.active.id === 'righteous_fire') {
      const exec = buildSkillExecution(player, s);
      return exec.radius;
    }
  }
  if (player.stats && player.stats.kaomsFireBonus > 0) {
    return 115;
  }
  return 0;
}

function applyDamageToPlayer(room, player, rawDamage, dmgType, ignoreEvade = false) {
  if (player.dashTimer > 0 || (player.graceTimer || 0) > 0 || (player.hitGraceTimer || 0) > 0) return;
  const s = player.stats;

  // Naked Vulnerability Penalty: Fighting with 0 equipped gear pieces increases incoming damage by 35% and disables evasion!
  const isNaked = (s.equippedCount || 0) === 0;
  if (isNaked) {
    rawDamage = Math.round(rawDamage * 1.35);
  }

  // Lori's Lantern Unlucky Enemy Damage (-25% incoming damage when below 65% Life)
  if (s.lorisLucky > 0 && player.hp <= player.maxHp * 0.65) {
    rawDamage = Math.max(1, Math.round(rawDamage * 0.75));
  }
  // The Brass Dome Bulwark (-20% incoming damage from enemy hits & slams)
  if (s.brassDome > 0) {
    rawDamage = Math.max(1, Math.round(rawDamage * 0.8));
  }

  if (!ignoreEvade && !isNaked) {
    const evadeChance = Math.min(60, (s.dodgeChance || 0) + Math.floor(s.evasion / (s.evasion + 240) * 48));
    if (Math.random() * 100 < evadeChance) {
      room.fxEvents.push({
        kind: 'dmg_num',
        x: Math.round(player.x),
        y: Math.round(player.y - 20),
        val: 'EVADE',
        crit: false,
        dtype: 'evade'
      });
      return;
    }
  }

  // Grant 0.22s anti-shotgun hit grace window so identical-tick overlaps don't instakill, while surrounds remain lethal!
  player.hitGraceTimer = isNaked ? 0.14 : 0.22;

  // Reset PoE Energy Shield recharge delay whenever hit (unless Shavronne's Wrappings is equipped!)
  if (!s.shavronneWard) {
    player.esDelayTimer = s.esRechargeFast ? 1.0 : 2.2;
  } else if ((player.shavNovaCd || 0) <= 0) {
    player.shavNovaCd = 0.85;
    const novaDmg = Math.round((45 + (player.level || 1) * 12) * (1 + (s.spellDmgPct || 0) / 100));
    room.fxEvents.push({
      kind: 'nova',
      x: Math.round(player.x),
      y: Math.round(player.y),
      r: 115,
      color: '#74c0fc'
    });
    for (const m of Array.from(room.enemies.values())) {
      if (dist(player.x, player.y, m.x, m.y) <= 115 + m.radius) {
        damageEnemy(room, m, novaDmg, false, player, 0, 'lightning');
      }
    }
  }

  let mitigated = rawDamage;
  if (dmgType === 'physical') {
    const armorRed = Math.min(0.65, s.armor / (s.armor + rawDamage * 12));
    mitigated = Math.max(2, Math.round(rawDamage * (1 - armorRed)));
  } else {
    mitigated = Math.max(2, Math.round(rawDamage * (1 - (s.allRes || 0) / 100)));
  }

  if (player.es > 0) {
    const esAbsorb = Math.min(player.es, mitigated);
    player.es -= esAbsorb;
    mitigated -= esAbsorb;
  }
  player.hp -= mitigated;

  room.fxEvents.push({
    kind: 'dmg_num',
    x: Math.round(player.x),
    y: Math.round(player.y - 24),
    val: `-${rawDamage}`,
    crit: false,
    dtype: 'player_hit'
  });

  if (player.hp <= 0) {
    player.hp = 0;
    player.dead = true;
    player.reviveProgress = 0;
  }
}

const exportsObj = { getPlayerRfRadius, applyDamageToPlayer };
Object.assign(global, exportsObj);
module.exports = exportsObj;
