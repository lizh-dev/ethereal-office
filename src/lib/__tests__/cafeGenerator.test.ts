import { describe, it, expect } from 'vitest';
import { FURNITURE_ASSETS } from '../furnitureAssets';

describe('カフェ生成の寸法整合性', () => {
  it('FURNITURE_ASSETSの椅子サイズが期待通り', () => {
    const chair = FURNITURE_ASSETS.find(a => a.id === 'fur-chair')!;
    const chairUp = FURNITURE_ASSETS.find(a => a.id === 'fur-chair-up')!;
    const chairLeft = FURNITURE_ASSETS.find(a => a.id === 'fur-chair-left')!;
    const chairRight = FURNITURE_ASSETS.find(a => a.id === 'fur-chair-right')!;

    expect(chair).toBeDefined();
    expect(chairUp).toBeDefined();
    expect(chairLeft).toBeDefined();
    expect(chairRight).toBeDefined();

    // 下向き・上向き椅子は同サイズ
    expect(chair.width).toBe(chairUp.width);
    expect(chair.height).toBe(chairUp.height);

    // 左向き・右向き椅子は同サイズ（90度回転）
    expect(chairLeft.width).toBe(chairRight.width);
    expect(chairLeft.height).toBe(chairRight.height);

    // isSeat フラグ
    expect(chair.isSeat).toBe(true);
    expect(chairUp.isSeat).toBe(true);
    expect(chairLeft.isSeat).toBe(true);
    expect(chairRight.isSeat).toBe(true);
  });

  it('テーブル・コーヒーマシンはisSeat=false', () => {
    const table = FURNITURE_ASSETS.find(a => a.id === 'fur-table-round')!;
    const coffee = FURNITURE_ASSETS.find(a => a.id === 'fur-coffee')!;

    expect(table.isSeat).toBe(false);
    expect(coffee.isSeat).toBe(false);
  });

  it('SpaceWizard generateCafe相当のレイアウトで椅子が部屋内に収まる', () => {
    const chairAsset = FURNITURE_ASSETS.find(a => a.id === 'fur-chair')!;
    const chairUpAsset = FURNITURE_ASSETS.find(a => a.id === 'fur-chair-up')!;
    const tableAsset = FURNITURE_ASSETS.find(a => a.id === 'fur-table-round')!;

    const chW = chairAsset.width;   // 22
    const chH = chairAsset.height;  // 35
    const tblScale = 0.7;
    const tblW = Math.round(tableAsset.width * tblScale);  // 46
    const tblH = Math.round(tableAsset.height * tblScale);  // 46
    const gap = 8;
    const spacing = 20;
    const rows = 2, cols = 2;

    const setH = chH + gap + tblH + gap + chH;
    const cellW = Math.max(tblW, chW) + spacing + 20;
    const cellH = setH + spacing;
    const roomW = cols * cellW + 60;
    const roomH = rows * cellH + 60;
    const ox = 0, oy = 0;

    // 全ての椅子が部屋の中に収まることを検証
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = ox + 30 + c * cellW + cellW / 2;
        const baseY = oy + 40 + r * cellH;

        // Top chair bounds
        const c1x = cx - chW / 2;
        const c1y = baseY;
        expect(c1x).toBeGreaterThanOrEqual(ox);
        expect(c1y).toBeGreaterThanOrEqual(oy);
        expect(c1x + chW).toBeLessThanOrEqual(ox + roomW);
        expect(c1y + chH).toBeLessThanOrEqual(oy + roomH);

        // Bottom chair bounds
        const c2x = cx - chW / 2;
        const c2y = baseY + chH + gap + tblH + gap;
        expect(c2x).toBeGreaterThanOrEqual(ox);
        expect(c2y).toBeGreaterThanOrEqual(oy);
        expect(c2x + chairUpAsset.width).toBeLessThanOrEqual(ox + roomW);
        expect(c2y + chairUpAsset.height).toBeLessThanOrEqual(oy + roomH);

        // Table bounds
        const tX = cx - tblW / 2;
        const tY = baseY + chH + gap;
        expect(tX).toBeGreaterThanOrEqual(ox);
        expect(tY).toBeGreaterThanOrEqual(oy);
        expect(tX + tblW).toBeLessThanOrEqual(ox + roomW);
        expect(tY + tblH).toBeLessThanOrEqual(oy + roomH);

        // 椅子とテーブルが重ならないことを検証
        // Top chair bottom < table top
        expect(c1y + chH + gap).toBeLessThanOrEqual(tY + 1);
        // Table bottom < bottom chair top
        expect(tY + tblH + gap).toBeLessThanOrEqual(c2y + 1);
      }
    }
  });

  it('seatDetection用: 椅子のfileIdがCHAIR_FILE_IDSと一致', () => {
    const CHAIR_FILE_IDS = new Set(['fur-chair', 'fur-chair-up', 'fur-chair-left', 'fur-chair-right']);
    const SOFA_FILE_IDS = new Set(['fur-sofa', 'fur-armchair']);

    // 全てのisSeat=trueアセットがいずれかのセットに含まれる
    for (const asset of FURNITURE_ASSETS) {
      if (asset.isSeat) {
        const inChairs = CHAIR_FILE_IDS.has(asset.id);
        const inSofas = SOFA_FILE_IDS.has(asset.id);
        expect(inChairs || inSofas, `isSeat=true asset "${asset.id}" が検出セットに含まれていない`).toBe(true);
      }
    }

    // セットの各IDが実際にアセットに存在する
    for (const id of CHAIR_FILE_IDS) {
      expect(FURNITURE_ASSETS.find(a => a.id === id), `CHAIR_FILE_IDS "${id}" がアセットに存在しない`).toBeDefined();
    }
    for (const id of SOFA_FILE_IDS) {
      expect(FURNITURE_ASSETS.find(a => a.id === id), `SOFA_FILE_IDS "${id}" がアセットに存在しない`).toBeDefined();
    }
  });
});
