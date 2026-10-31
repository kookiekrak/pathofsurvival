// Shared GameData Module: Outer Specialization Wheels, Notables & 6 Iconic Keystones
(function (exports) {
  const PASSIVE_NODES_EXPANSION = {
    // --- 1. WEST SECTOR: BERSERKER / WARBRINGER WHEEL & UNWAVERING STANCE ---
    str_berserk_1: {
      id: 'str_berserk_1',
      name: 'Warlord Vigor',
      type: 'small',
      color: '#e03131',
      x: -365,
      y: 40,
      stats: { maxLife: 32, physDmgPct: 20, str: 12 },
      neighbors: ['str_life_1', 'temp_consec_1', 'str_berserk_2', 'notable_warbringer']
    },
    str_berserk_2: {
      id: 'str_berserk_2',
      name: 'Slaughter Tempo',
      type: 'small',
      color: '#e03131',
      x: -435,
      y: 75,
      stats: { physDmgPct: 22, cdrPct: 14, armor: 55 },
      neighbors: ['str_berserk_1', 'str_life_2', 'notable_warbringer']
    },
    notable_warbringer: {
      id: 'notable_warbringer',
      name: "Warbringer's Fury",
      type: 'notable',
      color: '#ff6b6b',
      x: -445,
      y: 5,
      stats: { maxLife: 58, physDmgPct: 38, cdrPct: 18, areaPct: 24 },
      neighbors: ['str_berserk_1', 'str_berserk_2', 'keystone_unwavering']
    },
    keystone_unwavering: {
      id: 'keystone_unwavering',
      name: 'Unwavering Stance',
      type: 'keystone',
      color: '#ff3b24',
      x: -525,
      y: 15,
      stats: { armorMoreMulti: 30, maxLife: 55, dodgeChance: -10 },
      desc: ['30% MORE Total Armour & +55 to Maximum Life', 'Cannot Evade/Dodge (-10% Dodge Chance)'],
      neighbors: ['notable_warbringer', 'str_berserk_2']
    },

    // --- 2. SOUTH-WEST SECTOR: GLADIATOR IMPALE / BLEED WHEEL & CRIMSON DANCE ---
    duel_bleed_1: {
      id: 'duel_bleed_1',
      name: 'Serrated Edge',
      type: 'small',
      color: '#f08c00',
      x: -135,
      y: 385,
      stats: { physDmgPct: 24, aoeDmgPct: 18, str: 10 },
      neighbors: ['hybrid_str_dex', 'duel_atk_2', 'duel_bleed_2', 'notable_bloodscent']
    },
    duel_bleed_2: {
      id: 'duel_bleed_2',
      name: 'Arterial Rend',
      type: 'small',
      color: '#f08c00',
      x: -85,
      y: 445,
      stats: { physDmgPct: 22, lifeOnHit: 4, critMulti: 24 },
      neighbors: ['duel_bleed_1', 'keystone_vaal_pact', 'notable_bloodscent']
    },
    notable_bloodscent: {
      id: 'notable_bloodscent',
      name: 'Bloodscent Impale',
      type: 'notable',
      color: '#ffa94d',
      x: -165,
      y: 465,
      stats: { physDmgPct: 44, lifeOnHit: 6, critMulti: 36, cdrPct: 14 },
      neighbors: ['duel_bleed_1', 'duel_bleed_2', 'keystone_crimson_dance']
    },
    keystone_crimson_dance: {
      id: 'keystone_crimson_dance',
      name: 'Crimson Dance',
      type: 'keystone',
      color: '#ff922b',
      x: -130,
      y: 535,
      stats: { globalDmgMulti: 22, lifeOnHit: 4, critMulti: -25 },
      desc: ['22% MORE Global Physical & Hit Damage, +4 Life Gained on Hit', '-25% to Critical Strike Multiplier'],
      neighbors: ['notable_bloodscent', 'duel_bleed_2']
    },

    // --- 3. SOUTH-EAST SECTOR: PATHFINDER ALCHEMIST WHEEL & IRON REFLEXES ---
    dex_flask_1: {
      id: 'dex_flask_1',
      name: 'Herbalism',
      type: 'small',
      color: '#2f9e44',
      x: 155,
      y: 385,
      stats: { moveSpeedPct: 12, evasion: 75, maxLife: 28 },
      neighbors: ['duel_leech_2', 'dex_spd_2', 'dex_flask_2', 'notable_master_alchemist']
    },
    dex_flask_2: {
      id: 'dex_flask_2',
      name: 'Primal Spirit',
      type: 'small',
      color: '#2f9e44',
      x: 215,
      y: 440,
      stats: { projDmgPct: 24, evasion: 85, dex: 12 },
      neighbors: ['dex_flask_1', 'keystone_point_blank', 'notable_master_alchemist']
    },
    notable_master_alchemist: {
      id: 'notable_master_alchemist',
      name: "Nature's Adrenaline",
      type: 'notable',
      color: '#51cf66',
      x: 155,
      y: 465,
      stats: { moveSpeedPct: 20, evasion: 160, projDmgPct: 38, cdrPct: 16 },
      neighbors: ['dex_flask_1', 'dex_flask_2', 'keystone_iron_reflexes']
    },
    keystone_iron_reflexes: {
      id: 'keystone_iron_reflexes',
      name: 'Iron Reflexes',
      type: 'keystone',
      color: '#28e64c',
      x: 165,
      y: 535,
      stats: { ironReflexes: 1, armorMoreMulti: 25 },
      desc: ['Converts all Evasion Rating to Armour (+25% MORE Total Armour)', 'Evasion Rating is 0'],
      neighbors: ['notable_master_alchemist', 'dex_flask_2']
    },

    // --- 4. EAST SECTOR: DEADEYE MUNITIONS WHEEL & GHOST DANCE ---
    dex_sniper_1: {
      id: 'dex_sniper_1',
      name: 'Keen Sight',
      type: 'small',
      color: '#2f9e44',
      x: 395,
      y: 35,
      stats: { projDmgPct: 24, critChance: 24, dex: 12 },
      neighbors: ['hybrid_dex_int', 'dex_proj_2', 'dex_sniper_2', 'notable_far_shot']
    },
    dex_sniper_2: {
      id: 'dex_sniper_2',
      name: 'Feather Fletching',
      type: 'small',
      color: '#20c997',
      x: 395,
      y: -45,
      stats: { projDmgPct: 24, critMulti: 28, evasion: 70 },
      neighbors: ['hybrid_dex_int', 'shad_blade_2', 'dex_sniper_1', 'notable_far_shot']
    },
    notable_far_shot: {
      id: 'notable_far_shot',
      name: 'Endless Munitions',
      type: 'notable',
      color: '#38d9a9',
      x: 465,
      y: -5,
      stats: { extraProj: 1, pierceCount: 1, projDmgPct: 36, critChance: 32 },
      neighbors: ['dex_sniper_1', 'dex_sniper_2', 'keystone_ghost_dance']
    },
    keystone_ghost_dance: {
      id: 'keystone_ghost_dance',
      name: 'Ghost Dance',
      type: 'keystone',
      color: '#3bc9db',
      x: 535,
      y: -5,
      stats: { maxEs: 60, dodgeChance: 14, lifeOnHit: 4, maxLifePct: -10 },
      desc: ['+60 Maximum Energy Shield, +14% Dodge Chance & +4 Life/ES on Hit', '10% reduced Maximum Life'],
      neighbors: ['notable_far_shot', 'dex_sniper_2']
    },

    // --- 5. NORTH-EAST SECTOR: ARCHMAGE WHEEL & ELDRITCH BATTERY ---
    int_archmage_1: {
      id: 'int_archmage_1',
      name: 'Mystic Bulwark',
      type: 'small',
      color: '#339af0',
      x: 235,
      y: -335,
      stats: { spellDmgPct: 24, cdrPct: 14, int: 12 },
      neighbors: ['int_notable_elementalist', 'shad_crit_2', 'int_archmage_2', 'notable_archmage']
    },
    int_archmage_2: {
      id: 'int_archmage_2',
      name: 'Prodigal Perfection',
      type: 'small',
      color: '#339af0',
      x: 295,
      y: -295,
      stats: { spellDmgPct: 24, critMulti: 28, maxEs: 36 },
      neighbors: ['shad_notable_trickster', 'shad_crit_2', 'int_archmage_1', 'notable_archmage']
    },
    notable_archmage: {
      id: 'notable_archmage',
      name: 'Archmage Conduit',
      type: 'notable',
      color: '#74c0fc',
      x: 295,
      y: -380,
      stats: { spellDmgPct: 46, cdrPct: 22, extraChain: 1, critMulti: 40 },
      neighbors: ['int_archmage_1', 'int_archmage_2', 'keystone_eldritch_battery']
    },
    keystone_eldritch_battery: {
      id: 'keystone_eldritch_battery',
      name: 'Eldritch Battery',
      type: 'keystone',
      color: '#4791ff',
      x: 350,
      y: -445,
      stats: { cdrPct: 22, globalDmgMulti: 18, esMoreMulti: -25 },
      desc: ['+22% Skill Cooldown Recovery & 18% MORE Global Damage', '25% less Maximum Energy Shield'],
      neighbors: ['notable_archmage', 'int_archmage_1']
    },

    // --- 6. NORTH-WEST SECTOR: DIVINE TEMPLAR WHEEL & ZEALOT'S OATH ---
    temp_sanct_1: {
      id: 'temp_sanct_1',
      name: 'Righteous Decree',
      type: 'small',
      color: '#fcc419',
      x: -235,
      y: -335,
      stats: { eleDmgPct: 24, areaPct: 18, allRes: 8 },
      neighbors: ['hybrid_str_int', 'temp_ele_2', 'temp_sanct_2', 'notable_divine_wrath']
    },
    temp_sanct_2: {
      id: 'temp_sanct_2',
      name: 'Sanctum of Thought',
      type: 'small',
      color: '#fcc419',
      x: -145,
      y: -375,
      stats: { eleDmgPct: 24, maxEs: 38, maxLife: 28 },
      neighbors: ['hybrid_str_int', 'int_spell_2', 'temp_sanct_1', 'notable_divine_wrath']
    },
    notable_divine_wrath: {
      id: 'notable_divine_wrath',
      name: 'Divine Judgement',
      type: 'notable',
      color: '#ffd43b',
      x: -235,
      y: -410,
      stats: { eleDmgPct: 46, areaPct: 28, allRes: 16, cullingStrike: 1 },
      neighbors: ['temp_sanct_1', 'temp_sanct_2', 'keystone_zealots_oath']
    },
    keystone_zealots_oath: {
      id: 'keystone_zealots_oath',
      name: "Zealot's Oath",
      type: 'keystone',
      color: '#fcc419',
      x: -295,
      y: -475,
      stats: { maxEs: 75, lifeRegen: 8, eleMoreMulti: 16, moveSpeedPct: -8 },
      desc: ['+75 to Maximum Energy Shield, +8 Life/s Regen & 16% MORE Elemental Damage', '8% reduced Movement Speed'],
      neighbors: ['notable_divine_wrath', 'temp_sanct_1']
    }
  };

  exports.PASSIVE_NODES = Object.assign(exports.PASSIVE_NODES || {}, PASSIVE_NODES_EXPANSION);
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : (global.GameData = global.GameData || exports));
