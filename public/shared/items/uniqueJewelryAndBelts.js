// Shared GameData Module: Unique Helms, Gloves, Boots, Jewelry & Belts (Part 2)
(function (exports) {
  const UNIQUE_TEMPLATES_PART2 = [
    {
      name: 'Goldrim',
      baseName: 'Lion Pelt',
      slot: 'helm',
      rarity: 'unique',
      dropWeight: 1.35,
      implicits: { evasion: 42 },
      affixes: [
        { stat: 'allRes', min: 28, max: 40, val: 35, noIlvlScale: true, text: '+{val}% to all Elemental Resistances' },
        { stat: 'moveSpeedPct', min: 8, max: 15, val: 12, text: '{val}% increased Movement Speed' },
        { stat: 'evasion', min: 35, max: 65, val: 50, text: '+{val} to Evasion Rating' },
        { stat: 'maxLife', min: 25, max: 45, val: 35, text: '+{val} to Maximum Life' }
      ],
      flavor: '"No metal rings truer than pure gold."'
    },
    {
      name: 'Abyssus',
      baseName: 'Royal Burgonet',
      slot: 'helm',
      rarity: 'unique',
      dropWeight: 0.75,
      implicits: { armor: 55 },
      affixes: [
        { stat: 'flatDmg', min: 16, max: 28, val: 22, text: '+{val} to Base Physical & Weapon Damage' },
        { stat: 'critMulti', min: 50, max: 85, val: 68, noIlvlScale: true, text: '+{val}% to Global Critical Strike Multiplier' },
        { stat: 'armor', min: 50, max: 90, val: 70, text: '+{val} to Armour' },
        { stat: 'str', min: 20, max: 35, val: 28, text: '+{val} to Strength' }
      ],
      flavor: '"When you peer into the abyss, only violence peers back."'
    },
    {
      name: "Devoto's Devotion",
      baseName: 'Praetor Crown',
      slot: 'helm',
      rarity: 'unique',
      dropWeight: 0.80,
      implicits: { armor: 30, evasion: 30 },
      affixes: [
        { stat: 'moveSpeedPct', min: 20, max: 30, val: 25, noIlvlScale: true, text: '{val}% increased Movement Speed' },
        { stat: 'cdrPct', min: 14, max: 22, val: 18, text: '{val}% increased Attack & Cooldown Speed' },
        { stat: 'dex', min: 35, max: 60, val: 48, text: '+{val} to Dexterity' },
        { stat: 'armor', min: 45, max: 80, val: 62, text: '+{val} to Armour' },
        { stat: 'maxLife', min: 30, max: 50, val: 40, text: '+{val} to Maximum Life' }
      ],
      flavor: '"Swift as mercury, relentless as the tide."'
    },
    {
      name: 'Hands of the High Templar',
      baseName: 'Apothecary Gloves',
      slot: 'gloves',
      rarity: 'unique',
      dropWeight: 0.55,
      implicits: { flatDmg: 6, eleDmgPct: 14 },
      affixes: [
        { stat: 'allGemLevels', val: 1, binary: true, text: '+1 to Level of all Active Skill Gems' },
        { stat: 'cdrPct', min: 10, max: 18, val: 14, text: '{val}% increased Attack & Cast Speed' },
        { stat: 'eleDmgPct', min: 20, max: 35, val: 28, text: '{val}% increased Elemental Damage' },
        { stat: 'maxLife', min: 40, max: 70, val: 55, text: '+{val} to Maximum Life' },
        { stat: 'allRes', min: 10, max: 18, val: 14, text: '+{val}% to all Elemental Resistances' }
      ],
      flavor: '"Sanctified in blood and corruption, yet unbroken."'
    },
    {
      name: 'Shadows and Dust',
      baseName: 'Gripped Gloves',
      slot: 'gloves',
      rarity: 'unique',
      dropWeight: 0.90,
      implicits: { flatDmg: 5, projDmgPct: 12 },
      affixes: [
        { stat: 'critMulti', min: 22, max: 38, val: 30, text: '+{val}% to Global Critical Strike Multiplier' },
        { stat: 'critChance', min: 20, max: 35, val: 28, text: '+{val}% to Critical Strike Chance' },
        { stat: 'moveSpeedPct', min: 8, max: 15, val: 12, text: '{val}% increased Movement Speed' },
        { stat: 'lifeOnHit', min: 3, max: 6, val: 4, text: '+{val} Life gained for each Enemy Hit' },
        { stat: 'evasion', min: 35, max: 65, val: 50, text: '+{val} to Evasion Rating' }
      ],
      flavor: '"Out of the light, only blades remain."'
    },
    {
      name: 'Facebreaker',
      baseName: 'Spiked Gloves',
      slot: 'gloves',
      rarity: 'unique',
      dropWeight: 1.15,
      implicits: { flatDmg: 6, physDmgPct: 14 },
      affixes: [
        { stat: 'physDmgPct', min: 38, max: 65, val: 52, text: '{val}% increased Physical Damage' },
        { stat: 'critMulti', min: 30, max: 55, val: 42, text: '+{val}% to Global Critical Strike Multiplier' },
        { stat: 'flatDmg', min: 10, max: 18, val: 14, text: '+{val} to Base Physical & Skill Damage' },
        { stat: 'maxLife', min: 25, max: 45, val: 35, text: '+{val} to Maximum Life' }
      ],
      flavor: '"Why use a sword when knuckles shatter bone just as well?"'
    },
    {
      name: 'Seven-League Step',
      baseName: 'Rawhide Boots',
      slot: 'boots',
      rarity: 'unique',
      dropWeight: 0.45,
      implicits: { evasion: 40 },
      affixes: [
        { stat: 'sevenLeagueDash', val: 1, binary: true, text: 'Mirage Stride: -45% Flame Dash Cooldown, Immune to Chill & Leaves a Shocking Spark Wake when Dashing' },
        { stat: 'moveSpeedPct', min: 35, max: 50, val: 42, noIlvlScale: true, text: '{val}% increased Movement Speed' },
        { stat: 'dodgeChance', min: 10, max: 18, val: 14, noIlvlScale: true, text: '+{val}% Chance to Dodge Attacks & Spells' },
        { stat: 'maxLife', min: 25, max: 48, val: 35, text: '+{val} to Maximum Life' }
      ],
      flavor: '"Cross a continent in a single breath."'
    },
    {
      name: 'Skyforth',
      baseName: 'Sorcerer Boots',
      slot: 'boots',
      rarity: 'unique',
      dropWeight: 0.48,
      implicits: { maxEs: 28, moveSpeedPct: 12 },
      affixes: [
        { stat: 'moveSpeedPct', min: 24, max: 35, val: 30, noIlvlScale: true, text: '{val}% increased Movement Speed' },
        { stat: 'vaalSoulGainPct', min: 25, max: 45, val: 35, noIlvlScale: true, text: '{val}% increased Vaal Soul Gain' },
        { stat: 'critChance', min: 22, max: 38, val: 30, text: '+{val}% to Critical Strike Chance' },
        { stat: 'maxEs', min: 50, max: 85, val: 68, text: '+{val} to Maximum Energy Shield' },
        { stat: 'cdrPct', min: 10, max: 18, val: 14, text: '{val}% increased Skill Cooldown Recovery' }
      ],
      flavor: '"Walk among the stars and never look down."'
    },
    {
      name: "Death's Door",
      baseName: 'Titan Greaves',
      slot: 'boots',
      rarity: 'unique',
      dropWeight: 0.75,
      implicits: { maxLife: 18, armor: 36, moveSpeedPct: 12 },
      affixes: [
        { stat: 'moveSpeedPct', min: 22, max: 32, val: 27, noIlvlScale: true, text: '{val}% increased Movement Speed' },
        { stat: 'str', min: 28, max: 48, val: 38, text: '+{val} to Strength' },
        { stat: 'maxLife', min: 50, max: 80, val: 65, text: '+{val} to Maximum Life' },
        { stat: 'armor', min: 65, max: 115, val: 90, text: '+{val} to Armour' },
        { stat: 'allRes', min: 12, max: 20, val: 16, text: '+{val}% to all Elemental Resistances' }
      ],
      flavor: '"Knock, and the grave shall answer."'
    },
    {
      name: 'Wanderlust',
      baseName: 'Sorcerer Boots',
      slot: 'boots',
      rarity: 'unique',
      dropWeight: 1.35,
      implicits: { maxEs: 24, moveSpeedPct: 12 },
      affixes: [
        { stat: 'sevenLeagueDash', val: 1, binary: true, text: 'Cannot be Chilled • -45% Flame Dash Cooldown' },
        { stat: 'moveSpeedPct', min: 18, max: 28, val: 23, noIlvlScale: true, text: '{val}% increased Movement Speed' },
        { stat: 'maxEs', min: 30, max: 55, val: 42, text: '+{val} to Maximum Energy Shield' },
        { stat: 'int', min: 14, max: 26, val: 20, text: '+{val} to Intelligence' }
      ],
      flavor: '"All who wander are not lost."'
    },
    {
      name: "Ryslatha's Coil",
      baseName: 'Stygian Vise',
      slot: 'belt',
      rarity: 'unique',
      dropWeight: 0.75,
      implicits: { maxLife: 34 },
      affixes: [
        { stat: 'flatDmg', min: 10, max: 20, val: 15, text: '+{val} to Base Physical & Skill Damage' },
        { stat: 'physDmgPct', min: 28, max: 48, val: 38, text: '{val}% increased Physical Damage' },
        { stat: 'maxLife', min: 45, max: 80, val: 62, text: '+{val} to Maximum Life' },
        { stat: 'lifeRegen', min: 6, max: 12, val: 9, text: 'Regenerate {val} Life per second' },
        { stat: 'str', min: 20, max: 35, val: 28, text: '+{val} to Strength' }
      ],
      flavor: '"Tighter and tighter the broodmother squeezes."'
    },
    {
      name: "Lori's Lantern",
      baseName: 'Prismatic Ring',
      slot: 'ring',
      rarity: 'unique',
      dropWeight: 0.90,
      implicits: { allRes: 10 },
      affixes: [
        { stat: 'lorisLucky', val: 1, binary: true, text: 'Prismatic Ward: Enemies hitting you are Unlucky (-25% Damage Taken while below 65% Life & +20% Low-Life Speed)' },
        { stat: 'allRes', min: 14, max: 24, val: 20, text: '+{val}% to all Elemental Resistances' },
        { stat: 'eleDmgPct', min: 24, max: 40, val: 32, text: '{val}% increased Elemental Damage' },
        { stat: 'maxLife', min: 28, max: 48, val: 35, text: '+{val} to Maximum Life' }
      ],
      flavor: '"A steady flame against the encroaching abyss."'
    },
    {
      name: 'Call of the Brotherhood',
      baseName: 'Prismatic Ring',
      slot: 'ring',
      rarity: 'unique',
      dropWeight: 0.65,
      implicits: { allRes: 10 },
      affixes: [
        { stat: 'brotherhoodChill', val: 1, binary: true, text: '100% of your Lightning Hits also Chill & Freeze Enemies (triggers Herald of Ice Shatter on Kill!)' },
        { stat: 'eleDmgPct', min: 24, max: 42, val: 33, text: '{val}% increased Lightning & Cold Damage' },
        { stat: 'cdrPct', min: 10, max: 18, val: 14, text: '{val}% increased Cast & Cooldown Speed' },
        { stat: 'int', min: 18, max: 32, val: 25, text: '+{val} to Intelligence' },
        { stat: 'maxEs', min: 25, max: 45, val: 35, text: '+{val} to Maximum Energy Shield' }
      ],
      flavor: '"Lightning and frost, bound by blood."'
    },
    {
      name: "Ventor's Gamble",
      baseName: 'Vermilion Ring',
      slot: 'ring',
      rarity: 'unique',
      dropWeight: 0.70,
      implicits: { maxLife: 24 },
      affixes: [
        { stat: 'maxLife', min: 5, max: 75, val: 40, text: '+{val} to Maximum Life' },
        { stat: 'goldGainPct', min: 10, max: 60, val: 35, noIlvlScale: true, text: '{val}% increased Gold & Loot Rarity' },
        { stat: 'allRes', min: 4, max: 28, val: 16, noIlvlScale: true, text: '+{val}% to all Elemental Resistances' },
        { stat: 'moveSpeedPct', min: 5, max: 18, val: 12, noIlvlScale: true, text: '{val}% increased Movement Speed' },
        { stat: 'critChance', min: 8, max: 38, val: 22, text: '+{val}% to Critical Strike Chance' }
      ],
      flavor: '"In a blaze of glory, or a whisper of ruin, the dice decide."'
    },
    {
      name: 'Le Heup of All',
      baseName: 'Steel Ring',
      slot: 'ring',
      rarity: 'unique',
      dropWeight: 1.20,
      implicits: { flatDmg: 6, physDmgPct: 14 },
      affixes: [
        { stat: 'str', min: 15, max: 30, val: 22, text: '+{val} to Strength' },
        { stat: 'dex', min: 15, max: 30, val: 22, text: '+{val} to Dexterity' },
        { stat: 'int', min: 15, max: 30, val: 22, text: '+{val} to Intelligence' },
        { stat: 'physDmgPct', min: 18, max: 34, val: 26, text: '{val}% increased Physical Damage' },
        { stat: 'eleDmgPct', min: 18, max: 34, val: 26, text: '{val}% increased Elemental Damage' },
        { stat: 'allRes', min: 12, max: 22, val: 17, text: '+{val}% to all Elemental Resistances' }
      ],
      flavor: '"One ring to master every discipline."'
    },
    {
      name: 'Astramentis',
      baseName: 'Onyx Amulet',
      slot: 'amulet',
      rarity: 'unique',
      dropWeight: 0.65,
      implicits: { str: 16, dex: 16, int: 16 },
      affixes: [
        { stat: 'str', min: 45, max: 85, val: 65, text: '+{val} to Strength' },
        { stat: 'dex', min: 45, max: 85, val: 65, text: '+{val} to Dexterity' },
        { stat: 'int', min: 45, max: 85, val: 65, text: '+{val} to Intelligence' },
        { stat: 'flatDmg', min: 8, max: 16, val: 12, text: '+{val} to Base Skill & Weapon Damage' },
        { stat: 'maxLife', min: 30, max: 55, val: 42, text: '+{val} to Maximum Life' }
      ],
      flavor: '"Mind, body, and soul aligned with the cosmos."'
    },
    {
      name: 'Badge of the Brotherhood',
      baseName: 'Citrine Talisman',
      slot: 'amulet',
      rarity: 'unique',
      dropWeight: 0.60,
      implicits: { flatDmg: 7, cdrPct: 8 },
      affixes: [
        { stat: 'extraChain', val: 1, binary: true, text: 'Skills Chain +1 Additional Time' },
        { stat: 'moveSpeedPct', min: 16, max: 28, val: 22, noIlvlScale: true, text: '{val}% increased Movement Speed' },
        { stat: 'cdrPct', min: 14, max: 26, val: 20, text: '{val}% increased Skill Cooldown Recovery' },
        { stat: 'critMulti', min: 22, max: 40, val: 30, text: '+{val}% to Global Critical Strike Multiplier' },
        { stat: 'maxLife', min: 30, max: 55, val: 42, text: '+{val} to Maximum Life' }
      ],
      flavor: '"What is mine is yours, until the last drop of blood."'
    }
  ];

  exports.UNIQUE_TEMPLATES = (exports.UNIQUE_TEMPLATES || []).concat(UNIQUE_TEMPLATES_PART2);
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : (global.GameData = global.GameData || exports));
