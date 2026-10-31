// Modular GameData Aggregator (Shared between Node.js Server & Browser Client)
(function (exports) {
  if (typeof require === "function" && typeof window === "undefined") {
    Object.assign(
      exports,
      require("./classesAndSkills.js"),
      require("./itemsAndCrafting.js"),
      require("./passiveTreeData.js"),
      require("./worldAndStats.js")
    );
  }
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : exports);
