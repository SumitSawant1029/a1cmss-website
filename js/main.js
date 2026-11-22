/* =========================================================
   A-1 Cleaning Machines Sales & Services – Site scripts
   ========================================================= */

// Your WhatsApp number in international format, digits only (e.g. 919876543210)
const WHATSAPP_NUMBER = "917738395656";

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- Auto-load images into placeholders ----------
     Save a generated image at the path shown in a placeholder
     (e.g. images/hero-main.jpg) and it replaces the placeholder
     automatically – no HTML edits needed. */
  document.querySelectorAll(".img-slot[data-src]").forEach((slot) => {
    let img = slot.querySelector("img");
    if (!img) {
      img = document.createElement("img");
      img.alt = slot.dataset.alt || "";
      img.decoding = "async";
      if (!slot.closest(".hero")) {
        img.loading = "lazy";
      }
      slot.appendChild(img);
      img.src = slot.dataset.src;
    }
    const markLoaded = () => slot.classList.add("is-loaded");
    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener("load", markLoaded);
      img.addEventListener("error", () => {
        slot.classList.remove("is-loaded");
      });
    }
  });

  const root = document.documentElement;
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

  /* ---------- Dark / light theme ---------- */
  const themeBtn = document.getElementById("themeToggle");
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const savedTheme = () => { try { return localStorage.getItem("a1-theme"); } catch (e) { return null; } };
  const applyTheme = (t) => {
    root.setAttribute("data-theme", t);
    themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
  };
  applyTheme(root.getAttribute("data-theme") || (media.matches ? "dark" : "light"));
  themeBtn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem("a1-theme", next); } catch (e) {}
  });
  if (media.addEventListener) {
    media.addEventListener("change", (e) => { if (!savedTheme()) applyTheme(e.matches ? "dark" : "light"); });
  }

  /* ---------- Mobile navigation ---------- */
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const setNav = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    toggle.querySelector("use").setAttribute("href", open ? "#i-x" : "#i-menu");
    document.body.style.overflow = open ? "hidden" : "";
  };
  toggle.addEventListener("click", () => setNav(!nav.classList.contains("is-open")));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setNav(false)));
  window.addEventListener("resize", () => { if (window.innerWidth > 920) setNav(false); });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setNav(false); });

  /* ---------- Statement: split into words ---------- */
  const statement = document.querySelector("[data-words]");
  let words = [];
  if (statement) {
    const frag = document.createDocumentFragment();
    statement.childNodes.forEach((node) => {
      const isHl = node.nodeType === 1;
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
        const w = document.createElement("span");
        w.className = isHl ? "w hl" : "w";
        w.textContent = part;
        frag.appendChild(w);
      });
    });
    statement.textContent = "";
    statement.appendChild(frag);
    words = [...statement.querySelectorAll(".w")];
  }

  /* ---------- Scroll-driven effects (Apple-style) ---------- */
  const header = document.querySelector(".header");
  const hero = document.querySelector(".hero");
  const progressBar = document.querySelector(".scroll-progress");
  const showcase = document.querySelector(".showcase");
  const sticky = showcase ? showcase.querySelector(".showcase__sticky") : null;
  const slides = showcase ? [...showcase.querySelectorAll(".showcase__slide")] : [];
  const shots = showcase ? [...showcase.querySelectorAll(".showcase__img")] : [];
  const bars = showcase ? [...showcase.querySelectorAll(".showcase__progress i")] : [];
  const parallaxEls = [...document.querySelectorAll("[data-parallax]")];
  const zoomEls = [...document.querySelectorAll(".zoom-reveal")];
  let litCount = -1;
  let activeSlide = -1;
  let pendingReveal = [];

  const update = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;

    header.classList.toggle("is-scrolled", y > 10);

    // Reveal anything that has entered (or been scrolled past)
    if (pendingReveal.length) {
      pendingReveal = pendingReveal.filter((el) => {
        if (el.getBoundingClientRect().top < vh * 0.9) { el.classList.add("is-visible"); return false; }
        return true;
      });
    }

    // Page progress line
    const max = document.documentElement.scrollHeight - vh;
    if (progressBar) progressBar.style.setProperty("--sp", max > 0 ? (y / max).toFixed(4) : 0);

    // Hero: content drifts down & fades, image zooms in
    if (hero && y < hero.offsetHeight + 200) {
      hero.style.setProperty("--p", clamp(y / hero.offsetHeight).toFixed(3));
    }

    // Statement: words light up one by one
    if (statement) {
      const r = statement.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (vh * 0.4 + r.height));
      const n = Math.round(p * words.length);
      if (n !== litCount) {
        words.forEach((w, i) => w.classList.toggle("is-lit", i < n));
        litCount = n;
      }
    }

    // Showcase: pinned panel, slides change as you scroll
    if (showcase) {
      const r = showcase.getBoundingClientRect();
      const top = parseFloat(getComputedStyle(sticky).top) || 0;
      const total = showcase.offsetHeight - sticky.offsetHeight;
      const prog = clamp((top - r.top) / total);
      const n = slides.length;
      const idx = Math.min(n - 1, Math.floor(prog * n));
      const local = clamp(prog * n - idx);
      if (idx !== activeSlide) {
        slides.forEach((s, i) => { s.classList.toggle("is-active", i === idx); s.classList.toggle("is-past", i < idx); });
        shots.forEach((s, i) => s.classList.toggle("is-active", i === idx));
        activeSlide = idx;
      }
      if (shots[idx]) shots[idx].style.setProperty("--lp", local.toFixed(3));
      bars.forEach((b, i) => b.style.setProperty("--f", clamp(prog * n - i).toFixed(3)));
    }

    // Parallax images
    parallaxEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const t = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.setProperty("--py", (t * -50).toFixed(1) + "px");
    });

    // Zoom reveal: image opens up as it enters the screen
    zoomEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top > vh || r.bottom < 0) return;
      el.style.setProperty("--z", clamp((vh - r.top) / (vh * 0.75)).toFixed(3));
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  };
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", onScroll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onScroll);

  /* ---------- Active nav link ---------- */
  const navLinks = [...nav.querySelectorAll('a:not(.btn)[href^="#"]')];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Reveal on scroll ----------
     Checked on every scroll frame (not only when an element crosses
     the edge), so jumping straight to a section via the menu still
     reveals everything above and inside the viewport. */
  document.querySelectorAll(
    ".section__head, .products, .part, .plan, .industry, .feature, .steps li, .rent-plan, .split__media, .split__content > h2, .contact__info, .form, .service-banner, .cta-band__inner"
  ).forEach((el) => {
    // Stagger items that sit side by side in the same grid
    const cls = el.classList[0];
    const sibs = cls ? [...el.parentElement.children].filter((c) => c.classList.contains(cls)) : [el];
    el.style.setProperty("--d", (Math.max(0, sibs.indexOf(el)) % 4) * 90 + "ms");
    el.classList.add("reveal");
    pendingReveal.push(el);
  });
  onScroll();

  /* ---------- Pre-fill enquiry form from Buy / Rent / Quote buttons ---------- */
  const interest = document.getElementById("interest");
  const machine = document.getElementById("machine");
  const message = document.getElementById("message");
  document.querySelectorAll("[data-interest]").forEach((btn) => {
    btn.addEventListener("click", () => {
      interest.value = btn.dataset.interest;
      if (btn.dataset.machine) machine.value = btn.dataset.machine;
      if (btn.dataset.plan && !message.value) message.value = `I'd like a quote for the ${btn.dataset.plan} plan.`;
    });
  });

  /* ---------- Enquiry form ----------
     No server is needed: a valid enquiry opens WhatsApp with the
     details pre-filled. To receive enquiries by email instead, point
     the form at a service such as Formspree or your own backend. */
  const form = document.getElementById("quoteForm");
  const status = document.getElementById("formStatus");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll("input, select, textarea").forEach((field) => {
      const bad = !field.checkValidity();
      field.classList.toggle("is-invalid", bad);
      if (bad) valid = false;
    });
    if (!valid) {
      status.className = "form__status err";
      status.textContent = "Please fill in the highlighted fields.";
      return;
    }

    const d = Object.fromEntries(new FormData(form));
    const lines = [
      "New enquiry – A-1 Cleaning Machines website",
      `Name: ${d.name}`,
      d.company && `Company: ${d.company}`,
      `Phone: ${d.phone}`,
      d.email && `Email: ${d.email}`,
      `Interested in: ${d.interest}`,
      d.machine && `Machine: ${d.machine}`,
      d.message && `Message: ${d.message}`,
    ].filter(Boolean);

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
    status.className = "form__status ok";
    status.textContent = "Thank you! Your enquiry is ready to send on WhatsApp. We'll reply within one working day.";
    form.reset();
  });
  form.addEventListener("input", (e) => {
    if (e.target.classList.contains("is-invalid") && e.target.checkValidity()) e.target.classList.remove("is-invalid");
  });

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
});
