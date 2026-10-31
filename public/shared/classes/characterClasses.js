// Shared GameData Module: Character Classes
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

  Object.assign(exports, { CLASSES });
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : (global.GameData = global.GameData || exports));
