// Client Module: Interactive Radial Rogue-Lite Passive Skill Tree Canvas & Pathfinding Preview
(function () {
  with (window.__POS_CTX__) {
  // =========================================================================
  // INTERACTIVE RADIAL PASSIVE SKILL TREE (WITH MULTI-NODE PATH PREVIEW)
  // =========================================================================
  Object.assign(window.__POS_CTX__, {
    treeCamX: 0,
    treeCamY: 0,
    treeZoom: 1.0,
    isDraggingTree: false,
    dragStartX: 0,
    dragStartY: 0,
    hoveredNodeId: null,
    hoveredPathIds: []
  });

  function computePassiveShortestPath(allocatedList, targetId) {
    if (typeof GameData.findShortestPassivePath === 'function') {
      const res = GameData.findShortestPassivePath(allocatedList, targetId);
      if (Array.isArray(res)) return res;
    }
    if (!targetId || !GameData.PASSIVE_NODES[targetId]) return [];
    const allocSet = new Set(allocatedList || []);
    if (allocSet.has(targetId)) return [];
    const queue = [];
    const visited = new Set(allocSet);
    for (const aId of allocSet) {
      const aNode = GameData.PASSIVE_NODES[aId];
      if (!aNode) continue;
      for (const nb of aNode.neighbors) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push([nb]);
        }
      }
    }
    while (queue.length > 0) {
      const path = queue.shift();
      const last = path[path.length - 1];
      if (last === targetId) return path;
      const node = GameData.PASSIVE_NODES[last];
      if (!node) continue;
      for (const nb of node.neighbors) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push([...path, nb]);
        }
      }
    }
    return [];
  }

  function getFitTreeZoom() {
    const w = treeCanvas.width || window.innerWidth;
    const h = treeCanvas.height || window.innerHeight;
    return Math.max(0.55, Math.min(1.0, Math.min(w / 920, h / 880)));
  }

  document.getElementById('resetTreeViewBtn').addEventListener('click', () => {
    treeCamX = 0;
    treeCamY = 0;
    treeZoom = getFitTreeZoom();
    renderPassiveTree();
  });

  document.getElementById('resetPassiveTreeBtn')?.addEventListener('click', () => {
    if (ws) ws.send(JSON.stringify({ type: 'reset_passive_tree' }));
  });

  treeCanvas.addEventListener('mousedown', (ev) => {
    if (ev.button === 0) {
      isDraggingTree = true;
      dragStartX = ev.clientX - treeCamX;
      dragStartY = ev.clientY - treeCamY;
    }
  });

  window.addEventListener('mouseup', () => {
    isDraggingTree = false;
  });

  // Mobile Touch Pan, 2-Finger Pinch-to-Zoom & Tap-to-Allocate on Passive Skill Tree Canvas
  let treeTouchMoved = false;
  let treePinchDist = 0;
  let treePinchStartZoom = 1.0;
  treeCanvas.addEventListener('touchstart', (ev) => {
    if (ev.touches.length >= 2) {
      treeTouchMoved = true;
      treePinchDist = Math.hypot(ev.touches[0].clientX - ev.touches[1].clientX, ev.touches[0].clientY - ev.touches[1].clientY);
      treePinchStartZoom = treeZoom;
    } else if (ev.touches.length === 1) {
      treeTouchMoved = false;
      const t = ev.touches[0];
      dragStartX = t.clientX - treeCamX;
      dragStartY = t.clientY - treeCamY;
      treeCanvas.dispatchEvent(new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY }));
    }
  }, { passive: true });
  treeCanvas.addEventListener('touchmove', (ev) => {
    if (ev.touches.length >= 2) {
      ev.preventDefault();
      const d = Math.hypot(ev.touches[0].clientX - ev.touches[1].clientX, ev.touches[0].clientY - ev.touches[1].clientY);
      if (treePinchDist > 10 && d > 10) {
        treeZoom = Math.max(0.35, Math.min(2.2, treePinchStartZoom * (d / treePinchDist)));
        renderPassiveTree();
      }
    } else if (ev.touches.length === 1 && treePinchDist === 0) {
      ev.preventDefault();
      const t = ev.touches[0];
      if (Math.hypot(t.clientX - dragStartX - treeCamX, t.clientY - dragStartY - treeCamY) > 8) {
        treeTouchMoved = true;
      }
      treeCamX = t.clientX - dragStartX;
      treeCamY = t.clientY - dragStartY;
      renderPassiveTree();
    }
  }, { passive: false });
  treeCanvas.addEventListener('touchend', (ev) => {
    if (!ev.touches || ev.touches.length < 2) treePinchDist = 0;
    isDraggingTree = false;
    if (!treeTouchMoved && ev.changedTouches && ev.changedTouches[0]) {
      const t = ev.changedTouches[0];
      treeCanvas.dispatchEvent(new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY }));
      treeCanvas.dispatchEvent(new MouseEvent('click', { clientX: t.clientX, clientY: t.clientY }));
    }
  }, { passive: true });

  treeCanvas.addEventListener('mousemove', (ev) => {
    const rect = treeCanvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;

    if (isDraggingTree) {
      treeCamX = ev.clientX - dragStartX;
      treeCamY = ev.clientY - dragStartY;
      renderPassiveTree();
      return;
    }

    const wx = (mx - treeCanvas.width / 2 - treeCamX) / treeZoom;
    const wy = (my - treeCanvas.height / 2 - treeCamY) / treeZoom;

    let found = null;
    for (const node of Object.values(GameData.PASSIVE_NODES)) {
      const r = node.type === 'keystone' ? 26 : node.type === 'notable' ? 20 : 15;
      if (Math.hypot(wx - node.x, wy - node.y) <= r + 5) {
        found = node;
        break;
      }
    }

    hoveredNodeId = found ? found.id : null;
    hoveredPathIds = (found && myProfile) ? computePassiveShortestPath(myProfile.passives, found.id) : [];

    const tt = document.getElementById('passiveNodeTooltip');
    if (found) {
      const allocated = myProfile && myProfile.passives.includes(found.id);
      const ptsAvailable = myProfile ? (myProfile.passivePoints || 0) : 0;
      const neededPts = hoveredPathIds.length;
      let statusText = '';
      if (allocated) {
        statusText = '<span style="color:#69db7c">Allocated (Right-Click to Refund for Free)</span>';
      } else if (neededPts === 1) {
        statusText = ptsAvailable >= 1
          ? '<span style="color:#ffd43b">Click to Allocate (1 Skill Tree Point)</span>'
          : '<span style="color:#ff8787">Requires 1 Skill Tree Point (0 Available)</span>';
      } else if (neededPts > 1) {
        statusText = ptsAvailable >= neededPts
          ? `<span style="color:#ffd43b">Click to Allocate Path (${neededPts} Skill Tree Points)</span>`
          : `<span style="color:#f59f00">Click to Allocate Partial Path (${neededPts} Nodes • ${ptsAvailable} Point${ptsAvailable === 1 ? '' : 's'} Available)</span>`;
      } else {
        statusText = '<span style="color:#aaa">Unreachable node</span>';
      }

      tt.innerHTML = `
        <div class="tt-header" style="color:${found.color}">${found.name} (${found.type.toUpperCase()})</div>
        <div class="tt-body">
          ${found.desc.map(d => `<div class="tt-affix">${d}</div>`).join('')}
          <div style="margin-top:8px;font-size:0.88rem;font-weight:700">${statusText}</div>
        </div>
      `;
      tt.style.left = `${Math.min(window.innerWidth - 340, ev.clientX + 16)}px`;
      tt.style.top = `${Math.min(window.innerHeight - 180, ev.clientY + 16)}px`;
      tt.classList.remove('hidden');
    } else {
      tt.classList.add('hidden');
    }
    renderPassiveTree();
  });

  treeCanvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const factor = ev.deltaY < 0 ? 1.12 : 0.89;
    treeZoom = Math.max(0.55, Math.min(2.2, treeZoom * factor));
    renderPassiveTree();
  });

  treeCanvas.addEventListener('click', () => {
    if (!hoveredNodeId || !myProfile || !ws) return;
    if (!myProfile.passives.includes(hoveredNodeId)) {
      if (hoveredPathIds.length > 1) {
        ws.send(JSON.stringify({ type: 'allocate_passive_path', nodeId: hoveredNodeId }));
      } else {
        ws.send(JSON.stringify({ type: 'allocate_passive', nodeId: hoveredNodeId }));
      }
    }
  });

  treeCanvas.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
    if (!hoveredNodeId || !myProfile || !ws) return;
    if (myProfile.passives.includes(hoveredNodeId)) {
      ws.send(JSON.stringify({ type: 'refund_passive', nodeId: hoveredNodeId }));
    }
  });

  function renderPassiveTree() {
    if (!myProfile) return;
    const w = treeCanvas.width;
    const h = treeCanvas.height;
    treeCtx.clearRect(0, 0, w, h);

    treeCtx.save();
    treeCtx.translate(w / 2 + treeCamX, h / 2 + treeCamY);
    treeCtx.scale(treeZoom, treeZoom);

    treeCtx.strokeStyle = 'rgba(166, 134, 75, 0.12)';
    treeCtx.lineWidth = 1.2;
    for (const r of [130, 230, 320, 410]) {
      treeCtx.beginPath();
      treeCtx.arc(0, 0, r, 0, Math.PI * 2);
      treeCtx.stroke();
    }

    const allocatedSet = new Set(myProfile.passives);
    const pathSet = new Set(hoveredPathIds || []);
    const pathEdges = new Set();
    if (hoveredPathIds && hoveredPathIds.length > 0) {
      const firstNode = GameData.PASSIVE_NODES[hoveredPathIds[0]];
      if (firstNode) {
        const anchor = firstNode.neighbors.find(nb => allocatedSet.has(nb));
        if (anchor) {
          pathEdges.add([anchor, hoveredPathIds[0]].sort().join('--'));
        }
      }
      for (let i = 0; i < hoveredPathIds.length - 1; i++) {
        pathEdges.add([hoveredPathIds[i], hoveredPathIds[i + 1]].sort().join('--'));
      }
    }

    const drawnPairs = new Set();

    for (const node of Object.values(GameData.PASSIVE_NODES)) {
      for (const nbId of node.neighbors) {
        const pairKey = [node.id, nbId].sort().join('--');
        if (drawnPairs.has(pairKey)) continue;
        drawnPairs.add(pairKey);

        const nb = GameData.PASSIVE_NODES[nbId];
        if (!nb) continue;

        const bothAllocated = allocatedSet.has(node.id) && allocatedSet.has(nb.id);
        const isPathEdge = pathEdges.has(pairKey);
        const oneAllocated = allocatedSet.has(node.id) || allocatedSet.has(nb.id);

        treeCtx.save();
        treeCtx.beginPath();
        treeCtx.moveTo(node.x, node.y);
        treeCtx.lineTo(nb.x, nb.y);
        if (bothAllocated) {
          treeCtx.strokeStyle = '#f2c76e';
          treeCtx.lineWidth = 4.5;
        } else if (isPathEdge) {
          treeCtx.strokeStyle = '#ffe066';
          treeCtx.shadowColor = '#ffd43b';
          treeCtx.shadowBlur = 12;
          treeCtx.lineWidth = 4.5;
        } else if (oneAllocated) {
          treeCtx.strokeStyle = 'rgba(242, 199, 110, 0.45)';
          treeCtx.lineWidth = 2.5;
        } else {
          treeCtx.strokeStyle = '#2d2638';
          treeCtx.lineWidth = 2;
        }
        treeCtx.stroke();
        treeCtx.restore();
      }
    }

    for (const node of Object.values(GameData.PASSIVE_NODES)) {
      const isAllocated = allocatedSet.has(node.id);
      const isInPreviewPath = pathSet.has(node.id);
      const isAvailable = !isAllocated && node.neighbors.some(nb => allocatedSet.has(nb));
      const radius = node.type === 'keystone' ? 25 : node.type === 'notable' ? 19 : node.type === 'start' ? 21 : 14;

      treeCtx.save();
      treeCtx.beginPath();
      if (node.type === 'keystone') {
        treeCtx.moveTo(node.x, node.y - radius * 1.2);
        treeCtx.lineTo(node.x + radius * 1.2, node.y);
        treeCtx.lineTo(node.x, node.y + radius * 1.2);
        treeCtx.lineTo(node.x - radius * 1.2, node.y);
        treeCtx.closePath();
      } else {
        treeCtx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      }

      if (isAllocated) {
        treeCtx.fillStyle = node.color;
        treeCtx.shadowColor = node.color;
        treeCtx.shadowBlur = 14;
      } else if (isInPreviewPath) {
        treeCtx.fillStyle = '#4a3b18';
        treeCtx.shadowColor = '#ffd43b';
        treeCtx.shadowBlur = 16;
      } else if (isAvailable) {
        treeCtx.fillStyle = '#2a2433';
      } else {
        treeCtx.fillStyle = '#120f17';
      }
      treeCtx.fill();

      treeCtx.lineWidth = (hoveredNodeId === node.id || isInPreviewPath) ? 4 : isAllocated ? 3 : 2;
      treeCtx.strokeStyle = isAllocated
        ? '#fff3c4'
        : isInPreviewPath
          ? '#ffe066'
          : isAvailable
            ? '#d69e2e'
            : '#493d57';
      treeCtx.stroke();
      treeCtx.restore();
    }

    // Pass 3: Render Node Labels on top of all circles/diamonds with collision avoidance so labels never overlap!
    const labelCandidates = Object.values(GameData.PASSIVE_NODES)
      .filter(node => node.type !== 'small' || hoveredNodeId === node.id || pathSet.has(node.id))
      .sort((a, b) => {
        const score = (n) =>
          (hoveredNodeId === n.id ? 100 : 0) +
          (allocatedSet.has(n.id) ? 40 : 0) +
          (n.type === 'start' ? 30 : n.type === 'keystone' ? 25 : n.type === 'notable' ? 15 : 5) +
          (pathSet.has(n.id) ? 20 : 0);
        return score(b) - score(a);
      });

    const placedLabelRects = [];
    const overlapsPlaced = (rect) =>
      placedLabelRects.some(
        r => !(rect.x2 < r.x1 || rect.x1 > r.x2 || rect.y2 < r.y1 || rect.y1 > r.y2)
      );

    for (const node of labelCandidates) {
      const isAllocated = allocatedSet.has(node.id);
      const isInPreviewPath = pathSet.has(node.id);
      const isHovered = hoveredNodeId === node.id;
      const radius = node.type === 'keystone' ? 25 : node.type === 'notable' ? 19 : node.type === 'start' ? 21 : 14;

      treeCtx.save();
      treeCtx.font = '700 12.5px Cinzel, serif';
      treeCtx.textAlign = 'center';
      const tw = treeCtx.measureText(node.name).width + 12;
      const th = 17;

      let labelY = node.y + radius + 15;
      let rect = { x1: node.x - tw / 2 - 2, y1: labelY - 12, x2: node.x + tw / 2 + 2, y2: labelY + 5 };
      if (!isHovered && overlapsPlaced(rect)) {
        const altY = node.y - radius - 7;
        const altRect = { x1: node.x - tw / 2 - 2, y1: altY - 12, x2: node.x + tw / 2 + 2, y2: altY + 5 };
        if (!overlapsPlaced(altRect)) {
          labelY = altY;
          rect = altRect;
        } else {
          treeCtx.restore();
          continue;
        }
      }

      placedLabelRects.push(rect);
      treeCtx.fillStyle = 'rgba(6, 5, 4, 0.90)';
      treeCtx.fillRect(node.x - tw / 2, labelY - 12, tw, th);
      treeCtx.lineWidth = 3;
      treeCtx.strokeStyle = '#000000';
      treeCtx.strokeText(node.name, node.x, labelY);
      treeCtx.fillStyle = isAllocated ? '#ffffff' : isInPreviewPath ? '#ffe066' : '#dfcf99';
      treeCtx.fillText(node.name, node.x, labelY);
      treeCtx.restore();
    }

    treeCtx.restore();
  }

  Object.assign(window.__POS_CTX__, {
    computePassiveShortestPath, getFitTreeZoom, renderPassiveTree
  });
  }
})();
