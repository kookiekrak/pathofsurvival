// Client Module: Path of Exile 1 Bespoke SVG Artwork Library (Classes, Flasks, Skills, Gear & Orbs)
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
      case 'ball_lightning':
        return `<svg width="46" height="46" viewBox="0 0 48 48"><rect width="48" height="48" fill="#050d1c"/><circle cx="24" cy="24" r="13" fill="#1864ab" stroke="#74c0fc" stroke-width="2.4"/><polyline points="10,24 19,16 24,26 30,14 38,24" fill="none" stroke="#fff9db" stroke-width="2"/><circle cx="24" cy="24" r="6" fill="#d0ebff"/></svg>`;
      case 'glacial_cascade':
        return `<svg width="46" height="46" viewBox="0 0 48 48"><rect width="48" height="48" fill="#04111d"/><polygon points="8,40 14,22 20,40" fill="#339af0" stroke="#d0ebff" stroke-width="1.2"/><polygon points="18,40 25,14 32,40" fill="#4dabf7" stroke="#ffffff" stroke-width="1.4"/><polygon points="29,40 37,8 43,40" fill="#74c0fc" stroke="#ffffff" stroke-width="1.4"/></svg>`;
      case 'toxic_rain':
        return `<svg width="46" height="46" viewBox="0 0 48 48"><rect width="48" height="48" fill="#091606"/><g stroke="#82c91e" stroke-width="2"><line x1="14" y1="8" x2="14" y2="30"/><line x1="24" y1="6" x2="24" y2="28"/><line x1="34" y1="10" x2="34" y2="32"/></g><circle cx="14" cy="36" r="4.5" fill="#94d82d"/><circle cx="24" cy="34" r="5.5" fill="#a9e34b"/><circle cx="34" cy="37" r="4.5" fill="#94d82d"/></svg>`;
      case 'volcanic_fissure':
        return `<svg width="46" height="46" viewBox="0 0 48 48"><rect width="48" height="48" fill="#180602"/><path d="M6,38 L18,26 L24,30 L34,18 L42,22" fill="none" stroke="#ff922b" stroke-width="3"/><circle cx="18" cy="18" r="4.5" fill="#ff6b35"/><circle cx="28" cy="12" r="5" fill="#ffd43b"/><circle cx="38" cy="16" r="4" fill="#ff6b35"/></svg>`;
      case 'flicker_strike':
        return `<svg width="46" height="46" viewBox="0 0 48 48"><rect width="48" height="48" fill="#140914"/><line x1="6" y1="38" x2="42" y2="10" stroke="#f783ac" stroke-width="3"/><line x1="10" y1="12" x2="38" y2="36" stroke="#ffd8a8" stroke-width="2.2"/><circle cx="24" cy="24" r="5" fill="#ffffff"/></svg>`;
      case 'eye_of_winter':
        return `<svg width="46" height="46" viewBox="0 0 48 48"><rect width="48" height="48" fill="#041220"/><ellipse cx="24" cy="24" rx="17" ry="10" fill="#1864ab" stroke="#a5d8ff" stroke-width="2"/><circle cx="24" cy="24" r="6" fill="#e7f5ff"/><circle cx="24" cy="24" r="2.5" fill="#041220"/></svg>`;
      case 'ethereal_knives':
        return `<svg width="46" height="46" viewBox="0 0 48 48"><rect width="48" height="48" fill="#071512"/><g fill="#63e6be" stroke="#e6fcf5" stroke-width="1"><polygon points="24,6 27,22 24,40 21,22"/><polygon points="11,10 19,24 22,40 14,24"/><polygon points="37,10 34,24 26,40 29,24"/></g></svg>`;
      case 'divine_ire':
        return `<svg width="46" height="46" viewBox="0 0 48 48"><rect width="48" height="48" fill="#181204"/><polygon points="24,4 29,19 44,24 29,29 24,44 19,29 4,24 19,19" fill="#fab005" stroke="#fff9db" stroke-width="1.6"/><circle cx="24" cy="24" r="6" fill="#ffffff"/></svg>`;
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

  Object.assign(window.__POS_CTX__, {
    FALLBACK_CLASSES, getAllClasses, getClassEmblemSvg,
    getFlaskSvg, getSkillSvg, getBoonSvg, getGearSvg, getCurrencySvg, getGemSvg
  });
  }
})();
