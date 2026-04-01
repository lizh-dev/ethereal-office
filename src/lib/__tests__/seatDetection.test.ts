import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock zustand store before importing seatDetection
let mockZones: any[] = [];
vi.mock('@/store/officeStore', () => ({
  useOfficeStore: Object.assign(
    () => ({}),
    {
      getState: () => ({ zones: mockZones }),
      setState: (state: any) => { mockZones = state.zones; },
    },
  ),
}));

import { initSeatsFromElements } from '../seatDetection';

// ── Helpers ──

function makeRoom(name: string, x: number, y: number, w: number, h: number) {
  return [
    { type: 'rectangle', x, y, width: w, height: h, backgroundColor: '#ffffff', strokeColor: '#e5e5e5', fillStyle: 'solid', strokeWidth: 1 },
    { type: 'text', x: x + 12, y: y + 10, text: name, fontSize: 13, strokeColor: '#6b7280' },
  ];
}

function makeImageChair(fileId: string, x: number, y: number, w = 22, h = 35) {
  return { type: 'image', x, y, width: w, height: h, fileId, status: 'saved', strokeColor: 'transparent', backgroundColor: 'transparent' };
}

function makeEllipseChair(x: number, y: number, w = 22, h = 22) {
  return { type: 'ellipse', x, y, width: w, height: h, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', strokeWidth: 1 };
}

function makeCoffee(x: number, y: number) {
  return { type: 'image', x, y, width: 25, height: 24, fileId: 'fur-coffee', status: 'saved', strokeColor: 'transparent', backgroundColor: 'transparent' };
}

function makeTable(x: number, y: number, round = true) {
  return { type: 'image', x, y, width: round ? 46 : 90, height: round ? 46 : 62, fileId: round ? 'fur-table-round' : 'fur-table-rect', status: 'saved', strokeColor: 'transparent', backgroundColor: 'transparent' };
}

function makeDesk(x: number, y: number) {
  return { type: 'image', x, y, width: 90, height: 51, fileId: 'fur-desk', status: 'saved', strokeColor: 'transparent', backgroundColor: 'transparent' };
}

function makeSofa(x: number, y: number) {
  return { type: 'image', x, y, width: 55, height: 54, fileId: 'fur-sofa', status: 'saved', strokeColor: 'transparent', backgroundColor: 'transparent' };
}

beforeEach(() => {
  mockZones = [];
});

// ════════════════════════════════════════════
// 1. 削除エレメントのフィルタリング
// ════════════════════════════════════════════

describe('削除エレメント除外', () => {
  it('isDeleted: true の椅子(image)は座席として検出されない', () => {
    const elements = [
      ...makeRoom('テスト', 0, 0, 300, 200),
      makeImageChair('fur-chair', 50, 50),
      { ...makeImageChair('fur-chair-up', 100, 50), isDeleted: true },
    ];

    initSeatsFromElements(elements);

    const seats = mockZones.flatMap((z: any) => z.seats);
    expect(seats).toHaveLength(1);
    // 残った1席の位置は削除されていない椅子のセンター
    expect(seats[0].x).toBeCloseTo(50 + 22 / 2);
    expect(seats[0].y).toBeCloseTo(50 + 35 / 2);
  });

  it('isDeleted: true の椅子(ellipse)は座席として検出されない', () => {
    const elements = [
      ...makeRoom('テスト', 0, 0, 300, 200),
      makeEllipseChair(50, 50),
      { ...makeEllipseChair(100, 50), isDeleted: true },
    ];

    initSeatsFromElements(elements);

    const seats = mockZones.flatMap((z: any) => z.seats);
    expect(seats).toHaveLength(1);
  });

  it('isDeleted: true の部屋は検出されない', () => {
    const room = makeRoom('削除部屋', 0, 0, 300, 200);
    room[0] = { ...room[0], isDeleted: true };
    const elements = [
      ...room,
      makeImageChair('fur-chair', 50, 50),
      ...makeRoom('残る部屋', 400, 0, 300, 200),
      makeImageChair('fur-chair', 450, 50),
    ];

    initSeatsFromElements(elements);

    // 削除された部屋内の椅子はzone-otherに入るか、残る部屋のみ検出される
    const roomZones = mockZones.filter((z: any) => z.id !== 'zone-other');
    expect(roomZones).toHaveLength(1);
    expect(roomZones[0].name).toBe('残る部屋');
  });

  it('全ての椅子が削除されたら座席ゼロ', () => {
    const elements = [
      ...makeRoom('テスト', 0, 0, 300, 200),
      { ...makeImageChair('fur-chair', 50, 50), isDeleted: true },
      { ...makeImageChair('fur-chair-up', 100, 50), isDeleted: true },
    ];

    initSeatsFromElements(elements);

    const seats = mockZones.flatMap((z: any) => z.seats);
    expect(seats).toHaveLength(0);
  });
});

// ════════════════════════════════════════════
// 2. 座席位置がエレメントの中心座標
// ════════════════════════════════════════════

describe('座席位置 = エレメント中心', () => {
  it('image椅子の座席位置はエレメントの中心座標', () => {
    const chair = makeImageChair('fur-chair', 100, 200, 22, 35);
    const elements = [
      ...makeRoom('テスト', 0, 0, 400, 400),
      chair,
    ];

    initSeatsFromElements(elements);

    const seat = mockZones[0].seats[0];
    expect(seat.x).toBe(100 + 22 / 2);  // 111
    expect(seat.y).toBe(200 + 35 / 2);  // 217.5
  });

  it('ellipse椅子の座席位置はエレメントの中心座標', () => {
    const chair = makeEllipseChair(80, 120, 22, 22);
    const elements = [
      ...makeRoom('テスト', 0, 0, 400, 400),
      chair,
    ];

    initSeatsFromElements(elements);

    const seat = mockZones[0].seats[0];
    expect(seat.x).toBe(80 + 22 / 2);  // 91
    expect(seat.y).toBe(120 + 22 / 2);  // 131
  });

  it('複数椅子全てが中心座標を持つ', () => {
    const chairs = [
      makeImageChair('fur-chair', 50, 60, 22, 35),
      makeImageChair('fur-chair-up', 150, 60, 22, 35),
      makeImageChair('fur-chair-left', 50, 160, 35, 22),
    ];
    const elements = [
      ...makeRoom('テスト', 0, 0, 400, 400),
      ...chairs,
    ];

    initSeatsFromElements(elements);

    const seats = mockZones[0].seats;
    expect(seats).toHaveLength(3);
    for (const seat of seats) {
      // 各座席がいずれかの椅子の中心に一致することを確認
      const matchingChair = chairs.find(c =>
        Math.abs(seat.x - (c.x + c.width / 2)) < 0.01 &&
        Math.abs(seat.y - (c.y + c.height / 2)) < 0.01
      );
      expect(matchingChair).toBeDefined();
    }
  });
});

// ════════════════════════════════════════════
// 3. カフェスペースのルームタイプ検出
// ════════════════════════════════════════════

describe('ルームタイプ検出', () => {
  it('コーヒーマシン + テーブル → cafe', () => {
    const elements = [
      ...makeRoom('カフェ', 0, 0, 300, 300),
      makeTable(100, 100),
      makeCoffee(250, 30),
      makeImageChair('fur-chair', 90, 50),
    ];

    initSeatsFromElements(elements);

    expect(mockZones[0].type).toBe('cafe');
  });

  it('テーブルのみ(デスクなし) → meeting', () => {
    const elements = [
      ...makeRoom('会議室', 0, 0, 300, 300),
      makeTable(100, 100),
      makeImageChair('fur-chair', 90, 50),
    ];

    initSeatsFromElements(elements);

    expect(mockZones[0].type).toBe('meeting');
  });

  it('デスクあり → desk', () => {
    const elements = [
      ...makeRoom('ワーク', 0, 0, 300, 300),
      makeDesk(50, 50),
      makeImageChair('fur-chair', 70, 120),
    ];

    initSeatsFromElements(elements);

    expect(mockZones[0].type).toBe('desk');
  });

  it('ソファあり → lounge', () => {
    const elements = [
      ...makeRoom('ラウンジ', 0, 0, 300, 300),
      makeSofa(50, 50),
    ];

    initSeatsFromElements(elements);

    // ソファも座席として検出される
    expect(mockZones[0].type).toBe('lounge');
  });

  it('何もない大きい四角 → open', () => {
    const elements = [
      ...makeRoom('空き', 0, 0, 300, 300),
    ];

    initSeatsFromElements(elements);

    expect(mockZones[0].type).toBe('open');
  });
});

// ════════════════════════════════════════════
// 4. ラベル保持（中心座標キーの一致）
// ════════════════════════════════════════════

describe('ラベル保持', () => {
  it('再検出時に既存ラベルが中心座標マッチングで保持される', () => {
    // 最初の検出
    const chair = makeImageChair('fur-chair', 100, 200, 22, 35);
    const elements = [
      ...makeRoom('テスト', 0, 0, 400, 400),
      chair,
    ];

    initSeatsFromElements(elements);

    // ラベルを変更
    const cx = 100 + 22 / 2;
    const cy = 200 + 35 / 2;
    mockZones = mockZones.map((z: any) => ({
      ...z,
      seats: z.seats.map((s: any) => ({ ...s, label: 'カスタム-1', id: 'カスタム-1' })),
    }));

    // 再検出（同じエレメント）
    initSeatsFromElements(elements);

    const seat = mockZones[0].seats[0];
    expect(seat.label).toBe('カスタム-1');
    expect(seat.id).toBe('カスタム-1');
    // 座標も変わらない
    expect(seat.x).toBeCloseTo(cx);
    expect(seat.y).toBeCloseTo(cy);
  });

  it('椅子を移動するとラベルがリセットされる', () => {
    const elements = [
      ...makeRoom('テスト', 0, 0, 400, 400),
      makeImageChair('fur-chair', 100, 200, 22, 35),
    ];

    initSeatsFromElements(elements);

    mockZones = mockZones.map((z: any) => ({
      ...z,
      seats: z.seats.map((s: any) => ({ ...s, label: 'カスタム-1', id: 'カスタム-1' })),
    }));

    // 椅子を大きく移動
    const movedElements = [
      ...makeRoom('テスト', 0, 0, 400, 400),
      makeImageChair('fur-chair', 300, 300, 22, 35),
    ];

    initSeatsFromElements(movedElements);

    const seat = mockZones[0].seats[0];
    // 位置が変わったのでデフォルトラベルに戻る
    expect(seat.label).not.toBe('カスタム-1');
    expect(seat.x).toBeCloseTo(300 + 22 / 2);
  });
});

// ════════════════════════════════════════════
// 5. 椅子が部屋に正しく割り当てられる
// ════════════════════════════════════════════

describe('椅子→部屋の割り当て', () => {
  it('椅子が正しい部屋に割り当てられる', () => {
    const elements = [
      ...makeRoom('部屋A', 0, 0, 200, 200),
      ...makeRoom('部屋B', 300, 0, 200, 200),
      makeImageChair('fur-chair', 50, 50),   // 部屋A内
      makeImageChair('fur-chair', 350, 50),  // 部屋B内
    ];

    initSeatsFromElements(elements);

    const roomA = mockZones.find((z: any) => z.name === '部屋A');
    const roomB = mockZones.find((z: any) => z.name === '部屋B');
    expect(roomA?.seats).toHaveLength(1);
    expect(roomB?.seats).toHaveLength(1);
    expect(roomA?.seats[0].x).toBeCloseTo(50 + 22 / 2);
    expect(roomB?.seats[0].x).toBeCloseTo(350 + 22 / 2);
  });

  it('部屋外の椅子はzone-otherに入る', () => {
    const elements = [
      ...makeRoom('部屋A', 0, 0, 200, 200),
      makeImageChair('fur-chair', 50, 50),   // 部屋A内
      makeImageChair('fur-chair', 500, 500), // 部屋外
    ];

    initSeatsFromElements(elements);

    const other = mockZones.find((z: any) => z.id === 'zone-other');
    expect(other).toBeDefined();
    expect(other?.seats).toHaveLength(1);
    expect(other?.seats[0].x).toBeCloseTo(500 + 22 / 2);
  });
});

// ════════════════════════════════════════════
// 6. レガシー（ellipse）椅子の検出
// ════════════════════════════════════════════

describe('レガシー ellipse 椅子', () => {
  it('小さいellipseは椅子として検出される', () => {
    const elements = [
      ...makeRoom('旧式', 0, 0, 300, 200),
      makeEllipseChair(50, 50, 22, 22),
      makeEllipseChair(100, 50, 20, 20),
    ];

    initSeatsFromElements(elements);

    expect(mockZones[0].seats).toHaveLength(2);
  });

  it('大きいellipseは椅子として検出されない', () => {
    const elements = [
      ...makeRoom('旧式', 0, 0, 300, 200),
      { type: 'ellipse', x: 50, y: 50, width: 50, height: 50, backgroundColor: '#9ca3af' }, // 大きすぎる
    ];

    initSeatsFromElements(elements);

    expect(mockZones[0].seats).toHaveLength(0);
  });

  it('植物色のellipseは椅子として検出されない', () => {
    const elements = [
      ...makeRoom('旧式', 0, 0, 300, 200),
      { type: 'ellipse', x: 50, y: 50, width: 22, height: 22, backgroundColor: '#86ceab' }, // 植物色
      { type: 'ellipse', x: 100, y: 50, width: 22, height: 22, backgroundColor: '#4ade80' }, // 植物色
    ];

    initSeatsFromElements(elements);

    expect(mockZones[0].seats).toHaveLength(0);
  });
});

// ════════════════════════════════════════════
// 7. カフェスペース完全シナリオ（SpaceWizard相当）
// ════════════════════════════════════════════

describe('カフェスペース統合テスト', () => {
  it('SpaceWizard相当のカフェ構成で全椅子が正しく検出される', () => {
    // SpaceWizard.generateCafe 2x2 の出力を模倣
    const roomX = 0, roomY = 0;
    const chW = 22, chH = 35; // 修正後のアセットサイズ
    const tblScale = 0.7;
    const tblW = Math.round(65 * tblScale); // 46
    const tblH = Math.round(65 * tblScale); // 46
    const gap = 8;
    const spacing = 20;
    const setH = chH + gap + tblH + gap + chH;
    const cellW = Math.max(tblW, chW) + spacing + 20;
    const cellH = setH + spacing;
    const cols = 2, rows = 2;
    const roomW = cols * cellW + 60;
    const roomH = rows * cellH + 60;

    const elements: any[] = [...makeRoom('カフェスペース', roomX, roomY, roomW, roomH)];
    const expectedChairs: { x: number; y: number; w: number; h: number }[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = roomX + 30 + c * cellW + cellW / 2;
        const baseY = roomY + 40 + r * cellH;

        // Top chair
        const c1x = cx - chW / 2;
        const c1y = baseY;
        elements.push(makeImageChair('fur-chair', c1x, c1y, chW, chH));
        expectedChairs.push({ x: c1x + chW / 2, y: c1y + chH / 2, w: chW, h: chH });

        // Table
        elements.push(makeTable(cx - tblW / 2, baseY + chH + gap, true));

        // Bottom chair
        const c2x = cx - chW / 2;
        const c2y = baseY + chH + gap + tblH + gap;
        elements.push(makeImageChair('fur-chair-up', c2x, c2y, chW, chH));
        expectedChairs.push({ x: c2x + chW / 2, y: c2y + chH / 2, w: chW, h: chH });
      }
    }

    // Coffee machine
    elements.push(makeCoffee(roomW - 35, 35));

    initSeatsFromElements(elements);

    // カフェタイプであること
    expect(mockZones[0].type).toBe('cafe');
    // 全椅子分の座席があること (2x2x2 = 8)
    expect(mockZones[0].seats).toHaveLength(8);

    // 各座席が対応する椅子の中心にあること
    for (const expected of expectedChairs) {
      const match = mockZones[0].seats.find((s: any) =>
        Math.abs(s.x - expected.x) < 1 && Math.abs(s.y - expected.y) < 1
      );
      expect(match, `椅子 (${expected.x}, ${expected.y}) に対応する座席がない`).toBeDefined();
    }
  });

  it('カフェの椅子を削除すると座席から消える', () => {
    const elements = [
      ...makeRoom('カフェ', 0, 0, 300, 300),
      makeTable(100, 100),
      makeCoffee(250, 30),
      makeImageChair('fur-chair', 90, 50),
      makeImageChair('fur-chair-up', 90, 200),
    ];

    initSeatsFromElements(elements);
    expect(mockZones[0].seats).toHaveLength(2);

    // 1つの椅子を削除して再検出
    const afterDelete = elements.filter(el => !(el.type === 'image' && el.fileId === 'fur-chair-up' && el.y === 200));
    initSeatsFromElements(afterDelete);

    expect(mockZones[0].seats).toHaveLength(1);
    expect(mockZones[0].seats[0].x).toBeCloseTo(90 + 22 / 2);
    expect(mockZones[0].seats[0].y).toBeCloseTo(50 + 35 / 2);
  });
});

// ════════════════════════════════════════════
// 8. sceneToScreen / screenToScene 整合性
// ════════════════════════════════════════════

describe('sceneToScreen 座標変換', () => {
  // FloorCanvas.tsx の sceneToScreen（offsetは含めない: overlay divはコンテナ相対）
  function sceneToScreen(sceneX: number, sceneY: number, appState: any) {
    const zoom = appState.zoom?.value || 1;
    const scrollX = appState.scrollX || 0;
    const scrollY = appState.scrollY || 0;
    return {
      x: (sceneX + scrollX) * zoom,
      y: (sceneY + scrollY) * zoom,
    };
  }

  // handleCanvasClick の screenToScene
  // offsetLeft/offsetTopはExcalidrawキャンバスのコンテナ内オフセット
  function screenToScene(clientX: number, clientY: number, rectLeft: number, rectTop: number, appState: any) {
    const zoom = appState.zoom?.value || 1;
    const scrollX = appState.scrollX || 0;
    const scrollY = appState.scrollY || 0;
    const offsetLeft = appState.offsetLeft || 0;
    const offsetTop = appState.offsetTop || 0;
    return {
      x: (clientX - rectLeft - offsetLeft) / zoom - scrollX,
      y: (clientY - rectTop - offsetTop) / zoom - scrollY,
    };
  }

  it('offset=0 なら sceneToScreen と screenToScene は逆関数', () => {
    const appState = { zoom: { value: 1.5 }, scrollX: -100, scrollY: -200, offsetLeft: 0, offsetTop: 0 };
    const rectLeft = 50, rectTop = 80;

    const scenePos = { x: 300, y: 400 };
    const screenPos = sceneToScreen(scenePos.x, scenePos.y, appState);
    const clientX = screenPos.x + rectLeft;
    const clientY = screenPos.y + rectTop;
    const recovered = screenToScene(clientX, clientY, rectLeft, rectTop, appState);

    expect(recovered.x).toBeCloseTo(scenePos.x, 5);
    expect(recovered.y).toBeCloseTo(scenePos.y, 5);
  });

  it('viewモードではoffsetは通常0なので問題ない', () => {
    // view モードではツールバーが非表示のため offset ≈ 0
    const appState = { zoom: { value: 1 }, scrollX: 0, scrollY: 0, offsetLeft: 0, offsetTop: 0 };
    const scenePos = { x: 100, y: 200 };
    const screenPos = sceneToScreen(scenePos.x, scenePos.y, appState);
    expect(screenPos.x).toBe(100);
    expect(screenPos.y).toBe(200);
  });
});

// ════════════════════════════════════════════
// 9. DB zonesがあっても再検出で座標が正しくなる
// ════════════════════════════════════════════

describe('DB zones 再検出', () => {
  it('DBから読み込んだ座標がズレていても再検出で修正される', () => {
    // DBから読み込んだ（ズレた）zones を模擬
    mockZones = [{
      id: 'zone-0',
      type: 'cafe' as const,
      name: 'カフェ',
      x: 0, y: 0, w: 300, h: 300,
      seats: [
        { id: 'old-1', roomId: 'zone-0', x: 999, y: 999, label: 'カフェ-1', occupied: false }, // 明らかに間違った座標
      ],
    }];

    // 実際のエレメント
    const elements = [
      ...makeRoom('カフェ', 0, 0, 300, 300),
      makeTable(100, 100),
      makeCoffee(250, 30),
      makeImageChair('fur-chair', 90, 50, 22, 35),
    ];

    initSeatsFromElements(elements);

    const seat = mockZones[0].seats[0];
    // 再検出で正しい中心座標になる
    expect(seat.x).toBeCloseTo(90 + 22 / 2);
    expect(seat.y).toBeCloseTo(50 + 35 / 2);
    // ラベルは座標がマッチしないのでリセット
    expect(seat.label).not.toBe('カフェ-1');
  });

  it('DBの座標が正しければラベルが保持される', () => {
    const cx = 90 + 22 / 2;
    const cy = 50 + 35 / 2;
    // DBから読み込んだ正しい座標のzones
    mockZones = [{
      id: 'zone-0',
      type: 'cafe' as const,
      name: 'カフェ',
      x: 0, y: 0, w: 300, h: 300,
      seats: [
        { id: 'カフェ-1', roomId: 'zone-0', x: cx, y: cy, label: 'カフェ-1', occupied: false },
      ],
    }];

    const elements = [
      ...makeRoom('カフェ', 0, 0, 300, 300),
      makeTable(100, 100),
      makeCoffee(250, 30),
      makeImageChair('fur-chair', 90, 50, 22, 35),
    ];

    initSeatsFromElements(elements);

    const seat = mockZones[0].seats[0];
    expect(seat.x).toBeCloseTo(cx);
    expect(seat.y).toBeCloseTo(cy);
    expect(seat.label).toBe('カフェ-1');
  });
});
