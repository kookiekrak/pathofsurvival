// Shared GameData Module
(function (exports) {

  // ============================================================================
  // 5. EXPANDED RADIAL PASSIVE SKILL TREE (64 NODES: 7 STARTS, 8 KEYSTONES)
  // ============================================================================
  const PASSIVE_NODES = {
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
    },
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

    // --- 8 ICONIC PATH OF EXILE 1 KEYSTONES (+ LEGACY ALIASES) ---
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

  // Ensure 100% symmetric neighbor links & balanced passive stat values across all PASSIVE_NODES
  for (const [nodeId, node] of Object.entries(PASSIVE_NODES)) {
    if (!Array.isArray(node.neighbors)) node.neighbors = [];
    node.neighbors = node.neighbors.filter(nbId => Boolean(PASSIVE_NODES[nbId]));
    for (const nbId of node.neighbors) {
      const nbNode = PASSIVE_NODES[nbId];
      if (!nbNode) continue;
      if (!Array.isArray(nbNode.neighbors)) nbNode.neighbors = [];
      if (!nbNode.neighbors.includes(nodeId)) {
        nbNode.neighbors.push(nodeId);
      }
    }
  }
  const STAT_DESC_FMT = {
    maxLife: v => `+${v} to Maximum Life`,
    maxLifePct: v => `${v}% increased Maximum Life`,
    maxEs: v => `+${v} to Maximum Energy Shield`,
    armor: v => `+${v} to Armour`,
    evasion: v => `+${v} to Evasion Rating`,
    physDmgPct: v => `${v}% increased Physical Damage`,
    eleDmgPct: v => `${v}% increased Elemental Damage`,
    spellDmgPct: v => `${v}% increased Spell Damage`,
    projDmgPct: v => `${v}% increased Projectile Damage`,
    aoeDmgPct: v => `${v}% increased Area Damage`,
    areaPct: v => `${v}% increased Area of Effect Radius`,
    cdrPct: v => `${v}% increased Skill Cooldown Recovery`,
    critChance: v => `+${v}% to Critical Strike Chance`,
    critMulti: v => `+${v}% to Critical Strike Multiplier`,
    moveSpeedPct: v => `${v}% increased Movement Speed`,
    allRes: v => `+${v}% to all Elemental Resistances`,
    lifeRegen: v => `Regenerate ${v} Life per second`,
    lifeOnHit: v => `+${v} Life gained on Hit`,
    lifeOnKill: v => `Recover +${v} Life on Kill`,
    extraProj: v => `Skills fire +${v} additional Projectile`,
    extraChain: v => `Projectiles Chain +${v} additional time`,
    pierceCount: v => `Projectiles Pierce +${v} additional target`,
    cullingStrike: () => `Culling Strike (Slay Normal/Magic/Rare enemies below 12% Life)`,
    str: v => `+${v} to Strength`,
    dex: v => `+${v} to Dexterity`,
    int: v => `+${v} to Intelligence`
  };
  for (const node of Object.values(PASSIVE_NODES)) {
    node.neighbors = Array.from(new Set(node.neighbors));
    if (!node.stats) node.stats = {};
    if (node.type !== 'keystone') {
      const scale = node.type === 'start' ? 0.55 : node.type === 'notable' ? 0.5 : 0.48;
      const newDesc = [];
      for (const [k, v] of Object.entries(node.stats)) {
        if (typeof v === 'number' && k !== 'extraProj' && k !== 'extraChain' && k !== 'pierceCount' && k !== 'cullingStrike') {
          node.stats[k] = Math.max(1, Math.round(v * scale));
        }
        if (STAT_DESC_FMT[k]) {
          newDesc.push(STAT_DESC_FMT[k](node.stats[k]));
        }
      }
      if (node.type === 'start') {
        node.stats.startingGold = 25;
        newDesc.push('+25 Starting Run Gold');
      }
      if (newDesc.length > 0) {
        node.desc = newDesc;
      }
    }
  }

  /**
   * BFS pathfinder returning the shortest sequence of unallocated passive node IDs
   * connecting any node in `allocatedIds` to `targetNodeId` (inclusive of `targetNodeId`).
   */
  function findShortestPassivePath(allocatedIds, targetNodeId) {
    if (!targetNodeId || !PASSIVE_NODES[targetNodeId]) return [];
    const allocatedSet = new Set(Array.isArray(allocatedIds) ? allocatedIds : []);
    if (allocatedSet.has(targetNodeId)) return [];

    if (allocatedSet.size === 0) {
      return PASSIVE_NODES[targetNodeId].type === 'start' ? [targetNodeId] : [];
    }

    const visited = new Set(allocatedSet);
    const parent = new Map();
    const queue = [];

    for (const startId of allocatedSet) {
      if (PASSIVE_NODES[startId]) {
        queue.push(startId);
      }
    }

    while (queue.length > 0) {
      const currId = queue.shift();
      const currNode = PASSIVE_NODES[currId];
      if (!currNode) continue;

      for (const nbId of currNode.neighbors) {
        if (visited.has(nbId) || !PASSIVE_NODES[nbId]) continue;
        visited.add(nbId);
        parent.set(nbId, currId);
        if (nbId === targetNodeId) {
          const path = [];
          let step = targetNodeId;
          while (step && !allocatedSet.has(step)) {
            path.push(step);
            step = parent.get(step);
          }
          path.reverse();
          return path;
        }
        queue.push(nbId);
      }
    }

    return [];
  }

  Object.assign(exports, { PASSIVE_NODES, findShortestPassivePath });
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : exports);
