(() => {
  const body = document.body;
  const header = document.querySelector(".site-header");
  const navShell = header?.querySelector(".nav-shell");

  if (!body || !header || !navShell) {
    return;
  }

  const TOP_REVEAL_THRESHOLD = 24;
  const HIDE_START_SCROLL = 96;
  const HIDE_SCROLL_DELTA = 40;
  const SHOW_SCROLL_DELTA = 72;
  const DELTA_FLOOR = 3;

  let lastScrollY = Math.max(window.scrollY, 0);
  let downwardTravel = 0;
  let upwardTravel = 0;
  let isHidden = false;
  let ticking = false;

  const isMobileLayout = () => window.getComputedStyle(navShell).flexDirection === "column";

  const resetTravel = () => {
    downwardTravel = 0;
    upwardTravel = 0;
  };

  const setHidden = (nextHidden) => {
    if (isHidden !== nextHidden) {
      isHidden = nextHidden;
      body.classList.toggle("is-mobile-nav-hidden", isHidden);
    }

    header.setAttribute("data-nav-hidden", String(nextHidden));
  };

  const revealHeader = () => {
    setHidden(false);
    resetTravel();
  };

  const syncHeader = () => {
    ticking = false;

    if (!isMobileLayout()) {
      revealHeader();
      lastScrollY = Math.max(window.scrollY, 0);
      return;
    }

    const currentScrollY = Math.max(window.scrollY, 0);
    const delta = currentScrollY - lastScrollY;

    if (currentScrollY <= TOP_REVEAL_THRESHOLD) {
      revealHeader();
      lastScrollY = currentScrollY;
      return;
    }

    if (Math.abs(delta) < DELTA_FLOOR) {
      lastScrollY = currentScrollY;
      return;
    }

    if (delta > 0) {
      downwardTravel += delta;
      upwardTravel = 0;

      if (!isHidden && currentScrollY > HIDE_START_SCROLL && downwardTravel >= HIDE_SCROLL_DELTA) {
        setHidden(true);
        downwardTravel = 0;
      }
    } else {
      upwardTravel += Math.abs(delta);
      downwardTravel = 0;

      if (isHidden && upwardTravel >= SHOW_SCROLL_DELTA) {
        revealHeader();
      }
    }

    lastScrollY = currentScrollY;
  };

  const requestSync = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(syncHeader);
  };

  const resetState = () => {
    revealHeader();
    lastScrollY = Math.max(window.scrollY, 0);
  };

  window.addEventListener("scroll", requestSync, { passive: true });
  window.addEventListener("resize", resetState);
  window.addEventListener("orientationchange", resetState);
  window.addEventListener("hashchange", resetState);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      resetState();
    }
  });

  resetState();
})();
