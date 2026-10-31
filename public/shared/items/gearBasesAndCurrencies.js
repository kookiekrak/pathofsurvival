// Shared GameData Module: Flasks, Currencies, Gear Bases & Affix Tiers
(function (exports) {
  // ============================================================================
  // 4. FLASKS, CURRENCIES, 8 GEAR SLOTS, STAT LABELS & AFFIXES
  // ============================================================================
  const FLASKS = [
    { id: 'life', slot: 1, key: '1', name: 'Eternal Life Flask', color: '#c92a2a', maxCharges: 15, cost: 5, duration: 0, desc: 'Instantly recovers 45% of Maximum Life.' },
    { id: 'quicksilver', slot: 2, key: '2', name: 'Quicksilver Flask', color: '#2b8a3e', maxCharges: 20, cost: 10, duration: 4.5, desc: '+40% increased Movement Speed for 4.5 seconds.' },
    { id: 'granite', slot: 3, key: '3', name: 'Granite Flask', color: '#868e96', maxCharges: 20, cost: 10, duration: 5.0, desc: '+160 to Armour and 20% Physical Damage Reduction for 5 seconds.' },
    { id: 'diamond', slot: 4, key: '4', name: 'Diamond Flask', color: '#3bc9db', maxCharges: 20, cost: 10, duration: 4.5, desc: '+80% increased Critical Strike Chance & +40% Crit Multiplier for 4.5 seconds.' },
    { id: 'quartz', slot: 5, key: '5', name: 'Quartz Ward Flask', color: '#7950f2', maxCharges: 20, cost: 10, duration: 4.5, desc: 'Restores 40% Energy Shield & grants +20% Dodge Chance for 4.5 seconds.' },
    { id: 'silver', slot: 2, key: '2', name: 'Silver Onslaught Flask', color: '#dee2e6', maxCharges: 20, cost: 10, duration: 4.5, desc: 'Grants Onslaught: +22% Skill Cooldown Recovery & +20% Movement Speed for 4.5 seconds.' },
    { id: 'amethyst', slot: 3, key: '3', name: 'Amethyst Ward Flask', color: '#ae3ec9', maxCharges: 20, cost: 10, duration: 5.0, desc: 'Instantly restores 20% Life & ES and grants +25% All Elemental Resistances for 5 seconds.' }
  ];

  const CURRENCIES = {
    transmute: {
      id: 'transmute',
      name: 'Orb of Transmutation',
      short: 'Transmute',
      color: '#5c9eff',
      icon: '◈',
      description: 'Upgrades a Normal (White) gear piece to a Magic (Blue) item with 1-2 affixes.'
    },
    alteration: {
      id: 'alteration',
      name: 'Orb of Alteration',
      short: 'Alteration',
      color: '#4785ff',
      icon: '❖',
      description: 'Reforges a Magic (Blue) gear piece with new random modifiers.'
    },
    alchemy: {
      id: 'alchemy',
      name: 'Orb of Alchemy',
      short: 'Alchemy',
      color: '#ffd147',
      icon: '❂',
      description: 'Upgrades a Normal (White) gear piece to a Rare (Yellow) item with 3-5 affixes.'
    },
    chaos: {
      id: 'chaos',
      name: 'Chaos Orb',
      short: 'Chaos',
      color: '#e6b800',
      icon: '◉',
      description: 'Reforges a Rare (Yellow) gear piece with 4-5 new random modifiers.'
    },
    exalted: {
      id: 'exalted',
      name: 'Exalted Orb',
      short: 'Exalted',
      color: '#ff9933',
      icon: '✦',
      description: 'Augments a Rare (Yellow) gear piece with a new high-tier modifier (up to 6 max).'
    },
    divine: {
      id: 'divine',
      name: 'Divine Orb',
      short: 'Divine',
      color: '#fff3bf',
      icon: '✧',
      description: 'Randomises the numeric values of all explicit modifiers on a Magic, Rare, or Unique item within their current Affix Tier roll ranges!'
    },
    regret: {
      id: 'regret',
      name: 'Orb of Scouring',
      short: 'Scouring',
      color: '#e0e0e0',
      icon: '↺',
      description: 'Removes all modifiers from a Magic or Rare gear piece, returning it to Normal (White) rarity.'
    }
  };

  const GEAR_SLOTS = ['weapon', 'helm', 'body', 'gloves', 'boots', 'belt', 'ring', 'amulet'];

  const GEAR_BASES = {
    weapon: [
      { id: 'karui_chopper', name: 'Vaal Great-Axe', slot: 'weapon', implicits: { flatDmg: 16, physDmgPct: 16 } },
      { id: 'harbinger_bow', name: 'Harbinger Bow', slot: 'weapon', implicits: { flatDmg: 14, critChance: 15, projDmgPct: 12 } },
      { id: 'prophecy_wand', name: 'Prophecy Wand', slot: 'weapon', implicits: { flatDmg: 15, spellDmgPct: 16 } },
      { id: 'imperial_skean', name: 'Imperial Rune Dagger', slot: 'weapon', implicits: { flatDmg: 14, critMulti: 18 } },
      { id: 'jewelled_foil', name: 'Jewelled Foil', slot: 'weapon', implicits: { flatDmg: 14, critMulti: 14, cdrPct: 6 } },
      { id: 'opal_sceptre', name: 'Opal Sceptre', slot: 'weapon', implicits: { flatDmg: 15, eleDmgPct: 16 } }
    ],
    helm: [
      { id: 'royal_burgonet', name: 'Royal Burgonet', slot: 'helm', implicits: { maxLife: 18, armor: 42 } },
      { id: 'lion_pelt', name: 'Lion Pelt', slot: 'helm', implicits: { maxLife: 18, evasion: 46 } },
      { id: 'hubris_circlet', name: 'Hubris Circlet', slot: 'helm', implicits: { maxEs: 32 } },
      { id: 'bone_helmet', name: 'Praetor Crown', slot: 'helm', implicits: { maxLife: 14, armor: 24, maxEs: 18 } }
    ],
    body: [
      { id: 'astral_plate', name: 'Astral Plate', slot: 'body', implicits: { maxLife: 34, armor: 80, allRes: 8 } },
      { id: 'assassin_garb', name: "Assassin's Garb", slot: 'body', implicits: { maxLife: 28, evasion: 85, moveSpeedPct: 5 } },
      { id: 'vaal_regalia', name: 'Vaal Regalia', slot: 'body', implicits: { maxLife: 20, maxEs: 52 } },
      { id: 'triumphant_lamellar', name: 'Triumphant Lamellar', slot: 'body', implicits: { maxLife: 30, armor: 48, evasion: 48 } }
    ],
    gloves: [
      { id: 'spiked_gloves', name: 'Spiked Gloves', slot: 'gloves', implicits: { flatDmg: 5, physDmgPct: 12 } },
      { id: 'gripped_gloves', name: 'Gripped Gloves', slot: 'gloves', implicits: { flatDmg: 5, projDmgPct: 12 } },
      { id: 'fingerless_silk', name: 'Fingerless Silk Gloves', slot: 'gloves', implicits: { flatDmg: 5, spellDmgPct: 12 } },
      { id: 'apothecary_gloves', name: 'Apothecary Gloves', slot: 'gloves', implicits: { flatDmg: 5, eleDmgPct: 12 } }
    ],
    boots: [
      { id: 'titan_greaves', name: 'Titan Greaves', slot: 'boots', implicits: { maxLife: 16, armor: 30, moveSpeedPct: 12 } },
      { id: 'slink_boots', name: 'Slink Boots', slot: 'boots', implicits: { maxLife: 14, evasion: 36, moveSpeedPct: 14 } },
      { id: 'sorcerer_boots', name: 'Sorcerer Boots', slot: 'boots', implicits: { maxEs: 24, moveSpeedPct: 12 } },
      { id: 'two_toned_boots', name: 'Two-Toned Boots', slot: 'boots', implicits: { allRes: 8, moveSpeedPct: 12 } }
    ],
    belt: [
      { id: 'stygian_vise', name: 'Stygian Vise', slot: 'belt', implicits: { maxLife: 32 } },
      { id: 'crystal_belt', name: 'Crystal Belt', slot: 'belt', implicits: { maxEs: 32 } },
      { id: 'vanguard_belt', name: 'Vanguard Belt', slot: 'belt', implicits: { maxLife: 18, armor: 34, evasion: 34 } }
    ],
    ring: [
      { id: 'vermilion_ring', name: 'Vermilion Ring', slot: 'ring', implicits: { maxLife: 24 } },
      { id: 'opal_ring', name: 'Opal Ring', slot: 'ring', implicits: { flatDmg: 5, eleDmgPct: 14 } },
      { id: 'two_stone_ring', name: 'Prismatic Ring', slot: 'ring', implicits: { allRes: 10 } },
      { id: 'steel_ring', name: 'Steel Ring', slot: 'ring', implicits: { flatDmg: 6, physDmgPct: 14 } }
    ],
    amulet: [
      { id: 'onyx_amulet', name: 'Onyx Amulet', slot: 'amulet', implicits: { str: 12, dex: 12, int: 12 } },
      { id: 'marble_amulet', name: 'Marble Amulet', slot: 'amulet', implicits: { maxLife: 20, lifeRegen: 4 } },
      { id: 'jade_amulet', name: 'Citrine Talisman', slot: 'amulet', implicits: { flatDmg: 6, cdrPct: 6 } }
    ]
  };

  const STAT_LABELS = {
    flatDmg: 'Base Skill & Weapon Damage',
    maxLife: 'Maximum Life',
    maxLifePct: '% Increased Maximum Life',
    maxEs: 'Maximum Energy Shield',
    armor: 'Armour',
    evasion: 'Evasion Rating',
    allRes: '% All Elemental Resistances',
    moveSpeedPct: '% Movement Speed',
    physDmgPct: '% Physical Damage',
    eleDmgPct: '% Elemental Damage',
    spellDmgPct: '% Spell Damage',
    projDmgPct: '% Projectile Damage',
    aoeDmgPct: '% Area Damage',
    areaPct: '% Area of Effect Radius',
    cdrPct: '% Cooldown Recovery',
    critChance: '% Critical Strike Chance',
    critMulti: '% Critical Strike Multiplier',
    lifeOnHit: 'Life gained on Hit',
    lifeOnKill: 'Life gained on Kill',
    lifeRegen: 'Life Regen / sec',
    extraProj: 'Additional Projectiles',
    extraChain: 'Additional Chains',
    str: 'Strength',
    dex: 'Dexterity',
    int: 'Intelligence',
    globalDmgMulti: '% More Global Damage',
    startingGold: 'Starting Run Gold',
    headhunter: 'Headhunter Soul Stealer (Steals Rare Mods)',
    mageblood: 'Mageblood Eternal Utility Flasks (+25% Flask Effect)',
    allGemLevels: 'to Level of All Active Skill Gems',
    supportLevelBonus: 'to Level of All Support Gems',
    starforgeShock: 'Physical Hits Shock & Chill Enemies',
    voidBattery: 'Power Charge Mastery (+18% Base Crit & +60% Spell Dmg)',
    windripperCull: 'Elemental Hits Chill, Shock & Cull at 15% Life',
    kaomsFireBonus: 'Molten Caldera Aura (Burns Nearby Enemies for 18% of Max Life/s)',
    shavronneWard: 'Uninterruptible Energy Shield Recharge (+12% ES/sec)',
    atziriInstantLeech: 'Vaal Pact (Critical Strikes Instantly Leech 3% Life & ES)',
    crownOfEyes: 'Transfiguration of Soul (150% of Spell Dmg applies to Attacks)',
    sevenLeagueDash: 'Mirage Stride (-45% Dash Cooldown & Immune to Chill)',
    lorisLucky: 'Prismatic Ward (-25% Enemy Damage Taken on Low/Mid Life)',
    vaalSoulGainPct: '% Increased Vaal Soul Gain',
    goldGainPct: '% Increased Gold & Loot Rarity',
    dodgeChance: '% Chance to Dodge Attacks & Spells',
    esMoreMulti: '% MORE Maximum Energy Shield',
    mjolnerProc: 'Thunderous Strike (Hits Trigger Chaining Lightning Bolts)',
    cospriProc: 'Glacial Malice (Critical Strikes Trigger Frost Nova)',
    arakaaliVenom: 'Queen\'s Venom (Critical Strikes Wither Enemies for +20% Damage Taken)',
    inpulsaExplode: 'Shocked Enemies Explode for 22% Max Life as Lightning',
    brassDome: 'Juggernaut Fortress (20% Less Damage Taken from Hits & Slams)',
    brotherhoodChill: '100% of Lightning Hits Also Chill & Freeze Enemies'
  };

  const AFFIX_POOL = [
    { id: 'flat_dmg', label: '+{val} to Base Skill & Weapon Damage', stat: 'flatDmg', min: 6, max: 24 },
    { id: 'life', label: '+{val} to Maximum Life', stat: 'maxLife', min: 18, max: 58 },
    { id: 'life_pct', label: '{val}% increased Maximum Life', stat: 'maxLifePct', min: 5, max: 16 },
    { id: 'es', label: '+{val} to Maximum Energy Shield', stat: 'maxEs', min: 15, max: 48 },
    { id: 'armor', label: '+{val} to Armour', stat: 'armor', min: 28, max: 96 },
    { id: 'evasion', label: '+{val} to Evasion Rating', stat: 'evasion', min: 28, max: 96 },
    { id: 'phys_dmg', label: '{val}% increased Physical Damage', stat: 'physDmgPct', min: 14, max: 36 },
    { id: 'ele_dmg', label: '{val}% increased Elemental Damage', stat: 'eleDmgPct', min: 14, max: 36 },
    { id: 'spell_dmg', label: '{val}% increased Spell Damage', stat: 'spellDmgPct', min: 14, max: 36 },
    { id: 'proj_dmg', label: '{val}% increased Projectile Damage', stat: 'projDmgPct', min: 14, max: 34 },
    { id: 'aoe_dmg', label: '{val}% increased Area Damage', stat: 'aoeDmgPct', min: 14, max: 34 },
    { id: 'area_rad', label: '{val}% increased Area of Effect Radius', stat: 'areaPct', min: 6, max: 18 },
    { id: 'atk_spd', label: '{val}% increased Skill Cooldown Recovery', stat: 'cdrPct', min: 5, max: 14 },
    { id: 'crit_chance', label: '+{val}% to Critical Strike Chance', stat: 'critChance', min: 12, max: 30 },
    { id: 'crit_multi', label: '+{val}% to Global Critical Strike Multiplier', stat: 'critMulti', min: 12, max: 28 },
    { id: 'move_spd', label: '{val}% increased Movement Speed', stat: 'moveSpeedPct', min: 7, max: 18 },
    { id: 'all_res', label: '+{val}% to all Elemental Resistances', stat: 'allRes', min: 7, max: 18 },
    { id: 'life_regen', label: 'Regenerate {val} Life per second', stat: 'lifeRegen', min: 3, max: 10 },
    { id: 'life_on_hit', label: '+{val} Life gained for each Enemy Hit', stat: 'lifeOnHit', min: 2, max: 5 },
    { id: 'str', label: '+{val} to Strength', stat: 'str', min: 10, max: 28 },
    { id: 'dex', label: '+{val} to Dexterity', stat: 'dex', min: 10, max: 28 },
    { id: 'int', label: '+{val} to Intelligence', stat: 'int', min: 10, max: 28 }
  ];

  const AFFIX_TIER_BRACKETS = [
    { tierRank: 5, tierNum: 5, tierName: 'T5', minIlvl: 1, minFrac: 0.0, maxFrac: 0.25 },
    { tierRank: 4, tierNum: 4, tierName: 'T4', minIlvl: 3, minFrac: 0.25, maxFrac: 0.50 },
    { tierRank: 3, tierNum: 3, tierName: 'T3', minIlvl: 6, minFrac: 0.50, maxFrac: 0.78 },
    { tierRank: 2, tierNum: 2, tierName: 'T2', minIlvl: 10, minFrac: 0.78, maxFrac: 1.00 },
    { tierRank: 1, tierNum: 1, tierName: 'T1', minIlvl: 15, minFrac: 1.02, maxFrac: 1.30 }
  ];

  function computeAffixTierRange(affix, ilvl = 1) {
    if (!affix) return null;
    if (typeof affix.rollMin === 'number' && typeof affix.rollMax === 'number') {
      return { rollMin: affix.rollMin, rollMax: affix.rollMax, baseTier: affix.baseTier || String(affix.tierName || 'T5').split(' ')[0] };
    }
    const cleanIlvl = Math.max(1, Math.floor(ilvl || 1));
    const poolDef = AFFIX_POOL.find(p => p.id === affix.id || p.stat === affix.stat);
    if (!poolDef) return null;
    const rawTierStr = String(affix.baseTier || affix.tierName || (affix.tierNum ? `T${affix.tierNum}` : 'T5')).split(' ')[0];
    const bracket = AFFIX_TIER_BRACKETS.find(b => b.tierName === rawTierStr || b.tierRank === affix.tierRank || b.tierNum === affix.tierNum) || AFFIX_TIER_BRACKETS[0];
    const baseMin = typeof poolDef.min === 'number' ? poolDef.min : 10;
    const baseMax = typeof poolDef.max === 'number' ? poolDef.max : 30;
    const span = Math.max(1, baseMax - baseMin);
    let tMin;
    let tMax;
    if (bracket.tierRank === 1) {
      tMin = Math.max(baseMax, Math.round(baseMax * bracket.minFrac));
      tMax = Math.max(tMin + 1, Math.round(baseMax * bracket.maxFrac));
    } else {
      tMin = Math.max(1, Math.round(baseMin + span * bracket.minFrac));
      tMax = Math.max(tMin + 1, Math.round(baseMin + span * bracket.maxFrac));
    }
    const isFlatStat = ['flatDmg', 'maxLife', 'maxEs', 'armor', 'evasion', 'lifeRegen', 'lifeOnHit'].includes(poolDef.stat);
    const flatIlvlMult = isFlatStat ? (1 + Math.max(0, cleanIlvl - 1) * 0.24) : 1.0;
    const rollMin = Math.max(1, Math.round(tMin * flatIlvlMult));
    const rollMax = Math.max(rollMin + 1, Math.round(tMax * flatIlvlMult));
    return { rollMin, rollMax, baseTier: bracket.tierName, labelTemplate: poolDef.label };
  }

  Object.assign(exports, { FLASKS, CURRENCIES, GEAR_SLOTS, GEAR_BASES, STAT_LABELS, AFFIX_POOL, AFFIX_TIER_BRACKETS, computeAffixTierRange });
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : (global.GameData = global.GameData || exports));
