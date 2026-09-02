/**
 * SCENE 3 — celebration · balloons · confetti · birthday joy
 *
 * Timeline (seconds, approximate):
 *   0.0  sky clears from scene 2 — soft night blue
 *   1.0  first balloon floats up from ground
 *   2.5  balloons multiply, rise at different speeds
 *   4.0  confetti bursts from center, bursts fade
 *   5.5  "happy birthday" text fades in
 *   7.0  balloons reach top, gently bob
 *  9.∞  ambient hold: slow drift, occasional pop, text glow
 */

/* globals registerScene */

const T = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

import { registerScene } from "./registry.js";

const makeBalloon = (x, y, color, startTime) => ({
  x, y,
  color,
  size: Math.random() * 25 + 20,
  riseSpeed: Math.random() * 30 + 20, // px/s
  startTime,
  bobPhase: Math.random() * T,
  popped: false,
});

const makeConfettiBurst = (cx, cy, color, now) => {
  const pieces = [];
  const count = 15;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * T;
    const speed = Math.random() * 200 + 100; // px/s
    const size = Math.random() * 8 + 4;
    pieces.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      color,
      life: 0,
      maxLife: Math.random() * 600 + 400, // ms
    });
  }
  return pieces;
};

const scene3 = {
  id: "scene-3",
  title: "Celebration · balloons · confetti · birthday joy",

  mount(root) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = document.createElement("canvas");
    canvas.className = "s3-canvas";
    canvas.style.position = "absolute";
    canvas.style inset = "0";
    canvas.style.zIndex = "1";
    root.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    let w = 0, h = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // balloons
    let balloons = [];
    const totalBalloons = 8;
    const groundY = h - 60;
    for (let i = 0; i < totalBalloons; i++) {
      const x = 80 + (i / (totalBalloons - 1)) * (w - 160);
      const startTime = 1.0 + i * 0.3;
      balloons.push(makeBalloon(x, groundY, `hsl(${60 + i * 30}, 70%, 60%)`, startTime));
    }

    // confetti bursts array
    let bursts = [];

    let raf = 0, t0 = 0, last = 0;

    const frame = now => {
      raf = requestAnimationFrame(frame);
      if (!t0) { t0 = now; last = now; }
      const t = (now - t0) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ctx.clearRect(0, 0, w, h);

      // sky background - gradient from dark night to soft blue
      const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
      skyGradient.addColorStop(0, "#1a0f30");
      skyGradient.addColorStop(1, "#241a40");
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, w, h);

      // draw and update balloons
      balloons = balloons.filter(b => !b.popped);

      balloons.forEach((b, i) => {
        if (t < b.startTime) return;

        const nowt = t - b.startTime;
        if (nowt > 6) { // balloon has been rising for 6s then pops or floats up
          b.popped = true;
          return;
        }

        const progress = nowt / 6; // 0 → 1 over 6 seconds
        const y = groundY - progress * 200; // rises 200px
        const bob = Math.sin(t * 2 + b.bobPhase) * 5; // gentle bob

        // draw balloon
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, y + bob, b.size, 0, T);
        ctx.fill();

        // draw balloon knot below
        ctx.fillStyle = "#8b4513";
        ctx.beginPath();
        ctx.arc(b.x, y + b.size + 10 + bob, 4, 0, T);
        ctx.fill();

        // draw ribbon strands
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.x, y + b.size + 10);
        ctx.lineTo(b.x, y + b.size + 50);
        ctx.stroke();
      });

      // spawn confetti bursts occasionally
      if (Math.random() < 0.01 && bursts.length < 5) {
        bursts.push(makeConfettiBurst(w / 2, h / 2, "rgba(255,255,255,0.9)", now));
      }

      // update and draw confetti
      bursts = bursts.filter(burst => burst.life < burst.maxLife);
      bursts.forEach(burst => {
        burst.life += dt * 1000;
        burst.forEach(p => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          ctx.globalAlpha = Math.max(0, 1 - burst.life / burst.maxLife);
          ctx.fill();
        });
      });
      ctx.globalAlpha = 1;

      // "happy birthday" text fades in around t=5.5
      if (t > 5.2 && t < 7.5) {
        const alpha = Math.sin((t - 5.2) * Math.PI / 2.3);
        ctx.fillStyle = `rgba(255,215,0,${alpha})`;
        ctx.font = "bold 48px Cormorant Garamond, serif";
        ctx.textAlign = "center";
        ctx.fillText("happy birthday", w / 2, h / 2 - 20);
        ctx.font = "24px Cormorant Garamond, serif";
        ctx.fillText("✦ ✦ ✦", w / 2, h / 2 + 40);
      }
    };

    t0 = performance.now();
    last = t0;
    raf = requestAnimationFrame(frame);

    const cleanup = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      root.removeChild(canvas);
    };

    return cleanup;
  },
};

registerScene(scene3);