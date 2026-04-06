import type { FloorPattern } from './types';

// SVG <defs> patterns for floor textures
export function getPatternDefs(): string {
  return `
  <defs>
    <!-- Wood pattern -->
    <pattern id="pat-wood" width="200" height="42" patternUnits="userSpaceOnUse">
      <rect width="200" height="20" fill="#d4a76a" opacity="0.15" rx="1"/>
      <rect y="21" width="200" height="20" fill="#c49a5e" opacity="0.15" rx="1"/>
    </pattern>

    <!-- Wood dark pattern -->
    <pattern id="pat-wood-dark" width="200" height="42" patternUnits="userSpaceOnUse">
      <rect width="200" height="20" fill="#b8894a" opacity="0.18" rx="1"/>
      <rect y="21" width="200" height="20" fill="#a67d3d" opacity="0.18" rx="1"/>
    </pattern>

    <!-- Wood warm pattern -->
    <pattern id="pat-wood-warm" width="200" height="42" patternUnits="userSpaceOnUse">
      <rect width="200" height="20" fill="#d4956a" opacity="0.12" rx="1"/>
      <rect y="21" width="200" height="20" fill="#c48a5e" opacity="0.12" rx="1"/>
    </pattern>

    <!-- Tile pattern -->
    <pattern id="pat-tile" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="none"/>
      <rect x="0" y="0" width="19" height="19" fill="#ccc" opacity="0.08" rx="1"/>
      <rect x="20" y="0" width="19" height="19" fill="#bbb" opacity="0.06" rx="1"/>
      <rect x="0" y="20" width="19" height="19" fill="#bbb" opacity="0.06" rx="1"/>
      <rect x="20" y="20" width="19" height="19" fill="#ccc" opacity="0.08" rx="1"/>
    </pattern>

    <!-- Carpet pattern -->
    <pattern id="pat-carpet" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="#8888aa" opacity="0.04"/>
      <rect x="2" y="2" width="4" height="4" fill="#7777aa" opacity="0.03"/>
    </pattern>

    <!-- Marble pattern -->
    <pattern id="pat-marble" width="100" height="100" patternUnits="userSpaceOnUse">
      <rect width="100" height="100" fill="none"/>
      <path d="M10,30 Q30,10 50,25 T90,40" stroke="#ccc" stroke-width="0.5" fill="none" opacity="0.15"/>
      <path d="M5,70 Q40,50 60,75 T95,60" stroke="#bbb" stroke-width="0.5" fill="none" opacity="0.1"/>
    </pattern>

    <!-- Concrete pattern -->
    <pattern id="pat-concrete" width="60" height="60" patternUnits="userSpaceOnUse">
      <rect width="60" height="60" fill="#999" opacity="0.03"/>
      <circle cx="15" cy="15" r="1" fill="#888" opacity="0.05"/>
      <circle cx="45" cy="40" r="1.5" fill="#888" opacity="0.04"/>
    </pattern>
  </defs>`;
}

export function getPatternId(pattern: FloorPattern, roomType?: string): string {
  if (pattern === 'wood') {
    if (roomType === 'executive') return 'pat-wood-dark';
    if (roomType === 'cafe') return 'pat-wood-warm';
    return 'pat-wood';
  }
  return `pat-${pattern}`;
}
