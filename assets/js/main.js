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

const TESTIMONIAL_INTERVAL = 6000;

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
    autoTimer = window.setInterval(() => goTo(currentIndex + 1), TESTIMONIAL_INTERVAL);
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
