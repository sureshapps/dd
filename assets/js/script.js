(() => {
  "use strict";

  function boot() {

  const body = document.body;
  const siteShell = document.querySelector(".site-shell");
  const panels = Array.from(document.querySelectorAll(".panel"));
  const siteNav = document.querySelector(".site-nav");
  const navButtons = Array.from(document.querySelectorAll(".site-nav [data-target]"));
  const homeLink = document.querySelector(".home-mark");
  const menuToggle = document.querySelector(".menu-toggle");
  const menuToggleLabel = document.querySelector(".menu-toggle-label");
  const menuBackdrop = document.querySelector(".menu-backdrop");
  const mobileContactButton = document.querySelector(".mobile-contact-button");
  const nextButtons = Array.from(document.querySelectorAll("[data-next]"));
  const previousButton = document.querySelector("[data-previous]");
  const progressBar = document.querySelector(".section-progress span");
  const sectionAnnouncer = document.getElementById("section-announcer");
  const wipeEdge = document.querySelector(".wipe-edge");
  const videoStage = document.querySelector(".video-stage");
  const videos = [
    document.getElementById("background-video-a"),
    document.getElementById("background-video-b")
  ];

  const preloader = document.querySelector(".preloader");
  const preloaderGlass = document.querySelector(".preloader-glass");
  const percentage = document.getElementById("load-percentage");
  const vuTrack = document.getElementById("vu-track");
  const vuNeedle = document.getElementById("vu-needle");
  const scrollCursor = document.querySelector(".scroll-cursor");
  const scrollCursorLabel = document.getElementById("scroll-cursor-label");
  const legalOpenButtons = Array.from(document.querySelectorAll("[data-legal-open]"));
  const legalCloseButtons = Array.from(document.querySelectorAll("[data-legal-close]"));
  const legalLayers = Array.from(document.querySelectorAll(".legal-layer"));

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileMenuQuery = window.matchMedia("(max-width: 900px)");
  const hasGsap = typeof window.gsap !== "undefined";
  const sectionNames = ["Intro", "Webentwicklung", "Fotografie", "Videografie", "Der Mensch dahinter"];
  const state = {
    activeIndex: 0,
    activeVideo: 0,
    heroWord: 0,
    transitioning: false,
    wheelLock: false,
    touchStartY: 0,
    touchScrollArea: null,
    touchStartedAtTop: false,
    touchStartedAtBottom: false,
    preloaderDone: false,
    activeLegalLayer: null,
    lastFocusedElement: null,
    menuOpen: false
  };



  function setMenu(open, options = {}) {
    const shouldOpen = Boolean(open && mobileMenuQuery.matches);
    const returnFocus = options.returnFocus !== false;
    state.menuOpen = shouldOpen;
    body.classList.toggle("menu-open", shouldOpen);
    menuToggle?.setAttribute("aria-expanded", String(shouldOpen));
    if (menuToggleLabel) menuToggleLabel.textContent = shouldOpen ? "Menü schließen" : "Menü öffnen";
    if (siteNav) {
      if (mobileMenuQuery.matches) siteNav.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
      else siteNav.removeAttribute("aria-hidden");
    }
    if (shouldOpen) {
      requestAnimationFrame(() => navButtons[0]?.focus());
    } else if (returnFocus && options.fromToggle !== false) {
      menuToggle?.focus();
    }
  }

  menuToggle?.addEventListener("click", () => {
    setMenu(!state.menuOpen, { fromToggle: true, returnFocus: false });
  });
  menuBackdrop?.addEventListener("click", () => setMenu(false));
  mobileContactButton?.addEventListener("click", () => setMenu(false, { returnFocus: false }));
  const handleMenuBreakpoint = () => setMenu(false, { returnFocus: false });
  if (typeof mobileMenuQuery.addEventListener === "function") {
    mobileMenuQuery.addEventListener("change", handleMenuBreakpoint);
  } else if (typeof mobileMenuQuery.addListener === "function") {
    mobileMenuQuery.addListener(handleMenuBreakpoint);
  }

  const segmentCount = 20;
  const segments = [];

  for (let i = 0; i < segmentCount; i += 1) {
    const segment = document.createElement("span");
    segment.className = "vu-segment";
    if (((i + 1) / segmentCount) * 100 >= 85) segment.classList.add("is-danger");
    vuTrack.appendChild(segment);
    segments.push(segment);
  }

  function animate(targets, keyframes, options = {}) {
    const elements = (Array.isArray(targets) ? targets : [targets]).filter(Boolean);
    if (hasGsap) {
      const vars = {
        ...keyframes,
        duration: (options.duration || 600) / 1000,
        ease: options.ease || "power3.out",
        stagger: options.stagger ? options.stagger / 1000 : 0,
        onComplete: options.onComplete
      };
      return window.gsap.to(elements, vars);
    }

    const animations = elements.map((element, index) => {
      const computed = getComputedStyle(element);
      const from = {
        opacity: computed.opacity,
        transform: computed.transform === "none" ? "translateY(0)" : computed.transform
      };
      const to = {};
      if (Object.prototype.hasOwnProperty.call(keyframes, "opacity")) to.opacity = keyframes.opacity;
      if (Object.prototype.hasOwnProperty.call(keyframes, "y")) to.transform = `translateY(${keyframes.y}px)`;
      if (Object.prototype.hasOwnProperty.call(keyframes, "yPercent")) to.transform = `translateY(${keyframes.yPercent}%)`;
      if (Object.prototype.hasOwnProperty.call(keyframes, "scale")) to.transform = `scale(${keyframes.scale})`;
      ["clipPath", "filter", "left"].forEach((property) => {
        if (Object.prototype.hasOwnProperty.call(keyframes, property)) to[property] = keyframes[property];
      });

      return element.animate([from, to], {
        duration: options.duration || 600,
        delay: index * (options.stagger || 0),
        easing: "cubic-bezier(.2,.75,.2,1)",
        fill: "forwards"
      });
    });

    Promise.all(animations.map((animation) => animation.finished.catch(() => null)))
      .then(() => options.onComplete?.());
    return animations;
  }

  function setStyles(targets, styles) {
    const elements = (Array.isArray(targets) ? targets : [targets]).filter(Boolean);
    if (!elements.length) return;
    if (hasGsap) {
      window.gsap.set(elements, styles);
      return;
    }

    elements.forEach((element) => {
      Object.entries(styles).forEach(([property, value]) => {
        if (property === "y") element.style.transform = `translateY(${value}px)`;
        else if (property === "yPercent") element.style.transform = `translateY(${value}%)`;
        else if (property === "scale") element.style.transform = `scale(${value})`;
        else element.style[property] = typeof value === "number" && property !== "opacity" ? String(value) : value;
      });
    });
  }

  function playVideo(video) {
    if (reducedMotion) {
      video.pause();
      return;
    }
    const promise = video.play();
    if (promise && typeof promise.catch === "function") promise.catch(() => {});
  }

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const cursorPosition = { currentX: -120, currentY: -120, targetX: -120, targetY: -120 };

  function renderCursor() {
    if (!scrollCursor || !finePointer) return;
    const ease = reducedMotion ? 1 : 0.2;
    cursorPosition.currentX += (cursorPosition.targetX - cursorPosition.currentX) * ease;
    cursorPosition.currentY += (cursorPosition.targetY - cursorPosition.currentY) * ease;
    scrollCursor.style.setProperty("--cursor-x", `${cursorPosition.currentX}px`);
    scrollCursor.style.setProperty("--cursor-y", `${cursorPosition.currentY}px`);
    requestAnimationFrame(renderCursor);
  }

  if (scrollCursor && finePointer) {
    window.addEventListener("pointermove", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      cursorPosition.targetX = event.clientX;
      cursorPosition.targetY = event.clientY;
      if (reducedMotion) {
        cursorPosition.currentX = event.clientX;
        cursorPosition.currentY = event.clientY;
      }
      body.classList.add("cursor-ready");
    }, { passive: true });

    document.documentElement.addEventListener("mouseleave", () => {
      body.classList.remove("cursor-ready", "cursor-link");
    });
    document.documentElement.addEventListener("mouseenter", () => body.classList.add("cursor-ready"));

    const interactiveSelector = 'a, button, [role="button"], input, select, textarea, label, summary';
    document.addEventListener("pointerover", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      body.classList.toggle("cursor-link", Boolean(event.target.closest(interactiveSelector)));
    }, { passive: true });
    document.addEventListener("pointerout", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      const nextTarget = event.relatedTarget;
      body.classList.toggle("cursor-link", nextTarget instanceof Element && Boolean(nextTarget.closest(interactiveSelector)));
    }, { passive: true });

    requestAnimationFrame(renderCursor);
  }

  function openLegal(name) {
    const layer = document.getElementById(`legal-${name}`);
    if (!layer || state.activeLegalLayer) return;
    state.lastFocusedElement = document.activeElement;
    state.activeLegalLayer = layer;
    body.classList.add("is-legal-open");
    siteShell?.setAttribute("inert", "");
    layer.classList.add("is-open");
    layer.setAttribute("aria-hidden", "false");
    const legalFrame = layer.querySelector(".legal-frame[data-legal-src]");
    if (legalFrame && !legalFrame.getAttribute("src")) {
      legalFrame.setAttribute("src", legalFrame.dataset.legalSrc);
    }
    requestAnimationFrame(() => layer.querySelector(".legal-card")?.focus());
  }

  function closeLegal() {
    const layer = state.activeLegalLayer;
    if (!layer) return;
    layer.classList.remove("is-open");
    layer.setAttribute("aria-hidden", "true");
    state.activeLegalLayer = null;
    body.classList.remove("is-legal-open");
    siteShell?.removeAttribute("inert");
    if (state.lastFocusedElement instanceof HTMLElement) state.lastFocusedElement.focus();
    state.lastFocusedElement = null;
  }

  legalOpenButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      openLegal(button.dataset.legalOpen);
    });
  });
  legalCloseButtons.forEach((button) => button.addEventListener("click", closeLegal));

  function trapLegalFocus(event) {
    if (!state.activeLegalLayer || event.key !== "Tab") return false;
    const focusable = Array.from(state.activeLegalLayer.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.disabled && element.offsetParent !== null);
    if (!focusable.length) return false;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return true;
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
      return true;
    }
    return false;
  }

  function setLoadProgress(value) {
    const clamped = Math.max(0, Math.min(100, value));
    const activeCount = Math.round((clamped / 100) * segmentCount);
    percentage.textContent = `${Math.round(clamped)}%`;
    segments.forEach((segment, index) => segment.classList.toggle("is-active", index < activeCount));
    vuNeedle.style.transform = `translateX(calc(${clamped}% * (var(--meter-width, 1))))`;
    const trackWidth = vuTrack.getBoundingClientRect().width;
    vuNeedle.style.transform = `translateX(${Math.max(0, Math.min(trackWidth - 2, trackWidth * clamped / 100))}px)`;
    vuNeedle.style.background = clamped >= 85 ? "var(--red)" : "#fff";
    percentage.style.color = clamped >= 85 ? "var(--red)" : "#fff";
  }

  function finishPreloader() {
    state.preloaderDone = true;
    body.classList.remove("is-loading");

    const revealIntro = () => {
      preloader.hidden = true;
      const introItems = Array.from(document.querySelectorAll(".intro-copy > *"));
      setStyles(introItems, { opacity: 0, y: 36 });
      animate(introItems, { opacity: 1, y: 0 }, {
        duration: reducedMotion ? 10 : 900,
        stagger: reducedMotion ? 0 : 110,
        ease: "power3.out"
      });
    };

    if (hasGsap) {
      window.gsap.timeline({ onComplete: revealIntro })
        .to(preloaderGlass, { scale: 0.94, opacity: 0, y: -20, duration: reducedMotion ? 0.01 : 0.48, ease: "power3.in" })
        .to(preloader, { clipPath: "inset(50% 0% 50% 0%)", duration: reducedMotion ? 0.01 : 0.68, ease: "expo.inOut" }, "-=0.1")
        .to(videos[0], { filter: "grayscale(1) contrast(1.04) brightness(0.62) blur(0px)", scale: 1.025, duration: reducedMotion ? 0.01 : 1.05, ease: "power3.out" }, "-=0.62");
    } else {
      preloader.animate([
        { opacity: 1 },
        { opacity: 0 }
      ], { duration: reducedMotion ? 10 : 650, fill: "forwards" }).finished.then(revealIntro);
    }
  }

  function runPreloader() {
    const introVideo = videos[0];
    let mediaReady = introVideo.readyState >= 3;
    let pageReady = document.readyState === "complete";
    let fontsReady = !document.fonts;
    let progress = 0;
    let previousTime = performance.now();
    const startTime = previousTime;

    const markMediaReady = () => { mediaReady = true; };
    const markPageReady = () => { pageReady = true; };
    introVideo.addEventListener("canplaythrough", markMediaReady, { once: true });
    introVideo.addEventListener("loadeddata", markMediaReady, { once: true });
    window.addEventListener("load", markPageReady, { once: true });
    if (document.fonts) {
      document.fonts.ready.then(() => { fontsReady = true; }).catch(() => { fontsReady = true; });
    }

    introVideo.load();
    playVideo(introVideo);

    const minimumDuration = reducedMotion ? 100 : 1800;
    const maximumDuration = reducedMotion ? 250 : 4800;

    function tick(now) {
      const delta = Math.min(50, now - previousTime);
      previousTime = now;
      const elapsed = now - startTime;
      const allReady = mediaReady && pageReady && fontsReady;
      const target = allReady ? 99.6 : Math.min(86, 18 + elapsed * 0.034);
      const pace = allReady ? 0.105 : 0.042;
      progress += (target - progress) * pace * (delta / 16.67);

      const jitterStrength = progress < 98.5 ? Math.min(1.25, progress * 0.014) : 0.18;
      const jitter = Math.sin(now / 88) * jitterStrength;
      const displayed = Math.min(99.8, Math.max(0, progress + jitter));
      setLoadProgress(displayed);

      const readyToFinish = allReady && elapsed >= minimumDuration && progress >= 98.8;
      const fallbackReached = elapsed >= maximumDuration;
      if (readyToFinish || fallbackReached) {
        setLoadProgress(100);
        window.setTimeout(finishPreloader, reducedMotion ? 20 : 140);
        return;
      }
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function updateNavigation() {
    const activePanel = panels[state.activeIndex];
    const id = activePanel.id;
    body.dataset.section = id;

    navButtons.forEach((button) => {
      const active = button.dataset.target === id;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
      if (active && !mobileMenuQuery.matches) button.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", inline: "center", block: "nearest" });
    });

    sectionAnnouncer.textContent = sectionNames[state.activeIndex];
    if (scrollCursorLabel) {
      scrollCursorLabel.textContent = state.activeIndex === panels.length - 1 ? "Scroll zurück" : "Scroll";
    }
    progressBar.style.transform = `scaleX(${state.activeIndex / (panels.length - 1)})`;
    previousButton.disabled = state.activeIndex === 0 && state.heroWord === 0;
    document.querySelectorAll(".section-controls [data-next]").forEach((button) => {
      button.disabled = state.activeIndex === panels.length - 1;
    });
  }

  function updateHash(id, push = false) {
    const hash = id === "intro" ? "#intro" : `#${id}`;
    if (window.location.hash === hash) return;
    const method = push ? "pushState" : "replaceState";
    history[method](null, "", hash);
  }

  function setHeroWord(nextIndex, direction = 1) {
    const words = Array.from(document.querySelectorAll(".hero-word"));
    const bounded = Math.max(0, Math.min(words.length - 1, nextIndex));
    if (bounded === state.heroWord || state.transitioning) return false;

    state.transitioning = true;
    const current = words[state.heroWord];
    const next = words[bounded];
    const incomingY = direction > 0 ? 118 : -118;
    const outgoingY = direction > 0 ? -118 : 118;

    next.classList.add("is-current");
    setStyles(next, { yPercent: incomingY, opacity: 1 });

    if (hasGsap) {
      window.gsap.timeline({
        onComplete: () => {
          current.classList.remove("is-current");
          state.heroWord = bounded;
          state.transitioning = false;
          updateNavigation();
        }
      })
        .to(current, { yPercent: outgoingY, opacity: 0, duration: reducedMotion ? 0.01 : 0.72, ease: "power4.inOut" }, 0)
        .to(next, { yPercent: 0, opacity: 1, duration: reducedMotion ? 0.01 : 0.78, ease: "power4.inOut" }, 0.04);
    } else {
      const currentAnimation = current.animate([
        { transform: "translateY(0)", opacity: 1 },
        { transform: `translateY(${outgoingY}%)`, opacity: 0 }
      ], { duration: reducedMotion ? 10 : 700, easing: "cubic-bezier(.75,0,.25,1)", fill: "forwards" });
      next.animate([
        { transform: `translateY(${incomingY}%)`, opacity: 1 },
        { transform: "translateY(0)", opacity: 1 }
      ], { duration: reducedMotion ? 10 : 760, easing: "cubic-bezier(.75,0,.25,1)", fill: "forwards" });
      currentAnimation.finished.then(() => {
        current.classList.remove("is-current");
        state.heroWord = bounded;
        state.transitioning = false;
        updateNavigation();
      });
    }
    return true;
  }

  function panelChildren(panel) {
    return Array.from(panel.querySelectorAll(".panel-copy > *"));
  }

  function prepareNextVideo(panel, direction) {
    const nextVideoIndex = state.activeVideo === 0 ? 1 : 0;
    const nextVideo = videos[nextVideoIndex];
    nextVideo.pause();
    nextVideo.poster = panel.dataset.poster;
    nextVideo.style.setProperty("--mobile-object-position", panel.dataset.mobilePosition || "center");
    nextVideo.innerHTML = "";
    const source = document.createElement("source");
    source.src = panel.dataset.video;
    source.type = "video/mp4";
    nextVideo.appendChild(source);
    nextVideo.load();
    nextVideo.currentTime = 0;
    nextVideo.style.opacity = "1";
    nextVideo.style.zIndex = "2";
    nextVideo.style.clipPath = direction > 0 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";
    playVideo(nextVideo);
    return { nextVideo, nextVideoIndex };
  }

  function switchPanel(nextIndex, options = {}) {
    if (nextIndex < 0 || nextIndex >= panels.length || nextIndex === state.activeIndex || state.transitioning) return;
    state.transitioning = true;

    const currentIndex = state.activeIndex;
    const direction = nextIndex > currentIndex ? 1 : -1;
    const currentPanel = panels[currentIndex];
    const nextPanel = panels[nextIndex];
    const currentVideo = videos[state.activeVideo];
    const { nextVideo, nextVideoIndex } = prepareNextVideo(nextPanel, direction);
    const currentItems = panelChildren(currentPanel);
    const nextItems = panelChildren(nextPanel);

    nextPanel.classList.add("is-active");
    nextPanel.setAttribute("aria-hidden", "false");
    setStyles(nextItems, { opacity: 0, y: direction > 0 ? 42 : -42 });

    // Reagiere im Menü sofort auf den neuen Bereich, statt erst am Ende der Video-Transition.
    navButtons.forEach((button) => {
      const active = button.dataset.target === nextPanel.id;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
      if (active && !mobileMenuQuery.matches) {
        button.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", inline: "center", block: "nearest" });
      }
    });

    const complete = () => {
      currentPanel.classList.remove("is-active");
      currentPanel.setAttribute("aria-hidden", "true");
      currentVideo.pause();
      currentVideo.classList.remove("is-active");
      currentVideo.style.opacity = "0";
      currentVideo.style.zIndex = "0";
      nextVideo.classList.add("is-active");
      nextVideo.style.zIndex = "1";
      nextVideo.style.clipPath = "none";
      state.activeVideo = nextVideoIndex;
      state.activeIndex = nextIndex;
      state.transitioning = false;
      updateNavigation();
      updateHash(nextPanel.id, options.pushHash === true);
    };

    if (hasGsap) {
      const edgeStart = direction > 0 ? "0%" : "100%";
      const edgeEnd = direction > 0 ? "100%" : "0%";
      window.gsap.set(wipeEdge, { left: edgeStart, opacity: 0 });
      window.gsap.timeline({ onComplete: complete })
        .to(currentItems, {
          y: direction > 0 ? -24 : 24,
          opacity: 0,
          duration: reducedMotion ? 0.01 : 0.34,
          stagger: reducedMotion ? 0 : 0.025,
          ease: "power2.in"
        }, 0)
        .to(wipeEdge, { opacity: 0.76, duration: reducedMotion ? 0.01 : 0.12 }, 0.12)
        .to(wipeEdge, { left: edgeEnd, duration: reducedMotion ? 0.01 : 1.0, ease: "expo.inOut" }, 0.12)
        .to(nextVideo, {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: reducedMotion ? 0.01 : 1.0,
          ease: "expo.inOut"
        }, 0.12)
        .to(wipeEdge, { opacity: 0, duration: reducedMotion ? 0.01 : 0.18 }, 1.0)
        .to(nextItems, {
          y: 0,
          opacity: 1,
          duration: reducedMotion ? 0.01 : 0.72,
          stagger: reducedMotion ? 0 : 0.065,
          ease: "power3.out"
        }, 0.66);
    } else {
      currentItems.forEach((item) => item.animate([
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: `translateY(${direction > 0 ? -24 : 24}px)` }
      ], { duration: reducedMotion ? 10 : 300, fill: "forwards" }));
      const videoAnimation = nextVideo.animate([
        { clipPath: direction > 0 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)" },
        { clipPath: "inset(0 0 0 0)" }
      ], { duration: reducedMotion ? 10 : 1000, easing: "cubic-bezier(.7,0,.2,1)", fill: "forwards" });
      nextItems.forEach((item, index) => item.animate([
        { opacity: 0, transform: `translateY(${direction > 0 ? 42 : -42}px)` },
        { opacity: 1, transform: "translateY(0)" }
      ], { duration: reducedMotion ? 10 : 680, delay: reducedMotion ? 0 : 540 + index * 55, fill: "forwards" }));
      videoAnimation.finished.then(complete);
    }
  }

  function step(direction, pushHash = false) {
    if (!state.preloaderDone || state.transitioning) return;

    if (state.activeIndex === 0) {
      if (direction > 0 && state.heroWord < 2) {
        setHeroWord(state.heroWord + 1, 1);
        return;
      }
      if (direction < 0 && state.heroWord > 0) {
        setHeroWord(state.heroWord - 1, -1);
        return;
      }
    }
    switchPanel(state.activeIndex + direction, { pushHash });
  }

  function navigateToId(id, pushHash = true) {
    const nextIndex = panels.findIndex((panel) => panel.id === id);
    if (nextIndex === -1) return;
    if (nextIndex === 0 && state.activeIndex === 0) {
      if (state.heroWord !== 0) setHeroWord(0, -1);
      updateHash("intro", pushHash);
      return;
    }
    switchPanel(nextIndex, { pushHash });
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setMenu(false, { returnFocus: false });
      navigateToId(button.dataset.target, true);
    });
  });

  homeLink.addEventListener("click", (event) => {
    event.preventDefault();
    setMenu(false, { returnFocus: false });
    navigateToId("intro", true);
  });

  nextButtons.forEach((button) => button.addEventListener("click", () => step(1, true)));
  previousButton.addEventListener("click", () => step(-1, true));

  window.addEventListener("wheel", (event) => {
    if (state.activeLegalLayer || state.menuOpen || !state.preloaderDone || state.wheelLock || Math.abs(event.deltaY) < 18) return;
    if (event.target.closest(".content-panel") && event.target.closest(".content-panel").scrollHeight > event.target.closest(".content-panel").clientHeight) {
      const scrollArea = event.target.closest(".content-panel");
      const atTop = scrollArea.scrollTop <= 0;
      const atBottom = Math.ceil(scrollArea.scrollTop + scrollArea.clientHeight) >= scrollArea.scrollHeight;
      if ((event.deltaY < 0 && !atTop) || (event.deltaY > 0 && !atBottom)) return;
    }
    event.preventDefault();
    state.wheelLock = true;
    step(event.deltaY > 0 ? 1 : -1, false);
    window.setTimeout(() => { state.wheelLock = false; }, reducedMotion ? 80 : 760);
  }, { passive: false });

  function resetTouchState() {
    state.touchScrollArea = null;
    state.touchStartedAtTop = false;
    state.touchStartedAtBottom = false;
  }

  window.addEventListener("touchstart", (event) => {
    state.touchStartY = event.changedTouches[0].clientY;

    const target = event.target instanceof Element ? event.target.closest(".content-panel") : null;
    const isScrollable = target && target.scrollHeight > target.clientHeight + 2;
    state.touchScrollArea = isScrollable ? target : null;

    if (state.touchScrollArea) {
      const scrollArea = state.touchScrollArea;
      state.touchStartedAtTop = scrollArea.scrollTop <= 1;
      state.touchStartedAtBottom = Math.ceil(scrollArea.scrollTop + scrollArea.clientHeight) >= scrollArea.scrollHeight - 1;
    } else {
      state.touchStartedAtTop = false;
      state.touchStartedAtBottom = false;
    }
  }, { passive: true });

  window.addEventListener("touchend", (event) => {
    if (state.activeLegalLayer || state.menuOpen || !state.preloaderDone) {
      resetTouchState();
      return;
    }

    const delta = state.touchStartY - event.changedTouches[0].clientY;
    if (Math.abs(delta) <= 55) {
      resetTouchState();
      return;
    }

    const direction = delta > 0 ? 1 : -1;
    if (state.touchScrollArea) {
      const startedAtRelevantEdge = direction > 0
        ? state.touchStartedAtBottom
        : state.touchStartedAtTop;

      resetTouchState();
      if (!startedAtRelevantEdge) return;
    } else {
      resetTouchState();
    }

    step(direction, false);
  }, { passive: true });

  window.addEventListener("touchcancel", resetTouchState, { passive: true });

  window.addEventListener("keydown", (event) => {
    if (state.activeLegalLayer) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLegal();
      } else {
        trapLegalFocus(event);
      }
      return;
    }

    if (state.menuOpen) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenu(false);
      }
      return;
    }

    if (["ArrowDown", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      step(1, true);
    } else if (["ArrowUp", "PageUp"].includes(event.key)) {
      event.preventDefault();
      step(-1, true);
    } else if (event.key === "Home") {
      event.preventDefault();
      navigateToId("intro", true);
    }
  });

  window.addEventListener("popstate", () => {
    const id = window.location.hash.replace("#", "") || "intro";
    navigateToId(id, false);
  });

  document.addEventListener("visibilitychange", () => {
    const activeVideo = videos[state.activeVideo];
    if (document.hidden) activeVideo.pause();
    else playVideo(activeVideo);
  });

  const initialHash = window.location.hash.replace("#", "");
  if (initialHash && initialHash !== "intro") {
    const targetIndex = panels.findIndex((panel) => panel.id === initialHash);
    if (targetIndex > 0) {
      state.activeIndex = targetIndex;
      panels.forEach((panel, index) => {
        panel.classList.toggle("is-active", index === targetIndex);
        panel.setAttribute("aria-hidden", index === targetIndex ? "false" : "true");
      });
      const target = panels[targetIndex];
      videos[0].poster = target.dataset.poster;
      videos[0].querySelector("source").src = target.dataset.video;
      videos[0].load();
      body.dataset.section = target.id;
    }
  }

  videos[0].style.setProperty("--mobile-object-position", panels[state.activeIndex].dataset.mobilePosition || "center");
  setMenu(false, { returnFocus: false });
  updateNavigation();
  runPreloader();
  }

  let started = false;
  const startOnce = () => {
    if (started) return;
    started = true;
    boot();
  };

  if (window.gsap) {
    startOnce();
  } else {
    const gsapScript = document.getElementById("gsap-script");
    gsapScript?.addEventListener("load", startOnce, { once: true });
    gsapScript?.addEventListener("error", startOnce, { once: true });
    window.setTimeout(startOnce, 900);
  }
})();