// Shared GameData Module: Passive Tree Outer Sectors & Keystones (Part 2)
(function (exports) {
  const PASSIVE_NODES_PART2 = {
    dex_spd_1: {
      id: 'dex_spd_1',
      name: 'Fleetfoot',
      type: 'small',
      color: '#2b8a3e',
      x: 185,
      y: 165,
      stats: { moveSpeedPct: 9, evasion: 50 },
      desc: ['9% increased Movement Speed', '+50 to Evasion Rating'],
      neighbors: ['start_dex', 'inner_notable_dex_str', 'dex_spd_2', 'dex_notable_deadeye']
    },
    dex_spd_2: {
      id: 'dex_spd_2',
      name: 'Quickstep',
      type: 'small',
      color: '#2b8a3e',
      x: 250,
      y: 235,
      stats: { cdrPct: 10, moveSpeedPct: 8 },
      desc: ['10% increased Skill Cooldown Recovery', '8% increased Movement Speed'],
      neighbors: ['dex_spd_1', 'dex_notable_raider', 'duel_leech_2']
    },
    dex_notable_deadeye: {
      id: 'dex_notable_deadeye',
      name: 'Endless Munitions',
      type: 'notable',
      color: '#53f574',
      x: 255,
      y: 160,
      stats: { extraProj: 1, projDmgPct: 28, critChance: 24 },
      desc: ['Skills fire +1 additional Projectile', '28% increased Projectile Damage', '+24% to Critical Strike Chance'],
      neighbors: ['dex_proj_1', 'dex_proj_2', 'dex_spd_1', 'dex_notable_raider', 'keystone_acrobatics']
    },
    dex_notable_raider: {
      id: 'dex_notable_raider',
      name: 'Avatar of the Chase',
      type: 'notable',
      color: '#53f574',
      x: 315,
      y: 225,
      stats: { moveSpeedPct: 16, cdrPct: 14, evasion: 100 },
      desc: ['16% increased Movement Speed', '14% increased Skill Cooldown Recovery', '+100 to Evasion Rating'],
      neighbors: ['dex_spd_2', 'dex_notable_deadeye', 'keystone_point_blank']
    },
    // --- SECTOR 4: SHADOW (DEX/INT HYBRID / TOP-RIGHT) ---
    shad_crit_1: {
      id: 'shad_crit_1',
      name: 'Nightstalker',
      type: 'small',
      color: '#1098ad',
      x: 185,
      y: -165,
      stats: { critChance: 22, critMulti: 18 },
      desc: ['+22% to Critical Strike Chance', '+18% to Critical Strike Multiplier'],
      neighbors: ['start_dex_int', 'inner_notable_int_dex', 'shad_crit_2', 'shad_notable_assassin']
    },
    shad_crit_2: {
      id: 'shad_crit_2',
      name: 'Deadly Infusion',
      type: 'small',
      color: '#1098ad',
      x: 250,
      y: -235,
      stats: { critMulti: 28, cdrPct: 8 },
      desc: ['+28% to Critical Strike Multiplier', '8% increased Skill Cooldown Recovery'],
      neighbors: ['shad_crit_1', 'shad_notable_assassin', 'int_notable_elementalist', 'keystone_wicked_ward']
    },
    shad_blade_1: {
      id: 'shad_blade_1',
      name: 'Phantom Blades',
      type: 'small',
      color: '#1098ad',
      x: 225,
      y: -90,
      stats: { physDmgPct: 16, spellDmgPct: 16, projDmgPct: 16 },
      desc: ['16% increased Physical, Spell, and Projectile Damage'],
      neighbors: ['start_dex_int', 'inner_notable_dex_int', 'shad_blade_2', 'shad_notable_assassin']
    },
    shad_blade_2: {
      id: 'shad_blade_2',
      name: 'Ghost Reaver',
      type: 'small',
      color: '#1098ad',
      x: 310,
      y: -125,
      stats: { maxEs: 32, evasion: 55, moveSpeedPct: 7 },
      desc: ['+32 to Maximum Energy Shield', '+55 to Evasion Rating', '7% increased Movement Speed'],
      neighbors: ['shad_blade_1', 'shad_notable_trickster', 'hybrid_dex_int', 'keystone_wicked_ward']
    },
    shad_notable_assassin: {
      id: 'shad_notable_assassin',
      name: 'Mistwalker Ambush',
      type: 'notable',
      color: '#3bc9db',
      x: 255,
      y: -160,
      stats: { critChance: 34, critMulti: 40, moveSpeedPct: 10 },
      desc: ['+34% to Critical Strike Chance', '+40% to Critical Strike Multiplier', '10% increased Movement Speed'],
      neighbors: ['shad_crit_1', 'shad_crit_2', 'shad_blade_1', 'shad_notable_trickster']
    },
    shad_notable_trickster: {
      id: 'shad_notable_trickster',
      name: 'Escape Artist',
      type: 'notable',
      color: '#3bc9db',
      x: 335,
      y: -185,
      stats: { maxEs: 50, evasion: 90, cdrPct: 14, extraChain: 1 },
      desc: ['+50 to Energy Shield & +90 to Evasion', '14% increased Cooldown Recovery', 'Skills Chain +1 additional time'],
      neighbors: ['shad_notable_assassin', 'shad_blade_2', 'keystone_wicked_ward']
    },
    // --- SECTOR 5: WITCH (INTELLIGENCE / NORTH) ---
    int_spell_1: {
      id: 'int_spell_1',
      name: 'Arcane Focus',
      type: 'small',
      color: '#1971c2',
      x: -60,
      y: -235,
      stats: { spellDmgPct: 20, maxEs: 24 },
      desc: ['20% increased Spell Damage', '+24 to Maximum Energy Shield'],
      neighbors: ['start_int', 'inner_notable_int_str', 'int_spell_2', 'int_notable_occult']
    },
    int_spell_2: {
      id: 'int_spell_2',
      name: 'Annihilation',
      type: 'small',
      color: '#1971c2',
      x: -95,
      y: -315,
      stats: { critChance: 24, spellDmgPct: 18, maxEs: 22 },
      desc: ['+24% to Critical Strike Chance', '18% increased Spell Damage', '+22 to Maximum Energy Shield'],
      neighbors: ['int_spell_1', 'int_notable_occult', 'keystone_ci', 'hybrid_str_int']
    },
    int_ele_1: {
      id: 'int_ele_1',
      name: 'Elemental Dominion',
      type: 'small',
      color: '#1971c2',
      x: 60,
      y: -235,
      stats: { eleDmgPct: 22, allRes: 8 },
      desc: ['22% increased Elemental Damage', '+8% to all Elemental Resistances'],
      neighbors: ['start_int', 'inner_notable_int_dex', 'int_ele_2', 'int_notable_occult']
    },
    int_ele_2: {
      id: 'int_ele_2',
      name: 'Blast Radius',
      type: 'small',
      color: '#1971c2',
      x: 95,
      y: -315,
      stats: { areaPct: 18, aoeDmgPct: 20 },
      desc: ['18% increased Area of Effect', '20% increased Area Damage'],
      neighbors: ['int_ele_1', 'int_notable_elementalist', 'keystone_ci', 'keystone_ele_overload']
    },
    int_notable_occult: {
      id: 'int_notable_occult',
      name: 'Void Beacon',
      type: 'notable',
      color: '#63a4ff',
      x: 0,
      y: -285,
      stats: { maxEs: 70, spellDmgPct: 34, extraChain: 1 },
      desc: ['+70 to Maximum Energy Shield', '34% increased Spell Damage', 'Skills Chain +1 additional time'],
      neighbors: ['int_spell_1', 'int_spell_2', 'int_ele_1', 'keystone_ci']
    },
    int_notable_elementalist: {
      id: 'int_notable_elementalist',
      name: 'Shaper of Storms',
      type: 'notable',
      color: '#63a4ff',
      x: 175,
      y: -285,
      stats: { eleDmgPct: 40, cdrPct: 12, areaPct: 20 },
      desc: ['40% increased Elemental Damage', '12% increased Skill Cooldown Recovery', '20% increased Area of Effect'],
      neighbors: ['int_ele_2', 'shad_crit_2', 'keystone_ele_overload']
    },
    // --- SECTOR 6: TEMPLAR (STR/INT HYBRID / TOP-LEFT) ---
    temp_ele_1: {
      id: 'temp_ele_1',
      name: 'Celestial Punishment',
      type: 'small',
      color: '#d9a520',
      x: -185,
      y: -165,
      stats: { eleDmgPct: 20, critChance: 16, int: 10 },
      desc: ['20% increased Elemental Damage', '+16% to Critical Strike Chance', '+10 to Intelligence'],
      neighbors: ['start_str_int', 'inner_notable_int_str', 'temp_ele_2', 'temp_notable_inquis']
    },
    temp_ele_2: {
      id: 'temp_ele_2',
      name: 'Divine Wrath',
      type: 'small',
      color: '#d9a520',
      x: -250,
      y: -235,
      stats: { eleDmgPct: 24, aoeDmgPct: 18, areaPct: 14 },
      desc: ['24% increased Elemental Damage', '18% increased Area Damage & 14% Area of Effect'],
      neighbors: ['temp_ele_1', 'temp_notable_inquis', 'hybrid_str_int', 'keystone_avatar_of_fire']
    },
    temp_consec_1: {
      id: 'temp_consec_1',
      name: 'Pious Path',
      type: 'small',
      color: '#d9a520',
      x: -225,
      y: -90,
      stats: { maxLife: 22, maxEs: 22, lifeRegen: 6 },
      desc: ['+22 to Maximum Life & Energy Shield', 'Regenerate 6 Life per second'],
      neighbors: ['start_str_int', 'inner_notable_str_int', 'temp_consec_2', 'temp_notable_inquis']
    },
    temp_consec_2: {
      id: 'temp_consec_2',
      name: 'Sanctuary of Thought',
      type: 'small',
      color: '#d9a520',
      x: -310,
      y: -125,
      stats: { armor: 60, maxEs: 30, allRes: 10 },
      desc: ['+60 to Armour & +30 to Energy Shield', '+10% to all Elemental Resistances'],
      neighbors: ['temp_consec_1', 'temp_notable_hierophant', 'keystone_avatar_of_fire']
    },
    temp_notable_inquis: {
      id: 'temp_notable_inquis',
      name: 'Inevitable Judgement',
      type: 'notable',
      color: '#ffd43b',
      x: -255,
      y: -160,
      stats: { eleDmgPct: 36, critChance: 28, critMulti: 28, lifeRegen: 8 },
      desc: ['36% increased Elemental Damage', '+28% to Crit Chance & Multiplier', 'Regenerate 8 Life per second'],
      neighbors: ['temp_ele_1', 'temp_ele_2', 'temp_consec_1', 'temp_notable_hierophant']
    },
    temp_notable_hierophant: {
      id: 'temp_notable_hierophant',
      name: 'Divine Guidance',
      type: 'notable',
      color: '#ffd43b',
      x: -335,
      y: -185,
      stats: { maxLife: 45, maxEs: 50, areaPct: 24, cdrPct: 12 },
      desc: ['+45 to Maximum Life & +50 to Energy Shield', '24% increased Area of Effect', '12% increased Cooldown Recovery'],
      neighbors: ['temp_notable_inquis', 'temp_consec_2', 'keystone_avatar_of_fire']
    },
    // --- OUTER HYBRID BRIDGE NOTABLES ---
    hybrid_str_dex: {
      id: 'hybrid_str_dex',
      name: 'Art of the Gladiator',
      type: 'notable',
      color: '#e69138',
      x: -165,
      y: 295,
      stats: { maxLife: 45, moveSpeedPct: 12, cdrPct: 10, physDmgPct: 26 },
      desc: ['+45 to Maximum Life', '12% increased Movement Speed', '10% increased Skill Cooldown Recovery', '26% increased Physical Damage'],
      neighbors: ['str_melee_2', 'duel_atk_2', 'duel_notable_gladiator']
    },
    hybrid_str_int: {
      id: 'hybrid_str_int',
      name: 'Sovereignty of the Templar',
      type: 'notable',
      color: '#b4a7d6',
      x: -175,
      y: -285,
      stats: { maxLife: 42, maxEs: 42, eleDmgPct: 30, areaPct: 22 },
      desc: ['+42 to Maximum Life & +42 to Energy Shield', '30% increased Elemental Damage', '22% increased Area of Effect'],
      neighbors: ['temp_ele_2', 'int_spell_2']
    },
    hybrid_dex_int: {
      id: 'hybrid_dex_int',
      name: 'Assassination Shadow',
      type: 'notable',
      color: '#45818e',
      x: 325,
      y: 0,
      stats: { critChance: 35, critMulti: 45, moveSpeedPct: 10 },
      desc: ['+35% to Critical Strike Chance', '+45% to Critical Strike Multiplier', '10% increased Movement Speed'],
      neighbors: ['shad_blade_2', 'keystone_acrobatics', 'dex_proj_2']
    },
    // --- 9 ICONIC PATH OF EXILE KEYSTONES (OUTER PERIMETER, BALANCED TRADE-OFFS) ---
    keystone_resolute: {
      id: 'keystone_resolute',
      name: 'Resolute Technique',
      type: 'keystone',
      color: '#ff3b24',
      x: -395,
      y: 165,
      stats: { resoluteTechnique: 1, globalDmgMulti: 15 },
      desc: ['Your hits never deal Critical Strikes', '15% MORE Global Hit & Area Damage'],
      neighbors: ['str_life_2', 'str_notable_jugg', 'str_notable_slayer']
    },
    keystone_blood_magic: {
      id: 'keystone_blood_magic',
      name: 'Blood Magic',
      type: 'keystone',
      color: '#ff3b24',
      x: -290,
      y: 310,
      stats: { maxLifePct: 16, lifeRegen: 6, cdrPct: 8, noEs: 1 },
      desc: ['16% increased Maximum Life, +6 Life Regen/s & 8% Cooldown Recovery', 'Removes all Energy Shield'],
      neighbors: ['str_life_2', 'str_notable_slayer', 'duel_atk_2']
    },
    keystone_vaal_pact: {
      id: 'keystone_vaal_pact',
      name: 'Vaal Pact',
      type: 'keystone',
      color: '#ff922b',
      x: 0,
      y: 420,
      stats: { lifeOnHit: 4, globalDmgMulti: 10, noLifeRegen: 1 },
      desc: ['Recover +4 Life per Enemy Hit & 10% MORE Global Damage', 'Life Regeneration has no effect'],
      neighbors: ['duel_notable_gladiator', 'duel_leech_2', 'hybrid_str_dex']
    },
    keystone_point_blank: {
      id: 'keystone_point_blank',
      name: 'Point Blank',
      type: 'keystone',
      color: '#28e64c',
      x: 290,
      y: 310,
      stats: { extraProj: 1, projDmgPct: 16, areaPct: -10 },
      desc: ['Skills fire +1 additional Projectile & 16% increased Projectile Damage', '10% reduced Area of Effect Radius'],
      neighbors: ['dex_proj_2', 'dex_notable_raider', 'duel_leech_2']
    },
    keystone_acrobatics: {
      id: 'keystone_acrobatics',
      name: 'Phase Acrobatics',
      type: 'keystone',
      color: '#28e64c',
      x: 395,
      y: 125,
      stats: { dodgeChance: 18, moveSpeedPct: 8, halfArmor: 1 },
      desc: ['+18% Chance to Dodge Enemy Hits & 8% increased Movement Speed', '50% less Armour'],
      neighbors: ['dex_notable_deadeye', 'dex_proj_2', 'hybrid_dex_int']
    },
    keystone_wicked_ward: {
      id: 'keystone_wicked_ward',
      name: 'Wicked Ward',
      type: 'keystone',
      color: '#3bc9db',
      x: 395,
      y: -165,
      stats: { maxEs: 40, esRechargeFast: 1, allRes: 8 },
      desc: ['+40 to Maximum Energy Shield & +8% All Resistances', 'Energy Shield Recharges 50% faster'],
      neighbors: ['shad_crit_2', 'shad_blade_2', 'shad_notable_trickster']
    },
    keystone_ci: {
      id: 'keystone_ci',
      name: 'Arcane Sanctuary',
      type: 'keystone',
      color: '#4791ff',
      x: 0,
      y: -395,
      stats: { esMoreMulti: 30, esRechargeFast: 1, allRes: 8 },
      desc: ['30% MORE Maximum Energy Shield & +8% All Resistances', 'Energy Shield recharge delay reduced to 1.0s'],
      neighbors: ['int_spell_2', 'int_ele_2', 'int_notable_occult']
    },
    keystone_avatar_of_fire: {
      id: 'keystone_avatar_of_fire',
      name: 'Avatar of Fire',
      type: 'keystone',
      color: '#fcc419',
      x: -395,
      y: -165,
      stats: { eleMoreMulti: 15, areaPct: 12, lifeRegen: 4 },
      desc: ['15% MORE Elemental & Fire Damage', '12% increased Area of Effect & +4 Life Regen/s'],
      neighbors: ['temp_ele_2', 'temp_consec_2', 'temp_notable_hierophant']
    },
    keystone_ele_overload: {
      id: 'keystone_ele_overload',
      name: 'Elemental Overload',
      type: 'keystone',
      color: '#4791ff',
      x: 135,
      y: -385,
      stats: { eleMoreMulti: 14, extraChain: 1 },
      desc: ['14% MORE Elemental & Spell Damage', 'Projectiles Chain +1 additional time'],
      neighbors: ['int_ele_2', 'int_notable_elementalist']
    }
  };

  exports.PASSIVE_NODES = Object.assign(exports.PASSIVE_NODES || {}, PASSIVE_NODES_PART2);
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : (global.GameData = global.GameData || exports));
