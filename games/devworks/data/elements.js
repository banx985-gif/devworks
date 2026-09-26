// The game element catalogue (bible §13): all 50 elements in the six recipe families. Plain data only.
// art = image key; the file is assets/images/elements/<art>.png (a missing file shows its placeholder).
// Art Direction ids are ADR01–07 (plan review: ART01–07 clashed with the Artist staff ids).

// The six recipe slots, in order (bible §12).
export const FAMILIES = [
  { id: 'genre', name: 'Genre', prefix: 'GEN', count: 10 },
  { id: 'theme', name: 'Theme', prefix: 'THM', count: 10 },
  { id: 'gameplay', name: 'Core Gameplay', prefix: 'PLY', count: 8 },
  { id: 'technology', name: 'Technology', prefix: 'TEC', count: 8 },
  { id: 'artDirection', name: 'Art Direction', prefix: 'ADR', count: 7 },
  { id: 'feature', name: 'Feature Package', prefix: 'FEA', count: 7 },
];

export const ELEMENTS = [
  // Genre
  { id: 'GEN01', family: 'genre', name: 'Platformer', art: 'element_gen01' },
  { id: 'GEN02', family: 'genre', name: 'RPG', art: 'element_gen02' },
  { id: 'GEN03', family: 'genre', name: 'Strategy', art: 'element_gen03' },
  { id: 'GEN04', family: 'genre', name: 'Simulation', art: 'element_gen04' },
  { id: 'GEN05', family: 'genre', name: 'Racing', art: 'element_gen05' },
  { id: 'GEN06', family: 'genre', name: 'Action', art: 'element_gen06' },
  { id: 'GEN07', family: 'genre', name: 'Adventure', art: 'element_gen07' },
  { id: 'GEN08', family: 'genre', name: 'Puzzle', art: 'element_gen08' },
  { id: 'GEN09', family: 'genre', name: 'Sports', art: 'element_gen09' },
  { id: 'GEN10', family: 'genre', name: 'Horror', art: 'element_gen10' },
  // Theme
  { id: 'THM01', family: 'theme', name: 'Fantasy', art: 'element_thm01' },
  { id: 'THM02', family: 'theme', name: 'Science Fiction', art: 'element_thm02' },
  { id: 'THM03', family: 'theme', name: 'Modern Life', art: 'element_thm03' },
  { id: 'THM04', family: 'theme', name: 'Historical', art: 'element_thm04' },
  { id: 'THM05', family: 'theme', name: 'Space', art: 'element_thm05' },
  { id: 'THM06', family: 'theme', name: 'Monsters', art: 'element_thm06' },
  { id: 'THM07', family: 'theme', name: 'Crime', art: 'element_thm07' },
  { id: 'THM08', family: 'theme', name: 'Farming', art: 'element_thm08' },
  { id: 'THM09', family: 'theme', name: 'School', art: 'element_thm09' },
  { id: 'THM10', family: 'theme', name: 'Post-Apocalypse', art: 'element_thm10' },
  // Core Gameplay
  { id: 'PLY01', family: 'gameplay', name: 'Exploration', art: 'element_ply01' },
  { id: 'PLY02', family: 'gameplay', name: 'Combat', art: 'element_ply02' },
  { id: 'PLY03', family: 'gameplay', name: 'Management', art: 'element_ply03' },
  { id: 'PLY04', family: 'gameplay', name: 'Building', art: 'element_ply04' },
  { id: 'PLY05', family: 'gameplay', name: 'Collection', art: 'element_ply05' },
  { id: 'PLY06', family: 'gameplay', name: 'Narrative Choice', art: 'element_ply06' },
  { id: 'PLY07', family: 'gameplay', name: 'Competitive', art: 'element_ply07' },
  { id: 'PLY08', family: 'gameplay', name: 'Sandbox', art: 'element_ply08' },
  // Technology
  { id: 'TEC01', family: 'technology', name: 'Licensed 2D', art: 'element_tec01' },
  { id: 'TEC02', family: 'technology', name: 'Custom 2D', art: 'element_tec02' },
  { id: 'TEC03', family: 'technology', name: 'Early 3D', art: 'element_tec03' },
  { id: 'TEC04', family: 'technology', name: 'Advanced 3D', art: 'element_tec04' },
  { id: 'TEC05', family: 'technology', name: 'Online Framework', art: 'element_tec05' },
  { id: 'TEC06', family: 'technology', name: 'Streaming World', art: 'element_tec06' },
  { id: 'TEC07', family: 'technology', name: 'Procedural Systems', art: 'element_tec07' },
  { id: 'TEC08', family: 'technology', name: 'Neural Tools', art: 'element_tec08' },
  // Art Direction
  { id: 'ADR01', family: 'artDirection', name: 'Pixel', art: 'element_adr01' },
  { id: 'ADR02', family: 'artDirection', name: 'Cartoon', art: 'element_adr02' },
  { id: 'ADR03', family: 'artDirection', name: 'Stylised 3D', art: 'element_adr03' },
  { id: 'ADR04', family: 'artDirection', name: 'Realistic 3D', art: 'element_adr04' },
  { id: 'ADR05', family: 'artDirection', name: 'Hand-Painted', art: 'element_adr05' },
  { id: 'ADR06', family: 'artDirection', name: 'Low-Poly', art: 'element_adr06' },
  { id: 'ADR07', family: 'artDirection', name: 'Mixed Media', art: 'element_adr07' },
  // Feature Package
  { id: 'FEA01', family: 'feature', name: 'Single-Player Focus', art: 'element_fea01' },
  { id: 'FEA02', family: 'feature', name: 'Co-op', art: 'element_fea02' },
  { id: 'FEA03', family: 'feature', name: 'Competitive Online', art: 'element_fea03' },
  { id: 'FEA04', family: 'feature', name: 'Open World', art: 'element_fea04' },
  { id: 'FEA05', family: 'feature', name: 'Mod Support', art: 'element_fea05' },
  { id: 'FEA06', family: 'feature', name: 'User Creation', art: 'element_fea06' },
  { id: 'FEA07', family: 'feature', name: 'Procedural Replayability', art: 'element_fea07' },
];

// Open at the start of a run (Milestone 3: one per slot). Everything else shows locked until research (Milestone 6).
export const STARTING_UNLOCKED = ['GEN08', 'THM09', 'PLY05', 'TEC01', 'ADR02', 'FEA01'];

export const elementById = (id) => ELEMENTS.find((e) => e.id === id) ?? null;
export const elementsOf = (family) => ELEMENTS.filter((e) => e.family === family);
