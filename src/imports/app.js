const menuToggle = document.querySelector(".menu-toggle");
const leadForm = document.querySelector(".lead-form");

menuToggle?.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("menu-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".site-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

leadForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const button = leadForm.querySelector("button");
  const originalText = button.textContent;
  button.textContent = "Solicitud enviada";
  button.disabled = true;

  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
    leadForm.reset();
  }, 1800);
});
