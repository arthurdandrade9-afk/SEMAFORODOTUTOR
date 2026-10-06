document.querySelectorAll("[data-checkout-placeholder]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (link.getAttribute("href") !== "#") return;
    event.preventDefault();
    const note = document.querySelector(".pricing > .checkout-note");
    if (note) {
      note.textContent = "Checkout ainda não conectado. Substitua o # pelo link de pagamento desta opção.";
      note.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
});

const CAROUSEL_INTERVAL = 6000;

document.querySelectorAll("[data-demo-carousel]").forEach((carousel) => {
  const track = carousel.querySelector("[data-demo-track]");
  const slides = [...carousel.querySelectorAll(".demo-slide")];
  const CONTINUOUS_SPEED = 24;
  let animationFrame = null;
  let lastTimestamp = null;
  let loopWidth = 0;
  let scrollRemainder = 0;

  const clones = slides.map((slide) => {
    const clone = slide.cloneNode(true);
    clone.dataset.demoClone = "true";
    clone.setAttribute("aria-hidden", "true");
    track.append(clone);
    return clone;
  });

  function measureLoop() {
    loopWidth = clones[0] ? clones[0].offsetLeft - slides[0].offsetLeft : track.scrollWidth / 2;
    track.scrollLeft = loopWidth;
  }

  function normalizeLoop() {
    if (!loopWidth) return;
    if (track.scrollLeft <= 0) track.scrollLeft += loopWidth;
  }

  function animate(timestamp) {
    if (lastTimestamp === null) lastTimestamp = timestamp;
    const elapsed = Math.min(timestamp - lastTimestamp, 64);
    lastTimestamp = timestamp;

    if (!document.hidden) {
      scrollRemainder += CONTINUOUS_SPEED * elapsed / 1000;
      const wholePixels = Math.floor(scrollRemainder);
      if (wholePixels > 0) {
        track.scrollLeft -= wholePixels;
        scrollRemainder -= wholePixels;
        normalizeLoop();
      }
    }

    animationFrame = window.requestAnimationFrame(animate);
  }

  window.addEventListener("resize", () => window.requestAnimationFrame(measureLoop));

  measureLoop();
  animationFrame = window.requestAnimationFrame(animate);

  window.addEventListener("pagehide", () => window.cancelAnimationFrame(animationFrame), { once: true });
});

document.querySelectorAll("[data-testimonial-carousel]").forEach((carousel) => {
  const track = carousel.querySelector("[data-testimonial-track]");
  const slides = [...carousel.querySelectorAll(".testimonial-slide")];
  const previousButton = carousel.querySelector("[data-testimonial-prev]");
  const nextButton = carousel.querySelector("[data-testimonial-next]");
  const dotsContainer = carousel.querySelector("[data-testimonial-dots]");
  const status = carousel.querySelector("[data-testimonial-status]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let currentIndex = 0;
  let autoTimer = null;
  let scrollFrame = null;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let mouseDragging = false;

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "testimonial-dot";
    dot.setAttribute("aria-label", `Ver prova social ${index + 1}`);
    dot.addEventListener("click", () => {
      goTo(index);
      restartAutoPlay();
    });
    dotsContainer.append(dot);
    return dot;
  });

  function updateControls(index) {
    currentIndex = (index + slides.length) % slides.length;
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentIndex);
      dot.setAttribute("aria-current", dotIndex === currentIndex ? "true" : "false");
    });
    status.textContent = `${currentIndex + 1} de ${slides.length}`;
  }

  function goTo(index, behavior = "smooth") {
    const nextIndex = (index + slides.length) % slides.length;
    updateControls(nextIndex);
    track.scrollTo({ left: track.clientWidth * nextIndex, behavior });
  }

  function stopAutoPlay() {
    window.clearInterval(autoTimer);
    autoTimer = null;
  }

  function startAutoPlay() {
    stopAutoPlay();
    if (reducedMotion.matches || document.hidden) return;
    autoTimer = window.setInterval(() => goTo(currentIndex + 1), CAROUSEL_INTERVAL);
  }

  function restartAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }

  previousButton.addEventListener("click", () => {
    goTo(currentIndex - 1);
    restartAutoPlay();
  });

  nextButton.addEventListener("click", () => {
    goTo(currentIndex + 1);
    restartAutoPlay();
  });

  track.addEventListener("scroll", () => {
    if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(() => {
      const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
      if (index !== currentIndex) updateControls(index);
    });
  }, { passive: true });

  track.addEventListener("pointerdown", (event) => {
    stopAutoPlay();
    if (event.pointerType === "touch") return;
    mouseDragging = true;
    dragStartX = event.clientX;
    dragStartScroll = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture(event.pointerId);
  });

  track.addEventListener("pointermove", (event) => {
    if (!mouseDragging) return;
    track.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
  });

  function finishDrag(event) {
    if (!mouseDragging) {
      restartAutoPlay();
      return;
    }
    mouseDragging = false;
    track.classList.remove("is-dragging");
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    goTo(Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)));
    restartAutoPlay();
  }

  track.addEventListener("pointerup", finishDrag);
  track.addEventListener("pointercancel", finishDrag);
  carousel.addEventListener("mouseenter", stopAutoPlay);
  carousel.addEventListener("mouseleave", startAutoPlay);
  carousel.addEventListener("focusin", stopAutoPlay);
  carousel.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) startAutoPlay();
  });
  window.addEventListener("resize", () => goTo(currentIndex, "auto"));
  document.addEventListener("visibilitychange", () => document.hidden ? stopAutoPlay() : startAutoPlay());
  reducedMotion.addEventListener?.("change", startAutoPlay);

  updateControls(0);
  startAutoPlay();
});
