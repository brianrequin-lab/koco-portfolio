/* ═══════════════════════════════════════════════════
   KOCO. — EXPÉRIENCE IMMERSIVE — INSPIRED BY ORYZO.AI
   Scroll = transformation continue dans l'espace.
   Pas de pages. Pas de défilement visible.
   ═══════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

/* ─── Safety: kill any transform stacking context ─── */
['html','body'].forEach(sel => {
  const el = document.querySelector(sel);
  if (el) {
    el.style.setProperty('will-change','auto','important');
    el.style.setProperty('transform','none','important');
  }
});

/* ─── GPU Hints (targeted, never * or .scene) ─── */
['.s-hero-bg img','.about-bg img','.contact-bg-wrap img',
 '.float-item','.about-left img','.artwork-img img'].forEach(sel => {
  document.querySelectorAll(sel).forEach(el => {
    el.style.willChange = 'transform, opacity';
  });
});

/* ══ LOADER ══ */
(function initLoader() {
  const loader   = document.getElementById('loader');
  const bar      = loader && loader.querySelector('.loader-bar');
  const letters  = loader && loader.querySelectorAll('.loader-text span');
  const numEl    = loader && loader.querySelector('.loader-counter');
  if (!loader) { boot(); return; }

  let progress = 0;
  const tick = setInterval(function() {
    progress = Math.min(100, progress + Math.random() * 18 + 6);
    if (bar) bar.style.width = progress + '%';
    if (numEl) numEl.textContent = Math.floor(progress) + '%';
    if (progress >= 100) {
      clearInterval(tick);
      setTimeout(loaderExit, 320);
    }
  }, 90);

  if (letters && letters.length) {
    gsap.from(letters, {
      yPercent: 110, opacity: 0, duration: 0.9,
      stagger: 0.07, ease: 'expo.out', delay: 0.2
    });
  }

  function loaderExit() {
    gsap.to(loader, {
      yPercent: -100, duration: 1.1, ease: 'expo.inOut',
      onComplete: function() { loader.style.display = 'none'; boot(); }
    });
  }
})();

/* ══ MAIN ENGINE ══ */
function boot() {

  /* — Virtual Scroll Engine — */
  const SCENE_DEPTH = 1400;
  const LERP_EASE   = 0.055;
  const SCENES      = 4;
  const TOTAL_DEPTH = SCENES * SCENE_DEPTH;

  var scrollYTarget = 0;
  var scrollY       = 0;
  var prevScrollY   = 0;
  var velocity      = 0;

  document.body.style.height = (TOTAL_DEPTH + window.innerHeight) + 'px';

  window.addEventListener('wheel', function(e) {
    e.preventDefault();
    scrollYTarget = Math.max(0, Math.min(TOTAL_DEPTH, scrollYTarget + e.deltaY));
  }, { passive: false });

  var touchStartY = 0;
  window.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchmove', function(e) {
    var dy = touchStartY - e.touches[0].clientY;
    touchStartY = e.touches[0].clientY;
    scrollYTarget = Math.max(0, Math.min(TOTAL_DEPTH, scrollYTarget + dy * 2.2));
  }, { passive: true });

  /* — Grain Canvas — */
  var grainCanvas = document.createElement('canvas');
  grainCanvas.id = 'grain';
  grainCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;opacity:0.04;mix-blend-mode:overlay;';
  document.body.appendChild(grainCanvas);
  var grainCtx = grainCanvas.getContext('2d');
  function resizeGrain() {
    grainCanvas.width  = window.innerWidth;
    grainCanvas.height = window.innerHeight;
  }
  resizeGrain();
  window.addEventListener('resize', resizeGrain);
  var grainFrame = 0;
  function drawGrain(speed) {
    grainFrame++;
    if (grainFrame % 3 !== 0) return;
    var w = grainCanvas.width, h = grainCanvas.height;
    var imageData = grainCtx.createImageData(w, h);
    var data = imageData.data;
    var intensity = 160 + Math.min(80, Math.abs(speed) * 10);
    for (var i = 0; i < data.length; i += 4) {
      var v = (Math.random() * intensity) | 0;
      data[i] = data[i+1] = data[i+2] = v;
      data[i+3] = 255;
    }
    grainCtx.putImageData(imageData, 0, 0);
  }

  /* — Progress Bar — */
  var progressFill = document.getElementById('progress-fill');

  /* — Scene Refs — */
  var sceneHero    = document.getElementById('scene-hero');
  var sceneGallery = document.getElementById('scene-gallery');
  var sceneAbout   = document.getElementById('scene-about');
  var sceneContact = document.getElementById('scene-contact');

  /* Parallax inner layers */
  var heroBg     = sceneHero    && sceneHero.querySelector('.s-hero-bg img');
  var heroFloats = sceneHero    && sceneHero.querySelectorAll('.float-item');
  var heroTitle  = sceneHero    && sceneHero.querySelector('.hero-title');
  var heroSub    = sceneHero    && sceneHero.querySelector('.hero-subtitle');
  var heroMeta   = sceneHero    && sceneHero.querySelector('.hero-meta');
  var aboutBg    = sceneAbout   && sceneAbout.querySelector('.about-bg img');
  var aboutLeft  = sceneAbout   && sceneAbout.querySelector('.about-left img');
  var contactBg  = sceneContact && sceneContact.querySelector('.contact-bg-wrap img');
  var contactInner = sceneContact && sceneContact.querySelector('.contact-inner');

  /* Initial opacity states */
  gsap.set(sceneGallery, { opacity: 0 });
  gsap.set(sceneAbout,   { opacity: 0 });
  gsap.set(sceneContact, { opacity: 0 });
  gsap.set(sceneHero,    { opacity: 1 });

  /* Gallery artworks */
  var artworks = sceneGallery && sceneGallery.querySelectorAll('.artwork');
  var galleryAnimated = false;

  /* About / Contact text lines */
  var aboutLines   = sceneAbout   && sceneAbout.querySelectorAll('.abt-inner');
  var contactLines = sceneContact && sceneContact.querySelectorAll('.ct-inner');
  var aboutAnimated   = false;
  var contactAnimated = false;

  if (aboutLines && aboutLines.length)   gsap.set(aboutLines,   { yPercent: 105 });
  if (contactLines && contactLines.length) gsap.set(contactLines, { yPercent: 105 });

  /* — Helpers — */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(v)     { return Math.max(0, Math.min(1, v)); }
  function easeInOut(t)   { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

  /* — RAF Loop — */
  function raf() {
    requestAnimationFrame(raf);
    scrollY   = lerp(scrollY, scrollYTarget, LERP_EASE);
    velocity  = scrollY - prevScrollY;
    prevScrollY = scrollY;
    if (progressFill) progressFill.style.width = (scrollY / TOTAL_DEPTH * 100) + '%';
    drawGrain(velocity);
    handleScenes(scrollY);
  }

  /* — Scene Transitions — */
  function handleScenes(sy) {
    var p = sy / SCENE_DEPTH; // 0–4

    /* HERO (0–1) */
    var heroP   = clamp01(p);
    var hFadeOut = clamp01((heroP - 0.55) / 0.4);
    sceneHero.style.opacity = String(1 - easeInOut(hFadeOut));
    sceneHero.style.zIndex  = hFadeOut < 1 ? '10' : '5';
    if (heroBg) {
      heroBg.style.transform = 'scale(' + (1 + heroP * 0.07) + ') translateY(' + (heroP * -30) + 'px)';
    }
    if (heroTitle) heroTitle.style.transform = 'translateY(' + (heroP * -45) + 'px)';
    if (heroSub)   heroSub.style.transform   = 'translateY(' + (heroP * -28) + 'px)';
    if (heroMeta)  heroMeta.style.transform  = 'translateY(' + (heroP * -18) + 'px)';
    if (heroFloats && heroFloats.length) {
      var rates = [0.12, -0.18, 0.22, -0.14, 0.16];
      for (var f = 0; f < heroFloats.length; f++) {
        heroFloats[f].style.transform = 'translateY(' + (sy * rates[f % rates.length]) + 'px)';
      }
    }

    /* GALLERY (1–2) */
    var galP    = clamp01(p - 1);
    var gFadeIn = clamp01(galP / 0.4);
    var gFadeOut= clamp01((galP - 0.6) / 0.4);
    var gOp     = easeInOut(gFadeIn) * (1 - easeInOut(gFadeOut));
    sceneGallery.style.opacity = String(gOp);
    sceneGallery.style.zIndex  = gOp > 0.01 ? '12' : '5';
    if (gOp > 0.15 && !galleryAnimated && artworks && artworks.length) {
      galleryAnimated = true;
      gsap.fromTo(artworks,
        { opacity: 0, y: 50, scale: 0.93 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.08, ease: 'expo.out' }
      );
    }
    var galLabel = sceneGallery && sceneGallery.querySelector('.gallery-label');
    if (galLabel) galLabel.style.transform = 'translateX(' + ((galP - 0.5) * -35) + 'px)';

    /* ABOUT (2–3) */
    var abtP    = clamp01(p - 2);
    var aFadeIn = clamp01(abtP / 0.4);
    var aFadeOut= clamp01((abtP - 0.6) / 0.4);
    var aOp     = easeInOut(aFadeIn) * (1 - easeInOut(aFadeOut));
    sceneAbout.style.opacity = String(aOp);
    sceneAbout.style.zIndex  = aOp > 0.01 ? '14' : '5';
    if (aOp > 0.2 && !aboutAnimated && aboutLines && aboutLines.length) {
      aboutAnimated = true;
      gsap.to(aboutLines, { yPercent: 0, duration: 1.0, stagger: 0.14, ease: 'expo.out' });
    }
    if (aboutBg) aboutBg.style.transform = 'scale(' + (1 + abtP * 0.06) + ') translateY(' + ((abtP - 0.5) * -40) + 'px)';
    if (aboutLeft) aboutLeft.style.transform = 'translateY(' + ((abtP - 0.5) * -28) + 'px)';

    /* CONTACT (3–4) */
    var cntP    = clamp01(p - 3);
    var cFadeIn = clamp01(cntP / 0.5);
    var cOp     = easeInOut(cFadeIn);
    sceneContact.style.opacity = String(cOp);
    sceneContact.style.zIndex  = cOp > 0.01 ? '16' : '5';
    if (cOp > 0.2 && !contactAnimated && contactLines && contactLines.length) {
      contactAnimated = true;
      gsap.to(contactLines, { yPercent: 0, duration: 1.0, stagger: 0.16, ease: 'expo.out' });
    }
    if (contactBg) contactBg.style.transform = 'scale(' + (1 + cntP * 0.06) + ') translateY(' + ((cntP - 0.5) * -35) + 'px)';
    if (contactInner) contactInner.style.transform = 'translateX(' + ((cntP - 0.5) * -22) + 'px)';
  }

  /* — Custom Cursor — */
  var dot  = document.getElementById('cursor-dot');
  var ring = document.getElementById('cursor-ring');
  var mouseX = 0, mouseY = 0;
  var ringX  = 0, ringY  = 0;
  var prevMX = 0, prevMY = 0;
  var cVelX  = 0, cVelY  = 0;

  window.addEventListener('mousemove', function(e) {
    mouseX = e.clientX; mouseY = e.clientY;
  });

  (function cursorLoop() {
    requestAnimationFrame(cursorLoop);
    cVelX = mouseX - prevMX;
    cVelY = mouseY - prevMY;
    prevMX = mouseX; prevMY = mouseY;
    ringX = lerp(ringX, mouseX, 0.12);
    ringY = lerp(ringY, mouseY, 0.12);
    if (dot) dot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px)';
    if (ring) {
      var speed   = Math.sqrt(cVelX*cVelX + cVelY*cVelY);
      var squeeze = 1 + speed * 0.009;
      var angle   = Math.atan2(cVelY, cVelX) * 180 / Math.PI;
      ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px) rotate(' + angle + 'deg) scaleX(' + squeeze + ') scaleY(' + (1/squeeze) + ')';
    }
  })();

  document.querySelectorAll('a, .artwork, button').forEach(function(el) {
    el.addEventListener('mouseenter', function() {
      if (ring) ring.classList.add('is-hovering');
      if (dot)  dot.classList.add('is-hovering');
    });
    el.addEventListener('mouseleave', function() {
      if (ring) ring.classList.remove('is-hovering');
      if (dot)  dot.classList.remove('is-hovering');
    });
  });

  /* — Navbar — */
  var navbar = document.getElementById('navbar');
  var lastNavSY = 0;
  setInterval(function() {
    var dir = scrollY - lastNavSY;
    lastNavSY = scrollY;
    if (dir > 0.5 && scrollY > 80) navbar && navbar.classList.add('hidden');
    else if (dir < -0.5) navbar && navbar.classList.remove('hidden');
  }, 120);

  /* — Nav links — */
  document.querySelectorAll('[data-target]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      scrollYTarget = parseInt(link.dataset.target, 10) * SCENE_DEPTH;
    });
  });

  /* — Lightbox — */
  var paintings = [
    { src:'painting-1.jpg', title:'Sans titre I',   desc:'Huile sur toile · 80x60 cm · 2023' },
    { src:'painting-2.jpg', title:'Lumiere bleue',  desc:'Acrylique · 60x80 cm · 2022' },
    { src:'painting-3.jpg', title:'La Foret',       desc:'Huile sur toile · 90x70 cm · 2023' },
    { src:'painting-4.jpg', title:'Equilibre',      desc:'Technique mixte · 50x50 cm · 2022' },
    { src:'painting-5.jpg', title:'Horizon',        desc:'Huile sur toile · 100x75 cm · 2024' },
    { src:'painting-6.jpg', title:'Resonance',      desc:'Acrylique · 70x90 cm · 2023' },
    { src:'painting-7.jpg', title:'Introspection',  desc:'Huile sur bois · 40x60 cm · 2024' },
  ];
  var lightbox  = document.getElementById('lightbox');
  var lbImg     = document.getElementById('lightbox-img');
  var lbNum     = document.getElementById('lightbox-num');
  var lbTitle   = document.getElementById('lightbox-title');
  var lbDesc    = document.getElementById('lightbox-desc');
  var curPainting = 0;

  function openLightbox(idx) {
    curPainting = idx;
    var p = paintings[idx];
    if (lbImg)   lbImg.src = p.src;
    if (lbNum)   lbNum.textContent   = ('0'+(idx+1)).slice(-2) + ' / ' + ('0'+paintings.length).slice(-2);
    if (lbTitle) lbTitle.textContent = p.title;
    if (lbDesc)  lbDesc.textContent  = p.desc;
    if (lightbox) lightbox.classList.add('active');
    gsap.fromTo(lightbox, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
  }

  function closeLightbox() {
    gsap.to(lightbox, {
      opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: function() { if (lightbox) lightbox.classList.remove('active'); }
    });
  }

  document.querySelectorAll('.artwork').forEach(function(el, i) {
    el.addEventListener('click', function() { openLightbox(i); });
  });

  var lbClose = lightbox && lightbox.querySelector('.lb-close');
  var lbPrev  = lightbox && lightbox.querySelector('.lb-prev');
  var lbNext  = lightbox && lightbox.querySelector('.lb-next');
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev)  lbPrev.addEventListener('click', function() {
    openLightbox((curPainting - 1 + paintings.length) % paintings.length);
  });
  if (lbNext) lbNext.addEventListener('click', function() {
    openLightbox((curPainting + 1) % paintings.length);
  });
  if (lightbox) lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) closeLightbox();
  });
  window.addEventListener('keydown', function(e) {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    if (e.key === 'ArrowLeft')  lbPrev && lbPrev.click();
    if (e.key === 'ArrowRight') lbNext && lbNext.click();
    if (e.key === 'Escape')     closeLightbox();
  });

  /* — Hero Entry Animation — */
  var heroEls = [heroTitle, heroSub, heroMeta].filter(Boolean);
  if (heroEls.length) {
    gsap.from(heroEls, { opacity: 0, y: 32, duration: 1.2, stagger: 0.18, ease: 'expo.out', delay: 0.1 });
  }
  if (heroBg) {
    gsap.from(heroBg, { scale: 1.1, opacity: 0, duration: 1.8, ease: 'expo.out' });
  }
  if (heroFloats && heroFloats.length) {
    gsap.from(heroFloats, { opacity: 0, scale: 0.83, duration: 1.1, stagger: 0.12, ease: 'expo.out', delay: 0.5 });
  }

  /* — Start — */
  raf();
}
