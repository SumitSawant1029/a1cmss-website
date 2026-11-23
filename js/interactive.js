/* =========================================================
   A-1 Cleaning Machines – interactive extras
   ========================================================= */
(() => {
  "use strict";
  const WA_NUMBER = "917738395656";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---------------------------------------------------------
     1. Counting numbers
     --------------------------------------------------------- */
  const fmt = (n, el) => (el.dataset.sep ? n.toLocaleString("en-IN") : String(n));
  function countUp(el) {
    const end = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = fmt(end, el) + suffix; return; }
    const t0 = performance.now();
    const dur = 1700;
    const step = (now) => {
      const p = clamp((now - t0) / dur);
      el.textContent = fmt(Math.round(end * easeOut(p)), el) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const counters = [...document.querySelectorAll("[data-count]")];
  counters.forEach((el) => { el.textContent = "0" + (el.dataset.suffix || ""); });
  setTimeout(() => counters.filter((el) => !("onView" in el.dataset)).forEach(countUp), 650);
  const viewCounters = counters.filter((el) => "onView" in el.dataset);
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { countUp(e.target); io.unobserve(e.target); }
    }), { threshold: 0.6 });
    viewCounters.forEach((el) => io.observe(el));
  } else viewCounters.forEach(countUp);

  /* ---------------------------------------------------------
     2. Hero: rub the dusty floor to clean it
     --------------------------------------------------------- */
  const canvas = document.getElementById("wipeCanvas");
  if (canvas && canvas.getContext) {
    const fig = canvas.parentElement;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const hint = document.getElementById("wipeHint");
    const label = hint.querySelector(".wipe__do");
    const pctEl = document.getElementById("wipePct");
    const bubbleBox = document.getElementById("wipeBubbles");
    let W = 0, H = 0, dpr = 1, R = 40;
    let started = false, done = false, auto = false, last = null, active = false;
    let lastSample = 0, lastBubble = 0, demoTimer = null;

    // deterministic random so the dust looks the same each load
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

    function drawGrime() {
      seed = 7;
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(118, 98, 66, 0.86)";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 150; i++) {                         // dust patches
        const x = rnd() * W, y = rnd() * H, r = (0.02 + rnd() * 0.11) * W;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const dark = rnd() < 0.55;
        g.addColorStop(0, dark ? `rgba(58,42,24,${0.25 + rnd() * 0.3})` : `rgba(170,150,115,${0.2 + rnd() * 0.25})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      ctx.lineCap = "round";                                   // tyre marks & scuffs
      for (let i = 0; i < 22; i++) {
        ctx.strokeStyle = `rgba(35,26,16,${0.12 + rnd() * 0.18})`;
        ctx.lineWidth = (4 + rnd() * 12) * dpr;
        ctx.beginPath();
        const y = H * (0.45 + rnd() * 0.55);
        ctx.moveTo(-20, y);
        ctx.bezierCurveTo(W * 0.3, y + (rnd() - 0.5) * H * 0.3, W * 0.6, y + (rnd() - 0.5) * H * 0.3, W + 20, y + (rnd() - 0.5) * H * 0.2);
        ctx.stroke();
      }
      for (let i = 0; i < 1800; i++) {                        // specks
        ctx.fillStyle = rnd() < 0.7 ? `rgba(45,32,18,${0.3 + rnd() * 0.4})` : `rgba(210,195,165,${0.3 + rnd() * 0.3})`;
        ctx.beginPath();
        ctx.arc(rnd() * W, rnd() * H, (0.4 + rnd() * 1.8) * dpr, 0, 6.283);
        ctx.fill();
      }
      // "CLEAN ME" written by a finger in the dust
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.translate(W * 0.5, H * 0.56);
      ctx.rotate(-0.07);
      ctx.font = `800 ${Math.round(W * 0.115)}px "Barlow Condensed", "Arial Narrow", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillText("CLEAN ME", 0, 0);
      ctx.restore();
    }

    function resize() {
      if (done) return;
      const w = fig.offsetWidth, h = fig.offsetHeight;
      if (!w || !h) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const nw = Math.round(w * dpr), nh = Math.round(h * dpr);
      if (nw === W && nh === H) return;
      W = canvas.width = nw;
      H = canvas.height = nh;
      R = Math.max(26 * dpr, W * 0.075);
      drawGrime();
      started = false;
      setLabel(window.matchMedia("(pointer: coarse)").matches ? "Swipe sideways to clean the floor" : "Rub the floor to clean it", "");
    }

    function setLabel(main, pct) {
      label.textContent = main;
      pctEl.textContent = pct;
    }

    function dab(x, y) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.55, "rgba(0,0,0,0.85)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, R, 0, 6.283);
      ctx.fill();
    }

    function eraseTo(x, y) {
      ctx.globalCompositeOperation = "destination-out";
      if (!last) { dab(x, y); last = { x, y }; return; }
      const dx = x - last.x, dy = y - last.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(dist / (R * 0.35)));
      for (let i = 1; i <= steps; i++) dab(last.x + (dx * i) / steps, last.y + (dy * i) / steps);
      last = { x, y };
    }

    function bubble(px, py, big) {
      if (reduceMotion) return;
      const b = document.createElement("i");
      const s = (big ? 14 : 8) + Math.random() * (big ? 26 : 14);
      b.style.cssText = `left:${px}%;top:${py}%;bottom:auto;width:${s}px;height:${s}px;` +
        `--dx:${(Math.random() - 0.5) * 80}px;--rise:${(big ? 200 : 90) + Math.random() * 160}px;--dur:${1.4 + Math.random() * 1.4}s`;
      bubbleBox.appendChild(b);
      setTimeout(() => b.remove(), 3000);
    }

    function progress(force) {
      const now = performance.now();
      if (!force && now - lastSample < 220) return;
      lastSample = now;
      const data = ctx.getImageData(0, 0, W, H).data;
      const stride = 12;
      let clean = 0, total = 0;
      for (let y = 0; y < H; y += stride) {
        for (let x = 0; x < W; x += stride) {
          total++;
          if (data[(y * W + x) * 4 + 3] < 60) clean++;
        }
      }
      const pct = Math.round((clean / total) * 100);
      setLabel(pct < 30 ? "Keep going…" : pct < 50 ? "Almost there!" : "Nearly spotless!", `Floor cleaned ${pct}%`);
      if (pct >= 60) finish();
    }

    function finish() {
      if (done) return;
      done = true;
      canvas.classList.add("is-done");
      fig.classList.remove("is-clean");
      void fig.offsetWidth;
      fig.classList.add("is-clean");
      for (let i = 0; i < 26; i++) setTimeout(() => bubble(5 + Math.random() * 90, 55 + Math.random() * 45, true), i * 45);
      setLabel("✨ Spotless — that's the A-1 finish!", "");
      setTimeout(() => {
        hint.classList.add("is-hidden");
        setTimeout(() => {
          setLabel("Make it dusty again", "↺ Tap to replay");
          hint.querySelector(".wipe__hand").textContent = "↺";
          hint.classList.remove("is-hidden");
        }, 900);
      }, 2600);
    }

    function reset() {
      done = false;
      started = false;
      last = null;
      W = H = 0;
      canvas.classList.remove("is-done");
      fig.classList.remove("is-clean");
      hint.querySelector(".wipe__hand").textContent = "👆";
      resize();
    }

    const toCanvas = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H,
               px: ((e.clientX - r.left) / r.width) * 100, py: ((e.clientY - r.top) / r.height) * 100 };
    };

    function onMove(e) {
      if (done || auto) return;
      if (e.pointerType !== "mouse" && !active) return;
      const p = toCanvas(e);
      if (!started) { started = true; clearTimeout(demoTimer); }
      eraseTo(p.x, p.y);
      const now = performance.now();
      if (now - lastBubble > 110) { lastBubble = now; bubble(p.px, p.py, false); }
      progress(false);
    }
    canvas.addEventListener("pointerdown", (e) => { active = true; last = null; onMove(e); });
    canvas.addEventListener("pointermove", onMove);
    ["pointerup", "pointercancel", "pointerleave"].forEach((t) => canvas.addEventListener(t, () => { active = false; last = null; }));

    // Button: clean it for me (zig-zag like a scrubber), or replay when done
    function autoClean(duration, rows, untilPct) {
      auto = true;
      last = null;
      const t0 = performance.now();
      const pts = [];
      for (let r = 0; r <= rows; r++) {
        const y = H * (0.08 + (0.84 * r) / rows);
        pts.push(r % 2 ? { x: W * 1.05, y } : { x: -W * 0.05, y });
      }
      const seg = (t) => {
        const f = t * (pts.length - 1);
        const i = Math.min(pts.length - 2, Math.floor(f));
        const k = f - i;
        return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * k, y: pts[i].y + (pts[i + 1].y - pts[i].y) * k };
      };
      return new Promise((resolve) => {
        const step = (now) => {
          const t = clamp((now - t0) / duration) * (untilPct || 1);
          const p = seg(easeInOut(t));
          eraseTo(p.x, p.y);
          if (Math.random() < 0.3) bubble((p.x / W) * 100, (p.y / H) * 100, false);
          if (t < (untilPct || 1)) requestAnimationFrame(step);
          else { auto = false; last = null; resolve(); }
        };
        requestAnimationFrame(step);
      });
    }
    hint.addEventListener("click", () => {
      if (done) { reset(); return; }
      if (auto) return;
      started = true;
      clearTimeout(demoTimer);
      setLabel("Cleaning…", "");
      autoClean(1700, 5).then(() => progress(true));
    });

    // Teaching demo: if nobody touches it, wipe one stripe to show the idea
    function scheduleDemo() {
      if (reduceMotion) return;
      demoTimer = setTimeout(() => {
        if (started || done) return;
        const t0 = performance.now();
        auto = true;
        last = null;
        const y = H * 0.82;
        const step = (now) => {
          const t = clamp((now - t0) / 900);
          eraseTo(W * (0.15 + 0.4 * easeInOut(t)), y + Math.sin(t * 9) * H * 0.02);
          if (t < 1) requestAnimationFrame(step);
          else { auto = false; last = null; }
        };
        requestAnimationFrame(step);
      }, 4200);
    }

    if ("ResizeObserver" in window) new ResizeObserver(() => { if (!started) resize(); }).observe(fig);
    resize();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!started && !done) { drawGrime(); } });
    scheduleDemo();
  }

  /* ---------------------------------------------------------
     3. Scrubber drives across the floor as you scroll
     --------------------------------------------------------- */
  const floor = document.getElementById("scrubFloor");
  if (floor) {
    const wheels = [...floor.querySelectorAll(".scrub__wheel")];
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = floor.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -200 || r.top > vh + 200) return;
      const p = clamp((vh - r.top) / (vh + r.height));       // 0 when entering, 1 when leaving
      const x = clamp((p - 0.12) / 0.62) * 112;               // % across the floor
      floor.style.setProperty("--x", x.toFixed(2) + "%");
      wheels.forEach((w) => w.style.setProperty("--rot", (x * 16).toFixed(1) + "deg"));
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ---------------------------------------------------------
     4. Machine finder
     --------------------------------------------------------- */
  const app = document.getElementById("finder-app");
  if (app) {
    const steps = [...app.querySelectorAll(".finder__step")];
    const order = ["area", "floor", "mode", "result"];
    const bar = document.getElementById("finderBar");
    const back = document.getElementById("finderBack");
    const answers = {};
    let idx = 0;

    const LABEL = {
      area: { small: "Under 2,000 sq ft", medium: "2,000–20,000 sq ft", large: "Over 20,000 sq ft" },
      floor: { hard: "Tiles / marble / granite", concrete: "Concrete / industrial", carpet: "Carpets", mess: "Dust, debris & spills" },
    };

    function recommend(a, f) {
      if (f === "carpet") return { title: "Single Disc Machine + Carpet Kit", machine: "Single Disc Machine", img: "images/product-single-disc.jpg",
        why: "A low-speed single disc with a carpet shampoo kit lifts deep-down dirt from carpets. Pair it with a wet & dry vacuum to extract the water quickly." };
      if (f === "mess" && a === "large") return { title: "Ride-On Sweeper", machine: "Ride-On Machine", img: "images/product-ride-on.jpg",
        why: "For big areas full of dust and debris, a ride-on sweeper clears thousands of square feet an hour — add a wet & dry vacuum for spills and corners." };
      if (f === "mess") return { title: "Industrial Wet & Dry Vacuum", machine: "Industrial Vacuum Cleaner", img: "images/product-industrial-vacuum.jpg",
        why: "A twin-motor wet & dry vacuum picks up fine dust, debris, liquids and slurry in one machine — perfect for workshops and busy floors." };
      if (a === "large") return { title: "Ride-On Scrubber-Dryer", machine: "Ride-On Machine", img: "images/product-ride-on.jpg",
        why: `Scrubs and dries in a single pass and covers up to 4,000 m² an hour — the fastest way to keep large ${f === "concrete" ? "concrete" : "hard"} floors spotless.` };
      if (a === "medium" && f === "concrete") return { title: "Compact Ride-On Scrubber", machine: "Ride-On Machine", img: "images/product-ride-on.jpg",
        why: "A compact ride-on scrubber handles heavy-duty concrete with less effort than walk-behind machines, and fits through doorways and aisles." };
      if (a === "medium") return { title: "Walk-Behind Scrubber-Dryer", machine: "Walk-Behind Scrubber", img: "images/rental-delivery.jpg",
        why: "A walk-behind scrubber-dryer cleans and dries tiles, marble and granite in one go — floors are safe to walk on almost immediately." };
      return { title: "Single Disc Machine", machine: "Single Disc Machine", img: "images/product-single-disc.jpg",
        why: f === "concrete" ? "A heavy-duty single disc with a stiff brush scrubs smaller concrete areas — add a wet & dry vacuum to pick up the slurry."
                              : "Scrubs, polishes and buffs tiles, marble and granite — the most versatile machine for smaller spaces, with optional crystallisation for marble shine." };
    }

    const MODE_NOTE = {
      Buy: " Every machine comes with an on-site demo, operator training and optional AMC.",
      Rent: " Available on daily, weekly or monthly rental — delivered and maintained by us.",
      "Not sure": " Not sure yet? We'll arrange a free on-site demo so you can decide.",
    };

    function show(next, backwards) {
      steps.forEach((s) => s.classList.remove("is-active", "is-back"));
      const el = steps[next];
      if (backwards) el.classList.add("is-back");
      el.classList.add("is-active");
      idx = next;
      bar.style.width = [8, 40, 72, 100][next] + "%";
      back.hidden = next === 0 || next === 3;
    }

    function confetti() {
      if (reduceMotion) return;
      const colors = ["#f5b301", "#0f1f33", "#22a35a", "#2a8bf2", "#ff7a59"];
      for (let i = 0; i < 40; i++) {
        const c = document.createElement("i");
        c.className = "confetti";
        c.style.cssText = `left:${10 + Math.random() * 80}%;background:${colors[i % colors.length]};` +
          `--dx:${(Math.random() - 0.5) * 220}px;--rot:${Math.random() * 720 - 360}deg;animation-delay:${Math.random() * 0.25}s`;
        app.appendChild(c);
        setTimeout(() => c.remove(), 2300);
      }
    }

    function showResult() {
      const r = recommend(answers.area, answers.floor);
      document.getElementById("finderTitle").textContent = r.title;
      document.getElementById("finderWhy").textContent = r.why + (MODE_NOTE[answers.mode] || "");
      const img = document.getElementById("finderImg");
      img.src = r.img;
      img.alt = r.title;
      const msg = `Hi A-1 Cleaning Machines! The Machine Finder on your website suggested: ${r.title}.\n` +
        `Area: ${LABEL.area[answers.area]}\nFloor: ${LABEL.floor[answers.floor]}\nI want to: ${answers.mode}\nPlease share details and price.`;
      document.getElementById("finderWa").href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
      document.getElementById("finderForm").onclick = () => {
        const interest = document.getElementById("interest");
        const machine = document.getElementById("machine");
        const message = document.getElementById("message");
        if (interest) interest.value = answers.mode === "Not sure" ? "Free Demo" : answers.mode;
        if (machine) machine.value = r.machine;
        if (message) message.value = `Machine Finder suggestion: ${r.title}. Area: ${LABEL.area[answers.area]}. Floor: ${LABEL.floor[answers.floor]}.`;
      };
      show(3);
      confetti();
    }

    steps.forEach((step) => {
      step.querySelectorAll(".finder__opts button").forEach((btn) => {
        btn.addEventListener("click", () => {
          step.querySelectorAll("button").forEach((b) => b.classList.remove("is-picked"));
          btn.classList.add("is-picked");
          answers[step.dataset.step] = btn.dataset.v;
          setTimeout(() => (idx === 2 ? showResult() : show(idx + 1)), 260);
        });
      });
    });
    back.addEventListener("click", () => { if (idx > 0) show(idx - 1, true); });
    document.getElementById("finderRestart").addEventListener("click", () => {
      app.querySelectorAll(".is-picked").forEach((b) => b.classList.remove("is-picked"));
      show(0, true);
    });
    show(0);
  }

  /* ---------------------------------------------------------
     5. Before / after slider
     --------------------------------------------------------- */
  const ba = document.getElementById("ba");
  if (ba) {
    const handle = document.getElementById("baHandle");
    let pos = 50, dragging = false, touched = false;
    const set = (v) => {
      pos = clamp(v, 0, 100);
      ba.style.setProperty("--pos", pos.toFixed(2) + "%");
      handle.setAttribute("aria-valuenow", Math.round(pos));
    };
    const fromEvent = (e) => {
      const r = ba.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    };
    ba.addEventListener("pointerdown", (e) => {
      dragging = touched = true;
      ba.classList.add("is-dragging");
      try { ba.setPointerCapture(e.pointerId); } catch (_) {}
      fromEvent(e);
    });
    ba.addEventListener("pointermove", (e) => { if (dragging) fromEvent(e); });
    ["pointerup", "pointercancel"].forEach((t) => ba.addEventListener(t, () => { dragging = false; ba.classList.remove("is-dragging"); }));
    handle.addEventListener("keydown", (e) => {
      const k = { ArrowLeft: -5, ArrowRight: 5, Home: -100, End: 100 }[e.key];
      if (k !== undefined) { e.preventDefault(); touched = true; set(pos + k); }
    });

    // Peek animation the first time it scrolls into view
    if (!reduceMotion && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const keys = [[0, 50], [700, 80], [1500, 22], [2200, 50]];
        const t0 = performance.now();
        const step = (now) => {
          if (touched) return;
          const t = now - t0;
          let i = keys.findIndex((k) => k[0] > t);
          if (i === -1) { set(50); return; }
          const [ta, va] = keys[i - 1], [tb, vb] = keys[i];
          set(va + (vb - va) * easeInOut((t - ta) / (tb - ta)));
          requestAnimationFrame(step);
        };
        setTimeout(() => requestAnimationFrame(step), 300);
      }, { threshold: 0.55 });
      io.observe(ba);
    }
  }

  /* ---------------------------------------------------------
     6. Product cards tilt toward the mouse
     --------------------------------------------------------- */
  if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".product").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--ry", ((px - 0.5) * 10).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((0.5 - py) * 8).toFixed(2) + "deg");
        card.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
        card.classList.add("is-tilting");
      });
      card.addEventListener("pointerleave", () => card.classList.remove("is-tilting"));
    });
  }
})();
