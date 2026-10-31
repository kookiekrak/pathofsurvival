// Modular GameData Aggregator (Shared between Node.js Server & Browser Client)
(function (exports) {
  if (typeof require === "function" && typeof window === "undefined") {
    global.GameData = exports;
    require("./classes/characterClasses.js");
    require("./skills/activeSkillGems.js");
    require("./skills/supportSkillGems.js");
    require("./skills/vaalAndRunUpgrades.js");
    require("./skills/rogueliteAscendancyBoons.js");
    require("./items/gearBasesAndCurrencies.js");
    require("./items/uniqueArmourAndWeapons.js");
    require("./items/uniqueJewelryAndBelts.js");
    require("./passives/passiveNodesCore.js");
    require("./passives/passiveNodesOuter.js");
    require("./passives/passiveNodesExpansion.js");
    require("./passives/passiveTreeHelpers.js");
    require("./world/monstersAndAtlasMaps.js");
    require("./world/playerStatsCalculator.js");
  }
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : exports);
