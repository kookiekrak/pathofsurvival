// Shared GameData Module: Passive Tree Normalization & BFS Pathfinder
(function (exports) {
  const PASSIVE_NODES = exports.PASSIVE_NODES || {};

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

  function canRemovePassiveNode(passives, nodeToRemove, startNode) {
    if (nodeToRemove === startNode) return false;
    const remaining = new Set(passives.filter(n => n !== nodeToRemove));
    if (!remaining.has(startNode)) return false;

    const visited = new Set([startNode]);
    const queue = [startNode];
    while (queue.length > 0) {
      const curr = queue.shift();
      const def = PASSIVE_NODES[curr];
      if (!def) continue;
      for (const nb of def.neighbors) {
        if (remaining.has(nb) && !visited.has(nb)) {
          visited.add(nb);
          queue.push(nb);
        }
      }
    }
    return visited.size === remaining.size;
  }

  Object.assign(exports, { STAT_DESC_FMT, findShortestPassivePath, canRemovePassiveNode });
})(typeof exports === "undefined" ? (window.GameData = window.GameData || {}) : (global.GameData = global.GameData || exports));
