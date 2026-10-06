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
