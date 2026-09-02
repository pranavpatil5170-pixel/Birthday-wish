/**
 * SCENE 2 — night sky · wishes · shooting stars · drifting lanterns
 *
 * Timeline (seconds, approximate):
 *   0.0  deep indigo sky — last ember of scene 1 fades
 *   1.0  stars wink on one by one
 *   2.3  first shooting star streaks across
 *   4.5  lanterns begin to drift upward
 *   7.0  all lanterns hovering, gentle sway
 *  10.0  wish text fades in, carried by breeze
 *  12.∞  ambient: occasional meteor, soft twinkle, sway hold
 */

/* globals registerScene */

const T = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

import { registerScene } from "./registry.js";

const makeStar = (w, h) => ({
  x: Math.random() * w,
  y: Math.random() * h,
  r: Math.random() * 1.5 + 0.5,
  a: Math.random() * 0.4 + 0.3,
  c: Math.random() > 0.5 ? "255,255,255" : "214,222,255",
});

const scene2 = {
  id: "scene-2",
  title: "Night sky · wishes · lanterns",

  mount(root) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = document.createElement("canvas");
    canvas.className = "s2-sky";
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

    // init stars
    const starCount = Math.round((w * h) / 8000);
    const stars = Array.from({ length: starCount }, () => makeStar(w, h));

    // lanterns: each has a start time, rise speed, and sway phase
    let lanterns = [];
    const totalLanterns = 6;
    for (let i = 0; i < totalLanterns; i++) {
      lanterns.push({
        start: 2.5 + i * 1.2, // staggered start
        life: 6 + Math.random() * 4, // how long it floats
        id: i,
        swayPhase: Math.random() * T,
      });
    }

    let raf = 0, t0 = 0, last = 0;

    const frame = now => {
      raf = requestAnimationFrame(frame);
      if (!t0) { t0 = now; last = now; }
      const t = (now - t0) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ctx.clearRect(0, 0, w, h);

      // stars - fade in over first second, then steady
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      for (const st of stars) {
        const alpha = t < 1 ? t : st.a;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, T);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // shooting star (appears around t=2.3, lasts ~2s)
      if (t > 2.3 && t < 4.5) {
        const progress = (t - 2.3) / 2.2;
        const x = w * (0.2 + progress * 0.9);
        const y = h * 0.15 + Math.sin(t * 6) * 4;
        ctx.strokeStyle = "rgba(255,255,255,1)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 30 * Math.cos(t * 4), y + 15);
        ctx.stroke();
      }

      // lanterns - each drifts upward with gentle sway
      lanterns.forEach(lan => {
        if (t < lan.start) return;
        const nowt = (now - t0) / 1000 - lan.start;
        if (nowt > lan.life) return;
        const p = nowt / lan.life;
        const height = 80 + p * 120;
        const sway = Math.sin(lan.swayPhase + p * T * 0.3) * 0.5;
        const opacity = Math.max(0, 1 - p * 0.8);

        const x = 40 + lan.id * 60 + sway * 20;
        const y = -height;

        ctx.fillStyle = `rgba(255,165,0,${opacity})`; // orange lantern
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.ellipse(x, y, 12 + p * 6, 20 + p * 8, 0, Math.PI * 2, false);
        ctx.fill();

        // lantern stick/handle
        ctx.strokeStyle = `rgba(255,140,0,${opacity})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y + 20 + p * 8);
        ctx.lineTo(x + 5, y + 20 + p * 8 + 30);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // wish text fades in around t=10
      if (t > 9.5 && t < 11.5) {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "bold 36px Cormorant Garamond, serif";
        ctx.textAlign = "center";
        ctx.fillText("make a wish", w / 2, h / 2);
      }
    };

    t0 = performance.now();
    last = t0;
    raf = requestAnimationFrame(frame);

    // cleanup
    const cleanup = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      root.removeChild(canvas);
    };

    return cleanup;
  },
};

registerScene(scene2);