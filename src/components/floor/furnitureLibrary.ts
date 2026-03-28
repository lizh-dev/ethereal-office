import { convertToExcalidrawElements } from '@excalidraw/excalidraw';

type RawElement = {
  type: 'rectangle' | 'ellipse' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  backgroundColor?: string;
  strokeColor?: string;
  fillStyle?: 'solid';
  roundness?: { type: 3 };
  groupIds?: string[];
  strokeWidth?: number;
};

function makeItem(id: string, name: string, rawElements: RawElement[]) {
  return {
    id,
    status: 'published' as const,
    name,
    elements: convertToExcalidrawElements(rawElements as any),
    created: 1711600000000,
  };
}

// 1. デスクセット — desk + monitor + chair
function libDeskSet(): RawElement[] {
  const g = ['lib-desk-set'];
  return [
    { type: 'rectangle', x: 0, y: 0, width: 80, height: 40, backgroundColor: '#e8e3dd', strokeColor: '#d5d0ca', fillStyle: 'solid', roundness: { type: 3 }, groupIds: g, strokeWidth: 1 },
    { type: 'rectangle', x: 28, y: 3, width: 24, height: 12, backgroundColor: '#818cf8', strokeColor: '#475569', fillStyle: 'solid', roundness: { type: 3 }, groupIds: g, strokeWidth: 1 },
    { type: 'ellipse', x: 29, y: 48, width: 22, height: 22, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', groupIds: g, strokeWidth: 1 },
  ];
}

// 2. 椅子 — single chair
function libChair(): RawElement[] {
  return [
    { type: 'ellipse', x: 0, y: 0, width: 22, height: 22, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', strokeWidth: 1 },
  ];
}

// 3. 会議テーブル — oval table
function libMeetingTable(): RawElement[] {
  return [
    { type: 'ellipse', x: 0, y: 0, width: 130, height: 65, backgroundColor: '#ddd8d2', strokeColor: '#ccc7c0', fillStyle: 'solid', strokeWidth: 1 },
  ];
}

// 4. ソファ — rectangle sofa
function libSofa(): RawElement[] {
  return [
    { type: 'rectangle', x: 0, y: 0, width: 95, height: 35, backgroundColor: '#c4bab0', strokeColor: '#a8a29e', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 },
  ];
}

// 5. 植物 — green circle
function libPlant(): RawElement[] {
  return [
    { type: 'ellipse', x: 0, y: 0, width: 30, height: 30, backgroundColor: '#86ceab', strokeColor: '#5ead88', fillStyle: 'solid', strokeWidth: 1 },
  ];
}

// 6. プリンター — dark rectangle
function libPrinter(): RawElement[] {
  return [
    { type: 'rectangle', x: 0, y: 0, width: 50, height: 40, backgroundColor: '#4b5563', strokeColor: '#374151', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 },
  ];
}

// 7. コーヒーマシン — brown rectangle
function libCoffeeMachine(): RawElement[] {
  return [
    { type: 'rectangle', x: 0, y: 0, width: 30, height: 35, backgroundColor: '#92714a', strokeColor: '#78572e', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 },
  ];
}

// 8. 本棚 — long rectangle with book colors
function libBookshelf(): RawElement[] {
  const g = ['lib-bookshelf'];
  return [
    { type: 'rectangle', x: 0, y: 0, width: 120, height: 30, backgroundColor: '#d4a574', strokeColor: '#b8956a', fillStyle: 'solid', roundness: { type: 3 }, groupIds: g, strokeWidth: 1 },
    { type: 'rectangle', x: 5, y: 3, width: 12, height: 24, backgroundColor: '#ef4444', strokeColor: '#dc2626', fillStyle: 'solid', groupIds: g, strokeWidth: 1 },
    { type: 'rectangle', x: 20, y: 5, width: 10, height: 22, backgroundColor: '#3b82f6', strokeColor: '#2563eb', fillStyle: 'solid', groupIds: g, strokeWidth: 1 },
    { type: 'rectangle', x: 33, y: 3, width: 14, height: 24, backgroundColor: '#22c55e', strokeColor: '#16a34a', fillStyle: 'solid', groupIds: g, strokeWidth: 1 },
    { type: 'rectangle', x: 50, y: 6, width: 10, height: 21, backgroundColor: '#f59e0b', strokeColor: '#d97706', fillStyle: 'solid', groupIds: g, strokeWidth: 1 },
    { type: 'rectangle', x: 63, y: 3, width: 12, height: 24, backgroundColor: '#8b5cf6', strokeColor: '#7c3aed', fillStyle: 'solid', groupIds: g, strokeWidth: 1 },
    { type: 'rectangle', x: 78, y: 5, width: 14, height: 22, backgroundColor: '#ec4899', strokeColor: '#db2777', fillStyle: 'solid', groupIds: g, strokeWidth: 1 },
    { type: 'rectangle', x: 95, y: 3, width: 12, height: 24, backgroundColor: '#06b6d4', strokeColor: '#0891b2', fillStyle: 'solid', groupIds: g, strokeWidth: 1 },
  ];
}

// 9. ホワイトボード — white rectangle
function libWhiteboard(): RawElement[] {
  return [
    { type: 'rectangle', x: 0, y: 0, width: 120, height: 80, backgroundColor: '#ffffff', strokeColor: '#9ca3af', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 2 },
  ];
}

// 10. 2人デスク — 2 desk sets side by side
function libDoubleDesk(): RawElement[] {
  const g = ['lib-double-desk'];
  const desk1 = libDeskSet().map((el) => ({ ...el, groupIds: g }));
  const desk2 = libDeskSet().map((el) => ({ ...el, x: el.x + 100, groupIds: g }));
  return [...desk1, ...desk2];
}

// 11. 4人テーブル — round table + 4 chairs
function libFourPersonTable(): RawElement[] {
  const g = ['lib-4person'];
  return [
    { type: 'ellipse', x: 20, y: 20, width: 60, height: 60, backgroundColor: '#ddd8d2', strokeColor: '#ccc7c0', fillStyle: 'solid', groupIds: g, strokeWidth: 1 },
    // top chair
    { type: 'ellipse', x: 39, y: 0, width: 22, height: 22, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', groupIds: g, strokeWidth: 1 },
    // bottom chair
    { type: 'ellipse', x: 39, y: 78, width: 22, height: 22, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', groupIds: g, strokeWidth: 1 },
    // left chair
    { type: 'ellipse', x: 0, y: 39, width: 22, height: 22, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', groupIds: g, strokeWidth: 1 },
    // right chair
    { type: 'ellipse', x: 78, y: 39, width: 22, height: 22, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', groupIds: g, strokeWidth: 1 },
  ];
}

export function getFurnitureLibrary() {
  return {
    type: 'excalidrawlib' as const,
    version: 2,
    source: 'custom',
    libraryItems: [
      makeItem('furniture-desk-set', 'デスクセット', libDeskSet()),
      makeItem('furniture-chair', '椅子', libChair()),
      makeItem('furniture-meeting-table', '会議テーブル', libMeetingTable()),
      makeItem('furniture-sofa', 'ソファ', libSofa()),
      makeItem('furniture-plant', '植物', libPlant()),
      makeItem('furniture-printer', 'プリンター', libPrinter()),
      makeItem('furniture-coffee', 'コーヒーマシン', libCoffeeMachine()),
      makeItem('furniture-bookshelf', '本棚', libBookshelf()),
      makeItem('furniture-whiteboard', 'ホワイトボード', libWhiteboard()),
      makeItem('furniture-double-desk', '2人デスク', libDoubleDesk()),
      makeItem('furniture-4person-table', '4人テーブル', libFourPersonTable()),
    ],
  };
}
