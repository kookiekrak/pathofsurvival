// Shared GameData Module: Monsters, Rare Modifiers, 16 Atlas Map Tiers & 4 Pinnacle Boss Raids
(function (exports) {
  const MONSTER_TYPES = [
    { id: 'skeleton', name: 'Brittle Emperor Guard', role: 'swarmer', minWave: 1, hp: 115, speed: 138, radius: 14, damage: 24, xp: 24, color: '#d9d2c5', behavior: 'melee' },
    { id: 'scarab', name: 'Vaal Acid Spitter', role: 'ranged', minWave: 1, hp: 95, speed: 148, radius: 13, damage: 22, xp: 22, color: '#e03131', behavior: 'ranged_kite' },
    { id: 'archer', name: 'Undying Vaal Archer', role: 'ranged', minWave: 1, hp: 135, speed: 128, radius: 15, damage: 27, xp: 26, color: '#74c0fc', behavior: 'ranged_kite' },
    { id: 'frost_sentinel', name: 'Kalguuran Frost Weaver', role: 'caster', minWave: 1, hp: 195, speed: 132, radius: 16, damage: 32, xp: 30, color: '#74c0fc', behavior: 'frost_caster' },
    { id: 'volatile_imp', name: 'Volatile Magma Bearer', role: 'kamikaze', minWave: 2, hp: 140, speed: 174, radius: 14, damage: 46, xp: 30, color: '#ff922b', behavior: 'volatile_kamikaze' },
    { id: 'gilded_goblin', name: 'Perandus Treasure Hoarder', role: 'goblin', minWave: 2, hp: 480, speed: 178, radius: 15, damage: 14, xp: 95, color: '#fcc419', behavior: 'treasure_goblin' },
    { id: 'rhoa', name: 'Albino Bone Rhoa', role: 'charger', minWave: 2, hp: 240, speed: 162, radius: 16, damage: 38, xp: 32, color: '#a89f91', behavior: 'charge' },
    { id: 'goatman', name: 'Molten Goatman Shaman', role: 'caster', minWave: 2, hp: 265, speed: 134, radius: 17, damage: 36, xp: 34, color: '#a65332', behavior: 'mortar_leap' },
    { id: 'necromancer', name: 'Undying Soul Weaver', role: 'support', minWave: 3, hp: 320, speed: 122, radius: 17, damage: 34, xp: 40, color: '#be4bdb', behavior: 'necromancer' },
    { id: 'blight_spitter', name: 'Toxic Blight Spore', role: 'ranged', minWave: 2, hp: 225, speed: 126, radius: 16, damage: 36, xp: 34, color: '#82c91e', behavior: 'toxic_mortar' },
    { id: 'storm_herald', name: 'Templar Stormcaller', role: 'caster', minWave: 3, hp: 310, speed: 136, radius: 17, damage: 42, xp: 38, color: '#4dabf7', behavior: 'storm_caller' },
    { id: 'void_stalker', name: 'Shadow Blink Stalker', role: 'assassin', minWave: 4, hp: 255, speed: 158, radius: 15, damage: 44, xp: 38, color: '#9775fa', behavior: 'blink_ambush' },
    { id: 'cultist', name: 'Atziri Blood Cultist', role: 'caster', minWave: 3, hp: 290, speed: 132, radius: 16, damage: 40, xp: 38, color: '#c92a2a', behavior: 'flameblast_caster' },
    { id: 'devourer', name: 'AbyssalVenom Spitter', role: 'ranged', minWave: 4, hp: 450, speed: 136, radius: 20, damage: 48, xp: 44, color: '#5c940d', behavior: 'toxic_mortar' },
    { id: 'shield_juggernaut', name: 'Eternal Phalanx Guard', role: 'tank', minWave: 5, hp: 560, speed: 128, radius: 21, damage: 54, xp: 50, color: '#ffd43b', behavior: 'phalanx_tank' },
    { id: 'kitava_herald', name: 'Herald of Kitava', role: 'caster', minWave: 5, hp: 640, speed: 142, radius: 23, damage: 60, xp: 56, color: '#f03e3e', behavior: 'mortar_leap' }
  ];

  const RARE_MODS = [
    { id: 'hasted', name: 'Hasted', color: '#74c0fc', speedMulti: 1.32, hpMulti: 1.55, dmgMulti: 1.2 },
    { id: 'gargantuan', name: 'Gargantuan', color: '#ffa94d', radiusMulti: 1.35, hpMulti: 2.25, dmgMulti: 1.35 },
    { id: 'soul_eater', name: 'Soul Conduit', color: '#da77f2', hpMulti: 1.8, dmgMulti: 1.3, speedMulti: 1.2 },
    { id: 'flameweaver', name: 'Flameweaver', color: '#ff6b6b', hpMulti: 1.7, dmgMulti: 1.4 },
    { id: 'frost_strider', name: 'Frost Strider', color: '#66d9e8', hpMulti: 1.7, speedMulti: 1.22, dmgMulti: 1.25 },
    { id: 'steel_infused', name: 'Steel-Infused', color: '#ced4da', hpMulti: 1.95, dmgMulti: 1.35, radiusMulti: 1.18 },
    { id: 'temporal_bubble', name: 'Temporal Bubble', color: '#3bc9db', hpMulti: 1.85, dmgMulti: 1.25, proxShield: 165 },
    { id: 'magma_barrier', name: 'Magma Barrier', color: '#ff922b', hpMulti: 1.9, dmgMulti: 1.35, deathVolatile: true },
    { id: 'storm_strider', name: 'Storm Herald', color: '#4dabf7', hpMulti: 1.75, dmgMulti: 1.35, lightningCalls: true },
    { id: 'vampiric', name: 'Vampiric', color: '#e03131', hpMulti: 1.85, dmgMulti: 1.3, leechPct: 0.15 },
    { id: 'mirror_image', name: 'Mirror Image', color: '#cc5de8', hpMulti: 1.65, dmgMulti: 1.25, splitClone: true },
    { id: 'executioner', name: 'Executioner', color: '#c92a2a', hpMulti: 1.9, dmgMulti: 1.45, radiusMulti: 1.22 }
  ];

  // 4 WoW-Style Multi-Phase Pinnacle Boss Raids (Scaled across Tiers 5, 9, 13, and 17)
  const PINNACLE_RAID_BOSSES = [
    {
      id: 'raid_searing_exarch',
      name: 'The Searing Exarch',
      subtitle: 'Pinnacle Raid I • Cataclysm of Ash',
      bossName: 'The Searing Exarch',
      mapId: 'vaal_pyramid',
      tier: 5,
      recGear: 'Tier 5 Raid • Lv. 20+ Recommended',
      hpBase: 140000,
      dmgBase: 360,
      armor: 220,
      elePen: 24,
      lootQuantity: 350,
      lootRarityBonus: 250,
      goldMult: 1.8,
      mechanicsDesc: 'Meteor Soak Circles • Rolling Magma Wall • Solar Pylon Intermission Shield'
    },
    {
      id: 'raid_eater_of_worlds',
      name: 'The Eater of Worlds',
      subtitle: 'Pinnacle Raid II • Tentacles of the Deep',
      bossName: 'The Eater of Worlds',
      mapId: 'fetid_pool',
      tier: 9,
      recGear: 'Tier 9 Raid • Lv. 34+ Recommended',
      hpBase: 480000,
      dmgBase: 620,
      armor: 440,
      elePen: 35,
      lootQuantity: 580,
      lootRarityBonus: 480,
      goldMult: 2.4,
      mechanicsDesc: 'Inescapable Doom Soak Orbs • Sweeping Cosmos Beam • Golden Sanctuary Safe Dome'
    },
    {
      id: 'raid_maven_crucible',
      name: "The Maven's Crucible",
      subtitle: 'Pinnacle Raid III • Memory & Cascade',
      bossName: 'The Maven, Progenitor',
      mapId: 'defiled_cathedral',
      tier: 13,
      recGear: 'Tier 13 Raid • Lv. 50+ Recommended',
      hpBase: 1450000,
      dmgBase: 960,
      armor: 720,
      elePen: 46,
      lootQuantity: 920,
      lootRarityBonus: 780,
      goldMult: 3.2,
      mechanicsDesc: 'Rotating Void Lasers • Safe Quadrant Cascade • Brain Synapse Shield Pylons'
    },
    {
      id: 'raid_sirus_awakener',
      name: 'Sirus, Awakener of Worlds',
      subtitle: 'Uber Pinnacle Raid IV • Eye of the Storm',
      bossName: 'Sirus, Awakener of Worlds',
      mapId: 'shaper_realm',
      tier: 17,
      recGear: 'Tier 17 Raid • Lv. 65+ Uber Pinnacle',
      hpBase: 3800000,
      dmgBase: 1420,
      armor: 1150,
      elePen: 58,
      lootQuantity: 1450,
      lootRarityBonus: 1250,
      goldMult: 4.2,
      mechanicsDesc: '4-Way Spinning Corruption Cross • "DIE!" Tracking Beam • Meteor Ring Maze & Pylons'
    }
  ];

  // 16 Path of Exile Atlas Map Tiers: White (T1-T5), Yellow (T6-T10), Red (T11-T16) — Scales Item Rarity (PoE 2 style), NOT Quantity!
  const ATLAS_MAPS = [
    { id: 'strand', name: 'Forsaken Strand', tier: 1, biome: 'strand', durationSec: 240, monsterScale: 1.15, dmgScale: 1.35, monsterArmor: 15, speedScale: 0.96, packDensity: 0.90, eliteBonus: 0, lootQuantity: 100, lootRarityBonus: 0, goldMult: 1.0, recGear: 'White T1 • Starter Gear', bossName: 'Hillock, the Risen', themeColor: '#1f2933' },
    { id: 'fetid_pool', name: 'The Fetid Pool', tier: 2, biome: 'fetid_pool', durationSec: 245, monsterScale: 2.00, dmgScale: 1.75, monsterArmor: 32, speedScale: 1.02, packDensity: 1.00, eliteBonus: 0.04, lootQuantity: 100, lootRarityBonus: 18, goldMult: 1.18, recGear: 'White T2 • ilvl 4+ Gear', bossName: 'Kadavrus, the Defiler', themeColor: '#1b2b1e' },
    { id: 'submerged_cavern', name: 'Submerged Cavern', tier: 3, biome: 'strand', durationSec: 250, monsterScale: 3.40, dmgScale: 2.25, monsterArmor: 55, speedScale: 1.08, packDensity: 1.12, eliteBonus: 0.07, lootQuantity: 100, lootRarityBonus: 36, goldMult: 1.28, recGear: 'White T3 • ilvl 7+ Gear', bossName: 'Merveil, Twisted Siren', themeColor: '#142834' },
    { id: 'vaal_pyramid', name: 'Ancient Vaal Pyramid', tier: 4, biome: 'vaal_pyramid', durationSec: 255, monsterScale: 5.50, dmgScale: 2.85, monsterArmor: 85, speedScale: 1.14, packDensity: 1.22, eliteBonus: 0.10, lootQuantity: 100, lootRarityBonus: 55, goldMult: 1.37, recGear: 'White T4 • ilvl 10+ Gear', bossName: 'Vaal Oversoul', themeColor: '#2b2118' },
    { id: 'sarn_ruins', name: 'Ruins of Sarn', tier: 5, biome: 'vaal_pyramid', durationSec: 260, monsterScale: 8.80, dmgScale: 3.60, monsterArmor: 120, speedScale: 1.20, packDensity: 1.32, eliteBonus: 0.13, lootQuantity: 100, lootRarityBonus: 75, goldMult: 1.44, recGear: 'White T5 • ilvl 13+ Gear', bossName: 'General Gravicius', themeColor: '#2e2318' },
    { id: 'blood_aqueduct', name: 'Blood Aqueduct', tier: 6, biome: 'crimson_temple', durationSec: 265, monsterScale: 14.0, dmgScale: 4.50, monsterArmor: 165, speedScale: 1.26, packDensity: 1.44, eliteBonus: 0.16, lootQuantity: 100, lootRarityBonus: 98, goldMult: 1.51, recGear: 'Yellow T6 • ilvl 16+ Gear', bossName: 'Highgate Behemoth', themeColor: '#2e1619' },
    { id: 'toxic_sewer', name: 'Blighted Sewer', tier: 7, biome: 'fetid_pool', durationSec: 270, monsterScale: 21.5, dmgScale: 5.50, monsterArmor: 215, speedScale: 1.31, packDensity: 1.52, eliteBonus: 0.19, lootQuantity: 100, lootRarityBonus: 122, goldMult: 1.58, recGear: 'Yellow T7 • ilvl 19+ Gear', bossName: 'Doedre the Vile', themeColor: '#1a2e19' },
    { id: 'lunaris_temple', name: 'Lunaris Concourse', tier: 8, biome: 'defiled_cathedral', durationSec: 275, monsterScale: 32.0, dmgScale: 6.65, monsterArmor: 270, speedScale: 1.36, packDensity: 1.60, eliteBonus: 0.22, lootQuantity: 100, lootRarityBonus: 148, goldMult: 1.64, recGear: 'Yellow T8 • ilvl 22+ Gear', bossName: 'Piety, the Abomination', themeColor: '#192136' },
    { id: 'imperial_gardens', name: 'Imperial Gardens', tier: 9, biome: 'fetid_pool', durationSec: 280, monsterScale: 47.0, dmgScale: 7.95, monsterArmor: 335, speedScale: 1.41, packDensity: 1.68, eliteBonus: 0.25, lootQuantity: 100, lootRarityBonus: 175, goldMult: 1.70, recGear: 'Yellow T9 • ilvl 25+ Gear', bossName: 'High Templar Dominus', themeColor: '#1f2e1b' },
    { id: 'crimson_temple', name: 'Crimson Temple', tier: 10, biome: 'crimson_temple', durationSec: 285, monsterScale: 68.0, dmgScale: 9.40, monsterArmor: 410, speedScale: 1.46, packDensity: 1.76, eliteBonus: 0.28, lootQuantity: 100, lootRarityBonus: 205, goldMult: 1.75, recGear: 'Yellow T10 • ilvl 28+ Gear', bossName: 'Malachai, the Nightmare', themeColor: '#291518' },
    { id: 'caldera_of_ash', name: 'Caldera of Ash', tier: 11, biome: 'crimson_temple', durationSec: 290, monsterScale: 96.0, dmgScale: 11.1, monsterArmor: 495, speedScale: 1.50, packDensity: 1.84, eliteBonus: 0.31, lootQuantity: 100, lootRarityBonus: 240, goldMult: 1.80, recGear: 'Red T11 • ilvl 31+ Gear', bossName: 'King Kaom, the Molten', themeColor: '#33140e' },
    { id: 'glacier_summit', name: 'Glacial Summit', tier: 12, biome: 'strand', durationSec: 295, monsterScale: 135.0, dmgScale: 13.0, monsterArmor: 590, speedScale: 1.54, packDensity: 1.92, eliteBonus: 0.34, lootQuantity: 100, lootRarityBonus: 275, goldMult: 1.86, recGear: 'Red T12 • ilvl 34+ Gear', bossName: 'Veritania, the Redeemer', themeColor: '#142636' },
    { id: 'defiled_cathedral', name: 'Defiled Cathedral', tier: 13, biome: 'defiled_cathedral', durationSec: 300, monsterScale: 188.0, dmgScale: 15.2, monsterArmor: 700, speedScale: 1.58, packDensity: 2.00, eliteBonus: 0.37, lootQuantity: 100, lootRarityBonus: 315, goldMult: 1.91, recGear: 'Red T13 • ilvl 37+ Gear', bossName: 'Innocence, God-Emperor', themeColor: '#1c1d2e' },
    { id: 'alluring_abyss', name: 'The Alluring Abyss', tier: 14, biome: 'crimson_temple', durationSec: 305, monsterScale: 260.0, dmgScale: 17.8, monsterArmor: 825, speedScale: 1.62, packDensity: 2.08, eliteBonus: 0.40, lootQuantity: 100, lootRarityBonus: 360, goldMult: 1.95, recGear: 'Red T14 • ilvl 40+ Gear', bossName: 'Atziri, Queen of the Vaal', themeColor: '#2e1118' },
    { id: 'synthete_cortex', name: 'Synthete Cortex', tier: 15, biome: 'defiled_cathedral', durationSec: 310, monsterScale: 360.0, dmgScale: 20.8, monsterArmor: 965, speedScale: 1.66, packDensity: 2.16, eliteBonus: 0.43, lootQuantity: 100, lootRarityBonus: 410, goldMult: 2.00, recGear: 'Red T15 • ilvl 43+ Gear', bossName: 'Venarius, High Synthete', themeColor: '#161b33' },
    { id: 'shaper_realm', name: "The Shaper's Crucible", tier: 16, biome: 'shaper_realm', durationSec: 320, monsterScale: 500.0, dmgScale: 24.5, monsterArmor: 1120, speedScale: 1.70, packDensity: 2.25, eliteBonus: 0.46, lootQuantity: 100, lootRarityBonus: 465, goldMult: 2.05, recGear: 'Red T16 • ilvl 46+ Endgame', bossName: 'The Shaper of Worlds', themeColor: '#161326' }
  ];

  const MAP_MOD_POOL = [
    { id: 'hordes', name: 'of Hordes', text: '+18% Monster Pack Size & +24% Item Rarity', quant: 0, rarity: 24, packSize: 18 },
    { id: 'fleet', name: 'Fleet', text: 'Monsters have +22% Speed & +28% Item Rarity', quant: 0, rarity: 28, speedMult: 1.22 },
    { id: 'savage', name: 'Savage', text: 'Monsters deal +26% Damage & +32% Item Rarity', quant: 0, rarity: 32, dmgMult: 1.26 },
    { id: 'colossal', name: 'Colossal', text: 'Monsters have +32% More Life & +28% Item Rarity', quant: 0, rarity: 28, hpMult: 1.32 },
    { id: 'armoured', name: 'Armoured', text: 'Monsters have +40% Ward & +25% Item Rarity', quant: 0, rarity: 25, armorMult: 1.40 },
    { id: 'splitting', name: 'Splitting', text: 'Monsters fire +2 Projectiles & +36% Item Rarity', quant: 0, rarity: 36, extraProj: 2 },
    { id: 'deadly', name: 'Deadly', text: 'Monsters deal +30% Crit Damage & +32% Item Rarity', quant: 0, rarity: 32, dmgMult: 1.20, speedMult: 1.10 },
    { id: 'twinned', name: 'Twinned', text: 'Area contains Twinned Map Bosses & +45% Item Rarity', quant: 0, rarity: 45, twinned: 1 },
    { id: 'smothering', name: 'of Smothering', text: 'Players have -25% Life Regen & +30% Item Rarity', quant: 0, rarity: 30, lessRegen: 25 },
    { id: 'overlord', name: "Overlord's", text: 'Rare Monsters have +35% Life & +38% Item Rarity', quant: 0, rarity: 38, hpMult: 1.18, dmgMult: 1.15 }
  ];

  Object.assign(exports, { MONSTER_TYPES, RARE_MODS, PINNACLE_RAID_BOSSES, ATLAS_MAPS, MAP_MOD_POOL });
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : (global.GameData = global.GameData || exports));
