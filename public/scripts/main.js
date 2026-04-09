/* ============================================
   AssetEye v4 — Dense Cinematic Engine
   ============================================ */
(function () {
  "use strict";
  gsap.registerPlugin(ScrollTrigger);

  const IS_M = window.matchMedia("(max-width:768px)").matches;
  const REDUCED = window.matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* ── Lenis ── */
  const lenis = new Lenis({ lerp: 0.07, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const t = document.querySelector(a.getAttribute("href"));
      if (t) { e.preventDefault(); lenis.scrollTo(t, { duration: 1.2 }); }
    });
  });

  /* ── Progress bar ── */
  const bar = document.querySelector(".scroll-progress");
  if (bar) ScrollTrigger.create({ trigger: document.documentElement, start: "top top", end: "bottom bottom", onUpdate: (s) => { bar.style.width = s.progress * 100 + "%"; } });

  /* ── Cursor ── */
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  if (!IS_M && dot && ring) {
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    document.addEventListener("mousemove", (e) => { gsap.set(dot, { x: e.clientX, y: e.clientY }); rx(e.clientX); ry(e.clientY); });
    document.querySelectorAll("a,button,[data-magnetic],[data-tilt],.proof-card").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("hover"));
    });
  }

  /* ── Magnetics ── */
  document.querySelectorAll("[data-magnetic]").forEach((b) => {
    b.addEventListener("mousemove", (e) => {
      const r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.4, ease: "power2.out" });
    });
    b.addEventListener("mouseleave", () => gsap.to(b, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,.3)" }));
  });

  /* ══════════════════════════════════════════
     FX CANVAS — Drone orb + ambient particles
     ══════════════════════════════════════════ */
  const fxCv = document.getElementById("fx-canvas");
  if (fxCv && !REDUCED) {
    const c = fxCv.getContext("2d");
    let W, H;
    let spiralsReady = false;
    function fxResize() { W = fxCv.width = window.innerWidth; H = fxCv.height = window.innerHeight; if (spiralsReady) buildSpiralPoints(); }
    fxResize(); window.addEventListener("resize", fxResize);

    let pageP = 0, scrollY = 0;
    ScrollTrigger.create({ trigger: document.documentElement, start: "top top", end: "bottom bottom", onUpdate: (s) => { pageP = s.progress; scrollY = s.scroll(); } });

    /* Ambient particles (scroll in world space) */
    const amb = [];
    const AC = IS_M ? 50 : 120;
    for (let i = 0; i < AC; i++) amb.push({ x: Math.random() * 3000, y: Math.random() * 15000, s: Math.random() * 1.5 + 0.3, sp: Math.random() * 0.3 + 0.1, a: Math.random() * 0.12 + 0.02, ph: Math.random() * Math.PI * 2 });

    /* ── Scroll Spiral Lines (drawn on canvas) ── */
    const SPIRALS = [
      { range: [0.12, 0.28], side: "right", amplitude: 0.06, frequency: 3, phase: 0, taper: false, color: "119,185,64", lineWidth: 1.2, points: [] },
      { range: [0.28, 0.46], side: "left", amplitude: 0.09, frequency: 2, phase: Math.PI / 3, taper: false, color: "177,215,148", lineWidth: 1, points: [] },
      { range: [0.72, 0.88], side: "right", amplitude: 0.07, frequency: 4, phase: Math.PI / 2, taper: false, color: "119,185,64", lineWidth: 1.2, points: [] },
      { range: [0.88, 1.0], side: "left", amplitude: 0.1, frequency: 2.5, phase: Math.PI, taper: true, color: "177,215,148", lineWidth: 0.8, points: [] }
    ];
    const SP_N = IS_M ? 60 : 120;

    function buildSpiralPoints() {
      for (const sp of SPIRALS) {
        sp.points = [];
        const baseX = sp.side === "right" ? W * 0.85 : W * 0.15;
        for (let i = 0; i <= SP_N; i++) {
          const t = i / SP_N;
          const amp = sp.taper ? (1 - t * 0.7) : 1;
          const x = baseX + Math.sin(t * Math.PI * 2 * sp.frequency + sp.phase) * (W * sp.amplitude) * amp;
          const y = H * 0.05 + t * H * 0.9;
          sp.points.push({ x, y });
        }
      }
    }
    spiralsReady = true;
    buildSpiralPoints();

    function renderSpirals() {
      for (const sp of SPIRALS) {
        const [rStart, rEnd] = sp.range;
        const localP = (pageP - rStart) / (rEnd - rStart);
        if (localP < -0.05 || localP > 1.05) continue;

        const drawP = Math.max(0, Math.min(1, localP));
        const fadeIn = Math.min(1, localP / 0.15);
        const fadeOut = Math.min(1, (1 - localP) / 0.15);
        const opacity = Math.max(0, Math.min(fadeIn, fadeOut));
        if (opacity < 0.01) continue;

        const pts = sp.points;
        const drawCount = Math.floor(drawP * pts.length);
        if (drawCount < 2) continue;

        c.save();
        c.globalAlpha = opacity * 0.35;
        c.strokeStyle = `rgb(${sp.color})`;
        c.lineWidth = sp.lineWidth;
        c.lineCap = "round";
        c.lineJoin = "round";

        c.beginPath();
        c.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < drawCount; i++) {
          const prev = pts[i - 1], cur = pts[i];
          c.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) / 2, (prev.y + cur.y) / 2);
        }
        c.stroke();

        // Glowing tip dot
        if (drawCount > 1 && drawCount < pts.length) {
          const tip = pts[drawCount - 1];
          const glowR = c.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 14);
          glowR.addColorStop(0, `rgba(${sp.color},${opacity * 0.6})`);
          glowR.addColorStop(1, "rgba(0,0,0,0)");
          c.globalAlpha = 1;
          c.fillStyle = glowR;
          c.beginPath(); c.arc(tip.x, tip.y, 14, 0, Math.PI * 2); c.fill();
        }
        c.restore();
      }
    }

    /* Drone orb state */
    const D = { x: 0, y: 0, tx: 0, ty: 0, op: 0, beam: 0, bAngle: Math.PI / 2, trail: [], pulseR: 0 };

    function droneTarget(p) {
      const cx = W / 2, cy = H / 2;
      if (p < 0.12) { const t = p / 0.12; return { x: cx, y: -40 + (cy * 0.45) * Math.pow(t, 0.5), op: Math.min(t * 4, 1), beam: 0, bAngle: Math.PI / 2 }; }
      if (p < 0.28) { const t = (p - 0.12) / 0.16; return { x: cx + t * W * 0.22, y: cy * 0.35 + Math.sin(t * 5) * 12, op: 1, beam: t > 0.4 ? Math.min((t - 0.4) * 2.5, 1) : 0, bAngle: Math.PI / 2 + 0.2 }; }
      if (p < 0.46) { const t = (p - 0.28) / 0.18; return { x: W * 0.3 + Math.sin(t * 3) * 15, y: cy * 0.38 + Math.cos(t * 2.5) * 10, op: 1, beam: 0.7 + Math.sin(t * 5) * 0.3, bAngle: Math.PI / 2 + Math.sin(t * 2) * 0.4 }; }
      if (p < 0.72) { const t = (p - 0.46) / 0.26; return { x: W * 0.68 + Math.sin(t * Math.PI * 2) * W * 0.12, y: cy * 0.35 + Math.sin(t * Math.PI) * cy * 0.25, op: 1, beam: 0.4 + Math.sin(t * 8) * 0.3, bAngle: Math.PI / 2 + Math.sin(t * 4) * 0.5 }; }
      if (p < 0.88) { const t = (p - 0.72) / 0.16; return { x: cx + Math.sin(t * 3) * 20, y: cy * 0.3 + Math.cos(t * 2) * 8, op: 1 - Math.max(0, (t - 0.7) * 3.3), beam: 0, bAngle: Math.PI / 2 }; }
      { const t = (p - 0.88) / 0.12; return { x: cx, y: cy * 0.35, op: Math.max(0, 1 - t * 3), beam: 0, bAngle: Math.PI / 2 }; }
    }

    let ft = 0;
    function fxRender() {
      c.clearRect(0, 0, W, H);
      ft += 0.003;

      /* Ambient */
      const now = Date.now() * 0.001;
      for (const p of amb) {
        const sy = p.y - scrollY * 0.6;
        if (sy < -10 || sy > H + 10) continue;
        const px = (p.x + Math.sin(now * p.sp + p.ph) * 25) % W;
        c.beginPath(); c.arc(px, sy, p.s, 0, Math.PI * 2);
        c.fillStyle = `rgba(119,185,64,${p.a * 2.5})`; c.fill();
      }

      /* Spiral lines */
      renderSpirals();

      /* Drone */
      const st = droneTarget(pageP);
      D.tx = st.x; D.ty = st.y;
      D.x += (D.tx - D.x) * 0.06;
      D.y += (D.ty - D.y) * 0.06;
      D.op += (st.op - D.op) * 0.08;
      D.beam += (st.beam - D.beam) * 0.06;
      D.bAngle += (st.bAngle - D.bAngle) * 0.06;

      if (D.op < 0.02) { requestAnimationFrame(fxRender); return; }

      /* Trail */
      D.trail.push({ x: D.x, y: D.y, a: 0.4 });
      if (D.trail.length > 30) D.trail.shift();
      for (let i = 0; i < D.trail.length; i++) {
        const t = D.trail[i];
        t.a *= 0.92;
        c.beginPath(); c.arc(t.x, t.y, 3 * (i / D.trail.length), 0, Math.PI * 2);
        c.fillStyle = `rgba(119,185,64,${t.a * D.op})`; c.fill();
      }

      /* Scan beam */
      if (D.beam > 0.05) {
        c.save(); c.translate(D.x, D.y); c.rotate(D.bAngle);
        const bg = c.createRadialGradient(0, 0, 2, 0, 160, 160);
        bg.addColorStop(0, `rgba(177,215,148,${0.18 * D.beam * D.op})`);
        bg.addColorStop(0.6, `rgba(119,185,64,${0.05 * D.beam * D.op})`);
        bg.addColorStop(1, "rgba(119,185,64,0)");
        c.fillStyle = bg; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 160, -0.3, 0.3); c.closePath(); c.fill();
        c.restore();
      }

      /* Drone (top-down quadcopter) */
      const dx = D.x, dy = D.y, dop = D.op;
      const tilt = Math.sin(now * 1.5) * 0.06; // subtle hover wobble
      const rotorAngle = now * 25; // fast spinning rotors

      c.save();
      c.translate(dx, dy);
      c.rotate(tilt);
      c.globalAlpha = dop;

      // Outer glow under the drone
      const og = c.createRadialGradient(0, 0, 0, 0, 0, 45);
      og.addColorStop(0, `rgba(119,185,64,${0.12 * dop})`);
      og.addColorStop(1, "rgba(119,185,64,0)");
      c.fillStyle = og; c.beginPath(); c.arc(0, 0, 45, 0, Math.PI * 2); c.fill();

      // Arms (X pattern)
      const armLen = 18, armW = 2;
      c.strokeStyle = `rgba(177,215,148,${0.7 * dop})`;
      c.lineWidth = armW;
      c.lineCap = "round";
      const armAngles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
      for (const a of armAngles) {
        c.beginPath();
        c.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
        c.lineTo(Math.cos(a) * armLen, Math.sin(a) * armLen);
        c.stroke();
      }

      // Rotors (spinning circles at arm tips)
      for (let i = 0; i < 4; i++) {
        const a = armAngles[i];
        const rx = Math.cos(a) * armLen;
        const ry = Math.sin(a) * armLen;

        // Rotor disc glow
        c.fillStyle = `rgba(177,215,148,${0.08 * dop})`;
        c.beginPath(); c.arc(rx, ry, 10, 0, Math.PI * 2); c.fill();

        // Spinning rotor blades (2 per rotor)
        c.strokeStyle = `rgba(177,215,148,${0.5 * dop})`;
        c.lineWidth = 1.5;
        const rA = rotorAngle + i * 0.5;
        for (let b = 0; b < 2; b++) {
          const ba = rA + b * Math.PI;
          c.beginPath();
          c.moveTo(rx + Math.cos(ba) * -8, ry + Math.sin(ba) * -8);
          c.lineTo(rx + Math.cos(ba) * 8, ry + Math.sin(ba) * 8);
          c.stroke();
        }

        // Motor hub
        c.fillStyle = `rgba(177,215,148,${0.6 * dop})`;
        c.beginPath(); c.arc(rx, ry, 2, 0, Math.PI * 2); c.fill();
      }

      // Central body
      c.fillStyle = `rgba(210,235,190,${0.8 * dop})`;
      c.beginPath();
      c.rect(-6, -4, 12, 8);
      c.fill();

      // Camera lens (front indicator)
      c.fillStyle = `rgba(177,215,148,${0.9 * dop})`;
      c.beginPath(); c.arc(0, 5, 2, 0, Math.PI * 2); c.fill();

      c.globalAlpha = 1;
      c.restore();

      requestAnimationFrame(fxRender);
    }

    fxRender();
  }

  /* ── Scene canvases (How it works backgrounds) ── */
  document.querySelectorAll(".scene-cv").forEach((cv) => {
    const ctx = cv.getContext("2d");
    const sid = parseInt(cv.dataset.sid);
    let w, h;
    function rs() { w = cv.width = cv.offsetWidth; h = cv.height = cv.offsetHeight; }
    rs(); window.addEventListener("resize", rs);

    const pts = [];
    const N = IS_M ? 30 : 70;
    for (let i = 0; i < N; i++) pts.push({ x: Math.random() * 2000, y: Math.random() * 1200, r: Math.random() * 1.5 + 0.3, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.3, a: Math.random() * 0.1 + 0.02, ph: Math.random() * Math.PI * 2 });

    const cols = [{ r: 119, g: 185, b: 64 }, { r: 177, g: 215, b: 148 }, { r: 112, g: 196, b: 69 }];
    const cl = cols[sid] || cols[0];
    let t = 0;

    function anim() {
      ctx.clearRect(0, 0, w, h);
      t += 0.004;

      // Grid
      ctx.strokeStyle = `rgba(${cl.r},${cl.g},${cl.b},0.025)`;
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      // Particles + connections
      for (const p of pts) {
        p.x += p.vx + Math.sin(t + p.ph) * 0.2;
        p.y += p.vy + Math.cos(t * 0.7 + p.ph) * 0.15;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cl.r},${cl.g},${cl.b},${p.a})`; ctx.fill();
      }

      ctx.lineWidth = 0.4;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.strokeStyle = `rgba(${cl.r},${cl.g},${cl.b},${(1 - d / 100) * 0.05})`;
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
      }

      requestAnimationFrame(anim);
    }
    anim();
  });

  /* ══════════════════════════════════
     HERO ENTRANCE
     ══════════════════════════════════ */
  const hTl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.3 });
  hTl
    .to(".hero-eyebrow", { opacity: 1, duration: 0.5 })
    .to(".hero .rt-inner", { y: "0%", duration: 1, stagger: 0.15, ease: "power4.out" }, "-=0.2")
    .to(".hero-sub", { opacity: 1, duration: 0.6 }, "-=0.5")
    .to(".hero-actions", { opacity: 1, duration: 0.5 }, "-=0.3")
    .to(".hero-proof", { opacity: 1, duration: 0.5 }, "-=0.2")
    .to(".scroll-cue", { opacity: 1, duration: 0.4 }, "-=0.1");

  // Hero parallax out
  gsap.to(".hero-content", { yPercent: -25, autoAlpha: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "70% top", scrub: true } });
  gsap.to(".scroll-cue", { autoAlpha: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "8% top", end: "20% top", scrub: true } });

  /* ══════════════════════════════════
     PROBLEM
     ══════════════════════════════════ */
  const pTl = gsap.timeline({ scrollTrigger: { trigger: ".section-problem", start: "top 60%", toggleActions: "play none none none" }, defaults: { ease: "power3.out" } });
  pTl
    .to(".section-problem .label", { opacity: 1, duration: 0.4 })
    .to(".section-problem .rt-inner", { y: "0%", duration: 0.8, stagger: 0.12 }, "-=0.15")
    .to(".section-problem .sub-text", { opacity: 1, y: 0, duration: 0.6 }, "-=0.3")
    .to(".p-stat", { opacity: 1, x: 0, duration: 0.7, stagger: 0.18 }, "-=0.2");

  document.querySelectorAll(".p-stat-fill").forEach((f) => {
    gsap.to(f, { width: f.dataset.w + "%", duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: f, start: "top 88%", toggleActions: "play none none none" } });
  });

  /* ══════════════════════════════════
     CAPABILITIES — Staggered card entrance + tilt
     ══════════════════════════════════ */
  const capTl = gsap.timeline({ scrollTrigger: { trigger: ".section-caps", start: "top 65%", toggleActions: "play none none none" }, defaults: { ease: "power3.out" } });
  capTl
    .to(".caps-header .label", { opacity: 1, duration: 0.4 })
    .to(".caps-header .rt-inner", { y: "0%", duration: 0.8, stagger: 0.12 }, "-=0.15");

  ScrollTrigger.batch(".cap-card", {
    start: "top 88%",
    onEnter: (els) => {
      gsap.from(els, { y: 60, rotationX: -8, autoAlpha: 0, duration: 0.9, stagger: 0.15, ease: "power3.out", transformPerspective: 1000 });
    },
  });

  // Card tilt + glow
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      gsap.to(card, { rotateY: (px - 0.5) * 12, rotateX: -(py - 0.5) * 12, duration: 0.4, ease: "power2.out", transformPerspective: 800 });
      const glow = card.querySelector(".cap-card-glow,.proof-glow");
      if (glow) { glow.style.setProperty("--mx", px * 100 + "%"); glow.style.setProperty("--my", py * 100 + "%"); }
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.8, ease: "elastic.out(1,.4)" });
    });
  });

  /* ══════════════════════════════════
     HOW IT WORKS — Pinned scene transitions
     ══════════════════════════════════ */
  const howSection = document.querySelector(".section-how");
  const scenes = gsap.utils.toArray(".how-scene");
  const howDots = document.querySelectorAll(".how-dot");

  if (howSection && scenes.length === 3) {
    // Stack scenes absolutely
    gsap.set(scenes, { position: "absolute", inset: 0 });
    gsap.set(scenes[0], { autoAlpha: 1, visibility: "visible" });

    const howTl = gsap.timeline({
      scrollTrigger: {
        trigger: howSection,
        start: "top top",
        end: () => "+=" + window.innerHeight * 4,
        pin: ".how-pin",
        scrub: 1,
        onUpdate: (self) => {
          const idx = Math.min(2, Math.floor(self.progress * 3));
          howDots.forEach((d, i) => d.classList.toggle("active", i === idx));
        },
        onEnter: () => gsap.to(".how-dots", { opacity: 1, duration: 0.3 }),
        onLeave: () => gsap.to(".how-dots", { opacity: 0, duration: 0.3 }),
        onEnterBack: () => gsap.to(".how-dots", { opacity: 1, duration: 0.3 }),
        onLeaveBack: () => gsap.to(".how-dots", { opacity: 0, duration: 0.3 }),
      },
    });

    // Scene 0 → 1
    howTl
      .to(scenes[0].querySelector(".how-scene-content"), { autoAlpha: 0, y: -30, duration: 0.12 }, 0.25)
      .to(scenes[0].querySelector(".how-scene-visual"), { autoAlpha: 0, scale: 0.9, duration: 0.1 }, 0.28)
      .set(scenes[0], { autoAlpha: 0 }, 0.32)
      .set(scenes[1], { autoAlpha: 1, visibility: "visible" }, 0.32)
      .fromTo(scenes[1].querySelector(".how-scene-content"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.15 }, 0.33)
      .fromTo(scenes[1].querySelector(".how-scene-visual"), { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, scale: 1, duration: 0.15 }, 0.35)

    // Scene 1 → 2
      .to(scenes[1].querySelector(".how-scene-content"), { autoAlpha: 0, y: -30, duration: 0.12 }, 0.58)
      .to(scenes[1].querySelector(".how-scene-visual"), { autoAlpha: 0, scale: 0.9, duration: 0.1 }, 0.61)
      .set(scenes[1], { autoAlpha: 0 }, 0.65)
      .set(scenes[2], { autoAlpha: 1, visibility: "visible" }, 0.65)
      .fromTo(scenes[2].querySelector(".how-scene-content"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.15 }, 0.66)
      .fromTo(scenes[2].querySelector(".how-scene-visual"), { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, scale: 1, duration: 0.15 }, 0.68);
  }

  /* ══════════════════════════════════
     PROOF
     ══════════════════════════════════ */
  const prTl = gsap.timeline({ scrollTrigger: { trigger: ".section-proof", start: "top 65%", toggleActions: "play none none none" }, defaults: { ease: "power3.out" } });
  prTl
    .to(".section-proof .label", { opacity: 1, duration: 0.4 })
    .to(".section-proof .rt-inner", { y: "0%", duration: 0.8, stagger: 0.12 }, "-=0.15");

  ScrollTrigger.batch(".proof-card", {
    start: "top 88%",
    onEnter: (els) => gsap.from(els, { y: 50, rotationX: -10, autoAlpha: 0, duration: 0.8, stagger: 0.1, ease: "power3.out", transformPerspective: 800 }),
  });

  // Counters
  function counter(el) {
    if (el.dataset.raw) return;
    const target = parseFloat(el.dataset.count), prefix = el.dataset.prefix || "", suffix = el.dataset.suffix || "", dec = parseInt(el.dataset.decimals) || 0;
    const obj = { v: 0 };
    gsap.to(obj, { v: target, duration: 2.2, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" }, onUpdate: () => { el.textContent = prefix + (target >= 1000 ? Math.round(obj.v).toLocaleString() : obj.v.toFixed(dec)) + suffix; } });
  }
  document.querySelectorAll(".p-stat-num,.proof-num").forEach(counter);

  /* ══════════════════════════════════
     CTA
     ══════════════════════════════════ */
  const ctTl = gsap.timeline({ scrollTrigger: { trigger: ".section-cta", start: "top 70%", toggleActions: "play none none none" } });
  ctTl
    .to(".cta-headline .rt-inner", { y: "0%", duration: 0.9, stagger: 0.15, ease: "power4.out" })
    .to(".cta-sub", { opacity: 1, y: 0, duration: 0.6 }, "-=0.4");

  /* ── Nav hide ── */
  const nav = document.querySelector(".nav");
  if (nav) {
    let ls = 0;
    ScrollTrigger.create({ onUpdate: (s) => {
      const sc = s.scroll();
      gsap.to(nav, { yPercent: sc > ls && sc > 300 ? -110 : 0, duration: 0.35, ease: "power2.inOut" });
      ls = sc;
    }});
  }

  /* ── Spline 3D Drone in Hero — loaded separately ── */

  /* ── Refresh ── */
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
