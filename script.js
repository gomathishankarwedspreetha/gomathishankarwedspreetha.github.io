(() => {
  const MUHURTHAM = new Date("2026-11-29T11:00:00+05:30").getTime();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const SITE_URL = "https://gomathishankarwedspreetha.github.io/";
  const VENUE =
    "Shree Narayana Mahall, 6/3960, Thiru Narayana Nagar, No 1 Tollgate, Bikshandarkoil, Tamil Nadu 621216";
  const MAPS = "https://maps.app.goo.gl/d4QedArkRfNpaWfg9";

  const INTERACTIVE_SELECTOR =
    "a, button, .interactive, .selectable, input, textarea, select, label, summary";

  function isInteractive(target) {
    return !!(target && target.closest && target.closest(INTERACTIVE_SELECTOR));
  }

  /* ---------- Countdown ---------- */
  const countdownEl = document.getElementById("countdown");
  const units = {
    days: countdownEl?.querySelector('[data-unit="days"]'),
    hours: countdownEl?.querySelector('[data-unit="hours"]'),
    mins: countdownEl?.querySelector('[data-unit="mins"]'),
    secs: countdownEl?.querySelector('[data-unit="secs"]'),
  };

  function pad(n) {
    return String(Math.max(0, n)).padStart(2, "0");
  }

  function tickCountdown() {
    let diff = Math.max(0, MUHURTHAM - Date.now());
    const days = Math.floor(diff / 86400000);
    diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000);
    diff -= hours * 3600000;
    const mins = Math.floor(diff / 60000);
    diff -= mins * 60000;
    const secs = Math.floor(diff / 1000);

    if (units.days) units.days.textContent = pad(days);
    if (units.hours) units.hours.textContent = pad(hours);
    if (units.mins) units.mins.textContent = pad(mins);
    if (units.secs) units.secs.textContent = pad(secs);
  }

  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ---------- Audio helpers ---------- */
  let audioCtx = null;
  const bloopEl = document.getElementById("bloopSound");
  let lastBloop = 0;

  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function playBloop() {
    const now = performance.now();
    if (now - lastBloop < 80) return;
    lastBloop = now;

    try {
      ensureAudio();
      if (bloopEl) {
        const node = bloopEl.cloneNode(true);
        node.volume = 0.45;
        node.play().catch(() => {});
        node.addEventListener("ended", () => node.remove());
        return;
      }
    } catch (_) {
      /* fall through */
    }

    /* Fallback soft tone if file missing */
    try {
      const ctxA = ensureAudio();
      const t0 = ctxA.currentTime;
      const osc = ctxA.createOscillator();
      const gain = ctxA.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, t0);
      osc.frequency.exponentialRampToValueAtTime(320, t0 + 0.14);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.07, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      osc.connect(gain);
      gain.connect(ctxA.destination);
      osc.start(t0);
      osc.stop(t0 + 0.2);
    } catch (_) {
      /* ignore */
    }
  }

  /* ---------- Ripples (skip interactive targets) ---------- */
  const rippleLayer = document.getElementById("ripples");

  function spawnRipple(x, y) {
    if (!rippleLayer || reduceMotion) return;
    const el = document.createElement("span");
    el.className = "ripple";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    rippleLayer.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }

  document.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      playBloop();

      if (isInteractive(e.target)) return;
      if (e.target && e.target.closest && e.target.closest("#scratchCanvas")) return;

      spawnRipple(e.clientX, e.clientY);
    },
    { passive: true }
  );

  /* ---------- Custom cursor + global parallax ---------- */
  const cursor = document.getElementById("cursor");
  const cursorRing = cursor?.querySelector(".cursor__ring");
  const cursorDot = cursor?.querySelector(".cursor__dot");

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let dotX = mouseX;
  let dotY = mouseY;
  let globalPX = 0;
  let globalPY = 0;
  let targetPX = 0;
  let targetPY = 0;
  /* Shared with pull spring (declared early so parallax can read it) */
  let pullCurrent = 0;
  const PULL_MAX = 140;

  const hero = document.getElementById("hero");
  const layers = hero
    ? [...hero.querySelectorAll("[data-speed]")].map((el) => ({
        el,
        speed: parseFloat(el.dataset.speed) || 0,
      }))
    : [];

  const tiltEls = [];
  document.querySelectorAll(".invite__photo, .memory__frame, .timeline__item, .scratch, .venue__hands").forEach((el) => {
    el.classList.add("tilt");
    tiltEls.push(el);
  });

  if (finePointer && !reduceMotion && cursor) {
    document.body.classList.add("has-cursor");

    window.addEventListener(
      "pointermove",
      (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        targetPX = (e.clientX / window.innerWidth - 0.5) * 2;
        targetPY = (e.clientY / window.innerHeight - 0.5) * 2;

        const overInteractive = isInteractive(e.target);
        cursor.classList.toggle("is-hover", overInteractive);
      },
      { passive: true }
    );

    window.addEventListener(
      "pointerdown",
      () => cursor.classList.add("is-down"),
      { passive: true }
    );
    window.addEventListener(
      "pointerup",
      () => cursor.classList.remove("is-down"),
      { passive: true }
    );

    function animateCursor() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      dotX += (mouseX - dotX) * 0.45;
      dotY += (mouseY - dotY) * 0.45;
      globalPX += (targetPX - globalPX) * 0.08;
      globalPY += (targetPY - globalPY) * 0.08;

      if (cursorRing) {
        cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      }
      if (cursorDot) {
        cursorDot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
      }

      updateParallax();
      requestAnimationFrame(animateCursor);
    }
    requestAnimationFrame(animateCursor);
  }

  /* ---------- Hero + responsive hover parallax ---------- */
  let scrollTicking = false;

  function updateParallax() {
    if (!hero || reduceMotion) return;

    const rect = hero.getBoundingClientRect();
    const viewH = window.innerHeight || 1;
    const progress = Math.min(1, Math.max(0, -rect.top / (rect.height || 1)));
    const mid = (viewH / 2 - (rect.top + rect.height / 2)) / viewH;

    layers.forEach(({ el, speed }) => {
      const pullBoost = Math.min(1, pullCurrent / PULL_MAX);
      const y =
        progress * speed * 140 +
        mid * speed * 40 +
        globalPY * speed * 16 +
        pullBoost * speed * 28;
      const x = globalPX * speed * 28;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    /* Soft tilt on cards toward cursor */
    if (finePointer) {
      tiltEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = (mouseX - cx) / (r.width || 1);
        const dy = (mouseY - cy) / (r.height || 1);
        const inView = r.bottom > 0 && r.top < viewH;
        if (!inView) {
          el.style.transform = "";
          return;
        }
        const near = Math.abs(dx) < 1.2 && Math.abs(dy) < 1.2;
        if (!near) {
          el.style.transform = "";
          return;
        }
        const rx = Math.max(-6, Math.min(6, -dy * 6));
        const ry = Math.max(-8, Math.min(8, dx * 8));
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(${dx * 4}px, ${dy * 3}px, 0)`;
      });
    }

    scrollTicking = false;
  }

  function requestParallax() {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(updateParallax);
    }
  }

  window.addEventListener("scroll", requestParallax, { passive: true });
  window.addEventListener("resize", requestParallax);

  /* Touch-move parallax for mobile (gentle) */
  if (!finePointer && !reduceMotion) {
    window.addEventListener(
      "touchmove",
      (e) => {
        const t = e.touches[0];
        if (!t) return;
        targetPX = (t.clientX / window.innerWidth - 0.5) * 2;
        targetPY = (t.clientY / window.innerHeight - 0.5) * 2;
        globalPX += (targetPX - globalPX) * 0.2;
        globalPY += (targetPY - globalPY) * 0.2;
        requestParallax();
      },
      { passive: true }
    );
  }

  updateParallax();

  /* ---------- Instagram-style pull-to-invite (spring + parallax) ---------- */
  const pullRoot = document.getElementById("pullRoot");
  const pullZone = document.getElementById("pullZone");
  const pullZoneLabel = document.getElementById("pullZoneLabel");
  const inviteSheet = document.getElementById("inviteSheet");
  const inviteBackdrop = document.getElementById("inviteSheetBackdrop");
  const inviteClose = document.getElementById("inviteSheetClose");
  const pullHint = document.getElementById("pullHint");

  /* Threshold must stay BELOW max resisted distance or it never opens */
  const PULL_THRESHOLD = 52;
  let sheetOpen = false;
  let pulling = false;
  let pullStartY = 0;
  let pullTarget = 0;
  let pullVelocity = 0;
  let pullDistance = 0; /* mirrored from pullCurrent for threshold checks */

  function atPageTop() {
    return (window.scrollY || document.documentElement.scrollTop || 0) <= 8;
  }

  function resistPull(rawPx) {
    const t = Math.max(0, rawPx);
    /* Soft ease toward max — feels elastic without fighting the spring */
    const n = Math.min(1, t / (PULL_MAX * 1.35));
    return PULL_MAX * (1 - Math.pow(1 - n, 2.1));
  }

  function syncPullChrome(d) {
    if (pullZone) {
      pullZone.classList.toggle("is-pulling", d > 6);
      pullZone.classList.toggle("is-ready", d >= PULL_THRESHOLD);
    }
    if (pullZoneLabel) {
      pullZoneLabel.textContent = d >= PULL_THRESHOLD ? "Release for invite" : "Pull for invite";
    }
  }

  function applyPullVisual(d) {
    pullDistance = d;
    if (pullRoot && !sheetOpen) {
      if (d > 0.15) {
        /* Slight scale + translate keeps the reveal fluid with parallax */
        const s = 1 + Math.min(0.012, d / PULL_MAX * 0.012);
        pullRoot.style.transform = `translate3d(0, ${d}px, 0) scale(${s})`;
      } else {
        pullRoot.style.transform = "";
      }
    }
    syncPullChrome(d);
  }

  function setPullTarget(raw) {
    pullTarget = resistPull(raw);
  }

  function resetPull(animate = true) {
    pulling = false;
    pullRoot?.classList.remove("is-dragging");
    pullTarget = 0;
    if (!animate) {
      pullCurrent = 0;
      pullVelocity = 0;
      applyPullVisual(0);
    }
  }

  function tickPullSpring() {
    if (!reduceMotion) {
      const dragging = pulling;
      const stiffness = dragging ? 0.38 : 0.14;
      const damping = dragging ? 0.62 : 0.78;
      const force = (pullTarget - pullCurrent) * stiffness;
      pullVelocity = pullVelocity * damping + force;
      pullCurrent += pullVelocity;

      if (!dragging && pullTarget === 0 && Math.abs(pullCurrent) < 0.35 && Math.abs(pullVelocity) < 0.35) {
        pullCurrent = 0;
        pullVelocity = 0;
      }

      applyPullVisual(pullCurrent);

      /* Feed pull into global parallax for a unified motion feel */
      if (pullCurrent > 0.5) {
        const boost = Math.min(1, pullCurrent / PULL_MAX);
        targetPY = Math.max(targetPY, boost * 0.55);
        globalPY += (boost * 0.85 - globalPY) * 0.12;
        requestParallax();
      }
    } else if (pullTarget !== pullCurrent) {
      pullCurrent = pullTarget;
      applyPullVisual(pullCurrent);
    }
    requestAnimationFrame(tickPullSpring);
  }
  requestAnimationFrame(tickPullSpring);

  function openInviteSheet() {
    if (!inviteSheet || sheetOpen) return;
    sheetOpen = true;
    resetPull(false);
    applyPullVisual(0);
    inviteSheet.hidden = false;
    requestAnimationFrame(() => inviteSheet.classList.add("is-open"));
    document.body.classList.add("invite-open");
    playBloop();
  }

  function closeInviteSheet() {
    if (!inviteSheet || !sheetOpen) return;
    sheetOpen = false;
    inviteSheet.classList.remove("is-open");
    document.body.classList.remove("invite-open");
    setTimeout(() => {
      if (!sheetOpen) inviteSheet.hidden = true;
    }, 350);
    playBloop();
  }

  inviteBackdrop?.addEventListener("click", closeInviteSheet);
  inviteClose?.addEventListener("click", closeInviteSheet);
  pullHint?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openInviteSheet();
  });
  pullHint?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openInviteSheet();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheetOpen) closeInviteSheet();
  });

  function shouldIgnorePullTarget(target) {
    if (!target || !target.closest) return false;
    return !!target.closest(
      "a:not(#pullHint), button, input, textarea, select, label, .chip-btn, .btn, .link-btn, .scratch__canvas, .reach__map, iframe, #pullHint"
    );
  }

  function onPullStart(y) {
    if (sheetOpen || !atPageTop()) return false;
    pulling = true;
    pullStartY = y;
    pullVelocity = 0;
    pullRoot?.classList.add("is-dragging");
    return true;
  }

  function onPullMove(clientY, event) {
    if (!pulling || sheetOpen) return;
    const raw = clientY - pullStartY;
    if (raw <= 0) {
      setPullTarget(0);
      return;
    }
    if (!atPageTop() && pullCurrent <= 0) {
      resetPull(false);
      return;
    }
    setPullTarget(raw);
    if (event && pullTarget > 0 && event.cancelable) event.preventDefault();
  }

  function onPullEnd() {
    if (!pulling) return;
    const shouldOpen = Math.max(pullCurrent, pullTarget) >= PULL_THRESHOLD;
    pullRoot?.classList.remove("is-dragging");
    pulling = false;
    if (shouldOpen) openInviteSheet();
    else resetPull(true);
  }

  window.addEventListener(
    "touchstart",
    (e) => {
      if (shouldIgnorePullTarget(e.target)) return;
      onPullStart(e.touches[0].clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (!pulling) return;
      onPullMove(e.touches[0].clientY, e);
    },
    { passive: false }
  );

  window.addEventListener(
    "touchend",
    () => {
      onPullEnd();
    },
    { passive: true }
  );
  window.addEventListener(
    "touchcancel",
    () => {
      resetPull(true);
    },
    { passive: true }
  );

  /* Desktop: click-drag down at top of page */
  let mousePulling = false;
  window.addEventListener("mousedown", (e) => {
    if (e.button !== 0 || shouldIgnorePullTarget(e.target)) return;
    if (onPullStart(e.clientY)) mousePulling = true;
  });
  window.addEventListener("mousemove", (e) => {
    if (!mousePulling) return;
    onPullMove(e.clientY, null);
  });
  window.addEventListener("mouseup", () => {
    if (!mousePulling) return;
    mousePulling = false;
    onPullEnd();
  });

  /* Trackpad / mouse wheel: scroll "up" at top = pull */
  let wheelAcc = 0;
  let wheelTimer = null;
  window.addEventListener(
    "wheel",
    (e) => {
      if (sheetOpen || !atPageTop()) {
        wheelAcc = 0;
        return;
      }
      if (e.deltaY >= 0) {
        wheelAcc = 0;
        if (pullTarget > 0 || pullCurrent > 0) resetPull(true);
        return;
      }
      wheelAcc += -e.deltaY;
      pulling = true;
      pullRoot?.classList.add("is-dragging");
      setPullTarget(wheelAcc * 0.55);
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        pulling = false;
        pullRoot?.classList.remove("is-dragging");
        if (Math.max(pullCurrent, pullTarget) >= PULL_THRESHOLD) openInviteSheet();
        else resetPull(true);
        wheelAcc = 0;
      }, 140);
    },
    { passive: true }
  );

  /* ---------- Scroll reveals ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Soft petal particles ---------- */
  const canvas = document.getElementById("petals");
  const ctx = canvas?.getContext("2d");

  if (canvas && ctx && !reduceMotion) {
    let w = 0;
    let h = 0;
    let petals = [];
    const COUNT = window.matchMedia("(max-width: 700px)").matches ? 24 : 38;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function makePetal() {
      const blush = [
        "rgba(247,197,205,",   /* soft blush rose */
        "rgba(240,170,182,",   /* medium blush */
        "rgba(232,140,155,",   /* deeper blush */
      ];
      const redRose = [
        "rgba(198,58,78,",     /* classic red rose */
        "rgba(176,42,62,",     /* deep rose red */
        "rgba(212,78,96,",     /* bright rose */
      ];
      const palette = Math.random() > 0.42 ? blush : redRose;
      return {
        x: Math.random() * w,
        y: Math.random() * h - h,
        r: 2.8 + Math.random() * 3.6,
        slim: 0.38 + Math.random() * 0.2,
        vy: 0.35 + Math.random() * 0.7,
        vx: -0.3 + Math.random() * 0.6,
        rot: Math.random() * Math.PI * 2,
        vr: -0.03 + Math.random() * 0.06,
        hue: palette[(Math.random() * palette.length) | 0],
        a: 0.28 + Math.random() * 0.34,
        tip: 0.7 + Math.random() * 0.25,
      };
    }

    function initPetals() {
      petals = Array.from({ length: COUNT }, makePetal);
    }

    function drawPetal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      /* Slim rose petal — length retained, width narrowed */
      const hw = p.r * p.slim;
      ctx.beginPath();
      ctx.moveTo(0, -p.r * p.tip);
      ctx.bezierCurveTo(hw, -p.r * 0.4, hw * 0.9, p.r * 0.45, 0, p.r * 0.9);
      ctx.bezierCurveTo(-hw * 0.9, p.r * 0.45, -hw, -p.r * 0.4, 0, -p.r * p.tip);
      ctx.closePath();
      ctx.fillStyle = p.hue + p.a + ")";
      ctx.fill();
      ctx.restore();
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      petals.forEach((p) => {
        p.x += p.vx + Math.sin(p.y * 0.01) * 0.15 + globalPX * 0.15;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        drawPetal(p);
      });
      requestAnimationFrame(frame);
    }

    resize();
    initPetals();
    frame();
    window.addEventListener("resize", () => {
      resize();
      initPetals();
    });
  }

  /* ---------- Scratch card ---------- */
  const scratchCard = document.getElementById("scratchCard");
  const scratchCanvas = document.getElementById("scratchCanvas");
  const scratchGuide = document.getElementById("scratchGuide");

  if (scratchCanvas && scratchCard) {
    const sctx = scratchCanvas.getContext("2d", { willReadFrequently: true });
    let scratching = false;
    let last = null;
    let revealed = false;

    function sizeScratch() {
      const rect = scratchCard.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      scratchCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
      scratchCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
      scratchCanvas.style.width = `${rect.width}px`;
      scratchCanvas.style.height = `${rect.height}px`;
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintFoil(rect.width, rect.height);
    }

    function paintFoil(w, h) {
      const grad = sctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#e8d4b0");
      grad.addColorStop(0.35, "#c4a06a");
      grad.addColorStop(0.7, "#d8b87a");
      grad.addColorStop(1, "#b8956c");
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, w, h);

      /* Soft shimmer lines */
      sctx.strokeStyle = "rgba(255,255,255,0.18)";
      sctx.lineWidth = 1;
      for (let i = -h; i < w + h; i += 14) {
        sctx.beginPath();
        sctx.moveTo(i, 0);
        sctx.lineTo(i + h, h);
        sctx.stroke();
      }

      sctx.fillStyle = "rgba(47,38,34,0.28)";
      sctx.font = "500 13px 'Josefin Sans', sans-serif";
      sctx.textAlign = "center";
      sctx.textBaseline = "middle";
      sctx.letterSpacing = "0.18em";
      /* guide text also in DOM; keep foil clean-ish */
      sctx.fillStyle = "rgba(255,255,255,0.22)";
      sctx.beginPath();
      sctx.arc(w / 2, h / 2, Math.min(w, h) * 0.18, 0, Math.PI * 2);
      sctx.fill();
    }

    function scratchAt(x, y) {
      const rect = scratchCanvas.getBoundingClientRect();
      const px = x - rect.left;
      const py = y - rect.top;
      const radius = Math.max(36, Math.min(rect.width, rect.height) * 0.12);

      sctx.globalCompositeOperation = "destination-out";
      sctx.beginPath();
      sctx.arc(px, py, radius, 0, Math.PI * 2);
      sctx.fill();

      if (last) {
        sctx.lineWidth = radius * 2;
        sctx.lineCap = "round";
        sctx.lineJoin = "round";
        sctx.beginPath();
        sctx.moveTo(last.x, last.y);
        sctx.lineTo(px, py);
        sctx.stroke();
      }

      last = { x: px, y: py };
      sctx.globalCompositeOperation = "source-over";
    }

    function measureReveal() {
      if (revealed) return;
      const w = scratchCanvas.width;
      const h = scratchCanvas.height;
      const sample = sctx.getImageData(0, 0, w, h).data;
      let clear = 0;
      const step = 16;
      for (let i = 3; i < sample.length; i += 4 * step) {
        if (sample[i] < 40) clear += 1;
      }
      const total = sample.length / (4 * step);
      if (clear / total > 0.18) {
        revealed = true;
        scratchCard.classList.add("is-done");
        scratchCanvas.style.transition = "opacity 0.45s ease";
        scratchCanvas.style.opacity = "0";
        setTimeout(() => {
          scratchCanvas.style.pointerEvents = "none";
        }, 450);
        if (scratchGuide) scratchGuide.textContent = "Revealed";
        playBloop();
        burstConfetti();
        showToast("Muhurtham unlocked");
      }
    }

    function pointerPos(e) {
      if (e.touches && e.touches[0]) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    }

    function onStart(e) {
      if (revealed) return;
      scratching = true;
      scratchCard.classList.add("is-scratching");
      last = null;
      const p = pointerPos(e);
      scratchAt(p.x, p.y);
      e.preventDefault();
    }

    function onMove(e) {
      if (!scratching || revealed) return;
      const p = pointerPos(e);
      scratchAt(p.x, p.y);
      if (Math.random() > 0.7) measureReveal();
      e.preventDefault();
    }

    function onEnd() {
      if (!scratching) return;
      scratching = false;
      last = null;
      measureReveal();
    }

    sizeScratch();
    window.addEventListener("resize", () => {
      if (!revealed) sizeScratch();
    });

    scratchCanvas.addEventListener("pointerdown", onStart);
    scratchCanvas.addEventListener("pointermove", onMove);
    scratchCanvas.addEventListener("pointerup", onEnd);
    scratchCanvas.addEventListener("pointercancel", onEnd);
    scratchCanvas.addEventListener("pointerleave", onEnd);
  }

  /* ---------- Toast ---------- */
  const toast = document.getElementById("toast");
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.hidden = false;
    toast.textContent = message;
    requestAnimationFrame(() => toast.classList.add("is-on"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("is-on");
      setTimeout(() => {
        toast.hidden = true;
      }, 350);
    }, 2200);
  }

  /* ---------- WhatsApp share ---------- */
  const shareText =
    "You're invited to the wedding of Gomathi Shankar & Preetha!\n\nReception · 28 Nov 2026, 7 PM onwards\nMuhurtham · 29 Nov 2026, 11 AM – 12 PM\nMaruveedu · 30 Nov 2026\n\nShree Narayana Mahall, Bikshandarkoil\n" +
    SITE_URL;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  function openWhatsApp() {
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  const shareBtnVenue = document.getElementById("shareBtnVenue");
  if (shareBtnVenue) shareBtnVenue.href = waUrl;
  document.getElementById("shareBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    openWhatsApp();
  });

  /* ---------- Tab attention title ---------- */
  const baseTitle = document.title;
  const awayTitles = [
    "Psst… you're invited!",
    "Save the date · Nov 29",
    "G & P are waiting ✨",
    "Don't miss the muhurtham!",
    "Come back — you're invited!",
  ];
  let awayIdx = 0;
  let awayTimer = null;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      document.title = awayTitles[awayIdx % awayTitles.length];
      awayTimer = setInterval(() => {
        awayIdx += 1;
        document.title = awayTitles[awayIdx % awayTitles.length];
      }, 2800);
    } else {
      clearInterval(awayTimer);
      awayTimer = null;
      document.title = baseTitle;
    }
  });

  /* ---------- Confetti (petals + gold + teal) ---------- */
  function burstConfetti() {
    if (reduceMotion) return;
    const layer = document.getElementById("confetti");
    if (!layer) return;
    const ctxC = layer.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    layer.width = window.innerWidth * dpr;
    layer.height = window.innerHeight * dpr;
    layer.style.width = "100%";
    layer.style.height = "100%";
    ctxC.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ["#f7c5cd", "#f0aab6", "#e88c9b", "#c63a4e", "#b02a3e", "#d44e60", "#e9c5c8"];
    const parts = Array.from({ length: 56 }, () => ({
      x: window.innerWidth * (0.35 + Math.random() * 0.3),
      y: window.innerHeight * 0.35,
      vx: -5 + Math.random() * 10,
      vy: -8 - Math.random() * 7,
      g: 0.18 + Math.random() * 0.12,
      r: 3 + Math.random() * 5,
      rot: Math.random() * Math.PI * 2,
      vr: -0.2 + Math.random() * 0.4,
      color: colors[(Math.random() * colors.length) | 0],
      kind: Math.random() > 0.25 ? "petal" : "dot",
      life: 1,
    }));

    let frames = 0;
    function tick() {
      frames += 1;
      ctxC.clearRect(0, 0, window.innerWidth, window.innerHeight);
      parts.forEach((p) => {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.012;
        ctxC.save();
        ctxC.translate(p.x, p.y);
        ctxC.rotate(p.rot);
        ctxC.globalAlpha = Math.max(0, p.life);
        ctxC.fillStyle = p.color;
        if (p.kind === "petal") {
          ctxC.beginPath();
          ctxC.ellipse(0, 0, p.r * 1.4, p.r * 0.7, 0, 0, Math.PI * 2);
          ctxC.fill();
        } else {
          ctxC.beginPath();
          ctxC.arc(0, 0, p.r * 0.55, 0, Math.PI * 2);
          ctxC.fill();
        }
        ctxC.restore();
      });
      if (frames < 110) requestAnimationFrame(tick);
      else ctxC.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Calendar events ---------- */
  const events = {
    reception: {
      title: "Reception — Gomathi Shankar & Preetha",
      description: `Wedding reception of Gomathi Shankar & Preetha.\nVenue: ${VENUE}\nMaps: ${MAPS}\nInvite: ${SITE_URL}`,
      location: VENUE,
      start: "20261128T190000",
      end: "20261128T230000",
      file: "gs-preetha-reception.ics",
    },
    muhurtham: {
      title: "Muhurtham — Gomathi Shankar & Preetha",
      description: `Muhurtham of Gomathi Shankar & Preetha (11 AM – 12 PM).\nVenue: ${VENUE}\nMaps: ${MAPS}\nInvite: ${SITE_URL}`,
      location: VENUE,
      start: "20261129T110000",
      end: "20261129T120000",
      file: "gs-preetha-muhurtham.ics",
    },
    maruveedu: {
      title: "Maruveedu — Gomathi Shankar & Preetha",
      description: `Maruveedu — a warm welcome home, with blessings from both families.\nVenue: ${VENUE}\nMaps: ${MAPS}\nInvite: ${SITE_URL}`,
      location: VENUE,
      start: "20261130T100000",
      end: "20261130T140000",
      file: "gs-preetha-maruveedu.ics",
    },
  };

  function escapeIcs(text) {
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }

  function buildIcs(event) {
    const stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Gomathi Shankar & Preetha Wedding//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${event.file}@gomathishankarwedspreetha.github.io`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Asia/Kolkata:${event.start}`,
      `DTEND;TZID=Asia/Kolkata:${event.end}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `DESCRIPTION:${escapeIcs(event.description)}`,
      `LOCATION:${escapeIcs(event.location)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
  }

  function downloadIcs(key) {
    const event = events[key];
    if (!event) return;
    const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = event.file;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Calendar file downloaded");
  }

  function googleCalUrl(event) {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${event.start}/${event.end}`,
      ctz: "Asia/Kolkata",
      details: event.description,
      location: event.location,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  document.querySelectorAll("[data-cal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      downloadIcs(btn.getAttribute("data-cal"));
    });
  });

  document.querySelectorAll("[data-gcal]").forEach((link) => {
    const key = link.getAttribute("data-gcal");
    const event = events[key];
    if (event) link.href = googleCalUrl(event);
  });

  /* ---------- Music toggle ---------- */
  const musicBtn = document.getElementById("musicBtn");
  const bgMusic = document.getElementById("bgMusic");
  let musicOn = false;

  musicBtn?.addEventListener("click", async () => {
    if (!bgMusic) return;
    try {
      ensureAudio();
      if (!musicOn) {
        bgMusic.volume = 0.35;
        await bgMusic.play();
        musicOn = true;
        musicBtn.setAttribute("aria-pressed", "true");
        musicBtn.querySelector(".music-btn__label").textContent = "Playing";
      } else {
        bgMusic.pause();
        musicOn = false;
        musicBtn.setAttribute("aria-pressed", "false");
        musicBtn.querySelector(".music-btn__label").textContent = "Music";
      }
    } catch (_) {
      musicBtn.querySelector(".music-btn__label").textContent = "Add song";
      musicOn = false;
      musicBtn.setAttribute("aria-pressed", "false");
      showToast("Add assets/audio/bg.mp3 to enable music");
    }
  });
})();
