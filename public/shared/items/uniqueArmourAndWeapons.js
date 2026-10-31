// Shared GameData Module: Unique Armour & Weapons (Part 1)
(function (exports) {
  const UNIQUE_TEMPLATES_PART1 = [
    // =======================================================================
    // TIER 0 CHASE UNIQUES (dropWeight: 0.25 - 0.35)
    // =======================================================================
    {
      name: 'Mageblood',
      baseName: 'Heavy Belt',
      slot: 'belt',
      rarity: 'unique',
      dropWeight: 0.22,
      implicits: { str: 25 },
      affixes: [
        { stat: 'mageblood', val: 1, binary: true, text: 'Equipped Utility Flasks in your Belt are permanently active at 100% uptime with +25% increased Flask Effect' },
        { stat: 'maxLife', min: 35, max: 65, val: 50, text: '+{val} to Maximum Life' },
        { stat: 'allRes', min: 14, max: 25, val: 20, text: '+{val}% to all Elemental Resistances' },
        { stat: 'moveSpeedPct', min: 10, max: 20, val: 15, text: '{val}% increased Movement Speed' },
        { stat: 'dex', min: 20, max: 40, val: 30, text: '+{val} to Dexterity' }
      ],
      flavor: '"Rivers of power course through your veins."'
    },
    {
      name: 'Ashes of the Stars',
      baseName: 'Onyx Amulet',
      slot: 'amulet',
      rarity: 'unique',
      dropWeight: 0.25,
      implicits: { str: 16, dex: 16, int: 16 },
      affixes: [
        { stat: 'allGemLevels', val: 1, binary: true, text: '+1 to Level of all Active Skill Gems' },
        { stat: 'supportLevelBonus', val: 1, binary: true, text: '+1 to Level of all Linked Support Gems (+20% Gem Quality)' },
        { stat: 'cdrPct', min: 14, max: 26, val: 20, text: '{val}% increased Skill Cooldown Recovery' },
        { stat: 'vaalSoulGainPct', min: 25, max: 50, val: 40, noIlvlScale: true, text: '{val}% increased Vaal Soul Gain & Reservation Efficiency' },
        { stat: 'allRes', min: 10, max: 20, val: 15, text: '+{val}% to all Elemental Resistances' }
      ],
      flavor: '"What fell from the heavens forever altered the realm."'
    },
    {
      name: 'Headhunter',
      baseName: 'Leather Belt',
      slot: 'belt',
      rarity: 'unique',
      dropWeight: 0.24,
      implicits: { maxLife: 40 },
      affixes: [
        { stat: 'headhunter', val: 1, binary: true, text: 'Killing a Rare monster steals its Modifiers for 20s (Up to 8 Stacks: +10% MORE Damage, +8% Speed, +8% AoE & +35 Life/Ward per stack)' },
        { stat: 'str', min: 20, max: 38, val: 28, text: '+{val} to Strength' },
        { stat: 'dex', min: 20, max: 38, val: 28, text: '+{val} to Dexterity' },
        { stat: 'maxLife', min: 40, max: 70, val: 55, text: '+{val} to Maximum Life' },
        { stat: 'moveSpeedPct', min: 8, max: 16, val: 12, text: '{val}% increased Movement Speed' }
      ],
      flavor: '"A man\'s soul rules from a cavern of bone, learn to judge the housing and the prize is yours."'
    },
    {
      name: 'Starforge',
      baseName: 'Infernal Sword',
      slot: 'weapon',
      rarity: 'unique',
      dropWeight: 0.30,
      implicits: { flatDmg: 22, physDmgPct: 24 },
      affixes: [
        { stat: 'starforgeShock', val: 1, binary: true, text: 'Your Physical Damage can Shock & Chill Enemies (Shocked enemies take +20% increased Damage)' },
        { stat: 'flatDmg', min: 14, max: 24, val: 18, text: '+{val} to Base Physical Weapon Damage' },
        { stat: 'physDmgPct', min: 35, max: 60, val: 45, text: '{val}% increased Physical Damage' },
        { stat: 'areaPct', min: 20, max: 35, val: 30, noIlvlScale: true, text: '{val}% increased Area of Effect Radius' },
        { stat: 'maxLife', min: 40, max: 70, val: 55, text: '+{val} to Maximum Life' }
      ],
      flavor: '"The end is written in the stars."'
    },
    {
      name: 'Void Battery',
      baseName: 'Prophecy Wand',
      slot: 'weapon',
      rarity: 'unique',
      dropWeight: 0.32,
      implicits: { flatDmg: 18, spellDmgPct: 24 },
      affixes: [
        { stat: 'voidBattery', val: 1, binary: true, text: 'Power Charge Mastery: Grants 6 Maximum Power Charges (+18% Base Crit Chance, +35% Crit Multi & +65% Spell Damage)' },
        { stat: 'extraProj', val: 1, binary: true, text: 'Skills fire +1 Additional Projectile' },
        { stat: 'flatDmg', min: 10, max: 18, val: 14, text: '+{val} to Base Spell & Skill Damage' },
        { stat: 'cdrPct', min: 12, max: 22, val: 16, text: '{val}% increased Cast & Cooldown Speed' },
        { stat: 'maxEs', min: 35, max: 65, val: 48, text: '+{val} to Maximum Energy Shield' }
      ],
      flavor: '"Nothingness channeled into a single point of devastation."'
    },
    {
      name: 'Windripper',
      baseName: 'Harbinger Bow',
      slot: 'weapon',
      rarity: 'unique',
      dropWeight: 0.32,
      implicits: { flatDmg: 17, projDmgPct: 22 },
      affixes: [
        { stat: 'extraProj', val: 2, binary: true, text: 'Skills fire +2 Additional Projectiles' },
        { stat: 'windripperCull', val: 1, binary: true, text: 'Hits Chill & Shock Enemies • Culls Enemies below 15% Life' },
        { stat: 'flatDmg', min: 10, max: 18, val: 14, text: '+{val} to Base Elemental & Bow Damage' },
        { stat: 'critChance', min: 25, max: 45, val: 35, text: '+{val}% to Critical Strike Chance' },
        { stat: 'goldGainPct', min: 15, max: 35, val: 25, noIlvlScale: true, text: '{val}% increased Gold & Loot Quantity from Frozen/Shocked Enemies' }
      ],
      flavor: '"It pierces the gale before the string even sings."'
    },
    {
      name: "Kaom's Heart",
      baseName: 'Glorious Plate',
      slot: 'body',
      rarity: 'unique',
      dropWeight: 0.32,
      implicits: { armor: 80 },
      affixes: [
        { stat: 'kaomsFireBonus', val: 1, binary: true, text: 'Molten Caldera: Pulses Righteous Fire Damage equal to 18% of your Maximum Life per second to nearby enemies' },
        { stat: 'maxLife', min: 125, max: 195, val: 160, text: '+{val} to Maximum Life' },
        { stat: 'maxLifePct', min: 15, max: 25, val: 20, noIlvlScale: true, text: '{val}% increased Maximum Life' },
        { stat: 'eleDmgPct', min: 30, max: 50, val: 40, text: '{val}% increased Fire & Elemental Damage' },
        { stat: 'lifeRegen', min: 8, max: 16, val: 12, text: 'Regenerate {val} Life per second' }
      ],
      flavor: '"The warrior needs no trinkets when his blood burns like the caldera."'
    },
    {
      name: "Shavronne's Wrappings",
      baseName: 'Occultist Vestment',
      slot: 'body',
      rarity: 'unique',
      dropWeight: 0.32,
      implicits: { maxEs: 65 },
      affixes: [
        { stat: 'shavronneWard', val: 1, binary: true, text: 'Aether Ward: Energy Shield Recharge is NEVER interrupted by damage (+12% of Max ES regenerated per second) & Reflects Lightning Nova on Hit' },
        { stat: 'maxEs', min: 70, max: 120, val: 95, text: '+{val} to Maximum Energy Shield' },
        { stat: 'esMoreMulti', min: 15, max: 25, val: 20, noIlvlScale: true, text: '{val}% MORE Maximum Energy Shield' },
        { stat: 'spellDmgPct', min: 24, max: 42, val: 32, text: '{val}% increased Spell & Lightning Damage' },
        { stat: 'allRes', min: 12, max: 22, val: 16, text: '+{val}% to all Elemental Resistances' }
      ],
      flavor: '"Shavronne of Umbra wove lightning and aether into an impenetrable ward."'
    },
    {
      name: "Atziri's Acuity",
      baseName: 'Vaal Gauntlets',
      slot: 'gloves',
      rarity: 'unique',
      dropWeight: 0.35,
      implicits: { armor: 45 },
      affixes: [
        { stat: 'atziriInstantLeech', val: 1, binary: true, text: 'Vaal Pact: Critical Strikes Instantly Leech 3% of Maximum Life & Energy Shield (bypasses Leech cap)' },
        { stat: 'critChance', min: 24, max: 42, val: 32, text: '+{val}% to Critical Strike Chance' },
        { stat: 'critMulti', min: 18, max: 34, val: 25, text: '+{val}% to Critical Strike Multiplier' },
        { stat: 'cdrPct', min: 8, max: 16, val: 12, text: '{val}% increased Attack & Cast Speed' },
        { stat: 'maxLife', min: 35, max: 60, val: 45, text: '+{val} to Maximum Life' }
      ],
      flavor: '"A hand guided by the Queen never misses the heart."'
    },
    // =======================================================================
    // TIER 1 & TIER 2 BUILD-DEFINING UNIQUES (dropWeight: 0.55 - 1.35)
    // =======================================================================
    {
      name: 'Mjölner',
      baseName: 'Vaal Great-Axe',
      slot: 'weapon',
      rarity: 'unique',
      dropWeight: 0.45,
      implicits: { flatDmg: 19, eleDmgPct: 20 },
      affixes: [
        { stat: 'mjolnerProc', val: 1, binary: true, text: 'Thunderous Strike: Hits Trigger Chaining Lightning Bolts to 3 nearby enemies (0.38s cooldown)' },
        { stat: 'extraChain', val: 1, binary: true, text: 'Skills Chain +1 Additional Time' },
        { stat: 'flatDmg', min: 12, max: 22, val: 16, text: '+{val} to Base Lightning & Weapon Damage' },
        { stat: 'eleDmgPct', min: 32, max: 55, val: 42, text: '{val}% increased Lightning & Elemental Damage' },
        { stat: 'str', min: 25, max: 45, val: 35, text: '+{val} to Strength' }
      ],
      flavor: '"Look the storm in the eye and you will have its respect."'
    },
    {
      name: "Cospri's Malice",
      baseName: 'Jewelled Foil',
      slot: 'weapon',
      rarity: 'unique',
      dropWeight: 0.45,
      implicits: { flatDmg: 17, critMulti: 22 },
      affixes: [
        { stat: 'cospriProc', val: 1, binary: true, text: 'Glacial Malice: Critical Strikes Trigger a Chilling Frost Nova Burst on Target (0.42s cooldown)' },
        { stat: 'flatDmg', min: 11, max: 19, val: 15, text: '+{val} to Base Cold & Spell Damage' },
        { stat: 'spellDmgPct', min: 28, max: 48, val: 38, text: '{val}% increased Cold & Spell Damage' },
        { stat: 'critChance', min: 24, max: 40, val: 32, text: '+{val}% to Critical Strike Chance' },
        { stat: 'cdrPct', min: 10, max: 20, val: 15, text: '{val}% increased Attack & Cooldown Speed' }
      ],
      flavor: '"Browse the cold markets of Eternal Frost and find your demise."'
    },
    {
      name: "Arakaali's Fang",
      baseName: 'Imperial Rune Dagger',
      slot: 'weapon',
      rarity: 'unique',
      dropWeight: 0.55,
      implicits: { flatDmg: 16, critMulti: 20 },
      affixes: [
        { stat: 'arakaaliVenom', val: 1, binary: true, text: "Queen's Venom: Critical Strikes Wither & Shock Enemies for 4s (+20% increased Damage Taken)" },
        { stat: 'flatDmg', min: 10, max: 18, val: 14, text: '+{val} to Base Dagger & Skill Damage' },
        { stat: 'critMulti', min: 25, max: 48, val: 36, text: '+{val}% to Global Critical Strike Multiplier' },
        { stat: 'cdrPct', min: 10, max: 18, val: 14, text: '{val}% increased Attack & Cooldown Speed' },
        { stat: 'lifeOnHit', min: 3, max: 7, val: 5, text: '+{val} Life gained for each Enemy Hit' }
      ],
      flavor: '"All children must eat."'
    },
    {
      name: 'Quill Rain',
      baseName: 'Harbinger Bow',
      slot: 'weapon',
      rarity: 'unique',
      dropWeight: 1.15,
      implicits: { flatDmg: 11, projDmgPct: 14 },
      affixes: [
        { stat: 'extraProj', val: 2, binary: true, text: 'Skills fire +2 Additional Projectiles' },
        { stat: 'cdrPct', min: 35, max: 55, val: 45, noIlvlScale: true, text: '{val}% increased Attack & Skill Cooldown Recovery' },
        { stat: 'projDmgPct', min: 18, max: 32, val: 25, text: '{val}% increased Projectile Damage' },
        { stat: 'lifeOnHit', min: 3, max: 6, val: 4, text: '+{val} Life gained for each Enemy Hit' },
        { stat: 'dex', min: 18, max: 34, val: 26, text: '+{val} to Dexterity' }
      ],
      flavor: '"Hundreds of feathered needles blot out the sun."'
    },
    {
      name: "The Poet's Pen",
      baseName: 'Prophecy Wand',
      slot: 'weapon',
      rarity: 'unique',
      dropWeight: 0.85,
      implicits: { flatDmg: 15, spellDmgPct: 18 },
      affixes: [
        { stat: 'allGemLevels', val: 1, binary: true, text: '+1 to Level of all Active Skill Gems' },
        { stat: 'cdrPct', min: 14, max: 24, val: 19, text: '{val}% increased Cast & Cooldown Speed' },
        { stat: 'spellDmgPct', min: 22, max: 38, val: 30, text: '{val}% increased Spell Damage' },
        { stat: 'flatDmg', min: 9, max: 16, val: 12, text: '+{val} to Base Spell & Skill Damage' },
        { stat: 'maxEs', min: 25, max: 45, val: 35, text: '+{val} to Maximum Energy Shield' }
      ],
      flavor: '"Inscribed in blood, every verse is an execution."'
    },
    {
      name: "Inpulsa's Broken Heart",
      baseName: "Assassin's Garb",
      slot: 'body',
      rarity: 'unique',
      dropWeight: 0.55,
      implicits: { evasion: 80, moveSpeedPct: 5 },
      affixes: [
        { stat: 'inpulsaExplode', val: 1, binary: true, text: 'Shocked Enemies You Kill Explode, dealing 22% of their Maximum Life as Lightning Area Damage' },
        { stat: 'maxLife', min: 50, max: 85, val: 68, text: '+{val} to Maximum Life' },
        { stat: 'eleDmgPct', min: 28, max: 48, val: 38, text: '{val}% increased Elemental & Shock Damage' },
        { stat: 'moveSpeedPct', min: 7, max: 14, val: 10, text: '{val}% increased Movement Speed' },
        { stat: 'evasion', min: 45, max: 80, val: 60, text: '+{val} to Evasion Rating' }
      ],
      flavor: '"Calmness is a lie told by those who cannot feel the storm."'
    },
    {
      name: 'Carcass Jack',
      baseName: 'Triumphant Lamellar',
      slot: 'body',
      rarity: 'unique',
      dropWeight: 0.85,
      implicits: { armor: 48, evasion: 48 },
      affixes: [
        { stat: 'areaPct', min: 25, max: 45, val: 35, noIlvlScale: true, text: '{val}% increased Area of Effect Radius' },
        { stat: 'aoeDmgPct', min: 28, max: 50, val: 40, text: '{val}% increased Area Damage' },
        { stat: 'maxLife', min: 45, max: 75, val: 60, text: '+{val} to Maximum Life' },
        { stat: 'allRes', min: 9, max: 16, val: 12, text: '+{val}% to all Elemental Resistances' },
        { stat: 'evasion', min: 40, max: 70, val: 55, text: '+{val} to Evasion Rating' }
      ],
      flavor: '"oso-warm and slick with crimson, yet light as a whisper."'
    },
    {
      name: 'The Brass Dome',
      baseName: 'Astral Plate',
      slot: 'body',
      rarity: 'unique',
      dropWeight: 0.65,
      implicits: { armor: 95, allRes: 8 },
      affixes: [
        { stat: 'brassDome', val: 1, binary: true, text: 'Juggernaut Fortress: Take 20% Less Damage from All Hits & Boss Slams' },
        { stat: 'armor', min: 180, max: 310, val: 245, text: '+{val} to Armour' },
        { stat: 'allRes', min: 14, max: 22, val: 18, text: '+{val}% to all Elemental Resistances' },
        { stat: 'maxLife', min: 40, max: 70, val: 55, text: '+{val} to Maximum Life' }
      ],
      flavor: '"The turtle hides within its shell, untouched by the falling sky."'
    },
    {
      name: 'Crown of Eyes',
      baseName: 'Hubris Circlet',
      slot: 'helm',
      rarity: 'unique',
      dropWeight: 0.60,
      implicits: { maxLife: 25, maxEs: 35 },
      affixes: [
        { stat: 'crownOfEyes', val: 1, binary: true, text: 'Transfiguration of Soul: Increases to Spell Damage ALSO apply to Physical & Attack Damage at 150% of their value' },
        { stat: 'spellDmgPct', min: 20, max: 36, val: 28, text: '{val}% increased Spell Damage' },
        { stat: 'maxEs', min: 40, max: 70, val: 55, text: '+{val} to Maximum Energy Shield' },
        { stat: 'lifeOnHit', min: 3, max: 7, val: 5, text: '+{val} Life & Energy Shield gained for each Enemy Hit' }
      ],
      flavor: '"Gazes inward to see the threads of slaughter."'
    }
  ];

  exports.UNIQUE_TEMPLATES = (exports.UNIQUE_TEMPLATES || []).concat(UNIQUE_TEMPLATES_PART1);
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : (global.GameData = global.GameData || exports));
