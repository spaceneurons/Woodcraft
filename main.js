import Lenis from "./vendor/lenis.mjs";

document.documentElement.classList.add("motion-ready");

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const lenis = reduced
  ? null
  : new Lenis({
      duration: 1.15,
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.1,
    });

if (lenis) {
  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
  lenis.on("scroll", updateParallax);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    event.preventDefault();
    if (lenis) {
      lenis.scrollTo(target, { offset: -12, duration: 1.35 });
    } else {
      target.scrollIntoView({ behavior: "auto", block: "start" });
    }
  });
});

const form = document.getElementById("request");
if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    form.classList.add("is-sent");
  });
}

function countUp(node) {
  const target = Number(node.dataset.count);
  const suffix = node.dataset.suffix || "";
  if (!Number.isFinite(target)) return;
  if (reduced) {
    node.textContent = `${target}${suffix}`;
    return;
  }
  const start = performance.now();
  const duration = 1200;
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    node.textContent = `${Math.round(target * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };
  node.textContent = `0${suffix}`;
  requestAnimationFrame(tick);
}

const reveals = document.querySelectorAll(".reveal");
if (reduced) {
  reveals.forEach((el) => el.classList.add("is-in"));
} else if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        entry.target.querySelectorAll("[data-count]").forEach(countUp);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
  );
  reveals.forEach((el) => observer.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("is-in"));
}

const photos = document.querySelectorAll("[data-parallax]");

function updateParallax() {
  if (reduced) return;
  const view = window.innerHeight || 1;
  photos.forEach((photo) => {
    const frame = photo.parentElement;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const progress = (rect.top + rect.height / 2 - view / 2) / view;
    const shift = Math.max(-36, Math.min(36, progress * -28));
    photo.style.setProperty("--shift", `${shift}px`);
  });
}

document.querySelectorAll(".faq-item").forEach((item) => {
  const button = item.querySelector("button");
  if (!button) return;
  button.addEventListener("click", () => {
    const list = item.parentElement;
    const willOpen = !item.classList.contains("is-open");
    list.querySelectorAll(".faq-item").forEach((other) => {
      other.classList.remove("is-open");
      const otherButton = other.querySelector("button");
      if (otherButton) otherButton.setAttribute("aria-expanded", "false");
    });
    if (willOpen) {
      item.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
    }
  });
});

if (!lenis) {
  window.addEventListener("scroll", updateParallax, { passive: true });
}
updateParallax();

const panels = document.querySelectorAll(".panel");

function stackPanels() {
  if (reduced) return;
  const view = window.innerHeight;
  panels.forEach((panel) => {
    const extra = Math.max(0, panel.offsetHeight - view);
    panel.style.top = extra ? `${-extra}px` : "0px";
  });
}

if (!reduced) {
  if ("ResizeObserver" in window) {
    const panelSizes = new ResizeObserver(stackPanels);
    panels.forEach((panel) => panelSizes.observe(panel));
  }
  window.addEventListener("resize", stackPanels);
  window.addEventListener("load", stackPanels);
  document.fonts?.ready.then(stackPanels);
  stackPanels();
}
