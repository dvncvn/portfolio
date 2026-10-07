"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

type Vec3 = [number, number, number];
type Face = number[];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const subtract = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = (v: Vec3): Vec3 => { const length = Math.hypot(...v); return v.map(n => n / length) as Vec3; };
const phi = (1 + Math.sqrt(5)) / 2;
const raw: Vec3[] = [
  [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
  [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
  [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
];
const triangles: Face[] = [];
for (let a = 0; a < raw.length; a++) {
  for (let b = a + 1; b < raw.length; b++) {
    for (let c = b + 1; c < raw.length; c++) {
      if ([subtract(raw[a], raw[b]), subtract(raw[a], raw[c]), subtract(raw[b], raw[c])].every(edge => Math.abs(dot(edge, edge) - 4) < 0.001)) {
        const normal = cross(subtract(raw[b], raw[a]), subtract(raw[c], raw[a]));
        triangles.push(dot(normal, raw[a]) > 0 ? [a, b, c] : [a, c, b]);
      }
    }
  }
}
const front = triangles[0].map(index => raw[index]);
const center = front.reduce<Vec3>((sum, v) => [sum[0] + v[0] / 3, sum[1] + v[1] / 3, sum[2] + v[2] / 3], [0, 0, 0]);
const forward = normalize(center);
const up = normalize(subtract(front[0], center));
const right = cross(up, forward);
const vertices = raw.map(normalize).map<Vec3>(v => [dot(v, right), dot(v, up), dot(v, forward)]);
const cube: Vec3[] = [[-1,-1,-1], [1,-1,-1], [1,1,-1], [-1,1,-1], [-1,-1,1], [1,-1,1], [1,1,1], [-1,1,1]].map(v => v.map(n => n * 0.68) as Vec3);
const squares = [[0,3,2,1], [4,5,6,7], [0,1,5,4], [3,7,6,2], [0,4,7,3], [1,2,6,5]];

function rotate([x, y, z]: Vec3, ax: number, ay: number, az: number): Vec3 {
  const y1 = y * Math.cos(ax) - z * Math.sin(ax);
  const z1 = y * Math.sin(ax) + z * Math.cos(ax);
  const x2 = x * Math.cos(ay) + z1 * Math.sin(ay);
  const z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);
  return [x2 * Math.cos(az) - y1 * Math.sin(az), x2 * Math.sin(az) + y1 * Math.cos(az), z2];
}

export type CharacterDieHandle = { roll: () => Promise<void> };

export const CharacterDie = forwardRef<CharacterDieHandle, { sides: number }>(function CharacterDie({ sides }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const render = useRef<(x: number, y: number, z: number, lift: number) => void>(() => {});
  const frame = useRef(0);
  const complete = useRef<(() => void) | null>(null);

  useEffect(() => {
    const node = canvas.current;
    const context = node?.getContext('2d');
    if (!node || !context) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    node.width = 198 * dpr;
    node.height = 216 * dpr;
    context.scale(dpr * 1.5, dpr * 1.5);
    render.current = (ax, ay, az, lift) => {
      context.clearRect(0, 0, 132, 144);
      const points = (sides === 6 ? cube : vertices).map(v => rotate(v, ax, ay, az));
      const project = ([x, y, z]: Vec3) => [66 + x * 48 * 4 / (4 - z), 72 - y * 48 * 4 / (4 - z) - lift];
      const faces = (sides === 6 ? squares : triangles).map(indices => {
        const face = indices.map(index => points[index]);
        const normal = normalize(cross(subtract(face[1], face[0]), subtract(face[2], face[0])));
        return { face, normal, depth: face.reduce((sum, v) => sum + v[2], 0) / face.length };
      }).sort((a, b) => a.depth - b.depth);
      for (const { face, normal } of faces) {
        if (dot(normal, subtract([0, 0, 4], face[0])) <= 0) continue;
        const light = Math.max(0, dot(normal, normalize([-0.4, 0.7, 1])));
        context.beginPath();
        face.forEach((v, index) => { const [x, y] = project(v); if (index === 0) context.moveTo(x, y); else context.lineTo(x, y); });
        context.closePath();
        context.fillStyle = `rgb(${29 + light * 23}, ${22 + light * 20}, ${37 + light * 29})`;
        context.fill();
        context.strokeStyle = `rgba(197,181,208,${0.35 + light * 0.45})`;
        context.lineWidth = 0.8;
        context.stroke();
      }
    };
    render.current(0, 0, 0, 0);
    return () => {
      cancelAnimationFrame(frame.current);
      complete.current?.();
      complete.current = null;
      render.current = () => {};
    };
  }, [sides]);

  useImperativeHandle(ref, () => ({
    roll: () => new Promise<void>(resolve => {
      cancelAnimationFrame(frame.current);
      complete.current?.();
      complete.current = resolve;
      const start = performance.now();
      const direction = Math.random() < 0.5 ? -1 : 1;
      const draw = (now: number) => {
        const t = Math.min((now - start) / 1150, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        render.current(ease * Math.PI * 4, ease * Math.PI * 2 * direction,
          Math.sin(t * Math.PI) * 0.5 * direction, Math.sin(t * Math.PI) * 8);
        if (t < 1) frame.current = requestAnimationFrame(draw);
        else {
          render.current(0, 0, 0, 0);
          complete.current = null;
          resolve();
        }
      };
      frame.current = requestAnimationFrame(draw);
    }),
  }), []);

  return <canvas ref={canvas} aria-hidden="true" style={{ width: 198, height: 216, display: 'block' }} />;
});
