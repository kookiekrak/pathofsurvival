// Client Module: PoE 1 SVG Artwork Library, Character Selection/Creation, Party Lobby & World Entity Sync
(function () {
  with (window.__POS_CTX__) {
  // =========================================================================
  // PATH OF EXILE 1 BESPOKE SVG ARTWORK LIBRARY (7 CLASSES, 12 SKILLS, FLASKS, ORBS)
  // =========================================================================
  const FALLBACK_CLASSES = {
    Marauder: {
      id: 'Marauder', name: 'Marauder', title: 'Juggernaut', color: '#c92a2a',
      starterSkill: 'sunder', vaalSkill: 'vaal_ground_slam',
      baseStats: { str: 32, dex: 14, int: 14 },
      description: 'Karui Juggernaut of pure Strength, towering Life & Armour, and earth-shattering Physical & Fire slams.'
    },
    Ranger: {
      id: 'Ranger', name: 'Ranger', title: 'Deadeye', color: '#2b8a3e',
      starterSkill: 'tornado_shot', vaalSkill: 'vaal_rain_of_arrows',
      baseStats: { str: 14, dex: 32, int: 14 },
      description: 'Deadeye marksman of pure Dexterity, high Evasion, tailwind speed, and screen-filling arrow volleys.'
    },
    Witch: {
      id: 'Witch', name: 'Witch', title: 'Elementalist', color: '#1971c2',
      starterSkill: 'arc', vaalSkill: 'vaal_arc',
      baseStats: { str: 14, dex: 14, int: 32 },
      description: 'Elementalist of pure Intelligence, deep Energy Shield wards, and cataclysmic Chaining & Elemental spells.'
    },
    Duelist: {
      id: 'Duelist', name: 'Duelist', title: 'Slayer', color: '#e67700',
      starterSkill: 'cyclone', vaalSkill: 'vaal_cyclone',
      baseStats: { str: 23, dex: 23, int: 14 },
      description: 'Arena Slayer blending Strength and Dexterity for relentless spinning velocity, culling strikes, and Life Leech.'
    },
    Templar: {
      id: 'Templar', name: 'Templar', title: 'Inquisitor', color: '#d9a520',
      starterSkill: 'righteous_fire', vaalSkill: 'vaal_righteous_fire',
      baseStats: { str: 23, dex: 14, int: 23 },
      description: 'Theopolis Inquisitor uniting Strength and Intelligence with sacred Righteous Fire and Consecrated regeneration.'
    },
    Shadow: {
      id: 'Shadow', name: 'Shadow', title: 'Assassin', color: '#1098ad',
      starterSkill: 'spectral_throw', vaalSkill: 'vaal_blade_vortex',
      baseStats: { str: 14, dex: 23, int: 23 },
      description: 'Deadly Assassin fusing Dexterity and Intelligence for lethal Critical Strikes, elusive speed, and spinning blades.'
    },
    Scion: {
      id: 'Scion', name: 'Scion', title: 'Ascendant', color: '#e8c26b',
      starterSkill: 'fireball', vaalSkill: 'vaal_flameblast',
      baseStats: { str: 20, dex: 20, int: 20 },
      description: 'Oriath Ascendant at the center of the Passive Tree with balanced attributes and +1 extra starting Passive Point.'
    }
  };

  function getAllClasses() {
    return Object.values({ ...FALLBACK_CLASSES, ...((GameData && GameData.CLASSES) || {}) });
  }

  function getClassEmblemSvg(classId) {
    switch (classId) {
      case 'Marauder':
        return `<svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M4,6 L11,3 L12,10 L20,18 L18,20 L10,12 L3,11 Z" fill="#b8281d" stroke="#dfcf99" stroke-width="1.4"/>
          <path d="M20,6 L13,3 L12,10 L4,18 L6,20 L14,12 L21,11 Z" fill="#7a160f" stroke="#dfcf99" stroke-width="1.2" opacity="0.85"/>
          <circle cx="12" cy="9" r="2.2" fill="#ffd8a8"/>
        </svg>`;
      case 'Ranger':
        return `<svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M6,3 C17,6 18,18 6,21 M6,3 L17,12 L6,21" fill="none" stroke="#2ca849" stroke-width="1.9"/>
          <line x1="3" y1="12" x2="21" y2="12" stroke="#dfcf99" stroke-width="1.7"/>
          <polygon points="22,12 17,9.5 18,12 17,14.5" fill="#8ce99a"/>
        </svg>`;
      case 'Witch':
        return `<svg width="24" height="24" viewBox="0 0 24 24">
          <polygon points="12,2 15.5,9.5 22,12 15.5,14.5 12,22 8.5,14.5 2,12 8.5,9.5" fill="#1c5db8" stroke="#9ec5ff" stroke-width="1.3"/>
          <circle cx="12" cy="12" r="3" fill="#e7f5ff"/>
        </svg>`;
      case 'Duelist':
        return `<svg width="24" height="24" viewBox="0 0 24 24">
          <line x1="4" y1="20" x2="20" y2="4" stroke="#ffa94d" stroke-width="2.2"/>
          <line x1="20" y1="20" x2="4" y2="4" stroke="#ff6b6b" stroke-width="2.2"/>
          <polygon points="12,6 16,12 12,18 8,12" fill="#d9480f" stroke="#ffd8a8" stroke-width="1.3"/>
        </svg>`;
      case 'Templar':
        return `<svg width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" fill="#5c420e" stroke="#ffd43b" stroke-width="1.5"/>
          <path d="M12,3 L14,10 L21,12 L14,14 L12,21 L10,14 L3,12 L10,10 Z" fill="#ffd43b" stroke="#fff9db" stroke-width="1"/>
        </svg>`;
      case 'Shadow':
        return `<svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M5,19 C7,10 12,6 19,4 C15,10 14,15 18,20 C13,17 9,17 5,19 Z" fill="#0c8599" stroke="#66d9e8" stroke-width="1.4"/>
          <circle cx="13" cy="11" r="2.2" fill="#e3fafc"/>
        </svg>`;
      case 'Scion':
        return `<svg width="24" height="24" viewBox="0 0 24 24">
          <polygon points="12,2 14.8,8.8 22,9.3 16.5,14 18.2,21 12,17.2 5.8,21 7.5,14 2,9.3 9.2,8.8" fill="#c89d3c" stroke="#fff3bf" stroke-width="1.3"/>
          <circle cx="12" cy="12.5" r="2.6" fill="#fff9db"/>
        </svg>`;
      default:
        return `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#dfcf99" stroke-width="1.6"/><polygon points="12,4 15,12 12,20 9,12" fill="#c8a862"/></svg>`;
    }
  }

  let _flaskSvgUid = 0;
  function getFlaskSvg(flaskId, fillPct, liquidColor) {
    const clipId = `flaskClip_${flaskId}_${(++_flaskSvgUid) & 1023}`;
    const yFill = Math.round(44 - (Math.max(0, Math.min(100, fillPct)) / 100) * 30);
    let bottlePath = 'M11,13 L11,18 L5,28 C4,34 6,42 16,42 C26,42 28,34 27,28 L21,18 L21,13 Z';
    let ornament = '';
    if (flaskId === 'quicksilver') {
      bottlePath = 'M12,13 L12,19 L6,26 L9,41 L23,41 L26,26 L20,19 L20,13 Z';
      ornament = '<path d="M5,24 L2,19 L7,21 M27,24 L30,19 L25,21" stroke="#c8b38a" stroke-width="1.2" fill="none"/>';
    } else if (flaskId === 'granite') {
      bottlePath = 'M10,13 L10,18 L6,23 L6,41 L26,41 L26,23 L22,18 L22,13 Z';
      ornament = '<rect x="9" y="25" width="14" height="12" fill="none" stroke="#a38d6d" stroke-width="1"/>';
    } else if (flaskId === 'diamond') {
      bottlePath = 'M12,13 L12,18 L5,29 L16,43 L27,29 L20,18 L20,13 Z';
    } else if (flaskId === 'quartz') {
      bottlePath = 'M11,13 L11,18 L7,25 C5,33 9,42 16,42 C23,42 27,33 25,25 L21,18 L21,13 Z';
    } else if (flaskId === 'silver') {
      bottlePath = 'M11,13 L11,18 L5,24 L8,42 L24,42 L27,24 L21,18 L21,13 Z';
      ornament = '<polygon points="16,22 20,30 16,38 12,30" fill="none" stroke="#e9ecef" stroke-width="1.1"/>';
    } else if (flaskId === 'amethyst') {
      bottlePath = 'M12,13 L12,18 L6,27 L11,42 L21,42 L26,27 L20,18 L20,13 Z';
      ornament = '<circle cx="16" cy="31" r="4.5" fill="none" stroke="#e599f7" stroke-width="1.2"/>';
    }
    return `
      <svg width="32" height="40" viewBox="0 0 32 46">
        <defs>
          <clipPath id="${clipId}">
            <path d="${bottlePath}"/>
          </clipPath>
        </defs>
        <rect x="13" y="4" width="6" height="5" fill="#6e4726" stroke="#24160b" stroke-width="1"/>
        <rect x="10" y="9" width="12" height="4" fill="#9c7f54" stroke="#24160b" stroke-width="1"/>
        <path d="${bottlePath}" fill="#080605"/>
        <g clip-path="url(#${clipId})">
          <rect x="2" y="${yFill}" width="28" height="36" fill="${liquidColor}" opacity="0.88"/>
          <line x1="2" y1="${yFill}" x2="30" y2="${yFill}" stroke="#ffffff" stroke-width="1.3" opacity="0.65"/>
        </g>
        <path d="${bottlePath}" fill="none" stroke="#9c7f54" stroke-width="1.5"/>
        <path d="M11,22 L8,30" stroke="rgba(255,255,255,0.38)" stroke-width="1.3" stroke-linecap="round"/>
        ${ornament}
      </svg>
    `;
  }

  function getSkillSvg(skillId) {
    if (skillId && String(skillId).startsWith('vaal')) {
      return `<svg width="46" height="46" viewBox="0 0 48 48">
        <rect width="48" height="48" fill="#1a0305"/>
        <circle cx="24" cy="24" r="18" fill="none" stroke="#ff4d4d" stroke-width="2.2" stroke-dasharray="6 3"/>
        <polygon points="24,5 30,18 43,24 30,30 24,43 18,30 5,24 18,18" fill="#a61111" stroke="#ffd8a8" stroke-width="1.5"/>
        <circle cx="24" cy="24" r="5.5" fill="#ff8787"/>
      </svg>`;
    }
    switch (skillId) {
      case 'sunder':
        return `<svg width="46" height="46" viewBox="0 0 48 48">
          <rect width="48" height="48" fill="#140905"/>
          <path d="M6,38 L18,24 L15,16 L28,10 L25,22 L42,8" fill="none" stroke="#e8833a" stroke-width="2.5"/>
          <polygon points="10,42 22,28 28,32 38,18 42,42" fill="#6e220c" stroke="#f5b041" stroke-width="1.2"/>
          <line x1="4" y1="40" x2="44" y2="36" stroke="#ffd875" stroke-width="2"/>
        </svg>`;
      case 'cyclone':
        return `<svg width="46" height="46" viewBox="0 0 48 48">
          <rect width="48" height="48" fill="#120707"/>
          <path d="M24,24 m-16,0 a16,16 0 1,0 32,0 a16,16 0 1,0 -32,0" fill="none" stroke="#8a1c14" stroke-width="3" stroke-dasharray="12 6"/>
          <path d="M12,18 C20,8 36,12 36,24 C36,36 20,40 12,30" fill="none" stroke="#dfcf99" stroke-width="2.5"/>
          <circle cx="24" cy="24" r="4" fill="#e03131"/>
        </svg>`;
      case 'molten_strike':
        return `<svg width="46" height="46" viewBox="0 0 48 48">
          <rect width="48" height="48" fill="#1a0702"/>
          <path d="M8,38 Q16,14 26,28 M20,38 Q28,10 40,26" fill="none" stroke="#ff6b35" stroke-width="2.5"/>
          <circle cx="14" cy="24" r="5" fill="#e8590c" stroke="#ffd43b" stroke-width="1.5"/>
          <circle cx="28" cy="18" r="6" fill="#d9480f" stroke="#ffd43b" stroke-width="1.5"/>
          <circle cx="38" cy="28" r="5" fill="#f76707" stroke="#fff3bf" stroke-width="1.5"/>
        </svg>`;
      case 'ice_nova':
        return `<svg width="46" height="46" viewBox="0 0 48 48">
          <rect width="48" height="48" fill="#04101c"/>
          <circle cx="24" cy="24" r="16" fill="none" stroke="#74c0fc" stroke-width="2.5"/>
          <polygon points="24,4 28,18 44,24 28,30 24,44 20,30 4,24 20,18" fill="#1c7ed6" stroke="#d0ebff" stroke-width="1.4"/>
          <circle cx="24" cy="24" r="4.5" fill="#ffffff"/>
        </svg>`;
      case 'fireball':
        return `<svg width="46" height="46" viewBox="0 0 48 48">
          <rect width="48" height="48" fill="#170703"/>
          <path d="M6,10 Q20,16 28,28 L14,22 Q22,32 34,36" fill="none" stroke="#b83214" stroke-width="4"/>
          <circle cx="31" cy="30" r="10" fill="#d9480f" stroke="#ffd43b" stroke-width="2"/>
          <circle cx="33" cy="31" r="5" fill="#fff3bf"/>
        </svg>`;
      case 'arc':
        return `<svg width="46" height="46" viewBox="0 0 48 48">
          <rect width="48" height="48" fill="#050c1a"/>
          <polyline points="6,38 16,22 22,28 32,12 36,18 43,6" fill="none" stroke="#4dabf7" stroke-width="3"/>
          <polyline points="16,22 12,10 M32,12 40,24" fill="none" stroke="#a5d8ff" stroke-width="1.6"/>
          <polyline points="6,38 16,22 22,28 32,12 43,6" fill="none" stroke="#ffffff" stroke-width="1.2"/>
        </svg>`;
      case 'spark':
        return `<svg width="46" height="46" viewBox="0 0 48 48">
          <rect width="48" height="48" fill="#06101c"/>
          <g stroke="#74c0fc" stroke-width="1.8" fill="none">
            <path d="M24,24 L10,10 M24,24 L38,12 M24,24 L8,34 M24,24 L40,36 M24,24 L24,6"/>
          </g>
          <circle cx="24" cy="24" r="5" fill="#d0ebff" stroke="#339af0" stroke-width="2"/>
        </svg>`;
      case 'tornado_shot':
        return `<svg width="46" height="46" viewBox="0 0 48 48">
          <rect width="48" height="48" fill="#061409"/>
          <g stroke="#40c057" stroke-width="2">
            <line x1="24" y1="24" x2="8" y2="8"/><line x1="24" y1="24" x2="40" y2="8"/>
            <line x1="24" y1="24" x2="8" y2="40"/><line x1="24" y1="24" x2="40" y2="40"/>
            <line x1="24" y1="42" x2="24" y2="10" stroke="#dfcf99" stroke-width="2.5"/>
          </g>
          <circle cx="24" cy="24" r="4" fill="#b2f2bb"/>
        </svg>`;
      case 'lightning_arrow':
        return `<svg width="46" height="46" viewBox="0 0 48 48">
          <rect width="48" height="48" fill="#091408"/>
          <line x1="8" y1="40" x2="38" y2="10" stroke="#ffd43b" stroke-width="2.8"/>
          <polygon points="41,7 31,11 37,17" fill="#fff3bf"/>
          <polyline points="14,34 18,22 26,26 32,14" fill="none" stroke="#74c0fc" stroke-width="2"/>
        </svg>`;
      case 'blade_vortex':
        return `<svg width="46" height="46" viewBox="0 0 48 48">
          <rect width="48" height="48" fill="#071710"/>
          <circle cx="24" cy="24" r="16" fill="none" stroke="#51cf66" stroke-width="2.2" stroke-dasharray="9 4"/>
          <path d="M24,6 L29,18 L24,14 Z M42,24 L30,29 L34,24 Z M24,42 L19,30 L24,34 Z M6,24 L18,19 L14,24 Z" fill="#b2f2bb" stroke="#2b8a3e" stroke-width="1"/>
          <circle cx="24" cy="24" r="4" fill="#ebfbee"/>
        </svg>`;
      case 'righteous_fire':
        return `<svg width="46" height="46" viewBox="0 0 48 48">
          <rect width="48" height="48" fill="#1a0803"/>
          <circle cx="24" cy="24" r="16" fill="none" stroke="#e8590c" stroke-width="4" stroke-dasharray="8 3"/>
          <circle cx="24" cy="24" r="11" fill="none" stroke="#ffd43b" stroke-width="2"/>
          <circle cx="24" cy="24" r="5" fill="#ff922b"/>
        </svg>`;
      case 'spectral_throw':
        return `<svg width="46" height="46" viewBox="0 0 48 48">
          <rect width="48" height="48" fill="#081412"/>
          <circle cx="24" cy="24" r="15" fill="none" stroke="#38d9a9" stroke-width="1.8" stroke-dasharray="10 5"/>
          <polygon points="24,8 30,20 40,24 28,28 24,40 18,28 8,24 18,20" fill="#20c997" stroke="#e6fcf5" stroke-width="1.2"/>
        </svg>`;
      default: // Flame Dash
        return `<svg width="46" height="46" viewBox="0 0 48 48">
          <rect width="48" height="48" fill="#170804"/>
          <path d="M8,36 C16,34 22,26 36,10 L30,26 L40,24 C30,36 18,40 8,36 Z" fill="#e8590c" stroke="#ffd8a8" stroke-width="1.4"/>
        </svg>`;
    }
  }

  function getBoonSvg(color = '#f5d37a') {
    return `<svg width="24" height="24" viewBox="0 0 28 28">
      <polygon points="14,2 18,10 26,14 18,18 14,26 10,18 2,14 10,10" fill="#3b2b10" stroke="${color}" stroke-width="1.8"/>
      <circle cx="14" cy="14" r="4" fill="${color}"/>
    </svg>`;
  }

  function getGearSvg(item) {
    if (!item) return '';
    const strokeCol = item.rarity === 'unique' ? '#d97724' : item.rarity === 'rare' ? '#e8d258' : item.rarity === 'magic' ? '#7888ff' : '#a8a298';
    const fillCol = item.rarity === 'unique' ? '#4a1f08' : item.rarity === 'rare' ? '#3d330e' : item.rarity === 'magic' ? '#171d47' : '#262320';
    switch (item.slot) {
      case 'weapon':
        if (item.baseName && item.baseName.includes('Bow')) {
          return `<svg width="56" height="92" viewBox="0 0 56 96">
            <path d="M16,8 C44,24 44,72 16,88" fill="none" stroke="${strokeCol}" stroke-width="3.5"/>
            <line x1="16" y1="8" x2="16" y2="88" stroke="#8c7e6a" stroke-width="1.2"/>
            <line x1="10" y1="48" x2="44" y2="48" stroke="#dfcf99" stroke-width="2"/>
          </svg>`;
        }
        if (item.baseName && item.baseName.includes('Wand')) {
          return `<svg width="56" height="92" viewBox="0 0 56 96">
            <line x1="16" y1="84" x2="40" y2="18" stroke="${strokeCol}" stroke-width="4"/>
            <circle cx="41" cy="16" r="7" fill="#3bc9db" stroke="#dfcf99" stroke-width="1.8"/>
          </svg>`;
        }
        return `<svg width="56" height="92" viewBox="0 0 56 96">
          <line x1="28" y1="10" x2="28" y2="88" stroke="#6e5638" stroke-width="4"/>
          <path d="M28,16 L8,10 C4,22 4,34 8,44 L28,36 Z" fill="${fillCol}" stroke="${strokeCol}" stroke-width="2"/>
          <path d="M28,16 L48,10 C52,22 52,34 48,44 L28,36 Z" fill="${fillCol}" stroke="${strokeCol}" stroke-width="2"/>
        </svg>`;
      case 'helm':
        return `<svg width="52" height="52" viewBox="0 0 56 56">
          <path d="M12,44 L12,24 C12,10 44,10 44,24 L44,44 L34,40 L28,46 L22,40 Z" fill="${fillCol}" stroke="${strokeCol}" stroke-width="2"/>
          <line x1="28" y1="14" x2="28" y2="38" stroke="${strokeCol}" stroke-width="2"/>
          <line x1="18" y1="26" x2="25" y2="28" stroke="#000" stroke-width="2.5"/>
          <line x1="38" y1="26" x2="31" y2="28" stroke="#000" stroke-width="2.5"/>
        </svg>`;
      case 'body':
        return `<svg width="64" height="82" viewBox="0 0 64 84">
          <path d="M16,10 L24,16 L40,16 L48,10 L58,24 L50,34 L48,74 L16,74 L14,34 L6,24 Z" fill="${fillCol}" stroke="${strokeCol}" stroke-width="2"/>
          <line x1="32" y1="16" x2="32" y2="72" stroke="${strokeCol}" stroke-width="1.4"/>
          <path d="M20,32 L32,40 L44,32" fill="none" stroke="${strokeCol}" stroke-width="1.4"/>
        </svg>`;
      case 'gloves':
        return `<svg width="46" height="46" viewBox="0 0 48 48">
          <path d="M12,38 L10,20 L18,12 L28,12 L34,20 L38,18 L36,38 Z" fill="${fillCol}" stroke="${strokeCol}" stroke-width="2"/>
          <line x1="14" y1="30" x2="34" y2="30" stroke="${strokeCol}" stroke-width="1.5"/>
        </svg>`;
      case 'boots':
        return `<svg width="48" height="48" viewBox="0 0 48 48">
          <path d="M14,10 L28,10 L28,30 L40,36 L40,42 L12,42 Z" fill="${fillCol}" stroke="${strokeCol}" stroke-width="2"/>
          <line x1="14" y1="20" x2="28" y2="20" stroke="${strokeCol}" stroke-width="1.4"/>
        </svg>`;
      case 'belt':
        return `<svg width="64" height="32" viewBox="0 0 68 32">
          <rect x="6" y="9" width="56" height="14" rx="2" fill="${fillCol}" stroke="${strokeCol}" stroke-width="2"/>
          <rect x="26" y="6" width="16" height="20" fill="#2e2214" stroke="#dfcf99" stroke-width="2"/>
          <circle cx="34" cy="16" r="3" fill="${strokeCol}"/>
        </svg>`;
      case 'ring':
        return `<svg width="34" height="34" viewBox="0 0 36 36">
          <circle cx="18" cy="20" r="10" fill="none" stroke="${strokeCol}" stroke-width="3.5"/>
          <polygon points="18,4 23,10 18,14 13,10" fill="#e03131" stroke="#dfcf99" stroke-width="1.2"/>
        </svg>`;
      case 'amulet':
        return `<svg width="34" height="34" viewBox="0 0 36 36">
          <path d="M8,6 C8,18 28,18 28,6" fill="none" stroke="#9c7f54" stroke-width="1.6"/>
          <polygon points="18,14 25,22 18,32 11,22" fill="${fillCol}" stroke="${strokeCol}" stroke-width="2"/>
          <circle cx="18" cy="23" r="3" fill="#3bc9db"/>
        </svg>`;
      case 'flask': {
        const fDef = (GameData && GameData.FLASKS && GameData.FLASKS.find(fl => fl.id === item.flaskId)) || { id: item.flaskId || 'life', color: '#38d9a9' };
        return getFlaskSvg(fDef.id, 100, fDef.color);
      }
      default:
        return '';
    }
  }

  function getCurrencySvg(currencyId) {
    switch (currencyId) {
      case 'transmute':
        return `<svg width="24" height="24" viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" fill="#18325c" stroke="#6ea8fe" stroke-width="1.8"/><circle cx="11" cy="11" r="3" fill="#a5d8ff"/></svg>`;
      case 'alteration':
        return `<svg width="24" height="24" viewBox="0 0 28 28"><polygon points="14,3 24,14 14,25 4,14" fill="#1c3d6e" stroke="#74c0fc" stroke-width="1.8"/><circle cx="14" cy="14" r="4" fill="#d0ebff"/></svg>`;
      case 'alchemy':
        return `<svg width="24" height="24" viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" fill="#5c4212" stroke="#ffd43b" stroke-width="1.8"/><polygon points="14,6 20,18 8,18" fill="none" stroke="#fff3bf" stroke-width="1.4"/></svg>`;
      case 'chaos':
        return `<svg width="24" height="24" viewBox="0 0 28 28"><circle cx="14" cy="14" r="11" fill="#4f390e" stroke="#e8c26b" stroke-width="2"/><circle cx="10" cy="12" r="2" fill="#000"/><circle cx="18" cy="12" r="2" fill="#000"/><path d="M10,18 Q14,15 18,18" stroke="#000" stroke-width="2" fill="none"/></svg>`;
      case 'exalted':
        return `<svg width="24" height="24" viewBox="0 0 28 28"><circle cx="14" cy="14" r="11" fill="#66350f" stroke="#ffa94d" stroke-width="2"/><polygon points="14,3 17,11 25,14 17,17 14,25 11,17 3,14 11,11" fill="#ffd8a8"/></svg>`;
      case 'divine':
        return `<svg width="24" height="24" viewBox="0 0 28 28"><circle cx="14" cy="14" r="11" fill="#7d5a12" stroke="#fff3bf" stroke-width="2.2"/><polygon points="14,2 16.5,11.5 26,14 16.5,16.5 14,26 11.5,16.5 2,14 11.5,11.5" fill="#fff9db"/><circle cx="14" cy="14" r="3.5" fill="#ffd43b"/></svg>`;
      default: // Regret
        return `<svg width="24" height="24" viewBox="0 0 28 28"><path d="M7,14 A7,7 0 1,1 21,14 A5,5 0 1,0 11,14" fill="#868e96" stroke="#dee2e6" stroke-width="1.6"/></svg>`;
    }
  }

  function getGemSvg(color, isSupport = false) {
    const fill = color === 'R' ? '#b81d1d' : color === 'G' ? '#1f8a36' : color === 'B' ? '#1e5cb8' : '#d6c39c';
    const rim = color === 'R' ? '#ff8787' : color === 'G' ? '#8ce99a' : color === 'B' ? '#74c0fc' : '#ffffff';
    if (isSupport) {
      return `<svg width="20" height="20" viewBox="0 0 24 24"><polygon points="12,2 19,5 22,12 19,19 12,22 5,19 2,12 5,5" fill="${fill}" stroke="${rim}" stroke-width="1.5"/><circle cx="12" cy="12" r="4" fill="${rim}"/></svg>`;
    }
    return `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M12,2 L20,13 C20,19 16,22 12,22 C8,22 4,19 4,13 Z" fill="${fill}" stroke="${rim}" stroke-width="1.5"/><path d="M12,5 L15,13 L12,18 L9,13 Z" fill="${rim}" opacity="0.55"/></svg>`;
  }

  // Initialize Flame Dash & Vaal Ultimate icons in bottom tray
  const dashArtEl = document.getElementById('dashSkillArt');
  if (dashArtEl) dashArtEl.innerHTML = getSkillSvg('flame_dash');
  const vaalArtEl = document.getElementById('vaalSkillArt');
  if (vaalArtEl) vaalArtEl.innerHTML = getSkillSvg('vaal');

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
      // Select the newly created character and return to the PoE 1 Character Selection list!
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
    fetchActiveRooms();
  }
  // Guarantee all 7 classes render immediately in #classGrid!
  try {
    initLoginScreen();
  } catch (err) {
    console.warn('initLoginScreen warning:', err);
  }

  function openLobbyModal() {
    document.getElementById('lobbyModal')?.classList.remove('hidden');
    fetchActiveRooms();
  }

  function closeLobbyModal() {
    document.getElementById('lobbyModal')?.classList.add('hidden');
    renderSelectedClassSummary();
    if (!myPlayerId) {
      document.getElementById('loginModal')?.classList.remove('hidden');
    }
  }

  async function fetchActiveRooms() {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      const tbody = document.getElementById('roomBrowserBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      for (const r of data.rooms) {
        const tr = document.createElement('tr');
        const stateText = r.state === 'HIDEOUT' ? 'Oriath Hideout' : `Map Wave ${r.wave}`;
        tr.innerHTML = `
          <td><strong style="color:var(--poe-gold)">${r.code}</strong></td>
          <td>${r.roomName || r.code}</td>
          <td>${r.playerCount} / ${r.maxPlayers}</td>
          <td>${stateText}</td>
          <td><button class="poe-chisel-btn" type="button">JOIN</button></td>
        `;
        tr.querySelector('button').addEventListener('click', () => {
          document.getElementById('roomCodeInput').value = r.code;
          document.getElementById('roomNameInput').value = r.roomName || r.code;
          renderSelectedClassSummary();
          if (myPlayerId && myProfile) {
            connectAndJoin(myProfile.name, r.code, r.roomName, myProfile.classId, myProfile.characterId);
          } else {
            closeLobbyModal();
          }
        });
        tbody.appendChild(tr);
      }
    } catch {
      // Ignore pre-connection errors
    }
  }

  document.getElementById('refreshRoomsBtn')?.addEventListener('click', fetchActiveRooms);

  document.getElementById('openLobbyFromCreateBtn')?.addEventListener('click', () => {
    document.getElementById('loginModal')?.classList.add('hidden');
    openLobbyModal();
  });

  document.getElementById('backToCharCreateBtn')?.addEventListener('click', () => {
    closeLobbyModal();
  });

  document.getElementById('closeLobbyModalBtn')?.addEventListener('click', () => {
    closeLobbyModal();
  });

  document.getElementById('joinCustomRoomBtn')?.addEventListener('click', () => {
    const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase() || 'ORIATH';
    const roomName = document.getElementById('roomNameInput').value.trim() || `${roomCode} Instance`;
    renderSelectedClassSummary();
    if (myPlayerId && myProfile) {
      connectAndJoin(myProfile.name, roomCode, roomName, myProfile.classId, myProfile.characterId);
    } else {
      closeLobbyModal();
    }
  });

  document.getElementById('enterWraeclastBtn')?.addEventListener('click', () => {
    submitCreateCharacter();
  });

  function connectAndJoin(name, roomCode, roomName, classId, characterId = null) {
    if (ws) {
      try {
        ws.close();
      } catch {
        // Ignore close errors
      }
      ws = null;
    }
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${proto}//${location.host}`);

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        type: 'join',
        name,
        roomCode,
        roomName,
        classId,
        accountId: myAccountId,
        characterId
      }));
      document.getElementById('loginModal')?.classList.add('hidden');
      document.getElementById('lobbyModal')?.classList.add('hidden');
      document.getElementById('topHud').classList.remove('hidden');
      document.getElementById('bottomHud').classList.remove('hidden');
      document.getElementById('chatWidget').classList.remove('hidden');
    });

    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'profile') {
        myPlayerId = msg.playerId;
        myProfile = msg;
        updateProfileUI();
      } else if (msg.type === 'state') {
        worldState = msg;
        rebuildBiomeEnvironment(worldState.mode, worldState.mapId);
        if (msg.fx && msg.fx.length > 0) {
          for (const f of msg.fx) {
            if (f.kind === 'dmg_num') {
              if (floatingTexts.length >= 32) {
                floatingTexts.shift();
              }
              floatingTexts.push({
                x: f.x,
                z: f.y,
                yOffset: 34,
                text: f.val,
                crit: f.crit,
                dtype: f.dtype,
                life: 0.72,
                maxLife: 0.72
              });
            } else {
              spawn3DFxEvent(f);
            }
          }
        }
        syncWorldEntities();
        updateRealtimeHud();
      } else if (msg.type === 'announcement') {
        showBanner(msg.title, msg.subtitle, msg.color);
      } else if (msg.type === 'craft_feedback') {
        const banner = document.getElementById('craftStatusBanner');
        banner.textContent = msg.msg;
        banner.style.color = msg.ok ? '#69db7c' : '#ff8787';
      } else if (msg.type === 'chat_history') {
        const box = document.getElementById('chatMessages');
        box.innerHTML = '';
        for (const entry of (msg.log || [])) {
          appendChatLine(entry);
        }
      } else if (msg.type === 'chat_msg') {
        appendChatLine(msg.entry);
      }
    });
  }

  function appendChatLine(entry) {
    if (!entry) return;
    const box = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-line';
    div.innerHTML = `<strong style="color:${entry.color || '#f2c76e'}">[${entry.sender}]:</strong> <span>${entry.text}</span>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  const chatInput = document.getElementById('chatInput');
  chatInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      const txt = chatInput.value.trim();
      if (txt && ws) {
        ws.send(JSON.stringify({ type: 'chat', text: txt }));
        chatInput.value = '';
      }
      chatInput.blur();
    }
  });

  function showBanner(title, sub, color = '#f2c76e') {
    const el = document.getElementById('bannerAnnouncement');
    const tEl = document.getElementById('bannerTitle');
    const sEl = document.getElementById('bannerSub');
    tEl.textContent = title;
    tEl.style.color = color;
    sEl.textContent = sub || '';
    el.classList.remove('hidden');
    clearTimeout(showBanner._timer);
    showBanner._timer = setTimeout(() => {
      el.classList.add('hidden');
    }, 4000);
  }

  // =========================================================================
  // SYNC 3D ENTITIES WITH AUTHORITATIVE SERVER STATE
  // =========================================================================
  function syncWorldEntities() {
    if (!ASSETS.ready) return;

    // 1. Sync Players
    const seenPlayers = new Set();
    for (const p of worldState.players) {
      seenPlayers.add(p.id);
      const ent = getOrCreatePlayer3D(p);
      ent.targetX = p.x;
      ent.targetZ = p.y;
      ent.data = p;

      if (p.rfRadius > 0 && !p.dead) {
        ent.rfGroup.visible = true;
        ent.rfDisc.scale.setScalar(p.rfRadius);
        ent.rfRim.scale.setScalar(p.rfRadius);
      } else {
        ent.rfGroup.visible = false;
      }

      ent.esMesh.visible = p.es > 0 && !p.dead;

      if (p.atkSeq !== ent.lastAtkSeq) {
        ent.lastAtkSeq = p.atkSeq;
        if (ent.actions.atk && !p.dead) {
          ent.actions.atk.reset().play();
        }
        if (typeof p.atkAng === 'number') {
          ent.yaw = Math.atan2(Math.cos(p.atkAng), Math.sin(p.atkAng));
        }
      }

      const isMoving = Math.hypot(p.vx || 0, p.vy || 0) > 10;
      if (p.dead) {
        switchBaseAction(ent, ent.actions.death);
      } else if (p.dashing && ent.actions.dash) {
        switchBaseAction(ent, ent.actions.dash);
      } else if (isMoving && ent.actions.run) {
        switchBaseAction(ent, ent.actions.run);
        ent.yaw = Math.atan2(p.vx, p.vy);
      } else if (ent.actions.idle) {
        switchBaseAction(ent, ent.actions.idle);
      }
    }
    for (const [id, ent] of playerEntities.entries()) {
      if (!seenPlayers.has(id)) {
        playersGroup.remove(ent.group);
        cleanupEntity3D(ent);
        playerEntities.delete(id);
      }
    }

    // 2. Sync Enemies
    const seenEnemies = new Set();
    for (const m of worldState.enemies) {
      seenEnemies.add(m.id);
      const ent = getOrCreateEnemy3D(m);
      const dx = m.x - ent.targetX;
      const dz = m.y - ent.targetZ;
      if (Math.hypot(dx, dz) > 1.5) {
        ent.yaw = Math.atan2(dx, dz);
      }
      ent.targetX = m.x;
      ent.targetZ = m.y;
      ent.data = m;

      const isChilled = Boolean(m.chilled);
      if (ent.lastChilled !== isChilled) {
        ent.lastChilled = isChilled;
        for (const mat of ent.materials) {
          mat.color.setHex(isChilled ? 0x66d9e8 : 0xffffff);
        }
      }
    }
    for (const [id, ent] of enemyEntities.entries()) {
      if (!seenEnemies.has(id)) {
        spawnDeathBurst3D(
          ent.group.position.x,
          ent.group.position.z,
          ent.rarity === 'rare' ? 0xffd43b : 0xd93829
        );
        releaseEnemy3D(ent);
        enemyEntities.delete(id);
      }
    }

    // 3. Sync Projectiles
    const seenProjs = new Set();
    for (const prj of worldState.projectiles) {
      seenProjs.add(prj.id);
      const ent = getOrCreateProjectile3D(prj);
      ent.group.position.set(prj.x, ent.yHeight, prj.y);
      if (prj.vx || prj.vy) {
        ent.group.rotation.y = Math.atan2(prj.vx, prj.vy);
      }
    }
    for (const [id, ent] of projEntities.entries()) {
      if (!seenProjs.has(id)) {
        projectilesGroup.remove(ent.group);
        cleanupEntity3D(ent);
        projEntities.delete(id);
      }
    }

    // 4. Sync Telegraphed Ground Hazards
    const seenHaz = new Set();
    for (const h of (worldState.hazards || [])) {
      seenHaz.add(h.id);
      const ent = getOrCreateHazard3D(h);
      ent.innerFill.scale.setScalar(Math.max(0.08, h.prog));
    }
    for (const [id, ent] of hazardEntities.entries()) {
      if (!seenHaz.has(id)) {
        hazardsGroup.remove(ent.group);
        cleanupEntity3D(ent);
        hazardEntities.delete(id);
      }
    }

    // 5. Sync Map Interactables (Shrines, Strongboxes & Breaches)
    const seenInt = new Set();
    for (const it of (worldState.interactables || [])) {
      seenInt.add(it.id);
      getOrCreateInteractable3D(it);
    }
    for (const [id, ent] of interactableEntities.entries()) {
      if (!seenInt.has(id)) {
        interactablesGroup.remove(ent.group);
        cleanupEntity3D(ent);
        interactableEntities.delete(id);
      }
    }

    // 5B. Sync Scaling Gold Upgrade Chests
    const seenChests = new Set();
    for (const ch of (worldState.upgradeChests || [])) {
      if (ch.opened) continue;
      seenChests.add(ch.id);
      getOrCreateUpgradeChest3D(ch);
    }
    for (const [id, ent] of upgradeChestEntities.entries()) {
      if (!seenChests.has(id)) {
        interactablesGroup.remove(ent.group);
        cleanupEntity3D(ent);
        upgradeChestEntities.delete(id);
      }
    }

    // 5C. Sync Active Expanding PoE Breach Rings
    const seenBreaches = new Set();
    for (const b of (worldState.breaches || [])) {
      seenBreaches.add(b.id);
      getOrCreateBreachRing3D(b);
    }
    for (const [id, ent] of breachRingEntities.entries()) {
      if (!seenBreaches.has(id)) {
        interactablesGroup.remove(ent.group);
        cleanupEntity3D(ent);
        breachRingEntities.delete(id);
      }
    }

    // 6. Sync Ground Loot Drops
    const seenDrops = new Set();
    for (const d of worldState.drops) {
      seenDrops.add(d.id);
      getOrCreateDrop3D(d);
    }
    for (const [id, ent] of dropEntities.entries()) {
      if (!seenDrops.has(id)) {
        dropsGroup.remove(ent.group);
        cleanupEntity3D(ent);
        dropEntities.delete(id);
      }
    }

    // 7. Extraction Portal
    if (worldState.mode === 'RUN' && worldState.portalsOpen && !extractionPortalMesh) {
      const pGroup = new THREE.Group();
      pGroup.position.set(0, 26, 0);
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(24, 3.0, 16, 36),
        new THREE.MeshStandardMaterial({ color: 0x74c0fc, emissive: 0x1c7ed6, emissiveIntensity: 0.9 })
      );
      arch.scale.set(0.75, 1.35, 1);
      const vortex = new THREE.Mesh(
        new THREE.CircleGeometry(22, 32),
        new THREE.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.78, side: THREE.DoubleSide })
      );
      vortex.scale.set(0.75, 1.35, 1);
      pGroup.add(arch, vortex);
      envGroup.add(pGroup);
      extractionPortalMesh = pGroup;
    }
  }

    Object.assign(window.__POS_CTX__, { FALLBACK_CLASSES, getAllClasses, getClassEmblemSvg, getFlaskSvg, getSkillSvg, getBoonSvg, getGearSvg, getCurrencySvg, getGemSvg, buildClassCardElement, setCharFlowStage, renderSelectedCharacterSpotlight, renderSavedCharactersRoster, playSelectedCharacter, fetchSavedCharacters, submitCreateCharacter, renderSelectedClassSummary, initLoginScreen, openLobbyModal, closeLobbyModal, fetchActiveRooms, connectAndJoin, appendChatLine, chatInput, showBanner, syncWorldEntities });
  }
})();
