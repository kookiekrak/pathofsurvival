// Shared GameData Module: Support Skill Gems
(function (exports) {
  // ============================================================================
  // 2B. 17 SUPPORT SKILL GEMS (STRICT TAG COMPATIBILITY WITH ACTIVE SKILLS)
  // ============================================================================
  const SUPPORT_SKILL_GEMS = {
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
    },
    unleash: {
      id: 'unleash',
      name: 'Unleash Support',
      short: 'UNL',
      type: 'support',
      color: 'B',
      tags: ['Spell'],
      requireTags: ['Spell'],
      excludeTags: ['Aura', 'Attack'],
      mods: {
        repeatCount: 2,
        cooldownMulti: 1.06,
        damageMulti: 0.78
      },
      description: 'Supported Spells build Arcane Seals and unleash +2 additional cast waves in rapid succession.'
    },
    returning_proj: {
      id: 'returning_proj',
      name: 'Returning Projectiles',
      short: 'RET',
      type: 'support',
      color: 'G',
      tags: ['Projectile'],
      requireTags: ['Projectile'],
      excludeTags: ['Aura'],
      mods: {
        returnProj: 1,
        extraPierce: 2,
        damageMulti: 0.90
      },
      description: 'Supported Projectiles Pierce +2 targets and return to you at the end of their flight.'
    },
    pulverise: {
      id: 'pulverise',
      name: 'Pulverise Support',
      short: 'PLV',
      type: 'support',
      color: 'R',
      tags: ['Melee', 'Slam', 'AoE'],
      requireTags: ['Melee', 'Slam', 'AoE'],
      excludeTags: ['Spell', 'Bow'],
      mods: {
        areaMulti: 1.28,
        damageMulti: 1.22,
        cooldownMulti: 1.10
      },
      description: 'Supported Area & Slam Skills have 28% More Area Radius and 22% MORE Damage (10% slower cooldown).'
    },
    volley: {
      id: 'volley',
      name: 'Arrow Nova & Volley',
      short: 'VOL',
      type: 'support',
      color: 'G',
      tags: ['Projectile', 'Bow'],
      requireTags: ['Projectile'],
      excludeTags: ['Aura', 'Melee'],
      mods: {
        extraProjectiles: 2,
        cooldownMulti: 0.90,
        damageMulti: 0.84
      },
      description: 'Supported Projectile Skills fire +2 Volley Projectiles and recover cooldown 10% faster.'
    },
    trinity: {
      id: 'trinity',
      name: 'Trinity Resonance Support',
      short: 'TRI',
      type: 'support',
      color: 'B',
      tags: ['Fire', 'Cold', 'Lightning'],
      requireTags: ['Fire', 'Cold', 'Lightning'],
      excludeTags: [],
      mods: {
        flatBonusDamage: 4,
        damageMulti: 1.19,
        shockChance: 25,
        chillEffect: 1
      },
      description: 'Supported Elemental Skills deal 19% MORE Damage, +4 flat Elemental Damage, and inflict Chill & Shock.'
    },
    spell_cascade: {
      id: 'spell_cascade',
      name: 'Awakened Cascade Support',
      short: 'CSC',
      type: 'support',
      color: 'B',
      tags: ['AoE', 'Spell'],
      requireTags: ['AoE', 'Spell'],
      excludeTags: ['Aura'],
      mods: {
        repeatCount: 1,
        areaMulti: 1.12,
        damageMulti: 0.92
      },
      description: 'Supported Area & Spell Skills trigger an echoed Cascade wave with +12% Area of Effect.'
    }
  };

  exports.SKILL_GEMS = Object.assign(exports.SKILL_GEMS || {}, SUPPORT_SKILL_GEMS);
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : (global.GameData = global.GameData || exports));
