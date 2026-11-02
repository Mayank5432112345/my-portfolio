/* ============================================================
   SCENE CONTROLLER
   Scroll-driven 3D scene changes, navigation, stack, carousel.
   ============================================================ */

(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const compactQuery = window.matchMedia("(max-width: 820px)");
  let compact = compactQuery.matches;

  const scenes = $$(".scene");
  const anchors = $$(".anchor");
  const sceneLinks = $$("[data-scene-link]");
  const total = scenes.length;
  const accents = ["#ff5a36", "#7c8bff", "#33e6b0", "#ff5a36", "#c8ff4a", "#ff5a36"];
  scenes.forEach((scene, i) => scene.style.setProperty("--accent", accents[i]));

  let active = -1;
  let indexFloat = 0;
  let ticking = false;
  let countersDone = false;
  let sceneUnit = window.innerHeight;
  let pageMaxScroll = 1;
  let sceneTops = [];
  const progressBar = document.getElementById("scrollProgress");
  const sceneBar = document.getElementById("sceneProgress");

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function measurePage() {
    sceneUnit = anchors[0] && anchors[0].offsetHeight ? anchors[0].offsetHeight : window.innerHeight;
    pageMaxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (compact) sceneTops = scenes.map((scene) => scene.offsetTop);
  }
  measurePage();
  document.fonts?.ready.then(measurePage);
  window.addEventListener("load", measurePage, { once: true });

  /* ----------------------------------------------------------
     Navigation
     ---------------------------------------------------------- */
  function sceneTop(index) {
    if (reduceMotion || compact) {
      const scene = scenes[index];
      return scene.getBoundingClientRect().top + window.scrollY;
    }
    return anchors[index] ? anchors[index].offsetTop : index * sceneUnit;
  }

  function goTo(index, smooth = true) {
    const i = clamp(index, 0, total - 1);
    const top = sceneTop(i);
    window.scrollTo({ top, behavior: smooth && !reduceMotion ? "smooth" : "auto" });
    if (history.replaceState) {
      const id = scenes[i].id;
      try {
        if (id) history.replaceState(null, "", "#" + id);
      } catch (error) { /* file:// or restricted contexts */ }
    }
  }

  sceneLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setMenu(false);
      goTo(Number(link.getAttribute("data-scene-link")) || 0);
    });
  });
  const initialHash = location.hash.replace("#", "");
  if (initialHash) {
    const idx = scenes.findIndex((scene) => scene.id === initialHash);
    if (idx > 0) window.setTimeout(() => goTo(idx, false), 80);
  }

  /* ----------------------------------------------------------
     Scene transitions
     ---------------------------------------------------------- */
  function setActive(index) {
    if (index === active) return;
    active = index;
    const accent = accents[index] || accents[0];
    if (!compact) document.documentElement.style.setProperty("--accent", accent);

    if (!compact && !reduceMotion) {
      scenes.forEach((scene, i) => {
        const isActive = i === index;
        scene.classList.toggle("is-active", isActive);
        scene.setAttribute("aria-hidden", String(!isActive));
        try { scene.inert = !isActive; } catch (error) { /* older browsers */ }
      });
    }

    if (!compact) {
      sceneLinks.forEach((link) => {
        const i = Number(link.getAttribute("data-scene-link"));
        link.classList.toggle("is-active", i === index);
      });
    }

    const counter = $("#sceneNum");
    const name = $("#sceneName");
    if (!compact) {
      if (counter) counter.textContent = String(index + 1).padStart(2, "0");
      if (name) name.textContent = scenes[index].getAttribute("data-name") || "";
    }
    body.dataset.scene = String(index);
    body.classList.toggle("is-last", index === total - 1);

    const hint = $("#scrollHint");
    const hintText = $("#scrollHintText");
    if (hint && index < total - 1) {
      hint.setAttribute("href", "#" + scenes[index + 1].id);
      hint.setAttribute("data-scene-link", String(index + 1));
      if (hintText) hintText.textContent = "Scroll to advance";
    }

    document.querySelector(".site-header")?.classList.toggle("is-scrolled", true);

    if (index === 4 && !countersDone) animateCounters(compact);
    if (window.portfolioModel) window.portfolioModel.setActive(index === 0);
  }

  function render() {
    ticking = false;
    const y = window.scrollY;
    const u = sceneUnit;
    const maxScroll = pageMaxScroll;
    const progress = clamp(y / maxScroll, 0, 1);

    if (progressBar) progressBar.style.width = (progress * 100).toFixed(2) + "%";

    if (reduceMotion) return;

    if (compact) {
      /* Sections are in normal flow; no fixed-stage transforms needed. */
      const probe = window.scrollY + window.innerHeight * 0.5;
      let current = 0;
      for (let i = 0; i < sceneTops.length; i++) {
        if (sceneTops[i] <= probe) current = i;
      }
      indexFloat = current;
      if (current !== active) setActive(current);
      return;
    }

    const local = u ? y / u : 0;
    indexFloat = clamp(local, 0, total - 1);
    const current = Math.round(indexFloat);

    scenes.forEach((scene, i) => {
      const delta = i - indexFloat;
      const abs = Math.abs(delta);

      /* Off-screen scenes do not need a compositor layer or style writes. */
      if (abs > 1.35) {
        if (scene.style.visibility !== "hidden") {
          scene.style.visibility = "hidden";
          scene.style.opacity = "0";
          scene.style.willChange = "auto";
          scene.style.zIndex = "0";
        }
        if (scene.style.pointerEvents !== "none") scene.style.pointerEvents = "none";
        return;
      }

      let transform;
      let opacity;

      if (compact) {
        /* Phones use a clean 2D slide/fade instead of six 3D layers. */
        transform = `translate3d(0, ${(delta * 4.2).toFixed(2)}vh, 0)`;
        opacity = clamp(1 - abs * 1.55, 0, 1);
      } else {
        const z = delta >= 0 ? -abs * 820 : abs * 540;
        const rotate = delta * 6;
        const scale = 1 - abs * 0.025;
        transform = `translate3d(0, ${(delta * 6.5).toFixed(2)}vh, ${z.toFixed(0)}px) rotateX(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        opacity = clamp(1 - abs * 1.22, 0, 1);
      }

      scene.style.transform = transform;
      scene.style.opacity = opacity.toFixed(3);
      if (scene.style.visibility !== "visible") scene.style.visibility = "visible";

      const zIndex = String(30 - Math.round(abs * 10));
      if (scene.style.zIndex !== zIndex) scene.style.zIndex = zIndex;

      const pointer = i === current ? "auto" : "none";
      if (scene.style.pointerEvents !== pointer) scene.style.pointerEvents = pointer;

      const will = abs < 1.2 ? "transform, opacity" : "auto";
      if (scene.style.willChange !== will) scene.style.willChange = will;
    });

    if (current !== active) setActive(current);

    const railBar = sceneBar;
    if (railBar) railBar.style.height = ((indexFloat / (total - 1)) * 100).toFixed(2) + "%";
  }

  function requestRender() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(render);
  }

  window.addEventListener("scroll", requestRender, { passive: true });
  compactQuery.addEventListener?.("change", (event) => {
    compact = event.matches;
    measurePage();
    scenes.forEach((scene) => {
      scene.classList.toggle("is-active", compact);
      if (compact) {
        scene.removeAttribute("aria-hidden");
        try { scene.inert = false; } catch (error) { /* ignore */ }
        scene.style.willChange = "auto";
      }
    });
    active = -1;
    requestRender();
  });
  window.addEventListener("resize", () => {
    measurePage();
    requestRender();
    if (window.innerWidth > 1080) setMenu(false);
  });

  /* initial state */
  if (reduceMotion) {
    body.classList.add("is-ready");
    scenes.forEach((scene) => {
      scene.classList.add("is-active");
      scene.removeAttribute("aria-hidden");
      try { scene.inert = false; } catch (error) { /* ignore */ }
    });
    animateCounters(true);
    requestAnimationFrame(() => requestRender());
  } else {
    if (compact) {
      scenes.forEach((scene) => {
        scene.classList.add("is-active");
        scene.removeAttribute("aria-hidden");
      });
    } else {
      scenes.forEach((scene, i) => {
        if (i !== 0) {
          scene.setAttribute("aria-hidden", "true");
          try { scene.inert = true; } catch (error) { /* ignore */ }
        }
      });
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        body.classList.add("is-ready");
        requestRender();
      });
    });
  }

  /* ----------------------------------------------------------
     Counters
     ---------------------------------------------------------- */
  function animateCounters(instant = false) {
    if (countersDone && !instant) return;
    countersDone = true;
    /* On phones the values are already in the markup; skip reflow work. */
    if (compact) return;
    $$("[data-counter]").forEach((el) => {
      const target = Number(el.getAttribute("data-counter")) || 0;
      const suffix = el.getAttribute("data-suffix") || "";
      if (reduceMotion || instant) {
        el.textContent = target + suffix;
        return;
      }      const start = performance.now();
      const duration = 1200;
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + (p === 1 ? suffix : "");
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = "0" + suffix;
      requestAnimationFrame(tick);
    });
  }

  /* ----------------------------------------------------------
     Mobile menu
     ---------------------------------------------------------- */
  const menu = $("#menu");
  const menuToggle = $("#menuToggle");

  function setMenu(open) {
    if (!menu || !menuToggle) return;
    menu.classList.toggle("is-open", open);
    body.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
  }

  menuToggle?.addEventListener("click", () => setMenu(!menu?.classList.contains("is-open")));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu?.classList.contains("is-open")) {
      setMenu(false);
      menuToggle?.focus();
    }
  });

  /* ----------------------------------------------------------
     Clock + copy email
     ---------------------------------------------------------- */
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const clock = $("#clock");
  const setClock = () => { if (clock) clock.textContent = timeFormatter.format(new Date()); };
  setClock();
  window.setInterval(setClock, 15000);

  const copyBtn = $("#copyEmail");
  if (copyBtn) {
    const label = $("#copyLabel");
    const defaultLabel = label ? label.textContent : "Copy";
    let resetTimer;
    copyBtn.addEventListener("click", async () => {
      const email = copyBtn.getAttribute("data-email") || "";
      try {
        await navigator.clipboard.writeText(email);
      } catch (error) {
        const field = document.createElement("textarea");
        field.value = email;
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        try { document.execCommand("copy"); } catch (err) { /* ignore */ }
        field.remove();
      }
      copyBtn.classList.add("is-copied");
      if (label) label.textContent = "Copied ✓";
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        copyBtn.classList.remove("is-copied");
        if (label) label.textContent = defaultLabel;
      }, 2200);
    });
  }

  /* ----------------------------------------------------------
     Stack keys
     ---------------------------------------------------------- */
  const keys = $$(".key");
  const readoutIcon = $("#stackIcon");
  const readoutName = $("#stackName");
  const readoutDesc = $("#stackDesc");

  function inspectKey(key) {
    if (!key || !readoutName || !readoutDesc) return;
    readoutName.textContent = key.getAttribute("data-name") || "";
    readoutDesc.textContent = key.getAttribute("data-desc") || "";
    if (readoutIcon) {
      const icon = key.style.getPropertyValue("--icon");
      if (icon) {
        readoutIcon.classList.remove("is-text");
        readoutIcon.textContent = "";
        readoutIcon.style.setProperty("--icon", icon);
      } else {
        readoutIcon.classList.add("is-text");
        readoutIcon.style.removeProperty("--icon");
        readoutIcon.textContent = key.getAttribute("data-glyph") || "·";
      }
    }
  }

  keys.forEach((key) => {
    key.style.setProperty("--brand", key.getAttribute("data-color") || "var(--accent)");
    key.addEventListener("pointerenter", () => inspectKey(key));
    key.addEventListener("focus", () => inspectKey(key));
    key.addEventListener("click", () => {
      keys.forEach((k) => k.classList.remove("is-selected"));
      key.classList.add("is-selected");
      inspectKey(key);
    });
  });

  $$(".filter").forEach((filterBtn) => {
    filterBtn.addEventListener("click", () => {
      $$(".filter").forEach((btn) => btn.classList.toggle("is-active", btn === filterBtn));
      const filter = filterBtn.getAttribute("data-filter");
      keys.forEach((key) => {
        key.classList.toggle("is-dim", filter !== "all" && key.getAttribute("data-cat") !== filter);
      });
    });
  });

  const keyboard = $("#keyboard");
  if (keyboard && finePointer && !reduceMotion) {
    const wrap = keyboard.closest(".keyboard-wrap") || keyboard;
    wrap.addEventListener("pointermove", (event) => {
      const rect = wrap.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      keyboard.style.setProperty("--rx", (x * 5).toFixed(2) + "deg");
      keyboard.style.setProperty("--ry", (y * 4).toFixed(2) + "deg");
    });
    wrap.addEventListener("pointerleave", () => {
      keyboard.style.setProperty("--rx", "0deg");
      keyboard.style.setProperty("--ry", "0deg");
    });
  }

  /* ----------------------------------------------------------
     Project carousel
     ---------------------------------------------------------- */
  const carousel = $("#carousel");
  const cards = $$(".work-card");
  const projectIndex = $("#projectIndex");
  let currentProject = 0;
  let dragStartX = null;
  let dragged = false;

  function setProject(index) {
    if (!cards.length) return;
    currentProject = ((index % cards.length) + cards.length) % cards.length;
    const narrow = window.innerWidth < 821;
    const shift = narrow ? 86 : 34;
    const depth = narrow ? 180 : 230;
    const rotate = narrow ? 24 : 30;

    cards.forEach((card, i) => {
      let offset = i - currentProject;
      if (offset > 1) offset -= cards.length;
      if (offset < -1) offset += cards.length;
      const abs = Math.abs(offset);
      card.style.setProperty("--offset", String(offset));
      card.style.setProperty("--x", offset * shift + "%");
      card.style.setProperty("--z", -Math.abs(offset) * depth + "px");
      card.style.setProperty("--rot", -offset * rotate + "deg");
      card.style.setProperty("--scale", String(1 - abs * 0.07));
      card.style.setProperty("--opacity", String(1 - abs * 0.7));
      card.classList.toggle("is-active", offset === 0);
      card.setAttribute("aria-hidden", offset === 0 ? "false" : "true");
      const link = card.querySelector(".work-card__link");
      if (link) link.tabIndex = offset === 0 ? 0 : -1;
    });
    if (projectIndex) projectIndex.textContent = String(currentProject + 1).padStart(2, "0");
  }

  cards.forEach((card) => {
    card.addEventListener("click", (event) => {
      const index = Number(card.getAttribute("data-index"));
      if (dragged) {
        event.preventDefault();
        dragged = false;
        return;
      }
      if (index !== currentProject) {
        event.preventDefault();
        setProject(index);
      }
    });
  });

  $("#prevProject")?.addEventListener("click", () => setProject(currentProject - 1));
  $("#nextProject")?.addEventListener("click", () => setProject(currentProject + 1));

  if (carousel) {
    carousel.tabIndex = 0;
    carousel.setAttribute("aria-label", "Project carousel. Use left and right arrow keys.");
    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); setProject(currentProject - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); setProject(currentProject + 1); }
    });

    carousel.addEventListener("pointerdown", (event) => {
      dragStartX = event.clientX;
      dragged = false;
    });
    window.addEventListener("pointerup", (event) => {
      if (dragStartX === null) return;
      const dx = event.clientX - dragStartX;
      if (Math.abs(dx) > 48) {
        dragged = true;
        setProject(currentProject + (dx < 0 ? 1 : -1));
      }
      dragStartX = null;
    });
  }
  setProject(0);
  window.addEventListener("resize", () => setProject(currentProject));

  /* ----------------------------------------------------------
     ID card tilt
     ---------------------------------------------------------- */
  const card = $(".id-card");
  if (card && finePointer && !reduceMotion) {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) translateZ(0)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    });
  }

  /* ----------------------------------------------------------
     Custom cursor
     ---------------------------------------------------------- */
  if (finePointer && !reduceMotion && $("#cursor")) {
    const cursor = $("#cursor");
    const dot = $(".cursor__dot", cursor);
    const ring = $(".cursor__ring", cursor);
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let started = false;

    body.classList.add("has-cursor");
    const draw = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      if (dot) dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      if (ring) ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);

    document.addEventListener("mousemove", (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (!started) {
        started = true;
        ringX = mouseX;
        ringY = mouseY;
        cursor.classList.remove("is-hidden");
      }
      const target = event.target.closest("a, button, summary, canvas, [data-cursor]");
      cursor.classList.toggle("is-hover", Boolean(target));
    });
    document.addEventListener("mouseleave", () => cursor.classList.add("is-hidden"));
    document.addEventListener("mouseenter", () => cursor.classList.remove("is-hidden"));
  }

  /* ----------------------------------------------------------
     Magnetic buttons
     ---------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (event) => {
        const rect = el.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.16}px, ${y * 0.24}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }
})();
