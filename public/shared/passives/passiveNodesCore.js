// Shared GameData Module: Passive Tree Core & Inner Sectors (Part 1)
(function (exports) {
  const PASSIVE_NODES_PART1 = {
    // --- CENTER: SCION START & INNER ASCENDANT RING ---
    start_scion: {
      id: 'start_scion',
      name: 'Path of the Ascendant',
      type: 'start',
      color: '#e8c26b',
      x: 0,
      y: 0,
      stats: { maxLife: 18, maxEs: 14, str: 8, dex: 8, int: 8, allRes: 8 },
      desc: ['+18 to Maximum Life & +14 to Energy Shield', '+8 to all Attributes', '+8% to all Elemental Resistances'],
      neighbors: ['scion_life_wheel', 'center_bridge_n', 'center_bridge_ne', 'center_bridge_se', 'center_bridge_s', 'center_bridge_sw', 'center_bridge_nw']
    },
    scion_life_wheel: {
      id: 'scion_life_wheel',
      name: 'Heart of the Ascendant',
      type: 'notable',
      color: '#ffd966',
      x: 0,
      y: 42,
      stats: { maxLife: 45, maxEs: 30, allRes: 12, cdrPct: 8 },
      desc: ['+45 to Maximum Life', '+30 to Maximum Energy Shield', '+12% to all Elemental Resistances', '8% increased Skill Cooldown Recovery'],
      neighbors: ['start_scion', 'center_bridge_sw', 'center_bridge_se', 'center_bridge_s']
    },
    center_bridge_n: {
      id: 'center_bridge_n',
      name: 'Arcane Conditioning',
      type: 'small',
      color: '#6fa8dc',
      x: 0,
      y: -78,
      stats: { maxEs: 18, int: 10, spellDmgPct: 10 },
      desc: ['+18 to Maximum Energy Shield', '+10 to Intelligence', '10% increased Spell Damage'],
      neighbors: ['start_scion', 'start_int', 'center_bridge_nw', 'center_bridge_ne']
    },
    center_bridge_ne: {
      id: 'center_bridge_ne',
      name: 'Harrier Conditioning',
      type: 'small',
      color: '#45b8ac',
      x: 68,
      y: -39,
      stats: { critChance: 15, dex: 8, int: 8 },
      desc: ['+15% to Critical Strike Chance', '+8 to Dexterity & Intelligence'],
      neighbors: ['start_scion', 'start_dex_int', 'center_bridge_n', 'center_bridge_se']
    },
    center_bridge_se: {
      id: 'center_bridge_se',
      name: 'Reflex Conditioning',
      type: 'small',
      color: '#6aa84f',
      x: 68,
      y: 39,
      stats: { moveSpeedPct: 6, dex: 10, evasion: 25 },
      desc: ['6% increased Movement Speed', '+10 to Dexterity', '+25 to Evasion Rating'],
      neighbors: ['start_scion', 'start_dex', 'center_bridge_ne', 'center_bridge_s', 'scion_life_wheel']
    },
    center_bridge_s: {
      id: 'center_bridge_s',
      name: 'Gladiator Conditioning',
      type: 'small',
      color: '#e67700',
      x: 0,
      y: 86,
      stats: { maxLife: 16, physDmgPct: 12, str: 8, dex: 8 },
      desc: ['+16 to Maximum Life', '12% increased Physical Damage', '+8 to Strength & Dexterity'],
      neighbors: ['start_scion', 'start_str_dex', 'center_bridge_se', 'center_bridge_sw', 'scion_life_wheel']
    },
    center_bridge_sw: {
      id: 'center_bridge_sw',
      name: 'Constitution Conditioning',
      type: 'small',
      color: '#e06666',
      x: -68,
      y: 39,
      stats: { maxLife: 20, str: 10, armor: 25 },
      desc: ['+20 to Maximum Life', '+10 to Strength', '+25 to Armour'],
      neighbors: ['start_scion', 'start_str', 'center_bridge_s', 'center_bridge_nw', 'scion_life_wheel']
    },
    center_bridge_nw: {
      id: 'center_bridge_nw',
      name: 'Sanctuary Conditioning',
      type: 'small',
      color: '#d9a520',
      x: -68,
      y: -39,
      stats: { maxLife: 14, maxEs: 14, eleDmgPct: 12 },
      desc: ['+14 to Maximum Life & Energy Shield', '12% increased Elemental Damage'],
      neighbors: ['start_scion', 'start_str_int', 'center_bridge_sw', 'center_bridge_n']
    },
    // --- 6 OUTER CLASS STARTING NODES (HEXAGONAL RING AT RADIUS ~155) ---
    start_str: {
      id: 'start_str',
      name: 'Path of the Marauder',
      type: 'start',
      color: '#c92a2a',
      x: -135,
      y: 78,
      stats: { maxLife: 24, str: 16, physDmgPct: 14 },
      desc: ['+24 to Maximum Life', '+16 to Strength', '14% increased Physical Damage'],
      neighbors: ['center_bridge_sw', 'str_life_1', 'str_melee_1', 'inner_notable_str_int', 'inner_notable_str_dex']
    },
    start_str_dex: {
      id: 'start_str_dex',
      name: 'Path of the Duelist',
      type: 'start',
      color: '#e67700',
      x: 0,
      y: 156,
      stats: { maxLife: 18, str: 12, dex: 12, physDmgPct: 14, cdrPct: 6 },
      desc: ['+18 to Maximum Life', '+12 to Strength & Dexterity', '14% increased Physical Damage & 6% Cooldown Recovery'],
      neighbors: ['center_bridge_s', 'duel_atk_1', 'duel_leech_1', 'inner_notable_str_dex', 'inner_notable_dex_str']
    },
    start_dex: {
      id: 'start_dex',
      name: 'Path of the Ranger',
      type: 'start',
      color: '#2b8a3e',
      x: 135,
      y: 78,
      stats: { evasion: 35, dex: 16, projDmgPct: 14 },
      desc: ['+35 to Evasion Rating', '+16 to Dexterity', '14% increased Projectile Damage'],
      neighbors: ['center_bridge_se', 'dex_proj_1', 'dex_spd_1', 'inner_notable_dex_str', 'inner_notable_dex_int']
    },
    start_dex_int: {
      id: 'start_dex_int',
      name: 'Path of the Shadow',
      type: 'start',
      color: '#1098ad',
      x: 135,
      y: -78,
      stats: { critChance: 20, critMulti: 18, dex: 12, int: 12 },
      desc: ['+20% to Critical Strike Chance', '+18% to Critical Strike Multiplier', '+12 to Dexterity & Intelligence'],
      neighbors: ['center_bridge_ne', 'shad_crit_1', 'shad_blade_1', 'inner_notable_dex_int', 'inner_notable_int_dex']
    },
    start_int: {
      id: 'start_int',
      name: 'Path of the Witch',
      type: 'start',
      color: '#1971c2',
      x: 0,
      y: -156,
      stats: { maxEs: 28, int: 16, spellDmgPct: 14 },
      desc: ['+28 to Maximum Energy Shield', '+16 to Intelligence', '14% increased Spell Damage'],
      neighbors: ['center_bridge_n', 'int_spell_1', 'int_ele_1', 'inner_notable_int_dex', 'inner_notable_int_str']
    },
    start_str_int: {
      id: 'start_str_int',
      name: 'Path of the Templar',
      type: 'start',
      color: '#d9a520',
      x: -135,
      y: -78,
      stats: { maxLife: 18, maxEs: 18, eleDmgPct: 15, lifeRegen: 4 },
      desc: ['+18 to Maximum Life & Energy Shield', '15% increased Elemental Damage', 'Regenerate 4 Life per second'],
      neighbors: ['center_bridge_nw', 'temp_ele_1', 'temp_consec_1', 'inner_notable_int_str', 'inner_notable_str_int']
    },
    // --- 6 INNER WHEEL NOTABLES (CONNECTING ADJACENT CLASS STARTS) ---
    inner_notable_str_dex: {
      id: 'inner_notable_str_dex',
      name: 'Constitution Wheel',
      type: 'notable',
      color: '#f08c00',
      x: -78,
      y: 135,
      stats: { maxLife: 48, lifeRegen: 6, armor: 50 },
      desc: ['+48 to Maximum Life', 'Regenerate 6 Life per second', '+50 to Armour'],
      neighbors: ['start_str', 'start_str_dex', 'str_melee_1', 'duel_atk_1']
    },
    inner_notable_dex_str: {
      id: 'inner_notable_dex_str',
      name: 'Thick Skin & Reflexes',
      type: 'notable',
      color: '#51cf66',
      x: 78,
      y: 135,
      stats: { maxLife: 36, evasion: 65, moveSpeedPct: 8, allRes: 8 },
      desc: ['+36 to Maximum Life', '+65 to Evasion Rating', '8% increased Movement Speed & +8% All Resistances'],
      neighbors: ['start_str_dex', 'start_dex', 'duel_leech_1', 'dex_spd_1']
    },
    inner_notable_dex_int: {
      id: 'inner_notable_dex_int',
      name: 'Heartseeker Precision',
      type: 'notable',
      color: '#22b8cf',
      x: 156,
      y: 0,
      stats: { critChance: 26, critMulti: 28, moveSpeedPct: 7 },
      desc: ['+26% to Critical Strike Chance', '+28% to Critical Strike Multiplier', '7% increased Movement Speed'],
      neighbors: ['start_dex', 'start_dex_int', 'dex_proj_1', 'shad_blade_1']
    },
    inner_notable_int_dex: {
      id: 'inner_notable_int_dex',
      name: 'Written in Blood',
      type: 'notable',
      color: '#339af0',
      x: 78,
      y: -135,
      stats: { maxLife: 30, maxEs: 42, spellDmgPct: 22 },
      desc: ['+30 to Maximum Life', '+42 to Maximum Energy Shield', '22% increased Spell Damage'],
      neighbors: ['start_dex_int', 'start_int', 'shad_crit_1', 'int_ele_1']
    },
    inner_notable_int_str: {
      id: 'inner_notable_int_str',
      name: 'Sanctity & Devotion',
      type: 'notable',
      color: '#fcc419',
      x: -78,
      y: -135,
      stats: { maxLife: 34, maxEs: 34, eleDmgPct: 24, lifeRegen: 6 },
      desc: ['+34 to Maximum Life & Energy Shield', '24% increased Elemental Damage', 'Regenerate 6 Life per second'],
      neighbors: ['start_int', 'start_str_int', 'int_spell_1', 'temp_ele_1']
    },
    inner_notable_str_int: {
      id: 'inner_notable_str_int',
      name: 'Discipline and Training',
      type: 'notable',
      color: '#ff6b6b',
      x: -156,
      y: 0,
      stats: { maxLife: 44, armor: 65, areaPct: 16, allRes: 10 },
      desc: ['+44 to Maximum Life', '+65 to Armour', '16% increased Area of Effect & +10% All Resistances'],
      neighbors: ['start_str_int', 'start_str', 'temp_consec_1', 'str_life_1']
    },
    // --- SECTOR 1: MARAUDER (STRENGTH / BOTTOM-LEFT) ---
    str_life_1: {
      id: 'str_life_1',
      name: 'Vigour',
      type: 'small',
      color: '#c92a2a',
      x: -225,
      y: 90,
      stats: { maxLife: 26, lifeRegen: 4 },
      desc: ['+26 to Maximum Life', 'Regenerate 4 Life per second'],
      neighbors: ['start_str', 'inner_notable_str_int', 'str_life_2', 'str_notable_jugg']
    },
    str_life_2: {
      id: 'str_life_2',
      name: 'Iron Flesh',
      type: 'small',
      color: '#c92a2a',
      x: -310,
      y: 125,
      stats: { maxLife: 28, armor: 55 },
      desc: ['+28 to Maximum Life', '+55 to Armour'],
      neighbors: ['str_life_1', 'str_notable_jugg', 'keystone_resolute', 'keystone_blood_magic']
    },
    str_melee_1: {
      id: 'str_melee_1',
      name: 'Brutal Impact',
      type: 'small',
      color: '#c92a2a',
      x: -185,
      y: 165,
      stats: { physDmgPct: 20, aoeDmgPct: 14 },
      desc: ['20% increased Physical Damage', '14% increased Area Damage'],
      neighbors: ['start_str', 'inner_notable_str_dex', 'str_melee_2', 'str_notable_jugg']
    },
    str_melee_2: {
      id: 'str_melee_2',
      name: 'Earthbreaker',
      type: 'small',
      color: '#c92a2a',
      x: -250,
      y: 235,
      stats: { physDmgPct: 22, areaPct: 16 },
      desc: ['22% increased Physical Damage', '16% increased Area of Effect'],
      neighbors: ['str_melee_1', 'str_notable_slayer', 'hybrid_str_dex']
    },
    str_notable_jugg: {
      id: 'str_notable_jugg',
      name: 'Born to Fight',
      type: 'notable',
      color: '#ff6b57',
      x: -255,
      y: 160,
      stats: { maxLife: 60, armor: 95, physDmgPct: 30, lifeRegen: 8 },
      desc: ['+60 to Maximum Life', '+95 to Armour', '30% increased Physical Damage', 'Regenerate 8 Life per second'],
      neighbors: ['str_life_1', 'str_life_2', 'str_melee_1', 'str_notable_slayer', 'keystone_resolute']
    },
    str_notable_slayer: {
      id: 'str_notable_slayer',
      name: 'Titanic Impacts',
      type: 'notable',
      color: '#ff6b57',
      x: -315,
      y: 225,
      stats: { physDmgPct: 38, areaPct: 26, lifeOnKill: 12 },
      desc: ['38% increased Physical Damage', '26% increased Area of Effect', 'Recover +12 Life on Kill'],
      neighbors: ['str_melee_2', 'str_notable_jugg', 'keystone_resolute', 'keystone_blood_magic']
    },
    // --- SECTOR 2: DUELIST (STR/DEX HYBRID / SOUTH) ---
    duel_atk_1: {
      id: 'duel_atk_1',
      name: 'Blade Master',
      type: 'small',
      color: '#e67700',
      x: -55,
      y: 235,
      stats: { physDmgPct: 18, cdrPct: 8, str: 10 },
      desc: ['18% increased Physical Damage', '8% increased Skill Cooldown Recovery', '+10 to Strength'],
      neighbors: ['start_str_dex', 'inner_notable_str_dex', 'duel_atk_2', 'duel_notable_slayer']
    },
    duel_atk_2: {
      id: 'duel_atk_2',
      name: 'Dervish Fury',
      type: 'small',
      color: '#e67700',
      x: -85,
      y: 315,
      stats: { physDmgPct: 20, areaPct: 14, moveSpeedPct: 6 },
      desc: ['20% increased Physical Damage', '14% increased Area of Effect', '6% increased Movement Speed'],
      neighbors: ['duel_atk_1', 'duel_notable_slayer', 'hybrid_str_dex', 'keystone_blood_magic']
    },
    duel_leech_1: {
      id: 'duel_leech_1',
      name: 'Vitality Void',
      type: 'small',
      color: '#e67700',
      x: 55,
      y: 235,
      stats: { lifeOnHit: 3, maxLife: 20, dex: 10 },
      desc: ['+3 Life gained on Hit', '+20 to Maximum Life', '+10 to Dexterity'],
      neighbors: ['start_str_dex', 'inner_notable_dex_str', 'duel_leech_2', 'duel_notable_slayer']
    },
    duel_leech_2: {
      id: 'duel_leech_2',
      name: 'Hematophagy',
      type: 'small',
      color: '#e67700',
      x: 85,
      y: 315,
      stats: { lifeOnHit: 4, physDmgPct: 18, cdrPct: 8 },
      desc: ['+4 Life gained on Hit', '18% increased Physical Damage', '8% increased Skill Cooldown Recovery'],
      neighbors: ['duel_leech_1', 'duel_notable_gladiator', 'keystone_vaal_pact']
    },
    duel_notable_slayer: {
      id: 'duel_notable_slayer',
      name: 'Headsman Execution',
      type: 'notable',
      color: '#ffa94d',
      x: 0,
      y: 280,
      stats: { physDmgPct: 34, cdrPct: 12, lifeOnHit: 4, areaPct: 18 },
      desc: ['34% increased Physical Damage', '12% increased Skill Cooldown Recovery', '+4 Life gained on Hit & 18% Area of Effect'],
      neighbors: ['duel_atk_1', 'duel_atk_2', 'duel_leech_1', 'duel_notable_gladiator']
    },
    duel_notable_gladiator: {
      id: 'duel_notable_gladiator',
      name: 'Arena Challenger',
      type: 'notable',
      color: '#ffa94d',
      x: 0,
      y: 350,
      stats: { moveSpeedPct: 16, cdrPct: 14, maxLife: 45, armor: 70 },
      desc: ['16% increased Movement Speed', '14% increased Skill Cooldown Recovery', '+45 to Maximum Life & +70 to Armour'],
      neighbors: ['duel_notable_slayer', 'duel_leech_2', 'hybrid_str_dex', 'keystone_vaal_pact']
    },
    // --- SECTOR 3: RANGER (DEXTERITY / BOTTOM-RIGHT) ---
    dex_proj_1: {
      id: 'dex_proj_1',
      name: 'Ballistics',
      type: 'small',
      color: '#2b8a3e',
      x: 225,
      y: 90,
      stats: { projDmgPct: 20, dex: 12 },
      desc: ['20% increased Projectile Damage', '+12 to Dexterity'],
      neighbors: ['start_dex', 'inner_notable_dex_int', 'dex_proj_2', 'dex_notable_deadeye']
    },
    dex_proj_2: {
      id: 'dex_proj_2',
      name: 'Precision Draw',
      type: 'small',
      color: '#2b8a3e',
      x: 310,
      y: 125,
      stats: { critChance: 22, critMulti: 20 },
      desc: ['+22% to Critical Strike Chance', '+20% to Critical Strike Multiplier'],
      neighbors: ['dex_proj_1', 'dex_notable_deadeye', 'keystone_acrobatics', 'keystone_point_blank']
    }
  };

  exports.PASSIVE_NODES = Object.assign(exports.PASSIVE_NODES || {}, PASSIVE_NODES_PART1);
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : (global.GameData = global.GameData || exports));
