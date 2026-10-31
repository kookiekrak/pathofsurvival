// Shared GameData Module: Monsters, Rare Modifiers, 16 Atlas Map Tiers & 4 Pinnacle Boss Raids
(function (exports) {
  const MONSTER_TYPES = [
    { id: 'skeleton', name: 'Brittle Emperor Guard', role: 'swarmer', minWave: 1, hp: 46, speed: 138, radius: 14, damage: 18, xp: 18, color: '#d9d2c5', behavior: 'melee' },
    { id: 'scarab', name: 'Vaal Blood Swarmer', role: 'swarmer', minWave: 1, hp: 36, speed: 154, radius: 13, damage: 16, xp: 16, color: '#e03131', behavior: 'melee' },
    { id: 'archer', name: 'Undying Vaal Archer', role: 'ranged', minWave: 1, hp: 54, speed: 128, radius: 15, damage: 20, xp: 20, color: '#74c0fc', behavior: 'ranged_kite' },
    { id: 'frost_sentinel', name: 'Kalguuran Frost Weaver', role: 'caster', minWave: 2, hp: 82, speed: 132, radius: 16, damage: 24, xp: 25, color: '#74c0fc', behavior: 'frost_caster' },
    { id: 'volatile_imp', name: 'Volatile Magma Bearer', role: 'kamikaze', minWave: 2, hp: 58, speed: 174, radius: 14, damage: 34, xp: 24, color: '#ff922b', behavior: 'volatile_kamikaze' },
    { id: 'gilded_goblin', name: 'Perandus Treasure Hoarder', role: 'goblin', minWave: 2, hp: 210, speed: 178, radius: 15, damage: 10, xp: 85, color: '#fcc419', behavior: 'treasure_goblin' },
    { id: 'rhoa', name: 'Albino Bone Rhoa', role: 'charger', minWave: 3, hp: 98, speed: 162, radius: 16, damage: 28, xp: 26, color: '#a89f91', behavior: 'charge' },
    { id: 'goatman', name: 'Molten Goatman Shaman', role: 'caster', minWave: 3, hp: 110, speed: 134, radius: 17, damage: 26, xp: 28, color: '#a65332', behavior: 'mortar_leap' },
    { id: 'necromancer', name: 'Undying Soul Weaver', role: 'support', minWave: 3, hp: 135, speed: 122, radius: 17, damage: 24, xp: 34, color: '#be4bdb', behavior: 'necromancer' },
    { id: 'blight_spitter', name: 'Toxic Blight Spore', role: 'ranged', minWave: 3, hp: 92, speed: 126, radius: 16, damage: 27, xp: 26, color: '#82c91e', behavior: 'toxic_mortar' },
    { id: 'storm_herald', name: 'Templar Stormcaller', role: 'caster', minWave: 4, hp: 128, speed: 136, radius: 17, damage: 32, xp: 32, color: '#4dabf7', behavior: 'storm_caller' },
    { id: 'void_stalker', name: 'Shadow Blink Stalker', role: 'assassin', minWave: 4, hp: 105, speed: 158, radius: 15, damage: 33, xp: 30, color: '#9775fa', behavior: 'blink_ambush' },
    { id: 'cultist', name: 'Atziri Blood Cultist', role: 'caster', minWave: 5, hp: 120, speed: 132, radius: 16, damage: 30, xp: 30, color: '#c92a2a', behavior: 'flameblast_caster' },
    { id: 'devourer', name: 'Abyssal Executioner', role: 'tank', minWave: 5, hp: 195, speed: 136, radius: 20, damage: 38, xp: 36, color: '#5c940d', behavior: 'melee' },
    { id: 'shield_juggernaut', name: 'Eternal Phalanx Guard', role: 'tank', minWave: 6, hp: 240, speed: 128, radius: 21, damage: 42, xp: 42, color: '#ffd43b', behavior: 'phalanx_tank' },
    { id: 'kitava_herald', name: 'Herald of Kitava', role: 'tank', minWave: 7, hp: 280, speed: 142, radius: 23, damage: 46, xp: 48, color: '#f03e3e', behavior: 'mortar_leap' }
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
      recGear: 'Tier 5 Raid • White Atlas Pinnacle',
      hpBase: 28000,
      dmgBase: 92,
      armor: 95,
      lootQuantity: 350,
      lootRarityBonus: 180,
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
      recGear: 'Tier 9 Raid • Yellow Atlas Pinnacle',
      hpBase: 135000,
      dmgBase: 225,
      armor: 360,
      lootQuantity: 580,
      lootRarityBonus: 360,
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
      recGear: 'Tier 13 Raid • Red Atlas Pinnacle',
      hpBase: 540000,
      dmgBase: 495,
      armor: 1020,
      lootQuantity: 920,
      lootRarityBonus: 680,
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
      recGear: 'Tier 17 Raid • Uber Pinnacle Boss',
      hpBase: 1650000,
      dmgBase: 940,
      armor: 2100,
      lootQuantity: 1450,
      lootRarityBonus: 1150,
      goldMult: 4.2,
      mechanicsDesc: '4-Way Spinning Corruption Cross • "DIE!" Tracking Beam • Meteor Ring Maze & Pylons'
    }
  ];

  // 16 Path of Exile Atlas Map Tiers: White (T1-T5), Yellow (T6-T10), Red (T11-T16)
  const ATLAS_MAPS = [
    { id: 'strand', name: 'Forsaken Strand', tier: 1, biome: 'strand', durationSec: 240, monsterScale: 1.0, dmgScale: 1.0, monsterArmor: 0, speedScale: 1.0, packDensity: 1.0, eliteBonus: 0, lootQuantity: 100, lootRarityBonus: 0, goldMult: 1.0, recGear: 'White T1 • Starter Gear', bossName: 'Hillock, the Risen', themeColor: '#1f2933' },
    { id: 'fetid_pool', name: 'The Fetid Pool', tier: 2, biome: 'fetid_pool', durationSec: 245, monsterScale: 1.65, dmgScale: 1.32, monsterArmor: 12, speedScale: 1.05, packDensity: 1.08, eliteBonus: 0.03, lootQuantity: 130, lootRarityBonus: 20, goldMult: 1.1, recGear: 'White T2 • ilvl 4+ Gear', bossName: 'Kadavrus, the Defiler', themeColor: '#1b2b1e' },
    { id: 'submerged_cavern', name: 'Submerged Cavern', tier: 3, biome: 'strand', durationSec: 250, monsterScale: 2.6, dmgScale: 1.72, monsterArmor: 28, speedScale: 1.10, packDensity: 1.16, eliteBonus: 0.05, lootQuantity: 165, lootRarityBonus: 45, goldMult: 1.2, recGear: 'White T3 • ilvl 7+ Gear', bossName: 'Merveil, Twisted Siren', themeColor: '#142834' },
    { id: 'vaal_pyramid', name: 'Ancient Vaal Pyramid', tier: 4, biome: 'vaal_pyramid', durationSec: 255, monsterScale: 4.0, dmgScale: 2.20, monsterArmor: 50, speedScale: 1.15, packDensity: 1.24, eliteBonus: 0.08, lootQuantity: 205, lootRarityBonus: 75, goldMult: 1.3, recGear: 'White T4 • ilvl 10+ Gear', bossName: 'Vaal Oversoul', themeColor: '#2b2118' },
    { id: 'sarn_ruins', name: 'Ruins of Sarn', tier: 5, biome: 'vaal_pyramid', durationSec: 260, monsterScale: 6.0, dmgScale: 2.80, monsterArmor: 80, speedScale: 1.20, packDensity: 1.32, eliteBonus: 0.10, lootQuantity: 250, lootRarityBonus: 110, goldMult: 1.4, recGear: 'White T5 • ilvl 13+ Gear', bossName: 'General Gravicius', themeColor: '#2e2318' },
    { id: 'blood_aqueduct', name: 'Blood Aqueduct', tier: 6, biome: 'crimson_temple', durationSec: 265, monsterScale: 9.0, dmgScale: 3.55, monsterArmor: 120, speedScale: 1.25, packDensity: 1.40, eliteBonus: 0.13, lootQuantity: 300, lootRarityBonus: 150, goldMult: 1.5, recGear: 'Yellow T6 • ilvl 16+ Gear', bossName: 'Highgate Behemoth', themeColor: '#2e1619' },
    { id: 'toxic_sewer', name: 'Blighted Sewer', tier: 7, biome: 'fetid_pool', durationSec: 270, monsterScale: 13.2, dmgScale: 4.45, monsterArmor: 175, speedScale: 1.30, packDensity: 1.48, eliteBonus: 0.15, lootQuantity: 355, lootRarityBonus: 195, goldMult: 1.65, recGear: 'Yellow T7 • ilvl 19+ Gear', bossName: 'Doedre the Vile', themeColor: '#1a2e19' },
    { id: 'lunaris_temple', name: 'Lunaris Concourse', tier: 8, biome: 'defiled_cathedral', durationSec: 275, monsterScale: 19.0, dmgScale: 5.50, monsterArmor: 245, speedScale: 1.34, packDensity: 1.56, eliteBonus: 0.18, lootQuantity: 415, lootRarityBonus: 245, goldMult: 1.8, recGear: 'Yellow T8 • ilvl 22+ Gear', bossName: 'Piety, the Abomination', themeColor: '#192136' },
    { id: 'imperial_gardens', name: 'Imperial Gardens', tier: 9, biome: 'fetid_pool', durationSec: 280, monsterScale: 27.0, dmgScale: 6.80, monsterArmor: 335, speedScale: 1.38, packDensity: 1.64, eliteBonus: 0.20, lootQuantity: 480, lootRarityBonus: 300, goldMult: 1.95, recGear: 'Yellow T9 • ilvl 25+ Gear', bossName: 'High Templar Dominus', themeColor: '#1f2e1b' },
    { id: 'crimson_temple', name: 'Crimson Temple', tier: 10, biome: 'crimson_temple', durationSec: 285, monsterScale: 38.0, dmgScale: 8.35, monsterArmor: 450, speedScale: 1.42, packDensity: 1.72, eliteBonus: 0.23, lootQuantity: 550, lootRarityBonus: 360, goldMult: 2.1, recGear: 'Yellow T10 • ilvl 28+ Gear', bossName: 'Malachai, the Nightmare', themeColor: '#291518' },
    { id: 'caldera_of_ash', name: 'Caldera of Ash', tier: 11, biome: 'crimson_temple', durationSec: 290, monsterScale: 53.0, dmgScale: 10.2, monsterArmor: 590, speedScale: 1.46, packDensity: 1.80, eliteBonus: 0.26, lootQuantity: 630, lootRarityBonus: 430, goldMult: 2.3, recGear: 'Red T11 • ilvl 31+ Gear', bossName: 'King Kaom, the Molten', themeColor: '#33140e' },
    { id: 'glacier_summit', name: 'Glacial Summit', tier: 12, biome: 'strand', durationSec: 295, monsterScale: 74.0, dmgScale: 12.4, monsterArmor: 760, speedScale: 1.50, packDensity: 1.88, eliteBonus: 0.28, lootQuantity: 720, lootRarityBonus: 510, goldMult: 2.5, recGear: 'Red T12 • ilvl 34+ Gear', bossName: 'Veritania, the Redeemer', themeColor: '#142636' },
    { id: 'defiled_cathedral', name: 'Defiled Cathedral', tier: 13, biome: 'defiled_cathedral', durationSec: 300, monsterScale: 102.0, dmgScale: 15.0, monsterArmor: 970, speedScale: 1.54, packDensity: 1.96, eliteBonus: 0.31, lootQuantity: 820, lootRarityBonus: 600, goldMult: 2.75, recGear: 'Red T13 • ilvl 37+ Gear', bossName: 'Innocence, God-Emperor', themeColor: '#1c1d2e' },
    { id: 'alluring_abyss', name: 'The Alluring Abyss', tier: 14, biome: 'crimson_temple', durationSec: 305, monsterScale: 140.0, dmgScale: 18.2, monsterArmor: 1230, speedScale: 1.58, packDensity: 2.04, eliteBonus: 0.34, lootQuantity: 930, lootRarityBonus: 700, goldMult: 3.0, recGear: 'Red T14 • ilvl 40+ Gear', bossName: 'Atziri, Queen of the Vaal', themeColor: '#2e1118' },
    { id: 'synthete_cortex', name: 'Synthete Cortex', tier: 15, biome: 'defiled_cathedral', durationSec: 310, monsterScale: 192.0, dmgScale: 22.0, monsterArmor: 1550, speedScale: 1.62, packDensity: 2.12, eliteBonus: 0.37, lootQuantity: 1060, lootRarityBonus: 820, goldMult: 3.3, recGear: 'Red T15 • ilvl 43+ Gear', bossName: 'Venarius, High Synthete', themeColor: '#161b33' },
    { id: 'shaper_realm', name: "The Shaper's Crucible", tier: 16, biome: 'shaper_realm', durationSec: 320, monsterScale: 265.0, dmgScale: 26.5, monsterArmor: 1950, speedScale: 1.66, packDensity: 2.20, eliteBonus: 0.40, lootQuantity: 1200, lootRarityBonus: 950, goldMult: 3.6, recGear: 'Red T16 • ilvl 46+ Endgame', bossName: 'The Shaper of Worlds', themeColor: '#161326' }
  ];

  Object.assign(exports, { MONSTER_TYPES, RARE_MODS, PINNACLE_RAID_BOSSES, ATLAS_MAPS });
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : (global.GameData = global.GameData || exports));
