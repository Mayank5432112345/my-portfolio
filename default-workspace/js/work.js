/* ============================================================
   CASE STUDY PAGES — interaction
   ============================================================ */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const header = document.querySelector(".site-header");
  const progress = document.getElementById("scrollProgress");
  const reveals = Array.from(document.querySelectorAll("[data-reveal]"));

  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 20);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? Math.min(y / max, 1) * 100 : 0) + "%";
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-tilt]").forEach((wrap) => {
      const target = wrap.querySelector(".case-cover__frame") || wrap;
      wrap.addEventListener("pointermove", (event) => {
        const rect = wrap.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        target.style.transform = `rotateX(${(-y * 2.4).toFixed(2)}deg) rotateY(${(x * 3.2).toFixed(2)}deg) translateZ(0)`;
      });
      wrap.addEventListener("pointerleave", () => {
        target.style.transform = "rotateX(0deg) rotateY(0deg)";
      });
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
