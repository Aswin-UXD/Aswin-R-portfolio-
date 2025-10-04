// Section swapping, active link highlighting, and horizontal carousel controls
document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav-link[data-target], .dropdown-item[data-target]");
  const sections = document.querySelectorAll(".section");

  // Show specified section and hide others
  const showSection = (id) => {
    sections.forEach((sec) => {
      sec.classList.toggle("active", sec.id === id);
    });
  };

  // Set active class on nav link
  const setActiveLink = (link) => {
    document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
    if (link.classList.contains("nav-link")) link.classList.add("active");
  };

  // Click handlers for nav links and dropdown items
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("data-target");
      if (!targetId) return;

      showSection(targetId);
      setActiveLink(link);

      // Close mobile menu after selection
      const navMenu = document.getElementById("navMenu");
      if (navMenu && navMenu.classList.contains("show")) {
        const collapse = bootstrap.Collapse.getInstance(navMenu) || new bootstrap.Collapse(navMenu, { toggle: false });
        collapse.hide();
      }
    });
  });

  // Initialize all carousel-grid components
  document.querySelectorAll(".carousel-grid").forEach((root) => initCarousel(root));

  // Keyboard navigation for active section's carousel
  document.addEventListener("keydown", (e) => {
    const activeSection = document.querySelector(".section.active");
    if (!activeSection) return;
    const carousel = activeSection.querySelector(".carousel-grid");
    if (!carousel) return;

    if (e.key === "ArrowLeft") carousel.querySelector(".carousel-arrow.prev")?.click();
    if (e.key === "ArrowRight") carousel.querySelector(".carousel-arrow.next")?.click();
  });
});

// Horizontal carousel with 2 visible items (1 on mobile)
function initCarousel(root) {
  const track = root.querySelector(".track");
  const cards = Array.from(root.querySelectorAll(".grid-card"));
  const prev = root.querySelector(".carousel-arrow.prev");
  const next = root.querySelector(".carousel-arrow.next");
  const viewport = root.querySelector(".viewport");

  let index = 0;

  const getGap = () => 16; // keep in sync with CSS
  const update = () => {
    if (!cards.length) return;
    const gap = getGap();
    const cardWidth = cards[0].clientWidth;
    const vpWidth = viewport.clientWidth;

    // Compute visible count (approx): avoid overscroll
    const visibleCount = Math.max(1, Math.round(vpWidth / (cardWidth + gap)));
    const maxIndex = Math.max(0, cards.length - visibleCount);

    index = Math.min(Math.max(index, 0), maxIndex);
    const offset = index * (cardWidth + gap);

    track.style.transform = `translateX(${-offset}px)`;
  };

  const toPrev = () => { index -= 1; update(); };
  const toNext = () => { index += 1; update(); };

  prev?.addEventListener("click", toPrev);
  next?.addEventListener("click", toNext);
  window.addEventListener("resize", update);

  // Drag to scroll (desktop and mobile)
  let isDown = false, startX = 0, startTransform = 0;
  const getCurrentOffset = () => {
    const style = getComputedStyle(track).transform;
    if (style === "none") return 0;
    const matrix = new DOMMatrixReadOnly(style);
    return matrix.m41; // translateX value
  };

  const onDown = (e) => {
    isDown = true;
    startX = (e.touches ? e.touches[0].clientX : e.clientX);
    startTransform = getCurrentOffset();
    track.style.transition = "none";
  };
  const onMove = (e) => {
    if (!isDown) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    const delta = x - startX;
    track.style.transform = `translateX(${startTransform + delta}px)`;
  };
  const onUp = () => {
    if (!isDown) return;
    isDown = false;
    track.style.transition = ""; // restore
    // Snap to nearest card
    const gap = 16;
    const cardWidth = cards[0].clientWidth;
    const current = -getCurrentOffset();
    const snapped = Math.round(current / (cardWidth + gap));
    index = snapped;
    update();
  };

  viewport.addEventListener("mousedown", onDown);
  viewport.addEventListener("mousemove", onMove);
  viewport.addEventListener("mouseup", onUp);
  viewport.addEventListener("mouseleave", onUp);
  viewport.addEventListener("touchstart", onDown, { passive: true });
  viewport.addEventListener("touchmove", onMove, { passive: true });
  viewport.addEventListener("touchend", onUp);

  // Initialize after layout paints
  setTimeout(update, 0);
}
