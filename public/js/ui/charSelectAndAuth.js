// Client Module: Character Selection, Creation, Account Persistence & Delete Confirmation
(function () {
  with (window.__POS_CTX__) {
  function buildClassCardElement(cls, isSelected, onClick) {
    const starterGem = (GameData && GameData.SKILL_GEMS && GameData.SKILL_GEMS[cls.starterSkill]) || { name: cls.starterSkill || 'Skill' };
    const vaalDef = (GameData && GameData.VAAL_SKILLS && GameData.VAAL_SKILLS[cls.vaalSkill]) || { name: (cls.vaalSkill || 'Vaal Skill').replace(/_/g, ' ') };
    const bs = cls.baseStats || { str: 20, dex: 20, int: 20 };

    const card = document.createElement('div');
    card.className = `class-card ${isSelected ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="class-card-header">
        <div class="class-head-left">
          <div class="class-emblem">${getClassEmblemSvg(cls.id)}</div>
          <div>
            <div class="class-name">${cls.name.toUpperCase()}</div>
            <div class="class-title">${cls.title || 'Exile'}</div>
          </div>
        </div>
        <span class="class-starter-pill">${starterGem.name}</span>
      </div>
      <div class="class-attr-row">
        <span class="attr-pill str">STR ${bs.str}</span>
        <span class="attr-pill dex">DEX ${bs.dex}</span>
        <span class="attr-pill int">INT ${bs.int}</span>
        <span class="class-vaal-pill" title="Vaal Ultimate Skill [R]">${vaalDef.name}</span>
      </div>
      <div class="class-desc">${cls.description}</div>
    `;
    card.addEventListener('click', onClick);
    return card;
  }

  // Persistent Account ID in localStorage for SQLite Character Roster
  myAccountId = 'global';
  try {
    let storedAcc = localStorage.getItem('poe_account_id');
    if (!storedAcc) {
      storedAcc = 'acc_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('poe_account_id', storedAcc);
    }
    myAccountId = storedAcc;
  } catch {}

  // Default each player to their own personal instance code so PLAY creates your own clean lobby unless you pick a public party in Party Gateway!
  const myDefaultRoomCode = ('EXI' + myAccountId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()).slice(0, 8);
  const initRoomInput = document.getElementById('roomCodeInput');
  const initRoomNameInput = document.getElementById('roomNameInput');
  if (initRoomInput && initRoomInput.value === 'ORIATH') {
    initRoomInput.value = myDefaultRoomCode;
  }
  if (initRoomNameInput && initRoomNameInput.value === 'Oriath Docks') {
    initRoomNameInput.value = 'Personal Hideout';
  }

  selectedCharacterId = null;
  savedCharactersCache = [];
  charFlowMode = 'select'; // 'select' | 'create'

  function setCharFlowStage(stage) {
    charFlowMode = stage;
    const selectStage = document.getElementById('charSelectStage');
    const createStage = document.getElementById('charCreateStage');
    const playBtn = document.getElementById('playSelectedCharBtn');
    const delBtn = document.getElementById('openDeleteCharModalBtn');
    const hasChars = savedCharactersCache.length > 0;
    if (playBtn) {
      playBtn.disabled = !hasChars;
      playBtn.style.opacity = hasChars ? '1' : '0.45';
    }
    if (delBtn) {
      delBtn.disabled = !hasChars;
      delBtn.style.opacity = hasChars ? '1' : '0.45';
    }
    if (stage === 'create') {
      selectStage?.classList.add('hidden');
      createStage?.classList.remove('hidden');
    } else {
      selectStage?.classList.remove('hidden');
      createStage?.classList.add('hidden');
    }
  }

  function renderSelectedCharacterSpotlight() {
    const previewEl = document.getElementById('selectedCharPreview');
    if (!previewEl) return;
    const ch = savedCharactersCache.find(c => c.id === selectedCharacterId) || savedCharactersCache[0];
    if (!ch) {
      previewEl.innerHTML = `
        <div style="display:flex;flex-direction:column;justify-content:center;height:100%;gap:10px;text-align:center;padding:12px">
          <div class="class-name" style="font-size:1.15rem;letter-spacing:1px">NO CHARACTERS IN ROSTER</div>
          <div class="class-desc" style="font-size:0.9rem;line-height:1.4;color:#c7b089">
            Click <strong style="color:#ffd43b">CREATE</strong> under the right-hand Character List to choose one of the 7 Classes and name your character.
          </div>
          <div style="color:#9e8d73;font-size:0.8rem">
            Once created, your character will appear in the Character List on the right — select it and click <strong style="color:#ffd43b">PLAY</strong>.
          </div>
        </div>
      `;
      return;
    }
    selectedCharacterId = ch.id;
    const allCls = getAllClasses();
    const cls = allCls.find(c => c.id === ch.classId) || allCls[0];
    const starterGem = (GameData.SKILL_GEMS && GameData.SKILL_GEMS[cls.starterSkill || cls.starterGem]) || { name: 'Attack' };
    const vaalDef = (GameData.VAAL_SKILLS && GameData.VAAL_SKILLS[cls.vaalSkill]) || { name: 'Vaal Skill' };
    previewEl.innerHTML = `
      <div>
        <div class="class-head-left" style="gap:12px;margin-bottom:8px">
          <div class="class-emblem" style="width:46px;height:46px">${getClassEmblemSvg(ch.classId)}</div>
          <div>
            <div class="class-name" style="font-size:1.25rem;letter-spacing:1px">${ch.name}</div>
            <div style="color:#d8c198;font-family:var(--font-serif);font-size:0.9rem">
              Level ${ch.level} ${cls.name} • <span style="color:#a38d6d">${cls.title || 'Exile'}</span>
            </div>
            <div style="color:#78c2ad;font-size:0.78rem;letter-spacing:0.6px;margin-top:2px">
              STANDARD LEAGUE • CLASS LOCKED
            </div>
          </div>
        </div>
        <div class="class-desc" style="font-size:0.86rem;line-height:1.35;margin-top:6px">${cls.description}</div>
      </div>
      <div>
        <div class="class-attr-row" style="margin-bottom:8px;flex-wrap:wrap">
          <span class="attr-pill str">${ch.equippedCount || 0} GEAR EQUIPPED</span>
          <span class="attr-pill dex">${ch.gold || 0} GOLD</span>
          <span class="attr-pill int">${ch.passivePoints || 0} UNSPENT PASSIVES</span>
        </div>
        <div class="class-attr-row" style="flex-wrap:wrap">
          <span class="class-starter-pill">SIGNATURE: ${starterGem.name.toUpperCase()}</span>
          <span class="class-vaal-pill">VAAL: ${vaalDef.name.toUpperCase()}</span>
        </div>
      </div>
    `;
  }

  function renderSavedCharactersRoster() {
    const list = document.getElementById('savedCharsList');
    if (!list) return;
    list.innerHTML = '';
    if (savedCharactersCache.length === 0) {
      list.innerHTML = `
        <div style="padding:24px 12px;text-align:center;color:#9e8d73;font-size:0.86rem;line-height:1.4">
          No characters in your roster yet.<br>Click <strong style="color:#ffd43b">CREATE</strong> below to forge a new Exile.
        </div>
      `;
      return;
    }
    for (const ch of savedCharactersCache) {
      const isSel = ch.id === selectedCharacterId;
      const row = document.createElement('div');
      row.className = `poe-roster-row ${isSel ? 'selected' : ''}`;
      row.innerHTML = `
        <div class="class-head-left" style="gap:10px;min-width:0">
          <div class="class-emblem" style="width:32px;height:32px">${getClassEmblemSvg(ch.classId)}</div>
          <div style="min-width:0">
            <div style="font-family:var(--font-serif);font-weight:700;font-size:0.95rem;color:var(--poe-gold-bright)">${ch.name}</div>
            <div style="font-size:0.78rem;color:#c7b089">Level ${ch.level} ${ch.classId} • Standard League</div>
          </div>
        </div>
        <div style="text-align:right;font-size:0.76rem;color:#9e8d73;flex-shrink:0">
          <div>${ch.equippedCount || 0} Equipped</div>
          <div style="color:#ffd43b">${ch.gold || 0}g</div>
        </div>
      `;
      row.addEventListener('click', () => {
        selectedCharacterId = ch.id;
        selectedClassId = ch.classId;
        renderSavedCharactersRoster();
        renderSelectedCharacterSpotlight();
      });
      row.addEventListener('dblclick', () => {
        selectedCharacterId = ch.id;
        selectedClassId = ch.classId;
        playSelectedCharacter();
      });
      list.appendChild(row);
    }
  }

  function playSelectedCharacter() {
    const ch = savedCharactersCache.find(c => c.id === selectedCharacterId) || savedCharactersCache[0];
    if (!ch) return;
    selectedCharacterId = ch.id;
    selectedClassId = ch.classId;
    const roomCode = document.getElementById('roomCodeInput')?.value.trim().toUpperCase() || 'ORIATH';
    const roomName = document.getElementById('roomNameInput')?.value.trim() || `${roomCode} Instance`;
    connectAndJoin(ch.name, roomCode, roomName, ch.classId, ch.id);
  }

  async function fetchSavedCharacters() {
    try {
      const res = await fetch(`/api/characters?accountId=${encodeURIComponent(myAccountId)}`);
      const data = await res.json();
      savedCharactersCache = (data && data.characters) || [];
      if (savedCharactersCache.length === 0) {
        selectedCharacterId = null;
      } else if (!selectedCharacterId || !savedCharactersCache.some(c => c.id === selectedCharacterId)) {
        selectedCharacterId = savedCharactersCache[0].id;
      }
      renderSavedCharactersRoster();
      renderSelectedCharacterSpotlight();
      setCharFlowStage(charFlowMode === 'create' ? 'create' : 'select');
    } catch {
      savedCharactersCache = [];
      renderSavedCharactersRoster();
      renderSelectedCharacterSpotlight();
      setCharFlowStage(charFlowMode === 'create' ? 'create' : 'select');
    }
  }

  document.getElementById('goToCreateCharBtn')?.addEventListener('click', () => {
    const errEl = document.getElementById('charCreateError');
    errEl?.classList.add('hidden');
    const nameInput = document.getElementById('playerNameInput');
    if (nameInput) nameInput.value = '';
    setCharFlowStage('create');
    setTimeout(() => nameInput?.focus(), 30);
  });

  document.getElementById('backToCharSelectBtn')?.addEventListener('click', () => {
    const errEl = document.getElementById('charCreateError');
    errEl?.classList.add('hidden');
    renderSavedCharactersRoster();
    renderSelectedCharacterSpotlight();
    setCharFlowStage('select');
  });

  document.getElementById('playSelectedCharBtn')?.addEventListener('click', () => {
    playSelectedCharacter();
  });

  document.getElementById('openLobbyFromSelectBtn')?.addEventListener('click', () => {
    document.getElementById('loginModal')?.classList.add('hidden');
    openLobbyModal();
  });

  async function submitCreateCharacter() {
    const nameInput = document.getElementById('playerNameInput');
    const errEl = document.getElementById('charCreateError');
    const name = (nameInput?.value || '').trim();
    if (!name || name.length < 2) {
      if (errEl) {
        errEl.textContent = 'Enter a character name (2-16 characters).';
        errEl.classList.remove('hidden');
      }
      nameInput?.focus();
      return;
    }
    errEl?.classList.add('hidden');
    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: myAccountId,
          name,
          classId: selectedClassId
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (errEl) {
          errEl.textContent = (data && data.error) || 'Could not create character.';
          errEl.classList.remove('hidden');
        }
        return;
      }
      selectedCharacterId = data.character.id;
      charFlowMode = 'select';
      await fetchSavedCharacters();
    } catch {
      if (errEl) {
        errEl.textContent = 'Network error creating character.';
        errEl.classList.remove('hidden');
      }
    }
  }

  // PoE Delete Character Confirmation Modal Logic (Prevents Accidental Deletion!)
  document.getElementById('openDeleteCharModalBtn')?.addEventListener('click', () => {
    const ch = savedCharactersCache.find(c => c.id === selectedCharacterId) || savedCharactersCache[0];
    if (!ch) return;
    const modal = document.getElementById('deleteCharConfirmModal');
    const warn = document.getElementById('deleteCharWarningText');
    const input = document.getElementById('deleteConfirmNameInput');
    const err = document.getElementById('deleteConfirmError');
    if (warn) {
      warn.innerHTML = `Are you sure you want to permanently delete <strong style="color:#ffd43b">${ch.name}</strong> (Level ${ch.level} ${ch.classId})?<br><span style="color:#ff8787;font-size:0.84rem">All equipped gear, stash items, and passive allocations for this Exile will be lost forever.</span>`;
    }
    if (input) {
      input.value = '';
      input.placeholder = `Type "${ch.name}" to confirm...`;
    }
    err?.classList.add('hidden');
    modal?.classList.remove('hidden');
    setTimeout(() => input?.focus(), 30);
  });

  document.getElementById('cancelDeleteCharBtn')?.addEventListener('click', () => {
    document.getElementById('deleteCharConfirmModal')?.classList.add('hidden');
  });

  document.getElementById('confirmDeleteCharBtn')?.addEventListener('click', async () => {
    const ch = savedCharactersCache.find(c => c.id === selectedCharacterId) || savedCharactersCache[0];
    if (!ch) return;
    const input = document.getElementById('deleteConfirmNameInput');
    const err = document.getElementById('deleteConfirmError');
    const typed = (input?.value || '').trim();
    if (typed.toLowerCase() !== ch.name.toLowerCase()) {
      err?.classList.remove('hidden');
      return;
    }
    err?.classList.add('hidden');
    document.getElementById('deleteCharConfirmModal')?.classList.add('hidden');
    await fetch(`/api/characters?accountId=${encodeURIComponent(myAccountId)}&id=${encodeURIComponent(ch.id)}`, { method: 'DELETE' });
    selectedCharacterId = null;
    charFlowMode = 'select';
    await fetchSavedCharacters();
  });

  document.getElementById('playerNameInput')?.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      submitCreateCharacter();
    }
  });

  function renderSelectedClassSummary() {
    const summaryEl = document.getElementById('selectedClassSummary');
    const allCls = getAllClasses();
    const cls = allCls.find(c => c.id === selectedClassId) || allCls[0];
    if (!summaryEl || !cls) return;
    const starterGem = (GameData.SKILL_GEMS && GameData.SKILL_GEMS[cls.starterSkill || cls.starterGem]) || { name: 'Attack' };
    const vaalDef = (GameData.VAAL_SKILLS && GameData.VAAL_SKILLS[cls.vaalSkill]) || { name: 'Vaal Skill' };
    const bs = cls.baseStats || { str: 20, dex: 20, int: 20, maxLife: 180 };
    summaryEl.innerHTML = `
      <div class="class-head-left" style="min-width:0">
        <div class="class-emblem" style="width:36px;height:36px">${getClassEmblemSvg(cls.id)}</div>
        <div style="min-width:0">
          <div class="class-name" style="font-size:1.0rem">${cls.name.toUpperCase()} — ${cls.title.toUpperCase()}</div>
          <div class="class-desc" style="font-size:0.82rem;line-height:1.25">${cls.description}</div>
        </div>
      </div>
      <div class="class-attr-row" style="flex-shrink:0">
        <span class="attr-pill str">STR ${bs.str}</span>
        <span class="attr-pill dex">DEX ${bs.dex}</span>
        <span class="attr-pill int">INT ${bs.int}</span>
        <span class="class-starter-pill">SKILL: ${starterGem.name.toUpperCase()}</span>
        <span class="class-vaal-pill">VAAL: ${vaalDef.name.toUpperCase()}</span>
      </div>
    `;
    const roomBadge = document.getElementById('createTargetRoomBadge');
    const selectBadge = document.getElementById('selectTargetRoomBadge');
    const roomCodeInput = document.getElementById('roomCodeInput');
    const codeTxt = (roomCodeInput?.value || 'ORIATH').trim().toUpperCase() || 'ORIATH';
    if (roomBadge) roomBadge.textContent = codeTxt;
    if (selectBadge) selectBadge.textContent = codeTxt;
  }

  function initLoginScreen() {
    const classGrid = document.getElementById('classGrid');
    if (classGrid) {
      classGrid.innerHTML = '';
      for (const cls of getAllClasses()) {
        const card = buildClassCardElement(cls, cls.id === selectedClassId, () => {
          selectedClassId = cls.id;
          selectedCharacterId = null;
          charFlowMode = 'create';
          initLoginScreen();
        });
        classGrid.appendChild(card);
      }
    }
    renderSelectedClassSummary();
    fetchSavedCharacters();
    if (typeof fetchActiveRooms === 'function') fetchActiveRooms();
  }

  Object.assign(window.__POS_CTX__, {
    buildClassCardElement, myDefaultRoomCode, setCharFlowStage,
    renderSelectedCharacterSpotlight, renderSavedCharactersRoster,
    playSelectedCharacter, fetchSavedCharacters, submitCreateCharacter,
    renderSelectedClassSummary, initLoginScreen
  });
  }
})();
