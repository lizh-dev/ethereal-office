// Minimal Modern furniture rendering — clean, intentional, no uncanny valley
// Approach: Simple geometric shapes that read as what they are at a glance

import { Furniture } from '@/types';

const C = {
  // Desk
  deskTop: '#E8E3DD',
  deskBorder: '#D8D2CC',
  deskLeg: '#C5BFB8',
  // Keyboard/items
  keyboard: '#D0CBC5',
  monitor: '#475569',
  screenGlow: '#818CF8',
  // Chair
  chairBack: '#78716C',
  chairSeat: '#A8A29E',
  chairArm: '#8B8580',
  // Table
  tableTop: '#E0DBD5',
  tableBorder: '#CCC7C0',
  // Sofa
  sofaFrame: '#A8A29E',
  sofaCushion: '#D6D3CF',
  sofaPillow: '#C4C0BA',
  // Plant
  leafLight: '#86CEAB',
  leafDark: '#5EAD88',
  pot: '#C2AD95',
  potRim: '#B09A82',
  // General
  white: '#FFFFFF',
  accent: '#6366F1',
  gray100: '#F5F5F4',
  gray200: '#E7E5E4',
  gray300: '#D6D3D1',
  gray400: '#A8A29E',
  gray500: '#78716C',
  gray600: '#57534E',
};

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}

export function drawModernFurniture(ctx: CanvasRenderingContext2D, f: Furniture, isSel: boolean) {
  ctx.save();
  if (f.rotation) {
    const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
    ctx.translate(cx, cy); ctx.rotate(f.rotation * Math.PI / 180); ctx.translate(-cx, -cy);
  }

  ctx.shadowColor = 'rgba(0,0,0,0.06)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;

  switch (f.type) {
    case 'desk': {
      // ── DESK: Rectangle with monitor on top edge, subtle items ──
      // Table surface
      ctx.fillStyle = C.deskTop;
      rr(ctx, f.x, f.y, f.w, f.h, 3); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = C.deskBorder; ctx.lineWidth = 0.8;
      rr(ctx, f.x, f.y, f.w, f.h, 3); ctx.stroke();

      // Monitor (small rect at top center)
      const mw = Math.min(f.w * 0.35, 22);
      const mh = Math.min(f.h * 0.3, 10);
      const mx = f.x + f.w / 2 - mw / 2;
      const my = f.y + 3;
      ctx.fillStyle = C.monitor;
      rr(ctx, mx, my, mw, mh, 1.5); ctx.fill();
      ctx.fillStyle = C.screenGlow;
      rr(ctx, mx + 1, my + 1, mw - 2, mh - 2, 1); ctx.fill();

      // Keyboard area (subtle rect below center)
      const kw = Math.min(f.w * 0.4, 28);
      const kh = Math.min(f.h * 0.2, 8);
      ctx.fillStyle = C.keyboard;
      rr(ctx, f.x + f.w / 2 - kw / 2, f.y + f.h * 0.6, kw, kh, 1.5); ctx.fill();
      break;
    }

    case 'chair': {
      // ── CHAIR: Rounded square with subtle backrest indication ──
      const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
      const s = Math.min(f.w, f.h);

      // Seat (rounded square, not circle)
      ctx.fillStyle = C.chairSeat;
      rr(ctx, cx - s / 2, cy - s / 2, s, s, s * 0.3); ctx.fill();
      ctx.shadowColor = 'transparent';

      // Backrest (thicker top edge)
      ctx.fillStyle = C.chairBack;
      rr(ctx, cx - s * 0.4, cy - s / 2 - 2, s * 0.8, 4, 2); ctx.fill();

      // Seat center dot
      ctx.fillStyle = C.chairArm;
      ctx.beginPath(); ctx.arc(cx, cy + 1, s * 0.12, 0, Math.PI * 2); ctx.fill();
      break;
    }

    case 'sofa': {
      // ── SOFA: Rounded rect with visible cushion divisions ──
      ctx.fillStyle = C.sofaFrame;
      rr(ctx, f.x, f.y, f.w, f.h, 6); ctx.fill();
      ctx.shadowColor = 'transparent';

      // Backrest
      ctx.fillStyle = C.gray500;
      rr(ctx, f.x + 2, f.y, f.w - 4, 6, 3); ctx.fill();

      // Arms
      ctx.fillStyle = C.gray500;
      rr(ctx, f.x, f.y + 2, 5, f.h - 4, 3); ctx.fill();
      rr(ctx, f.x + f.w - 5, f.y + 2, 5, f.h - 4, 3); ctx.fill();

      // Cushions
      const pad = 7;
      const numCush = f.w > 70 ? 2 : 1;
      const cw = (f.w - pad * 2 - (numCush - 1) * 2) / numCush;
      for (let i = 0; i < numCush; i++) {
        ctx.fillStyle = C.sofaCushion;
        rr(ctx, f.x + pad + i * (cw + 2), f.y + 8, cw, f.h - 12, 4); ctx.fill();
      }
      break;
    }

    case 'table': {
      // ── TABLE: Rounded rectangle (not oval) for cleaner look ──
      ctx.fillStyle = C.tableTop;
      rr(ctx, f.x, f.y, f.w, f.h, Math.min(f.w, f.h) * 0.15); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = C.tableBorder; ctx.lineWidth = 0.6;
      rr(ctx, f.x, f.y, f.w, f.h, Math.min(f.w, f.h) * 0.15); ctx.stroke();
      break;
    }

    case 'plant': {
      // ── PLANT: Simple pot + circular foliage ──
      const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
      const r = Math.min(f.w, f.h) * 0.35;

      // Pot
      ctx.fillStyle = C.potRim;
      rr(ctx, cx - r * 0.6, cy + r * 0.3, r * 1.2, 3, 1.5); ctx.fill();
      ctx.fillStyle = C.pot;
      rr(ctx, cx - r * 0.5, cy + r * 0.5, r * 1, r * 0.8, 2); ctx.fill();
      ctx.shadowColor = 'transparent';

      // Foliage
      ctx.fillStyle = C.leafDark;
      ctx.beginPath(); ctx.arc(cx, cy - r * 0.2, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.leafLight;
      ctx.beginPath(); ctx.arc(cx - r * 0.25, cy - r * 0.45, r * 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + r * 0.2, cy - r * 0.35, r * 0.55, 0, Math.PI * 2); ctx.fill();
      break;
    }

    case 'monitor': {
      // ── MONITOR: Dark frame + colored screen ──
      ctx.fillStyle = C.monitor;
      rr(ctx, f.x, f.y, f.w, f.h - 2, 1.5); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = C.screenGlow;
      rr(ctx, f.x + 1.5, f.y + 1.5, f.w - 3, f.h - 5, 1); ctx.fill();
      // Stand
      ctx.fillStyle = C.gray400;
      ctx.fillRect(f.x + f.w / 2 - 2.5, f.y + f.h - 2, 5, 2);
      break;
    }

    case 'whiteboard': {
      ctx.fillStyle = C.white;
      rr(ctx, f.x, f.y, f.w, f.h, 1.5); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = C.gray300; ctx.lineWidth = 0.6;
      rr(ctx, f.x, f.y, f.w, f.h, 1.5); ctx.stroke();
      break;
    }

    case 'printer': {
      ctx.fillStyle = C.gray600;
      rr(ctx, f.x, f.y, f.w, f.h, 3); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = C.gray100;
      rr(ctx, f.x + 2, f.y + 2, f.w - 4, f.h * 0.35, 1.5); ctx.fill();
      ctx.fillStyle = '#4ADE80';
      ctx.beginPath(); ctx.arc(f.x + f.w - 5, f.y + f.h - 5, 1.5, 0, Math.PI * 2); ctx.fill();
      break;
    }

    case 'coffee-machine': {
      ctx.fillStyle = C.gray600;
      rr(ctx, f.x, f.y, f.w, f.h, 4); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#86EFAC';
      rr(ctx, f.x + 3, f.y + 3, f.w - 6, f.h * 0.28, 2); ctx.fill();
      break;
    }

    case 'bookshelf': {
      ctx.fillStyle = '#7C6A54';
      rr(ctx, f.x, f.y, f.w, f.h, 1.5); ctx.fill();
      ctx.shadowColor = 'transparent';
      // Muted books
      const books = ['#A45A5A', '#5A6FA4', '#5A9474', '#B8924A', '#7A62A4', '#5A9494'];
      const bw = Math.max(3.5, (f.w - 3) / books.length - 0.5);
      books.forEach((c, i) => {
        ctx.fillStyle = c;
        rr(ctx, f.x + 1.5 + i * (bw + 0.5), f.y + 1.5, bw, f.h - 3, 0.5); ctx.fill();
      });
      break;
    }

    default: {
      ctx.fillStyle = C.deskTop;
      rr(ctx, f.x, f.y, f.w, f.h, 3); ctx.fill();
      ctx.shadowColor = 'transparent';
    }
  }

  ctx.shadowColor = 'transparent';

  if (isSel) {
    ctx.strokeStyle = C.accent; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    rr(ctx, f.x - 3, f.y - 3, f.w + 6, f.h + 6, 5); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
}
