# テーマ家具画像生成ガイド

## 概要
各テーマ × 19アイテム = 95画像をGemini Proで事前生成する。

## 画像仕様
- 形式: 透過PNG
- サイズ: 各アイテムに合わせた正方形〜長方形（デスク: 180x102, チェア: 44x70 等）
- 視点: トップダウン（真上から）
- スタイル: フラットデザイン、シンプル
- 背景: 透明

## テーマ別プロンプト

### modern（モダン）
「ミニマルなモダンオフィス、ガラスとスチール、白・グレー・ブルーの配色」

### japanese（和室）
「和風オフィス、畳・木目・盆栽、ベージュ・グリーン・ブラウンの配色」

### cyberpunk（サイバーパンク）
「サイバーパンクオフィス、ネオン発光・ダークメタル、パープル・シアン・ブラックの配色」

### nature（ナチュラル）
「自然素材のオフィス、無垢材・グリーン、ライトウッド・モスグリーンの配色」

### cafe（カフェ）
「カフェ風スペース、暖色照明・レトロ家具、ブラウン・クリーム・オレンジの配色」

## 対象アイテム（19種）
1. desk.png
2. chair-down.png
3. chair-up.png
4. chair-left.png
5. chair-right.png
6. table-round.png
7. table-rect.png
8. sofa.png
9. armchair.png
10. plant.png
11. bookshelf.png
12. whiteboard.png
13. coffee-machine.png
14. monitor.png
15. partition.png
16. rug.png
17. laptop.png
18. printer.png

## 出力先
```
public/assets/furniture-{theme}/{filename}.png
```

## フォールバック
テーマ画像がない場合、`furnitureAssets.ts` が自動的に `furniture-topdown/` にフォールバックする。
