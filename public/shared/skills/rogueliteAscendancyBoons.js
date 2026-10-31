// Shared GameData Module: Build-Defining Ascendancy & Proc Roguelite Run Boons
(function (exports) {
  const ASCENDANCY_RUN_UPGRADES = {
    up_herald_ash: {
      id: 'up_herald_ash',
      name: 'Herald of Ash',
      subtitle: 'ASCENDANCY ON-KILL PROC',
      color: 'R',
      maxRanks: 2,
      desc: 'Slain enemies detonate in a Fiery Overkill Nova (18% Max HP) + 16% Fire & Physical Damage',
      stats: { heraldAsh: 1, physDmgPct: 16, eleDmgPct: 16 }
    },
    up_herald_ice: {
      id: 'up_herald_ice',
      name: 'Herald of Ice',
      subtitle: 'ASCENDANCY SHATTER PROC',
      color: 'G',
      maxRanks: 2,
      desc: 'Slain enemies Shatter in an Ice Nova that Chills nearby foes + 22% Crit Chance',
      stats: { heraldIce: 1, critChance: 22, eleDmgPct: 14 }
    },
    up_herald_thunder: {
      id: 'up_herald_thunder',
      name: 'Herald of Thunder',
      subtitle: 'ASCENDANCY STORM PROC',
      color: 'B',
      maxRanks: 2,
      desc: 'Calls down automatic Lightning Storm bolts on nearby enemies every 0.8s + 16% Elemental Damage',
      stats: { heraldThunder: 1, eleDmgPct: 16 }
    },
    up_mirage_echo: {
      id: 'up_mirage_echo',
      name: 'Mirage Echo Repeater',
      subtitle: 'ASCENDANCY ECHO BOON',
      color: 'B',
      maxRanks: 1,
      desc: 'Skills have a 50% chance to fire an instant Echo Repeat cast + 10% Cooldown Recovery',
      stats: { mirageEcho: 1, cdrPct: 10 }
    },
    up_nova_ring: {
      id: 'up_nova_ring',
      name: 'Sire of Shards Volley',
      subtitle: 'PROJECTILE KEYSTONE BOON',
      color: 'G',
      maxRanks: 1,
      requireTags: ['Projectile'],
      desc: 'Fires +2 Additional Projectiles in a wide arc & +15% Area Radius, -6% Global Damage',
      stats: { extraProj: 2, aoePct: 15, globalDmgMulti: -6 }
    },
    up_cast_on_crit: {
      id: 'up_cast_on_crit',
      name: 'Cast on Critical Strike',
      subtitle: 'TRIGGER PROC BOON',
      color: 'G',
      maxRanks: 2,
      desc: 'Critical Strikes call down an Arcane Lightning Bolt on the target + 25% Crit Chance',
      stats: { castOnCrit: 1, critChance: 25, critMultiPct: 15 }
    },
    up_abberath_steps: {
      id: 'up_abberath_steps',
      name: "Abberath's Fury Hooves",
      subtitle: 'MOVEMENT PROC BOON',
      color: 'R',
      maxRanks: 2,
      desc: 'Moving unleashes Fiery Hoof-Stomps every 0.45s that scorch nearby foes + 10% Move Speed',
      stats: { abberathSteps: 1, moveSpeedPct: 10, aoeDmgPct: 12 }
    },
    up_soul_eater: {
      id: 'up_soul_eater',
      name: 'Soul Eater Pact',
      subtitle: 'ASCENDANCY FRENZY BOON',
      color: 'B',
      maxRanks: 2,
      desc: '+14% Cooldown Recovery, +12% Area Radius, +8% Move Speed & +30% Vaal Souls Gained',
      stats: { cdrPct: 14, aoePct: 12, moveSpeedPct: 8, vaalSoulGainPct: 30 }
    },
    up_trinity_resonance: {
      id: 'up_trinity_resonance',
      name: 'Trinity Resonance',
      subtitle: 'ELEMENTAL ASCENDANCY',
      color: 'B',
      maxRanks: 2,
      desc: '+18% MORE Global Damage & +10% All Elemental Resistances',
      stats: { globalDmgMulti: 18, allRes: 10 }
    },
    up_adrenaline_rush: {
      id: 'up_adrenaline_rush',
      name: "Champion's Adrenaline",
      subtitle: 'WARLORD ASCENDANCY',
      color: 'R',
      maxRanks: 2,
      desc: '+16% MORE Global Damage, +10% Move Speed, +55 Armour & +3 Life on Hit',
      stats: { globalDmgMulti: 16, moveSpeedPct: 10, armor: 55, lifeOnHit: 3 }
    },
    up_ricochet_chain: {
      id: 'up_ricochet_chain',
      name: 'Deadeye Ricochet',
      subtitle: 'PROJECTILE ASCENDANCY',
      color: 'G',
      maxRanks: 2,
      requireTags: ['Projectile', 'Chaining'],
      desc: 'Projectiles Chain +1 additional time, Pierce +1 Target & deal +14% Projectile Damage',
      stats: { extraChain: 1, pierceCount: 1, projDmgPct: 14 }
    },
    up_profane_pact: {
      id: 'up_profane_pact',
      name: 'Profane Bloom Hex',
      subtitle: 'OCCULTIST ON-KILL PROC',
      color: 'B',
      maxRanks: 2,
      desc: 'Slain enemies have a 40% chance to detonate in a Chaos Hex Nova (22% Max HP) + 14% Area Radius',
      stats: { profaneBloom: 1, aoePct: 14, spellDmgPct: 15 }
    },
    up_consecrated_trail: {
      id: 'up_consecrated_trail',
      name: 'Inquisitor Sanctuary',
      subtitle: 'TEMPLAR ASCENDANCY',
      color: 'R',
      maxRanks: 2,
      desc: 'Regenerate +5.5 Life/sec, +35 Maximum Energy Shield & +28% Critical Strike Chance',
      stats: { lifeRegen: 5.5, maxEs: 35, critChance: 28 }
    },
    up_berserker_rage: {
      id: 'up_berserker_rage',
      name: 'Rite of Ruin',
      subtitle: 'BERSERKER TRADE-OFF BOON',
      color: 'R',
      maxRanks: 2,
      desc: '+24% MORE Global Damage & +14% Cooldown Recovery, -1.5 Life Regenerated/sec',
      stats: { globalDmgMulti: 24, cdrPct: 14, lifeRegen: -1.5 }
    },
    up_wardloop_aegis: {
      id: 'up_wardloop_aegis',
      name: 'Aegis Aurora Bastion',
      subtitle: 'DEFENSIVE ASCENDANCY',
      color: 'B',
      maxRanks: 2,
      desc: '+85 Armour, +45 Maximum Energy Shield & +2 Life/ES Gained on Hit',
      stats: { armor: 85, maxEs: 45, lifeOnHit: 2 }
    }
  };

  exports.RUN_UPGRADES = Object.assign(exports.RUN_UPGRADES || {}, ASCENDANCY_RUN_UPGRADES);
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : (global.GameData = global.GameData || exports));
