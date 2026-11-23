import Phaser from 'phaser';
// Spirit-realm palette remap (gradient map on luminance), baked once per texture to a canvas texture.
const STOPS: [number, number, number, number][] = [ // lum 0..1 -> rgb
  [0.00, 12, 14, 52], [0.30, 38, 66, 122], [0.58, 88, 168, 188], [0.82, 170, 226, 232], [1.0, 236, 250, 255],
];
function grad(l: number): [number, number, number] {
  for (let i = 1; i < STOPS.length; i++) { const a = STOPS[i - 1], b = STOPS[i]; if (l <= b[0]) { const t = (l - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]; } }
  return [236, 250, 255];
}
export function recolorCanvas(src: CanvasImageSource, w: number, h: number, mix = 0.82): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d')!; ctx.imageSmoothingEnabled = false; ctx.drawImage(src, 0, 0);
  const id = ctx.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue; const r = d[i], g = d[i + 1], b = d[i + 2];
    const lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255; const [R, G, B] = grad(Math.min(1, lum * 1.08));
    d[i] = R * mix + r * (1 - mix) * 0.6; d[i + 1] = G * mix + g * (1 - mix) * 0.8; d[i + 2] = B * mix + b * (1 - mix);
  }
  ctx.putImageData(id, 0, 0); return c;
}
/** Far-realm version of one colour (same remap as recolorCanvas), e.g. for a map's letterbox background. */
export function farColor(hex: string, mix = 0.82): string {
  const n = parseInt(hex.replace('#', ''), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const [R, G, B] = grad(Math.min(1, ((0.3 * r + 0.59 * g + 0.11 * b) / 255) * 1.08));
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + c(R * mix + r * (1 - mix) * 0.6) + c(G * mix + g * (1 - mix) * 0.8) + c(B * mix + b * (1 - mix));
}
/** Get/create far-realm variant of a texture; copies frames (named or numeric). */
export function farTexture(scene: Phaser.Scene, key: string): string {
  const fk = key + '_far'; if (scene.textures.exists(fk)) return fk;
  const tex = scene.textures.get(key); const img = tex.getSourceImage() as HTMLImageElement;
  const c = recolorCanvas(img, img.width, img.height); const nt = scene.textures.addCanvas(fk, c)!;
  for (const name of tex.getFrameNames(false)) { if (name === '__BASE') continue; const f = tex.get(name); nt.add(name, 0, f.cutX, f.cutY, f.cutWidth, f.cutHeight); }
  return fk;
}
