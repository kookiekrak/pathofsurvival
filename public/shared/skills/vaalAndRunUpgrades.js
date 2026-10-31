// Shared GameData Module: Vaal Skills & In-Run Upgrades
(function (exports) {
  // ============================================================================
  // 3. 7 VAAL ULTIMATE SKILLS
  // ============================================================================
  const VAAL_SKILLS = {
    vaal_ground_slam: {
      id: 'vaal_ground_slam',
      name: 'Vaal Ground Slam',
      soulCost: 45,
      damageType: 'physical',
      baseDamage: [145, 210],
      radius: 340,
      color: '#ff5c4d',
      description: 'Unleashes a cataclysmic 360-degree Karui tectonic upheaval that stuns and obliterates surrounding hordes.'
    },
    vaal_rain_of_arrows: {
      id: 'vaal_rain_of_arrows',
      name: 'Vaal Rain of Arrows',
      soulCost: 45,
      damageType: 'physical',
      baseDamage: [130, 195],
      radius: 360,
      projCount: 24,
      color: '#53f574',
      description: 'Darkens the sky with an inescapable barrage of pinned arrows across a massive radius, maiming all foes.'
    },
    vaal_arc: {
      id: 'vaal_arc',
      name: 'Vaal Arc',
      soulCost: 45,
      damageType: 'lightning',
      baseDamage: [120, 240],
      radius: 420,
      chains: 18,
      color: '#63a4ff',
      description: 'Releases a supercharged chain lightning tempest that arcs across up to 18 monsters with guaranteed Shock.'
    },
    vaal_cyclone: {
      id: 'vaal_cyclone',
      name: 'Vaal Cyclone',
      soulCost: 45,
      damageType: 'physical',
      baseDamage: [135, 200],
      radius: 320,
      duration: 3.0,
      color: '#ffa94d',
      description: 'Generates a gravitational blood-vacuum whirlwind that pulls nearby monsters inward and shreds them.'
    },
    vaal_righteous_fire: {
      id: 'vaal_righteous_fire',
      name: 'Vaal Righteous Fire',
      soulCost: 45,
      damageType: 'fire',
      baseDamage: [155, 225],
      radius: 350,
      duration: 4.0,
      color: '#ffd43b',
      description: 'Detonates a divine solar pillar of sacred flame around you and supercharges Spell & Burning damage.'
    },
    vaal_blade_vortex: {
      id: 'vaal_blade_vortex',
      name: 'Vaal Blade Vortex',
      soulCost: 45,
      damageType: 'physical',
      baseDamage: [140, 205],
      radius: 310,
      duration: 3.5,
      color: '#3bc9db',
      description: 'Unleashes a Relentless 10-blade autonomous razor storm that seeks and dices packs at extreme velocity.'
    },
    vaal_flameblast: {
      id: 'vaal_flameblast',
      name: 'Vaal Flameblast',
      soulCost: 45,
      damageType: 'fire',
      baseDamage: [165, 245],
      radius: 360,
      color: '#ff922b',
      description: 'Calls down an instant Stage-10 Atziri solar cataclysm that incinerates everything in a massive blast zone.'
    }
  };

  // ============================================================================
  // 3B. ROGUE-LITE IN-RUN PASSIVE BOONS (`RUN_UPGRADES`) — 24 VARIED, BALANCED BOONS
  // ============================================================================
  const RUN_UPGRADES = {
    up_move_speed: {
      id: 'up_move_speed',
      name: 'Quicksilver Stride',
      subtitle: 'MOBILITY BOON',
      color: 'G',
      maxRanks: 3,
      desc: '+7% Movement Speed & +5% Skill Cooldown Recovery',
      stats: { moveSpeedPct: 7, cdrPct: 5 }
    },
    up_extra_proj: {
      id: 'up_extra_proj',
      name: 'Split Quiver',
      subtitle: 'PROJECTILE TRADE-OFF BOON',
      color: 'G',
      maxRanks: 1,
      requireTags: ['Projectile'],
      desc: 'Fires +1 Additional Projectile, -8% Global Damage',
      stats: { extraProj: 1, globalDmgMulti: -8 }
    },
    up_chain_pierce: {
      id: 'up_chain_pierce',
      name: 'Ricochet Fletcher',
      subtitle: 'PROJECTILE BOON',
      color: 'G',
      maxRanks: 2,
      requireTags: ['Projectile', 'Chaining'],
      desc: 'Projectiles Pierce +1 Target & deal +10% Projectile Damage',
      stats: { pierceCount: 1, projDmgPct: 10 }
    },
    up_tailwind_volley: {
      id: 'up_tailwind_volley',
      name: 'Deadeye Tailwind',
      subtitle: 'PROJECTILE BOON',
      color: 'G',
      maxRanks: 3,
      requireTags: ['Projectile'],
      desc: '+12% Projectile Damage & +5% Movement Speed',
      stats: { projDmgPct: 12, moveSpeedPct: 5 }
    },
    up_phys_might: {
      id: 'up_phys_might',
      name: 'Karui Brutality',
      subtitle: 'PHYSICAL BOON',
      color: 'R',
      maxRanks: 3,
      requireTags: ['Physical'],
      desc: '+13% Physical Damage & +25 Armour',
      stats: { physDmgPct: 13, armor: 25 }
    },
    up_melee_fortify: {
      id: 'up_melee_fortify',
      name: 'Juggernaut Fortitude',
      subtitle: 'MELEE / SLAM BOON',
      color: 'R',
      maxRanks: 3,
      requireTags: ['Melee', 'Slam'],
      desc: '+50 Armour, +10% Physical Damage & +6% Area Radius',
      stats: { armor: 50, physDmgPct: 10, aoePct: 6 }
    },
    up_ele_overload: {
      id: 'up_ele_overload',
      name: 'Elemental Confluence',
      subtitle: 'ELEMENTAL BOON',
      color: 'B',
      maxRanks: 3,
      requireTags: ['Fire', 'Cold', 'Lightning'],
      desc: '+13% Elemental Damage & +4% Elemental Resistances',
      stats: { eleDmgPct: 13, allRes: 4 }
    },
    up_spell_weaver: {
      id: 'up_spell_weaver',
      name: 'Arcane Surge',
      subtitle: 'SPELLCASTER BOON',
      color: 'B',
      maxRanks: 3,
      requireTags: ['Spell'],
      desc: '+13% Spell Damage & +6% Cast Cooldown Recovery',
      stats: { spellDmgPct: 13, cdrPct: 6 }
    },
    up_crit_strikes: {
      id: 'up_crit_strikes',
      name: "Assassin's Mark",
      subtitle: 'CRITICAL BOON',
      color: 'G',
      maxRanks: 3,
      desc: '+18% Increased Critical Strike Chance & +12% Crit Multiplier',
      stats: { critChance: 18, critMultiPct: 12 }
    },
    up_attack_cast: {
      id: 'up_attack_cast',
      name: 'Onslaught Tempo',
      subtitle: 'HASTE BOON',
      color: 'G',
      maxRanks: 3,
      desc: '+8% Skill Cooldown Recovery & +4% Movement Speed',
      stats: { cdrPct: 8, moveSpeedPct: 4 }
    },
    up_aoe_reach: {
      id: 'up_aoe_reach',
      name: 'Carcass Amplify',
      subtitle: 'AREA BOON',
      color: 'B',
      maxRanks: 3,
      requireTags: ['AoE'],
      desc: '+11% Area of Effect Radius & +8% Area Damage',
      stats: { aoePct: 11, aoeDmgPct: 8 }
    },
    up_conc_blast: {
      id: 'up_conc_blast',
      name: 'Pendulum of Destruction',
      subtitle: 'AREA TRADE-OFF BOON',
      color: 'B',
      maxRanks: 2,
      requireTags: ['AoE'],
      desc: '+18% Area Damage, -6% Area of Effect Radius',
      stats: { aoeDmgPct: 18, aoePct: -6 }
    },
    up_armor_ward: {
      id: 'up_armor_ward',
      name: 'Granite Carapace',
      subtitle: 'DEFENCE BOON',
      color: 'R',
      maxRanks: 3,
      desc: '+55 Armour & +22 Maximum Life',
      stats: { armor: 55, maxHp: 22 }
    },
    up_evasion_mist: {
      id: 'up_evasion_mist',
      name: 'Wind Dancer Reflex',
      subtitle: 'EVASION BOON',
      color: 'G',
      maxRanks: 3,
      desc: '+65 Evasion Rating & +4% Dodge Chance',
      stats: { evasion: 65, dodgeChance: 4 }
    },
    up_life_regen: {
      id: 'up_life_regen',
      name: 'Consecrated Vitality',
      subtitle: 'SURVIVAL BOON',
      color: 'R',
      maxRanks: 3,
      desc: '+28 Maximum Life & +2.2 Life Regenerated per sec',
      stats: { maxHp: 28, lifeRegen: 2.2 }
    },
    up_es_barrier: {
      id: 'up_es_barrier',
      name: 'Discipline Ward',
      subtitle: 'WARD BOON',
      color: 'B',
      maxRanks: 3,
      desc: '+28 Maximum Energy Shield & +6% Elemental Resistances',
      stats: { maxEs: 28, allRes: 6 }
    },
    up_vampiric: {
      id: 'up_vampiric',
      name: 'Crimson Leech',
      subtitle: 'LEECH BOON',
      color: 'R',
      maxRanks: 2,
      desc: 'Restore +1 Life on Hit & +18 Maximum Life',
      stats: { lifeOnHit: 1, maxHp: 18 }
    },
    up_prism_res: {
      id: 'up_prism_res',
      name: 'Purity of Elements',
      subtitle: 'MITIGATION BOON',
      color: 'B',
      maxRanks: 3,
      desc: '+8% All Elemental Resistances & +18 Energy Shield',
      stats: { allRes: 8, maxEs: 18 }
    },
    up_glass_cannon: {
      id: 'up_glass_cannon',
      name: 'Abyssal Reckoning',
      subtitle: 'PACT TRADE-OFF BOON',
      color: 'R',
      maxRanks: 2,
      desc: '+16% MORE Global Damage, -25 Maximum Life',
      stats: { globalDmgMulti: 16, maxHp: -25 }
    },
    up_iron_fortress: {
      id: 'up_iron_fortress',
      name: 'Unbreakable Bastion',
      subtitle: 'FORTRESS TRADE-OFF BOON',
      color: 'R',
      maxRanks: 2,
      desc: '+42 Maximum Life & +75 Armour, -5% Movement Speed',
      stats: { maxHp: 42, armor: 75, moveSpeedPct: -5 }
    },
    up_vaal_harvester: {
      id: 'up_vaal_harvester',
      name: 'Soul Catcher',
      subtitle: 'VAAL BOON',
      color: 'R',
      maxRanks: 2,
      desc: '+35% Vaal Souls Gained on Kill & +8% Skill Cooldown Recovery',
      stats: { vaalSoulGainPct: 35, cdrPct: 8 }
    },
    up_chemist_flasks: {
      id: 'up_chemist_flasks',
      name: 'Pathfinder Alchemist',
      subtitle: 'FLASK BOON',
      color: 'G',
      maxRanks: 2,
      desc: '+45% Flask Charges Gained & +6% Movement Speed',
      stats: { flaskChargeGainPct: 45, moveSpeedPct: 6 }
    },
    up_culling_exec: {
      id: 'up_culling_exec',
      name: "Slayer's Execution",
      subtitle: 'EXECUTION BOON',
      color: 'R',
      maxRanks: 1,
      desc: 'Culls Non-Boss Monsters below 12% Life on Hit & +8% Damage',
      stats: { cullingStrike: 1, physDmgPct: 8, eleDmgPct: 8 }
    },
    up_aurum_greed: {
      id: 'up_aurum_greed',
      name: 'Perandus Coffer',
      subtitle: 'WEALTH BOON',
      color: 'G',
      maxRanks: 2,
      desc: '+35% Run Gold Gained from Monsters & +25 Evasion/Armour',
      stats: { goldGainPct: 35, armor: 25, evasion: 25 }
    },
    up_gilded_bounty: {
      id: 'up_gilded_bounty',
      name: 'Gilded Momentum',
      subtitle: 'WEALTH & SPEED BOON',
      color: 'G',
      maxRanks: 2,
      desc: '+25% Run Gold Gained, +10% Movement Speed & +12% Global Damage',
      stats: { goldGainPct: 25, moveSpeedPct: 10, physDmgPct: 12, eleDmgPct: 12 }
    }
  };

  Object.assign(exports, { VAAL_SKILLS, RUN_UPGRADES });
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : (global.GameData = global.GameData || exports));
