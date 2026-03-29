// Floor templates for Excalidraw scenes
// Each template returns raw Excalidraw element descriptors

type RawEl = Record<string, unknown>;

function deskSet(x: number, y: number, gid: string): RawEl[] {
  return [
    { type: 'rectangle', x, y, width: 80, height: 40, backgroundColor: '#e8e3dd', strokeColor: '#d5d0ca', fillStyle: 'solid', roundness: { type: 3 }, groupIds: [gid], strokeWidth: 1 },
    { type: 'rectangle', x: x + 28, y: y + 3, width: 24, height: 12, backgroundColor: '#818cf8', strokeColor: '#475569', fillStyle: 'solid', roundness: { type: 3 }, groupIds: [gid], strokeWidth: 1 },
    { type: 'ellipse', x: x + 29, y: y + 48, width: 22, height: 22, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', groupIds: [gid], strokeWidth: 1 },
  ];
}

function room(name: string, x: number, y: number, w: number, h: number): RawEl[] {
  return [
    { type: 'rectangle', x, y, width: w, height: h, backgroundColor: '#ffffff', strokeColor: '#e5e5e5', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 },
    { type: 'text', x: x + 12, y: y + 10, text: name, fontSize: 13, strokeColor: '#6b7280' },
  ];
}

function meetingTable(x: number, y: number, seats: number): RawEl[] {
  const els: RawEl[] = [
    { type: 'ellipse', x: x, y: y, width: 130, height: 65, backgroundColor: '#ddd8d2', strokeColor: '#ccc7c0', fillStyle: 'solid', strokeWidth: 1 },
  ];
  for (let i = 0; i < seats; i++) {
    els.push({ type: 'ellipse', x: x + 13 + i * 32, y: y - 17, width: 20, height: 20, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', strokeWidth: 1 });
    els.push({ type: 'ellipse', x: x + 13 + i * 32, y: y + 73, width: 20, height: 20, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', strokeWidth: 1 });
  }
  return els;
}

function lounge(x: number, y: number): RawEl[] {
  return [
    { type: 'rectangle', x: x, y: y, width: 95, height: 35, backgroundColor: '#c4bab0', strokeColor: '#a8a29e', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 },
    { type: 'rectangle', x: x, y: y + 70, width: 95, height: 35, backgroundColor: '#c4bab0', strokeColor: '#a8a29e', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 },
    { type: 'rectangle', x: x + 15, y: y + 41, width: 60, height: 24, backgroundColor: '#ddd8d2', strokeColor: '#ccc7c0', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 },
    { type: 'ellipse', x: x + 120, y: y, width: 30, height: 30, backgroundColor: '#86ceab', strokeColor: '#5ead88', fillStyle: 'solid', strokeWidth: 1 },
  ];
}

function gid() { return `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

export function getTemplateElements(templateId: string): RawEl[] {
  switch (templateId) {
    case 'default': {
      const els: RawEl[] = [];
      // Open space: 3x4
      els.push(...room('オープンスペース', 50, 50, 470, 340));
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 4; c++)
          els.push(...deskSet(65 + c * 105, 85 + r * 95, gid()));
      // Meeting A
      els.push(...room('会議室 A', 560, 50, 220, 160));
      els.push(...meetingTable(605, 95, 3));
      // Meeting B
      els.push(...room('会議室 B', 560, 240, 220, 160));
      els.push(...meetingTable(605, 285, 3));
      // Lounge
      els.push(...room('ラウンジ', 560, 430, 220, 170));
      els.push(...lounge(575, 465));
      return els;
    }

    case 'small': {
      const els: RawEl[] = [];
      // Small desk area: 2x4
      els.push(...room('ワークスペース', 50, 50, 470, 240));
      for (let r = 0; r < 2; r++)
        for (let c = 0; c < 4; c++)
          els.push(...deskSet(65 + c * 105, 85 + r * 95, gid()));
      // Meeting room
      els.push(...room('会議室', 50, 320, 220, 160));
      els.push(...meetingTable(95, 365, 3));
      return els;
    }

    case 'meeting': {
      const els: RawEl[] = [];
      // 3 meeting rooms
      els.push(...room('会議室 A', 50, 50, 220, 160));
      els.push(...meetingTable(95, 95, 3));
      els.push(...room('会議室 B', 300, 50, 220, 160));
      els.push(...meetingTable(345, 95, 3));
      els.push(...room('会議室 C', 550, 50, 220, 160));
      els.push(...meetingTable(595, 95, 3));
      // Free space with a few desks
      els.push(...room('フリースペース', 50, 240, 720, 200));
      for (let c = 0; c < 6; c++)
        els.push(...deskSet(65 + c * 110, 275, gid()));
      return els;
    }

    case 'isometric':
      // Return empty - ExcalidrawEditor detects isometric via appState marker
      return [];

    case 'empty':
    default:
      return [];
  }
}
