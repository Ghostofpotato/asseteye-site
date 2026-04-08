/* ============================================
   AssetEye — Main Animations
   ============================================ */

(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  // ---- Lenis smooth scroll ----
  const lenis = new Lenis({
    lerp: 0.08,
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // ---- Scroll progress bar ----
  const progressBar = document.querySelector(".scroll-progress");
  ScrollTrigger.create({
    trigger: document.documentElement,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      progressBar.style.width = (self.progress * 100) + "%";
    },
  });

  // ---- Custom cursor ----
  const cursorDot = document.querySelector(".cursor-dot");
  const cursorRing = document.querySelector(".cursor-ring");
  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  if (!isMobile && cursorDot && cursorRing) {
    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = mouseX + "px";
      cursorDot.style.top = mouseY + "px";
    });

    function animateCursorRing() {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      cursorRing.style.left = ringX + "px";
      cursorRing.style.top = ringY + "px";
      requestAnimationFrame(animateCursorRing);
    }
    animateCursorRing();

    // Hover scale on interactive elements
    const interactiveEls = document.querySelectorAll("a, button, [data-magnetic], .stat-card, .metric-card, .showcase-feature");
    interactiveEls.forEach((el) => {
      el.addEventListener("mouseenter", () => cursorRing.classList.add("hover"));
      el.addEventListener("mouseleave", () => cursorRing.classList.remove("hover"));
    });
  }

  // ---- Magnetic buttons ----
  const magnetics = document.querySelectorAll("[data-magnetic]");
  magnetics.forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.3;
      const dy = (e.clientY - cy) * 0.3;
      gsap.to(btn, { x: dx, y: dy, duration: 0.4, ease: "power2.out" });
    });
    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    });
  });

  // ---- Text split utility ----
  function splitText(el) {
    const text = el.textContent;
    // Check if already split
    if (el.querySelector(".word")) return;

    const html = text
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        const chars = word
          .split("")
          .map((c) => `<span class="char">${c}</span>`)
          .join("");
        return `<span class="word">${chars}</span>`;
      })
      .join(" ");
    el.innerHTML = html;
  }

  // Split all .split-text elements
  document.querySelectorAll(".split-text").forEach(splitText);

  // ---- Hero animations ----
  const heroTl = gsap.timeline({ delay: 0.3 });

  // Animate hero headline chars
  const heroChars = document.querySelectorAll(".hero-headline .char");
  heroTl.to(heroChars, {
    y: 0,
    duration: 0.8,
    ease: "power3.out",
    stagger: 0.025,
  });

  heroTl.to(".hero-sub", {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: "power2.out",
  }, "-=0.3");

  heroTl.to(".hero-cta", {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: "power2.out",
  }, "-=0.4");

  // ---- Hero mouse parallax ----
  if (!isMobile) {
    const heroContent = document.querySelector(".hero-content");
    const heroGradient = document.querySelector(".hero-gradient");

    document.querySelector(".hero").addEventListener("mousemove", (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(heroContent, {
        x: -px * 20,
        y: -py * 15,
        duration: 0.8,
        ease: "power2.out",
      });

      gsap.to(heroGradient, {
        x: px * 30,
        y: py * 20,
        duration: 1.2,
        ease: "power2.out",
      });
    });
  }

  // ---- Section background color transitions ----
  document.querySelectorAll(".section[data-bg]").forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: "top 60%",
      end: "bottom 40%",
      onEnter: () => {
        section.style.setProperty("--section-bg", section.dataset.bg);
        section.style.backgroundColor = section.dataset.bg;
      },
      onEnterBack: () => {
        section.style.setProperty("--section-bg", section.dataset.bg);
        section.style.backgroundColor = section.dataset.bg;
      },
    });
  });

  // ---- Problem section — text reveal + stats ----
  const sectionHeadlines = document.querySelectorAll(".section-headline .char, .cta-headline .char");

  // Batch animate section headline chars per parent
  document.querySelectorAll(".section-headline, .cta-headline").forEach((headline) => {
    const chars = headline.querySelectorAll(".char");
    gsap.to(chars, {
      y: 0,
      duration: 0.6,
      ease: "power3.out",
      stagger: 0.02,
      scrollTrigger: {
        trigger: headline,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });
  });

  // ---- Counter animation utility ----
  function animateCounter(el) {
    const raw = el.dataset.raw;
    if (raw) return; // Static text like "< 60s"

    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const decimals = parseInt(el.dataset.decimals) || 0;
    const obj = { val: 0 };

    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
      onUpdate: () => {
        let display;
        if (target >= 1000) {
          display = Math.round(obj.val).toLocaleString();
        } else {
          display = obj.val.toFixed(decimals);
        }
        el.textContent = prefix + display + suffix;
      },
    });
  }

  document.querySelectorAll(".stat-number, .metric-number").forEach(animateCounter);

  // ---- Stat / metric card staggered entrance ----
  gsap.utils.toArray(".stat-card, .metric-card").forEach((card, i) => {
    gsap.from(card, {
      y: 60,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      delay: i * 0.1,
      scrollTrigger: {
        trigger: card,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  });

  // ---- Card tilt effect ----
  document.querySelectorAll(".tilt-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const px = cx / rect.width - 0.5;
      const py = cy / rect.height - 0.5;

      gsap.to(card, {
        rotateY: px * 12,
        rotateX: -py * 12,
        duration: 0.4,
        ease: "power2.out",
        transformPerspective: 800,
      });

      // Update glow position
      const glow = card.querySelector(".card-glow");
      if (glow) {
        glow.style.setProperty("--glow-x", (cx / rect.width * 100) + "%");
        glow.style.setProperty("--glow-y", (cy / rect.height * 100) + "%");
      }
    });

    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.5)",
      });
    });
  });

  // ---- Product showcase — feature slide-in ----
  const features = gsap.utils.toArray(".showcase-feature");
  features.forEach((feature, i) => {
    gsap.to(feature, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: feature,
        start: "top 80%",
        toggleActions: "play none none none",
      },
      onStart: () => feature.classList.add("active"),
    });
  });

  // ---- How It Works — horizontal scroll ----
  const howSection = document.querySelector(".how");
  const howTrack = document.querySelector(".how-track");

  if (howSection && howTrack) {
    const totalScroll = howTrack.scrollWidth - window.innerWidth;

    const howTween = gsap.to(howTrack, {
      x: () => -totalScroll,
      ease: "none",
      scrollTrigger: {
        trigger: howSection,
        start: "top top",
        end: () => "+=" + (howTrack.scrollWidth),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    // Animate connector lines as they come into view
    gsap.utils.toArray(".connector-line line").forEach((line) => {
      gsap.fromTo(line,
        { strokeDashoffset: 200 },
        {
          strokeDashoffset: 0,
          duration: 1,
          ease: "none",
          scrollTrigger: {
            trigger: line.closest(".how-connector"),
            containerAnimation: howTween,
            start: "left 80%",
            end: "right 20%",
            scrub: 1,
          },
        }
      );
    });

    // Animate steps as they enter
    gsap.utils.toArray(".how-step").forEach((step) => {
      gsap.from(step, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: step,
          containerAnimation: howTween,
          start: "left 75%",
          toggleActions: "play none none none",
        },
      });
    });
  }

  // ---- Trust section — metrics entrance ----
  gsap.utils.toArray(".metric-card").forEach((card, i) => {
    gsap.from(card, {
      y: 40,
      opacity: 0,
      duration: 0.7,
      ease: "power2.out",
      delay: i * 0.1,
      scrollTrigger: {
        trigger: card,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  });

  // ---- CTA button ripple ----
  const ctaBtn = document.querySelector(".cta-button");
  if (ctaBtn) {
    ctaBtn.addEventListener("mouseenter", (e) => {
      const ripple = ctaBtn.querySelector(".cta-button-ripple");
      const rect = ctaBtn.getBoundingClientRect();
      ripple.style.left = (e.clientX - rect.left) + "px";
      ripple.style.top = (e.clientY - rect.top) + "px";
    });
  }

  // ---- Parallax layers ----
  gsap.utils.toArray(".parallax-layer").forEach((layer) => {
    const speed = parseFloat(layer.dataset.speed) || 0.5;
    gsap.to(layer, {
      yPercent: -30 * speed,
      ease: "none",
      scrollTrigger: {
        trigger: layer.closest(".section"),
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });

  // ---- Clip-path reveals ----
  gsap.utils.toArray(".clip-reveal").forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      onEnter: () => el.classList.add("revealed"),
    });
  });

  // ---- Grid overlay subtle parallax ----
  gsap.utils.toArray(".grid-overlay").forEach((grid) => {
    gsap.to(grid, {
      backgroundPosition: "30px 30px",
      ease: "none",
      scrollTrigger: {
        trigger: grid.closest(".section"),
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });

  // ---- Refresh on load ----
  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
  });

})();
