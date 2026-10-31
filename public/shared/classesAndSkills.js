// Shared GameData Module
(function (exports) {

  // ============================================================================
  // 1. ALL 7 ICONIC PATH OF EXILE 1 CLASSES
  // ============================================================================
  const CLASSES = {
    Marauder: {
      id: 'Marauder',
      name: 'Marauder',
      title: 'Juggernaut',
      color: '#c92a2a',
      glow: '#ff5c4d',
      startNode: 'start_str',
      starterSkill: 'sunder',
      vaalSkill: 'vaal_ground_slam',
      baseStats: {
        str: 32,
        dex: 14,
        int: 14,
        maxLife: 140,
        maxEs: 0,
        armor: 24,
        evasion: 10,
        moveSpeed: 184,
        critChance: 5.0,
        critMulti: 150,
        lifeRegen: 2.0
      },
      description: 'Karui Juggernaut of pure Strength, towering Life & Armour, and earth-shattering Physical & Fire slams.'
    },
    Ranger: {
      id: 'Ranger',
      name: 'Ranger',
      title: 'Deadeye',
      color: '#2b8a3e',
      glow: '#53f574',
      startNode: 'start_dex',
      starterSkill: 'tornado_shot',
      vaalSkill: 'vaal_rain_of_arrows',
      baseStats: {
        str: 14,
        dex: 32,
        int: 14,
        maxLife: 115,
        maxEs: 10,
        armor: 10,
        evasion: 45,
        moveSpeed: 192,
        critChance: 7.0,
        critMulti: 160,
        lifeRegen: 1.5
      },
      description: 'Deadeye marksman of pure Dexterity, high Evasion, tailwind speed, and screen-filling arrow volleys.'
    },
    Witch: {
      id: 'Witch',
      name: 'Witch',
      title: 'Elementalist',
      color: '#1971c2',
      glow: '#63a4ff',
      startNode: 'start_int',
      starterSkill: 'arc',
      vaalSkill: 'vaal_arc',
      baseStats: {
        str: 14,
        dex: 14,
        int: 32,
        maxLife: 110,
        maxEs: 48,
        armor: 8,
        evasion: 12,
        moveSpeed: 185,
        critChance: 6.5,
        critMulti: 155,
        lifeRegen: 1.2
      },
      description: 'Elementalist of pure Intelligence, deep Energy Shield wards, and cataclysmic Chaining & Elemental spells.'
    },
    Duelist: {
      id: 'Duelist',
      name: 'Duelist',
      title: 'Slayer',
      color: '#e67700',
      glow: '#ffa94d',
      startNode: 'start_str_dex',
      starterSkill: 'cyclone',
      vaalSkill: 'vaal_cyclone',
      baseStats: {
        str: 23,
        dex: 23,
        int: 14,
        maxLife: 130,
        maxEs: 0,
        armor: 18,
        evasion: 28,
        moveSpeed: 188,
        critChance: 6.0,
        critMulti: 155,
        lifeOnHit: 2,
        lifeRegen: 1.8
      },
      description: 'Arena Slayer blending Strength and Dexterity for relentless spinning velocity, culling strikes, and Life Leech.'
    },
    Templar: {
      id: 'Templar',
      name: 'Templar',
      title: 'Inquisitor',
      color: '#d9a520',
      glow: '#ffd43b',
      startNode: 'start_str_int',
      starterSkill: 'righteous_fire',
      vaalSkill: 'vaal_righteous_fire',
      baseStats: {
        str: 23,
        dex: 14,
        int: 23,
        maxLife: 128,
        maxEs: 32,
        armor: 20,
        evasion: 10,
        moveSpeed: 184,
        critChance: 6.5,
        critMulti: 155,
        lifeRegen: 2.8
      },
      description: 'Theopolis Inquisitor uniting Strength and Intelligence with sacred Righteous Fire and Consecrated regeneration.'
    },
    Shadow: {
      id: 'Shadow',
      name: 'Shadow',
      title: 'Assassin',
      color: '#1098ad',
      glow: '#3bc9db',
      startNode: 'start_dex_int',
      starterSkill: 'spectral_throw',
      vaalSkill: 'vaal_blade_vortex',
      baseStats: {
        str: 14,
        dex: 23,
        int: 23,
        maxLife: 115,
        maxEs: 30,
        armor: 10,
        evasion: 36,
        moveSpeed: 190,
        critChance: 8.0,
        critMulti: 170,
        lifeRegen: 1.5
      },
      description: 'Deadly Assassin fusing Dexterity and Intelligence for lethal Critical Strikes, elusive speed, and spinning blades.'
    },
    Scion: {
      id: 'Scion',
      name: 'Scion',
      title: 'Ascendant',
      color: '#e8c26b',
      glow: '#fff3bf',
      startNode: 'start_scion',
      starterSkill: 'fireball',
      vaalSkill: 'vaal_flameblast',
      extraPassivePoints: 1,
      baseStats: {
        str: 20,
        dex: 20,
        int: 20,
        maxLife: 124,
        maxEs: 25,
        armor: 16,
        evasion: 20,
        moveSpeed: 186,
        critChance: 6.0,
        critMulti: 155,
        lifeRegen: 1.8
      },
      description: 'Oriath Ascendant at the center of the Passive Tree with balanced attributes and +1 extra starting Passive Point.'
    }
  };

  // ============================================================================
  // 2. 12 ACTIVE SKILL GEMS & 12 SUPPORT GEMS
  // ============================================================================
  const SKILL_GEMS = {
    // --- 12 ACTIVE SKILL GEMS ---
    sunder: {
      id: 'sunder',
      name: 'Sunder',
      type: 'active',
      color: 'R',
      tags: ['Attack', 'AoE', 'Physical', 'Melee', 'Slam'],
      cooldown: 0.92,
      baseDamage: [12, 18],
      damageType: 'physical',
      projCount: 1,
      projSpeed: 540,
      radius: 52,
      duration: 0.72,
      behavior: 'sunder_wave',
      description: 'Slams the ground, sending a cascading fault line that erupts shockwaves on every monster hit.'
    },
    cyclone: {
      id: 'cyclone',
      name: 'Cyclone',
      type: 'active',
      color: 'G',
      tags: ['Attack', 'AoE', 'Physical', 'Melee', 'Movement'],
      cooldown: 0.42,
      baseDamage: [6, 10],
      damageType: 'physical',
      projCount: 1,
      projSpeed: 0,
      radius: 108,
      duration: 0.42,
      behavior: 'cyclone_spin',
      description: 'Spins in a relentless 360-degree whirlwind of steel, rapidly cleaving all surrounding enemies.'
    },
    molten_strike: {
      id: 'molten_strike',
      name: 'Molten Strike',
      type: 'active',
      color: 'R',
      tags: ['Attack', 'Projectile', 'AoE', 'Fire', 'Melee'],
      cooldown: 0.88,
      baseDamage: [9, 15],
      damageType: 'fire',
      projCount: 4,
      projSpeed: 390,
      radius: 42,
      duration: 0.65,
      behavior: 'molten_lob',
      description: 'Strikes with volcanic fury and launches arcing magma spheres that detonate on impact.'
    },
    ice_nova: {
      id: 'ice_nova',
      name: 'Ice Nova',
      type: 'active',
      color: 'B',
      tags: ['Spell', 'AoE', 'Cold'],
      cooldown: 0.95,
      baseDamage: [11, 18],
      damageType: 'cold',
      projCount: 1,
      projSpeed: 0,
      radius: 145,
      duration: 0.45,
      behavior: 'ice_nova_ring',
      description: 'Expands a 360-degree freezing frost nova around you, chilling and shattering surrounding packs.'
    },
    tornado_shot: {
      id: 'tornado_shot',
      name: 'Tornado Shot',
      type: 'active',
      color: 'G',
      tags: ['Attack', 'Projectile', 'Physical', 'Bow'],
      cooldown: 0.90,
      baseDamage: [10, 16],
      damageType: 'physical',
      projCount: 1,
      projSpeed: 640,
      secondaryCount: 6,
      radius: 28,
      duration: 0.44,
      behavior: 'tornado_burst',
      description: 'Fires a piercing arrow that bursts into 6 secondary arrows in a 360-degree storm.'
    },
    lightning_arrow: {
      id: 'lightning_arrow',
      name: 'Lightning Arrow',
      type: 'active',
      color: 'G',
      tags: ['Attack', 'Projectile', 'AoE', 'Lightning', 'Bow'],
      cooldown: 0.82,
      baseDamage: [7, 17],
      damageType: 'lightning',
      projCount: 2,
      projSpeed: 720,
      chains: 2,
      radius: 95,
      duration: 0.70,
      behavior: 'lightning_arrow',
      description: 'Fires charged arrows that pierce targets and call down shocking bolts onto nearby monsters on hit.'
    },
    spectral_throw: {
      id: 'spectral_throw',
      name: 'Spectral Throw',
      type: 'active',
      color: 'G',
      tags: ['Attack', 'Projectile', 'Physical'],
      cooldown: 0.86,
      baseDamage: [10, 16],
      damageType: 'physical',
      projCount: 2,
      projSpeed: 530,
      radius: 28,
      duration: 1.25,
      behavior: 'boomerang',
      description: 'Hurls spinning spectral blades that decelerate at their apex and boomerang back through packs.'
    },
    blade_vortex: {
      id: 'blade_vortex',
      name: 'Blade Vortex',
      type: 'active',
      color: 'G',
      tags: ['Spell', 'AoE', 'Physical', 'Duration'],
      cooldown: 0.45,
      baseDamage: [6, 10],
      damageType: 'physical',
      projCount: 3,
      projSpeed: 420,
      radius: 112,
      duration: 1.8,
      behavior: 'blade_vortex',
      description: 'Conjures ethereal spinning blades that orbit closely around you, shredding every enemy in reach.'
    },
    fireball: {
      id: 'fireball',
      name: 'Fireball',
      type: 'active',
      color: 'B',
      tags: ['Spell', 'Projectile', 'AoE', 'Fire'],
      cooldown: 0.94,
      baseDamage: [12, 19],
      damageType: 'fire',
      projCount: 1,
      projSpeed: 560,
      radius: 62,
      duration: 1.0,
      behavior: 'fireball_explode',
      description: 'Unleashes a volatile solar orb that detonates in a massive fiery conflagration on impact.'
    },
    arc: {
      id: 'arc',
      name: 'Arc',
      type: 'active',
      color: 'B',
      tags: ['Spell', 'Lightning', 'Chaining'],
      cooldown: 0.88,
      baseDamage: [6, 20],
      damageType: 'lightning',
      projCount: 1,
      chains: 4,
      radius: 270,
      duration: 0.35,
      behavior: 'arc_chain',
      description: 'Lashes a high-voltage bolt of lightning that chains across multiple nearby monsters.'
    },
    spark: {
      id: 'spark',
      name: 'Spark',
      type: 'active',
      color: 'B',
      tags: ['Spell', 'Projectile', 'Lightning', 'Duration'],
      cooldown: 0.78,
      baseDamage: [5, 15],
      damageType: 'lightning',
      projCount: 5,
      projSpeed: 420,
      radius: 18,
      duration: 2.1,
      behavior: 'spark_erratic',
      description: 'Releases erratic lightning spiders that skitter and ricochet rapidly across the arena.'
    },
    righteous_fire: {
      id: 'righteous_fire',
      name: 'Righteous Fire',
      type: 'active',
      color: 'B',
      tags: ['Spell', 'AoE', 'Fire', 'Aura'],
      cooldown: 0.42,
      baseDamage: [5, 9],
      damageType: 'fire',
      projCount: 1,
      radius: 118,
      duration: 0.42,
      behavior: 'rf_aura',
      description: 'Engulfs you in a persistent ring of sacred fire that continuously incinerates nearby enemies.'
    },

    // --- 17 SUPPORT SKILL GEMS (STRICT TAG COMPATIBILITY WITH ACTIVE SKILLS) ---
    gmp: {
      id: 'gmp',
      name: 'Greater Multiple Projectiles',
      short: 'GMP',
      type: 'support',
      color: 'G',
      tags: ['Projectile'],
      requireTags: ['Projectile'],
      excludeTags: ['Aura'],
      mods: {
        extraProjectiles: 2,
        damageMulti: 0.78
      },
      description: 'Supported Projectile Skills fire +2 additional Projectiles (22% less per-hit damage).'
    },
    multistrike: {
      id: 'multistrike',
      name: 'Multistrike Support',
      short: 'MLT',
      type: 'support',
      color: 'R',
      tags: ['Attack', 'Melee'],
      requireTags: ['Melee', 'Slam'],
      excludeTags: ['Aura', 'Spell', 'Bow'],
      mods: {
        repeatCount: 1,
        cooldownMulti: 0.88,
        damageMulti: 0.82
      },
      description: 'Supported Melee Attack Skills repeat an additional strike and attack 12% faster (18% less per-hit damage).'
    },
    spell_echo: {
      id: 'spell_echo',
      name: 'Spell Echo Support',
      short: 'ECH',
      type: 'support',
      color: 'B',
      tags: ['Spell'],
      requireTags: ['Spell'],
      excludeTags: ['Aura', 'Attack'],
      mods: {
        repeatCount: 1,
        cooldownMulti: 0.88,
        damageMulti: 0.82
      },
      description: 'Supported Spells repeat an additional cast and recover 12% faster (18% less per-hit damage).'
    },
    chain: {
      id: 'chain',
      name: 'Chain Support',
      short: 'CHN',
      type: 'support',
      color: 'G',
      tags: ['Projectile', 'Chaining'],
      requireTags: ['Projectile', 'Chaining'],
      excludeTags: ['Aura', 'Slam', 'Melee'],
      mods: {
        extraChains: 2,
        damageMulti: 0.84
      },
      description: 'Supported Projectile & Chaining Skills Chain +2 times to nearby monsters (16% less per-hit damage).'
    },
    fork: {
      id: 'fork',
      name: 'Fork & Pierce Support',
      short: 'FRK',
      type: 'support',
      color: 'G',
      tags: ['Projectile'],
      requireTags: ['Projectile'],
      excludeTags: ['Aura'],
      mods: {
        fork: 1,
        extraPierce: 1,
        extraProjectiles: 1,
        damageMulti: 0.94
      },
      description: 'Supported Projectiles Pierce +1 target and fire +1 split projectile (6% less per-hit damage).'
    },
    faster_attacks: {
      id: 'faster_attacks',
      name: 'Faster Attacks Support',
      short: 'FAS',
      type: 'support',
      color: 'G',
      tags: ['Attack'],
      requireTags: ['Attack'],
      excludeTags: ['Aura', 'Spell'],
      mods: {
        cooldownMulti: 0.83,
        damageMulti: 1.06
      },
      description: 'Supported Attack Skills recover cooldown 17% faster and deal 6% More Attack Damage.'
    },
    faster_casting: {
      id: 'faster_casting',
      name: 'Faster Casting Support',
      short: 'FCS',
      type: 'support',
      color: 'B',
      tags: ['Spell'],
      requireTags: ['Spell'],
      excludeTags: ['Aura', 'Attack'],
      mods: {
        cooldownMulti: 0.83,
        damageMulti: 1.06
      },
      description: 'Supported Spells recover cooldown 17% faster and deal 6% More Spell Damage.'
    },
    brutality: {
      id: 'brutality',
      name: 'Brutality Support',
      short: 'BRT',
      type: 'support',
      color: 'R',
      tags: ['Physical'],
      requireTags: ['Physical'],
      excludeTags: ['Fire', 'Cold', 'Lightning', 'Aura'],
      mods: {
        damageMulti: 1.18
      },
      description: 'Supported Physical Skills deal 18% MORE Physical Damage.'
    },
    elem_focus: {
      id: 'elem_focus',
      name: 'Elemental Focus Support',
      short: 'ELF',
      type: 'support',
      color: 'B',
      tags: ['Fire', 'Cold', 'Lightning'],
      requireTags: ['Fire', 'Cold', 'Lightning'],
      excludeTags: [],
      mods: {
        damageMulti: 1.18
      },
      description: 'Supported Elemental Skills deal 18% MORE Elemental Damage.'
    },
    efficacy: {
      id: 'efficacy',
      name: 'Burning & Efficacy Support',
      short: 'EFF',
      type: 'support',
      color: 'B',
      tags: ['Aura', 'Duration', 'Fire', 'Spell'],
      requireTags: ['Aura', 'Duration', 'Fire', 'Spell'],
      excludeTags: [],
      mods: {
        areaMulti: 1.14,
        damageMulti: 1.15
      },
      description: 'Supported Aura, Fire & Spell Skills deal 15% MORE Damage with +14% increased Area & Duration.'
    },
    added_fire: {
      id: 'added_fire',
      name: 'Added Fire & Ignite Support',
      short: 'FIR',
      type: 'support',
      color: 'R',
      tags: ['Attack', 'Spell', 'Fire', 'Physical'],
      requireTags: ['Attack', 'Spell'],
      excludeTags: ['Aura'],
      mods: {
        flatBonusDamage: 3,
        flatFire: 3,
        igniteChance: 30,
        damageMulti: 1.12
      },
      description: 'Adds +3 flat Fire Damage, 12% More Damage, and 30% chance to Ignite enemies.'
    },
    added_cold: {
      id: 'added_cold',
      name: 'Hypothermia & Chill Support',
      short: 'CLD',
      type: 'support',
      color: 'G',
      tags: ['Attack', 'Spell', 'Cold', 'Projectile', 'AoE'],
      requireTags: ['Attack', 'Spell'],
      excludeTags: ['Aura'],
      mods: {
        flatBonusDamage: 3,
        flatCold: 3,
        chillEffect: 1,
        shatterOnKill: 1,
        damageMulti: 1.11
      },
      description: 'Adds +3 flat Cold Damage, 11% More Damage, and Chills enemies on hit.'
    },
    added_lightning: {
      id: 'added_lightning',
      name: 'Added Lightning & Shock Support',
      short: 'LTG',
      type: 'support',
      color: 'B',
      tags: ['Attack', 'Spell', 'Lightning', 'Projectile', 'AoE'],
      requireTags: ['Attack', 'Spell'],
      excludeTags: ['Aura'],
      mods: {
        flatBonusDamage: 4,
        flatLightning: 4,
        shockChance: 30,
        damageMulti: 1.11
      },
      description: 'Adds +4 flat Lightning Damage, 11% More Damage, and Shocks enemies for +20% damage taken.'
    },
    life_on_hit: {
      id: 'life_on_hit',
      name: 'Vitality Leech Support',
      short: 'LOH',
      type: 'support',
      color: 'R',
      tags: ['Attack', 'Spell', 'AoE', 'Projectile'],
      requireTags: ['Attack', 'Spell'],
      excludeTags: ['Aura'],
      mods: {
        lifeOnHit: 2,
        damageMulti: 1.08
      },
      description: 'Supported Hit Skills restore +2 Life on Hit and deal 8% More Damage.'
    },
    inc_aoe: {
      id: 'inc_aoe',
      name: 'Increased Area of Effect',
      short: 'AOE',
      type: 'support',
      color: 'B',
      tags: ['AoE'],
      requireTags: ['AoE'],
      excludeTags: [],
      mods: {
        areaMulti: 1.20,
        damageMulti: 1.08
      },
      description: 'Supported Area Skills have 20% More Area of Effect radius and 8% More Damage.'
    },
    conc_effect: {
      id: 'conc_effect',
      name: 'Concentrated Effect Support',
      short: 'CNC',
      type: 'support',
      color: 'B',
      tags: ['AoE'],
      requireTags: ['AoE'],
      excludeTags: [],
      mods: {
        areaMulti: 0.86,
        damageMulti: 1.20
      },
      description: 'Supported Area Skills deal 20% MORE Area Damage with 14% smaller Area radius.'
    },
    inc_crit: {
      id: 'inc_crit',
      name: 'Increased Critical Strikes',
      short: 'CRT',
      type: 'support',
      color: 'B',
      tags: ['Attack', 'Spell'],
      requireTags: ['Attack', 'Spell'],
      excludeTags: ['Aura'],
      mods: {
        bonusCritChance: 8,
        bonusCritMulti: 20
      },
      description: 'Supported Hit Skills gain +8% Critical Strike Chance and +20% Critical Strike Multiplier.'
    }
  };

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

  Object.assign(exports, { CLASSES, SKILL_GEMS, VAAL_SKILLS, RUN_UPGRADES });
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : exports);
