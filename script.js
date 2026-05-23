/* ═══════════════════════════════════════════════════
   KOCO. — EXPÉRIENCE IMMERSIVE — INSPIRED BY ORYZO.AI
   Scroll = transformation continue dans l'espace.
   Pas de pages. Pas de défilement visible.
   ═══════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

/* ─── Safety: kill any transform stacking context ─── */
['html','body'].forEach(function(sel) {
  var el = document.querySelector(sel);
  if (el) {
    el.style.setProperty('will-change','auto','important');
    el.style.setProperty('transform','none','important');
  }
});

/* ─── GPU Hints (targeted, never * or .scene) ─── */
['.s-bg img','.about-bg img','.contact-bg-wrap img',
 '.hero-float','.artwork-img'].forEach(function(sel) {
  document.querySelectorAll(sel).forEach(function(el) {
    el.style.willChange = 'transform, opacity';
  });
});

/* ══ LOADER ══ */
(function initLoader() {
  var loader  = document.getElementById('loader');
  var bar     = loader && loader.querySelector('.loader-bar');
  var letters = loader && loader.querySelectorAll('.loader-text span');
  var numEl   = loader && loader.querySelector('.loader-counter');
  if (!loader) { boot(); return; }

  var progress = 0;
  var tick = setInterval(function() {
    progress = Math.min(100, progress + Math.random() * 18 + 6);
    if (bar)   bar.style.width = progress + '%';
    if (numEl) numEl.textContent = String(Math.floor(progress)).padStart(3,'0');
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
    var bootCalled = false;
    function doBoot() {
      if (bootCalled) return; bootCalled = true;
      loader.style.display = 'none'; boot();
    }
    gsap.to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut', onComplete: doBoot });
    setTimeout(doBoot, 4500); /* safety if GSAP RAF freezes */
  }
})();

/* ══ MAIN ENGINE ══ */
function boot() {

  /* — Virtual Scroll — */
  var SCENE_DEPTH = 1400;
  var LERP_EASE   = 0.055;
  var SCENES      = 4;
  var TOTAL_DEPTH = SCENES * SCENE_DEPTH;

  var scrollYTarget = 0;
  var scrollY       = 0;
  var prevScrollY   = 0;
  var velocity      = 0;

  /* Lock native scroll — virtual engine only */
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.body.style.height = '100vh';

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
  function resizeGrain() { grainCanvas.width = window.innerWidth; grainCanvas.height = window.innerHeight; }
  resizeGrain();
  window.addEventListener('resize', resizeGrain);
  var grainFrame = 0;
  function drawGrain(speed) {
    if (++grainFrame % 3 !== 0) return;
    var w = grainCanvas.width, h = grainCanvas.height;
    var img = grainCtx.createImageData(w, h);
    var d = img.data;
    var intens = 155 + Math.min(80, Math.abs(speed) * 10);
    for (var i = 0; i < d.length; i += 4) {
      var v = (Math.random() * intens) | 0;
      d[i] = d[i+1] = d[i+2] = v; d[i+3] = 255;
    }
    grainCtx.putImageData(img, 0, 0);
  }

  /* — Progress — */
  var progressFill = document.getElementById('progress-fill');

  /* — Scene Refs — */
  var sceneHero    = document.getElementById('scene-hero');
  var sceneGallery = document.getElementById('scene-gallery');
  var sceneAbout   = document.getElementById('scene-about');
  var sceneContact = document.getElementById('scene-contact');

  /* — Parallax layers (correct selectors from actual HTML) — */
  var heroBg       = sceneHero    && sceneHero.querySelector('.s-bg img');
  var heroFloats   = sceneHero    && sceneHero.querySelectorAll('.hero-float');
  var heroTitle    = sceneHero    && sceneHero.querySelector('.hero-title');
  var heroSub      = sceneHero    && sceneHero.querySelector('.hero-sub');
  var heroGiant    = sceneHero    && sceneHero.querySelector('.hero-giant-text');
  var aboutBg      = sceneAbout   && sceneAbout.querySelector('.about-bg img');
  var aboutContent = sceneAbout   && sceneAbout.querySelector('.about-content');
  var contactBg    = sceneContact && sceneContact.querySelector('.contact-bg-wrap img');
  var contactContent = sceneContact && sceneContact.querySelector('.contact-content');

  /* — Initial states — */
  gsap.set(sceneGallery, { opacity: 0 });
  gsap.set(sceneAbout,   { opacity: 0 });
  gsap.set(sceneContact, { opacity: 0 });
  gsap.set(sceneHero,    { opacity: 1 });

  /* — Text reveal lines — */
  var aboutLines   = sceneAbout   && sceneAbout.querySelectorAll('.abt-inner');
  var contactLines = sceneContact && sceneContact.querySelectorAll('.ct-inner');
  var galleryAnimated = false, aboutAnimated = false, contactAnimated = false;
  if (aboutLines && aboutLines.length)   gsap.set(aboutLines,   { yPercent: 105 });
  if (contactLines && contactLines.length) gsap.set(contactLines, { yPercent: 105 });

  /* — Gallery artworks — */
  var artworks = sceneGallery && sceneGallery.querySelectorAll('.artwork');

  /* — Helpers — */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v)       { return Math.max(0, Math.min(1, v)); }
  function ease(t)        { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

  /* — RAF Loop — */
  function raf() {
    requestAnimationFrame(raf);
    scrollY     = lerp(scrollY, scrollYTarget, LERP_EASE);
    velocity    = scrollY - prevScrollY;
    prevScrollY = scrollY;
    if (progressFill) progressFill.style.width = (scrollY / TOTAL_DEPTH * 100) + '%';
    drawGrain(velocity);
    handleScenes(scrollY);
  }

  /* — Scene Transitions — */
  function handleScenes(sy) {
    var p = sy / SCENE_DEPTH; // 0→4

    /* ── HERO (0→1) ── */
    var hp = clamp(p);
    var hOut = clamp((hp - 0.55) / 0.4);
    sceneHero.style.opacity = String(1 - ease(hOut));
    sceneHero.style.zIndex  = hOut < 1 ? '10' : '5';

    /* BG parallax: slow zoom + drift */
    if (heroBg) heroBg.style.transform = 'scale(' + (1 + hp * 0.07) + ') translateY(' + (hp * -30) + 'px)';
    /* Giant text: drifts up faster */
    if (heroGiant) heroGiant.style.transform = 'translateY(' + (hp * -60) + 'px)';
    /* Title: medium drift */
    if (heroTitle) heroTitle.style.transform = 'translateY(' + (hp * -40) + 'px)';
    /* Sub: slow drift */
    if (heroSub) heroSub.style.transform = 'translateY(' + (hp * -22) + 'px)';
    /* Floats: different rates per element */
    if (heroFloats && heroFloats.length) {
      var rates = [0.14, -0.20, 0.18, -0.12];
      for (var f = 0; f < heroFloats.length; f++) {
        heroFloats[f].style.transform = 'translateY(' + (sy * rates[f % rates.length]) + 'px)';
      }
    }

    /* ── GALLERY (1→2) ── */
    var gp  = clamp(p - 1);
    var gIn = clamp(gp / 0.4), gOut = clamp((gp - 0.6) / 0.4);
    var gOp = ease(gIn) * (1 - ease(gOut));
    sceneGallery.style.opacity = String(gOp);
    sceneGallery.style.zIndex  = gOp > 0.01 ? '12' : '5';
    if (gOp > 0.15 && !galleryAnimated && artworks && artworks.length) {
      galleryAnimated = true;
      gsap.fromTo(artworks,
        { opacity: 0, y: 55, scale: 0.92 },
        { opacity: 1, y: 0,  scale: 1, duration: 0.9, stagger: 0.07, ease: 'expo.out' }
      );
    }
    /* Gallery header parallax */
    var galHeader = sceneGallery && sceneGallery.querySelector('.gallery-header');
    if (galHeader) galHeader.style.transform = 'translateX(' + ((gp - 0.5) * -40) + 'px)';

    /* ── ABOUT (2→3) ── */
    var ap  = clamp(p - 2);
    var aIn = clamp(ap / 0.4), aOut = clamp((ap - 0.6) / 0.4);
    var aOp = ease(aIn) * (1 - ease(aOut));
    sceneAbout.style.opacity = String(aOp);
    sceneAbout.style.zIndex  = aOp > 0.01 ? '14' : '5';
    if (aOp > 0.2 && !aboutAnimated && aboutLines && aboutLines.length) {
      aboutAnimated = true;
      gsap.to(aboutLines, { yPercent: 0, duration: 1.0, stagger: 0.14, ease: 'expo.out' });
    }
    if (aboutBg) aboutBg.style.transform = 'scale(' + (1 + ap * 0.06) + ') translateY(' + ((ap - 0.5) * -40) + 'px)';
    if (aboutContent) aboutContent.style.transform = 'translateX(' + ((ap - 0.5) * -25) + 'px)';

    /* ── CONTACT (3→4) ── */
    var cp  = clamp(p - 3);
    var cIn = clamp(cp / 0.5);
    var cOp = ease(cIn);
    sceneContact.style.opacity = String(cOp);
    sceneContact.style.zIndex  = cOp > 0.01 ? '16' : '5';
    if (cOp > 0.2 && !contactAnimated && contactLines && contactLines.length) {
      contactAnimated = true;
      gsap.to(contactLines, { yPercent: 0, duration: 1.0, stagger: 0.16, ease: 'expo.out' });
    }
    if (contactBg) contactBg.style.transform = 'scale(' + (1 + cp * 0.06) + ') translateY(' + ((cp - 0.5) * -35) + 'px)';
    if (contactContent) contactContent.style.transform = 'translateX(' + ((cp - 0.5) * -20) + 'px)';
  }

  /* — Custom Cursor — */
  var dot  = document.getElementById('cursor-dot');
  var ring = document.getElementById('cursor-ring');
  var mx = 0, my = 0, rx = 0, ry = 0, pvx = 0, pvy = 0, cvx = 0, cvy = 0;
  window.addEventListener('mousemove', function(e) { mx = e.clientX; my = e.clientY; });
  (function cursorLoop() {
    requestAnimationFrame(cursorLoop);
    cvx = mx - pvx; cvy = my - pvy; pvx = mx; pvy = my;
    rx = lerp(rx, mx, 0.12); ry = lerp(ry, my, 0.12);
    if (dot)  dot.style.transform  = 'translate(' + mx + 'px,' + my + 'px)';
    if (ring) {
      var spd = Math.sqrt(cvx*cvx + cvy*cvy);
      var sq  = 1 + spd * 0.009;
      var ang = Math.atan2(cvy, cvx) * 180 / Math.PI;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) rotate(' + ang + 'deg) scaleX(' + sq + ') scaleY(' + (1/sq) + ')';
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

  /* — Navbar hide/show — */
  var navbar = document.getElementById('navbar');
  var lastNavSY = 0;
  setInterval(function() {
    var dir = scrollY - lastNavSY; lastNavSY = scrollY;
    if (dir > 0.5 && scrollY > 80) navbar && navbar.classList.add('hidden');
    else if (dir < -0.5)           navbar && navbar.classList.remove('hidden');
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
    { src:'painting-7.jpg', title:'Introspection',  desc:'Huile sur bois · 40x60 cm · 2024' }
  ];
  var lightbox = document.getElementById('lightbox');
  var lbImg    = document.getElementById('lightbox-img');
  var lbNum    = document.getElementById('lightbox-num');
  var lbTitle  = document.getElementById('lightbox-title');
  var lbDesc   = document.getElementById('lightbox-desc');
  var curP = 0;

  function openLightbox(idx) {
    curP = idx;
    var p = paintings[idx];
    if (lbImg)   lbImg.src = p.src;
    if (lbNum)   lbNum.textContent   = String(idx+1).padStart(2,'0') + ' / ' + String(paintings.length).padStart(2,'0');
    if (lbTitle) lbTitle.textContent = p.title;
    if (lbDesc)  lbDesc.textContent  = p.desc;
    if (lightbox) lightbox.classList.add('active');
    gsap.fromTo(lightbox, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
  }
  function closeLightbox() {
    gsap.to(lightbox, { opacity: 0, duration: 0.3, ease: 'power2.in',
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
  if (lbPrev)  lbPrev.addEventListener('click', function() { openLightbox((curP-1+paintings.length)%paintings.length); });
  if (lbNext)  lbNext.addEventListener('click', function() { openLightbox((curP+1)%paintings.length); });
  if (lightbox) lightbox.addEventListener('click', function(e) { if (e.target===lightbox) closeLightbox(); });
  window.addEventListener('keydown', function(e) {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    if (e.key==='ArrowLeft')  lbPrev && lbPrev.click();
    if (e.key==='ArrowRight') lbNext && lbNext.click();
    if (e.key==='Escape')     closeLightbox();
  });

  /* — Hero entry animation — */
  var heroEls = [heroTitle, heroSub].filter(Boolean);
  if (heroEls.length) gsap.from(heroEls, { opacity:0, y:32, duration:1.2, stagger:0.18, ease:'expo.out', delay:0.1 });
  if (heroBg) gsap.from(heroBg, { scale:1.1, opacity:0, duration:1.8, ease:'expo.out' });
  if (heroGiant) gsap.from(heroGiant, { opacity:0, x:-40, duration:1.4, ease:'expo.out', delay:0.2 });
  if (heroFloats && heroFloats.length) gsap.from(heroFloats, { opacity:0, scale:0.82, duration:1.1, stagger:0.14, ease:'expo.out', delay:0.5 });

  /* — Start — */
  raf();
}
