/* ============================================================
   Interactive 3D sculpture — canvas 2D, no dependencies
   A torus knot with orbital rings. Drag to rotate, click to pulse.
   ============================================================ */

(function () {
  "use strict";

  const canvas = document.getElementById("modelCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const host = canvas.closest(".model") || canvas;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const compact = window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = 0;
  let running = false;
  let visible = true;
  let lastDraw = 0;

  const state = {
    rotX: -0.38,
    rotY: 0.65,
    velX: 0,
    velY: 0.0026,
    dragX: 0,
    dragY: 0,
    dragging: false,
    pointerId: null,
    moved: 0,
    pulse: 0,
    pointerX: 0,
    pointerY: 0,
    hover: false,
  };

  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ff5a36";
  const bone = "#f2efe6";

  /* ---------- geometry ---------- */
  const KNOT_POINTS = compact ? 220 : 420;
  const knot = [];
  const P = 2;
  const Q = 3;
  for (let i = 0; i <= KNOT_POINTS; i++) {
    const t = (i / KNOT_POINTS) * Math.PI * 2;
    const r = 2 + Math.cos(Q * t);
    knot.push({
      x: r * Math.cos(P * t),
      y: r * Math.sin(P * t),
      z: Math.sin(Q * t) * 1.25,
    });
  }

  const rings = [0, 1, 2].map((axis) => {
    const pts = [];
    const steps = compact ? 84 : 140;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const u = Math.cos(a) * 3.35;
      const v = Math.sin(a) * 3.35;
      if (axis === 0) pts.push({ x: u, y: v, z: 0 });
      else if (axis === 1) pts.push({ x: u, y: 0, z: v });
      else pts.push({ x: 0, y: u, z: v });
    }
    return pts;
  });

  /* ---------- sizing ---------- */
  function resize() {
    const rect = host.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }

  /* ---------- projection ---------- */
  const project = (p, scale, cx, cy, cosX, sinX, cosY, sinY) => {
    // rotate Y then X
    let x = p.x * cosY - p.z * sinY;
    let z = p.x * sinY + p.z * cosY;
    let y = p.y * cosX - z * sinX;
    z = p.y * sinX + z * cosX;

    const perspective = 760 / (760 + z * scale);
    return {
      x: cx + x * scale * perspective,
      y: cy + y * scale * perspective,
      z,
      k: perspective,
    };
  };

  function render() {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);

    const min = Math.min(width, height);
    const scale = min * 0.128;
    const cx = width / 2;
    const cy = height * 0.515;
    const cosY = Math.cos(state.rotY);
    const sinY = Math.sin(state.rotY);
    const cosX = Math.cos(state.rotX);
    const sinX = Math.sin(state.rotX);

    const pulseScale = 1 + state.pulse * 0.06;
    const s = scale * pulseScale;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // orbital rings, faint
    rings.forEach((ring, idx) => {
      ctx.beginPath();
      ring.forEach((p, i) => {
        const q = project(p, s, cx, cy, cosX, sinX, cosY, sinY);
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      });
      ctx.strokeStyle = idx === 1 ? "rgba(255,90,54,0.13)" : "rgba(242,239,230,0.075)";
      ctx.lineWidth = 0.8;
      ctx.setLineDash(idx === 2 ? [1, 5] : [2, 7]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // project knot
    const pts = knot.map((p) => project(p, s, cx, cy, cosX, sinX, cosY, sinY));

    // far-to-near order for line segments
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      segs.push({ a: pts[i], b: pts[i + 1], z: (pts[i].z + pts[i + 1].z) / 2, i });
    }
    segs.sort((a, b) => a.z - b.z);

    for (const seg of segs) {
      const depth = Math.max(0, Math.min(1, (seg.z + 2.2) / 4.4));
      const alpha = 0.14 + depth * 0.7;
      const isAccent = seg.i % 17 < 2;
      ctx.beginPath();
      ctx.moveTo(seg.a.x, seg.a.y);
      ctx.lineTo(seg.b.x, seg.b.y);
      ctx.strokeStyle = isAccent
        ? `rgba(255,90,54,${0.3 + depth * 0.68})`
        : `rgba(242,239,230,${alpha})`;
      ctx.lineWidth = 0.8 + depth * 1.5;
      ctx.stroke();
    }

    // glow pass on a few segments
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < segs.length; i += compact ? 14 : 7) {
      const seg = segs[i];
      const depth = Math.max(0, Math.min(1, (seg.z + 2.2) / 4.4));
      ctx.beginPath();
      ctx.moveTo(seg.a.x, seg.a.y);
      ctx.lineTo(seg.b.x, seg.b.y);
      ctx.strokeStyle = `rgba(255,90,54,${0.03 + depth * 0.08})`;
      ctx.lineWidth = 5 + depth * 5;
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";

    // nodes
    pts.forEach((p, i) => {
      if (i % (compact ? 12 : 8) !== 0) return;
      const depth = Math.max(0, Math.min(1, (p.z + 2.2) / 4.4));
      const r = 0.6 + depth * 2.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = i % 48 === 0
        ? `rgba(255,90,54,${0.35 + depth * 0.65})`
        : `rgba(242,239,230,${0.18 + depth * 0.55})`;
      ctx.fill();
      if (i % 48 === 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,90,54,${0.04 + depth * 0.08})`;
        ctx.fill();
      }
    });

    // center crosshair
    const crossAlpha = 0.08 + state.pulse * 0.08;
    ctx.strokeStyle = `rgba(242,239,230,${crossAlpha})`;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx - min * 0.24, cy);
    ctx.lineTo(cx + min * 0.24, cy);
    ctx.moveTo(cx, cy - min * 0.24);
    ctx.lineTo(cx, cy + min * 0.24);
    ctx.stroke();

    ctx.restore();
  }

  /* ---------- animation ---------- */
  function animate(now = 0) {
    if (!running) return;
    frame = window.requestAnimationFrame(animate);

    /* 30fps is plenty for a slow orbital sculpture and halves GPU work. */
    if (compact && now - lastDraw < 30) return;
    lastDraw = now;

    if (!state.dragging) {
      state.rotY += state.velY;
      state.rotX += state.velX;
      state.velY += (0.0026 - state.velY) * 0.012;
      state.velX *= 0.96;
      if (Math.abs(state.velX) < 0.00001) state.velX = 0;
    }

    state.pulse *= 0.94;
    if (state.pulse < 0.002) state.pulse = 0;

    render();
  }

  function start() {
    if (running || reduceMotion || document.hidden) return;
    if (compact) {
      /* Phones get a static sculpture that responds to drag/tap. */
      render();
      return;
    }
    running = true;
    frame = window.requestAnimationFrame(animate);
  }

  function stop() {
    running = false;
    window.cancelAnimationFrame(frame);
  }

  function setActive(active) {
    visible = Boolean(active);
    if (visible && !document.hidden) start();
    else {
      stop();
      if (visible) render();
    }
  }

  /* ---------- pointer ---------- */
  canvas.addEventListener("pointerdown", (event) => {
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.dragX = event.clientX;
    state.dragY = event.clientY;
    state.moved = 0;
    state.velX = 0;
    state.velY = 0;
    try { canvas.setPointerCapture(event.pointerId); } catch (error) { /* ignore */ }
  });

  canvas.addEventListener("pointermove", (event) => {
    const dx = event.clientX - state.dragX;
    const dy = event.clientY - state.dragY;

    if (state.dragging) {
      state.rotY += dx * 0.007;
      state.rotX += dy * 0.005;
      state.velY = dx * 0.0007;
      state.velX = dy * 0.0005;
      state.dragX = event.clientX;
      state.dragY = event.clientY;
      state.moved += Math.abs(dx) + Math.abs(dy);
      if (!reduceMotion) render();
    }

    if (finePointer) {
      const rect = host.getBoundingClientRect();
      state.pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      state.pointerY = (event.clientY - rect.top) / rect.height - 0.5;
      state.hover = true;
    }
  });

  function endDrag(event) {
    if (!state.dragging) return;
    state.dragging = false;
    try { canvas.releasePointerCapture(event.pointerId); } catch (error) { /* ignore */ }
    if (state.moved < 7) {
      state.pulse = 1;
      state.velY += 0.045;
      state.velX -= 0.008;
      if (compact) {
        state.rotY += 0.18;
        state.rotX += 0.04;
        render();
        state.pulse = 0;
      } else if (reduceMotion) {
        render();
      }
    }
    state.moved = 0;
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => { state.hover = false; });

  canvas.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      state.pulse = 1;
      if (compact) {
        state.rotY += 0.18;
        state.rotX += 0.04;
        render();
        state.pulse = 0;
      } else if (reduceMotion) {
        render();
      }
    }
  });

  /* ---------- resize + visibility ---------- */
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else if (visible) start();
  });

  if (reduceMotion) {
    // static render; still allow drag redraws
    resize();
  } else {
    start();
  }

  // Hook used by the scene controller
  window.portfolioModel = { setActive };
})();
