const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxCaption = document.querySelector("#lightbox-caption");
const demoButtons = [...document.querySelectorAll("[data-demo-index]")];
let activeIndex = 0;
let previouslyFocused = null;

const demoSource = (index) => `assets/images/demo-${String(index + 1).padStart(2, "0")}.jpg`;

function renderDemo(index) {
  activeIndex = (index + 20) % 20;
  lightboxImage.src = demoSource(activeIndex);
  lightboxImage.alt = `Demonstrativo ${activeIndex + 1} ampliado do guia`;
  lightboxCaption.textContent = `Página demonstrativa ${activeIndex + 1} de 20`;
}

function openLightbox(index, trigger) {
  previouslyFocused = trigger;
  renderDemo(index);
  lightbox.hidden = false;
  document.body.classList.add("is-lightbox-open");
  lightbox.querySelector(".lightbox__close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.body.classList.remove("is-lightbox-open");
  previouslyFocused?.focus();
}

demoButtons.forEach((button) => {
  button.addEventListener("click", () => openLightbox(Number(button.dataset.demoIndex), button));
});

document.querySelectorAll("[data-lightbox-close]").forEach((button) => {
  button.addEventListener("click", closeLightbox);
});

document.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => renderDemo(activeIndex - 1));
document.querySelector("[data-lightbox-next]")?.addEventListener("click", () => renderDemo(activeIndex + 1));

document.addEventListener("keydown", (event) => {
  if (lightbox.hidden) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") renderDemo(activeIndex - 1);
  if (event.key === "ArrowRight") renderDemo(activeIndex + 1);
});

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
  const previousButton = carousel.querySelector("[data-demo-prev]");
  const nextButton = carousel.querySelector("[data-demo-next]");
  const dotsContainer = carousel.querySelector("[data-demo-dots]");
  const status = carousel.querySelector("[data-demo-status]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const CONTINUOUS_SPEED = 24;
  let currentPage = 0;
  let dots = [];
  let scrollFrame = null;
  let animationFrame = null;
  let lastTimestamp = null;
  let loopWidth = 0;
  let isHovered = false;
  let isInteracting = false;
  let hasFocus = false;
  let manualPauseUntil = 0;
  let scrollRemainder = 0;

  const clones = slides.map((slide) => {
    const clone = slide.cloneNode(true);
    clone.dataset.demoClone = "true";
    clone.setAttribute("aria-hidden", "true");
    clone.tabIndex = -1;
    clone.querySelectorAll("a, button, input, select, textarea, [tabindex]").forEach((element) => {
      element.tabIndex = -1;
    });
    clone.addEventListener("click", () => openLightbox(Number(clone.dataset.demoIndex), clone));
    track.append(clone);
    return clone;
  });

  const visibleCount = () => Math.max(1, Math.round(track.clientWidth / Math.max(slides[0]?.getBoundingClientRect().width || 1, 1)));
  const pageCount = () => Math.ceil(slides.length / visibleCount());

  function updateControls(page) {
    const total = pageCount();
    currentPage = (page + total) % total;
    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentPage);
      dot.setAttribute("aria-current", index === currentPage ? "true" : "false");
    });
    status.textContent = `${currentPage + 1} de ${total}`;
  }

  function slideOffset(page) {
    const target = slides[Math.min(page * visibleCount(), slides.length - 1)];
    return target ? target.offsetLeft - slides[0].offsetLeft : 0;
  }

  function goTo(page, behavior = "smooth") {
    const total = pageCount();
    const nextPage = (page + total) % total;
    updateControls(nextPage);
    manualPauseUntil = performance.now() + 1100;
    track.scrollTo({ left: slideOffset(nextPage), behavior });
  }

  function rebuildDots() {
    const total = pageCount();
    dotsContainer.replaceChildren();
    dots = Array.from({ length: total }, (_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "demo-dot";
      dot.setAttribute("aria-label", `Ver grupo ${index + 1} de demonstrativos`);
      dot.addEventListener("click", () => {
        goTo(index);
      });
      dotsContainer.append(dot);
      return dot;
    });
    updateControls(Math.min(currentPage, total - 1));
  }

  function measureLoop() {
    loopWidth = clones[0] ? clones[0].offsetLeft - slides[0].offsetLeft : track.scrollWidth / 2;
  }

  function normalizeLoop() {
    if (!loopWidth) return;
    if (track.scrollLeft >= loopWidth) track.scrollLeft -= loopWidth;
    if (track.scrollLeft < 0) track.scrollLeft += loopWidth;
  }

  function canMove(timestamp) {
    return !reducedMotion.matches
      && !document.hidden
      && !document.body.classList.contains("is-lightbox-open")
      && !isHovered
      && !isInteracting
      && !hasFocus
      && timestamp >= manualPauseUntil;
  }

  function animate(timestamp) {
    if (lastTimestamp === null) lastTimestamp = timestamp;
    const elapsed = Math.min(timestamp - lastTimestamp, 64);
    lastTimestamp = timestamp;

    if (canMove(timestamp)) {
      scrollRemainder += CONTINUOUS_SPEED * elapsed / 1000;
      const wholePixels = Math.floor(scrollRemainder);
      if (wholePixels > 0) {
        track.scrollLeft += wholePixels;
        scrollRemainder -= wholePixels;
        normalizeLoop();
      }
    }

    animationFrame = window.requestAnimationFrame(animate);
  }

  previousButton.addEventListener("click", () => {
    normalizeLoop();
    const distance = Math.max(slides[1]?.offsetLeft - slides[0].offsetLeft || 1, 1) * visibleCount();
    if (track.scrollLeft < distance) track.scrollLeft += loopWidth;
    manualPauseUntil = performance.now() + 1100;
    track.scrollBy({ left: -distance, behavior: "smooth" });
  });

  nextButton.addEventListener("click", () => {
    const distance = Math.max(slides[1]?.offsetLeft - slides[0].offsetLeft || 1, 1) * visibleCount();
    manualPauseUntil = performance.now() + 1100;
    track.scrollBy({ left: distance, behavior: "smooth" });
  });

  track.addEventListener("scroll", () => {
    if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(() => {
      const slideDistance = Math.max(slides[1]?.offsetLeft - slides[0].offsetLeft || 1, 1);
      const normalizedPosition = loopWidth ? track.scrollLeft % loopWidth : track.scrollLeft;
      const page = Math.floor((normalizedPosition / slideDistance) / visibleCount());
      if (page !== currentPage) updateControls(page);
    });
  }, { passive: true });

  carousel.addEventListener("pointerdown", () => { isInteracting = true; });
  carousel.addEventListener("pointerup", () => { isInteracting = false; });
  carousel.addEventListener("pointercancel", () => { isInteracting = false; });
  carousel.addEventListener("mouseenter", () => { isHovered = true; });
  carousel.addEventListener("mouseleave", () => { isHovered = false; });
  carousel.addEventListener("focusin", () => { hasFocus = true; });
  carousel.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) hasFocus = false;
  });
  window.addEventListener("resize", () => {
    rebuildDots();
    goTo(0, "auto");
    window.requestAnimationFrame(measureLoop);
  });

  measureLoop();
  rebuildDots();
  goTo(0, "auto");
  manualPauseUntil = 0;
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
