/* ===== KOCO. — SCRIPT CINÉMATIQUE v3 ===== */
/* Loader + GSAP + ScrollTrigger + Lenis      */

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  /* ─────────────────────────────────────────
     DONNÉES DES ŒUVRES
  ───────────────────────────────────────── */
  const artworkData = [
    { num:'01', title:'Sans titre 01', desc:'Acrylique sur toile — 2025' },
    { num:'02', title:'Sans titre 02', desc:'Acrylique et spray sur toile — 2025' },
    { num:'03', title:'Sans titre 03', desc:'Acrylique sur toile — 2025' },
    { num:'04', title:'Sans titre 04', desc:'Acrylique sur toile — 2025' },
    { num:'05', title:'Sans titre 05', desc:'Acrylique et stylo sur toile — 2025' },
    { num:'06', title:'Sans titre 06', desc:'Acrylique et spray sur toile — 2025' },
    { num:'07', title:'Sans titre 07', desc:'Acrylique sur toile — 2025' },
  ];

  /* ─────────────────────────────────────────
     WILL-CHANGE GPU bootstrap
  ───────────────────────────────────────── */
  gsap.set([
    '#hero', '.hero-bg', '.hero-img-bg img', '.hero-content',
    '.float-item', '.title-inner', '.title-period',
    '.artwork', '.artwork-img-wrap img',
    '.about-image-frame', '.about-img',
    '.contact-bg-art img', '.marquee-track',
    '#navbar', '#loader'
  ], { force3D: true, willChange: 'transform, opacity' });

  /* ─────────────────────────────────────────
     1.  LOADER CINÉMATIQUE
  ───────────────────────────────────────── */
  const loader     = document.getElementById('loader');
  const loaderBar  = loader.querySelector('.loader-bar');
  const loaderLetters = loader.querySelectorAll('.loader-text span');
  const loaderCounter = loader.querySelector('.loader-counter');

  // Counter animation
  let count = 0;
  const counterTL = gsap.timeline();
  counterTL.to(loaderCounter, { opacity: 1, duration: 0.3 });

  const countInterval = setInterval(() => {
    count += Math.ceil(Math.random() * 15);
    if (count >= 100) { count = 100; clearInterval(countInterval); }
    loaderCounter.textContent = String(count).padStart(3, '0');
  }, 60);

  // Barre de chargement
  gsap.to(loaderBar, { width: '100%', duration: 2.2, ease: 'power2.inOut' });

  // Lettres tombantes
  gsap.to(loaderLetters, {
    y: 0, duration: 1, stagger: 0.07, ease: 'expo.out',
    delay: 0.3, force3D: true
  });

  // Exit du loader
  const loaderExit = gsap.timeline({ delay: 2.5 });
  loaderExit
    .to(loaderLetters, {
      y: '-110%', duration: 0.8, stagger: 0.04,
      ease: 'expo.in', force3D: true
    })
    .to(loaderCounter, { opacity: 0, duration: 0.3 }, '-=0.6')
    .to(loader, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.9, ease: 'expo.inOut'
    }, '-=0.2')
    .set(loader, { display: 'none' })
    .add(() => initAnimations(), '-=0.3');

  /* ─────────────────────────────────────────
     2.  INIT (après loader)
  ───────────────────────────────────────── */
  function initAnimations() {

    /* ── LENIS ──────────────────────────── */
    const lenis = new Lenis({
      duration: 1.6,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    });
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.on('scroll', ScrollTrigger.update);

    /* ── PROGRESS BAR ────────────────────── */
    const progressFill = document.getElementById('progress-fill');
    lenis.on('scroll', ({ progress }) => {
      gsap.set(progressFill, { width: (progress * 100) + '%' });
    });

    /* ── CURSEUR MAGNÉTIQUE ──────────────── */
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    const ringLabel = ring.querySelector('.cursor-label');
    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    gsap.ticker.add(() => {
      gsap.set(dot, { x: mx, y: my });
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      gsap.set(ring, { x: rx, y: ry });
    });

    // Hover sur liens/boutons
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => {
        gsap.to(ring, { width: 56, height: 56, borderColor: 'var(--c-gold)', duration: 0.35, ease: 'power2.out' });
        gsap.to(dot, { scale: 0, duration: 0.2 });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(ring, { width: 36, height: 36, borderColor: 'var(--c-gold)', duration: 0.35, ease: 'power2.out' });
        gsap.to(dot, { scale: 1, duration: 0.2 });
        gsap.to(ringLabel, { opacity: 0, scale: 0.5, duration: 0.2 });
      });
    });

    // Hover sur les œuvres — curseur "VOIR"
    document.querySelectorAll('.artwork').forEach(el => {
      el.addEventListener('mouseenter', () => {
        gsap.to(ring, { width: 72, height: 72, duration: 0.4, ease: 'back.out(2)' });
        gsap.to(dot, { scale: 0, duration: 0.2 });
        gsap.to(ringLabel, { opacity: 1, scale: 1, duration: 0.3 });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(ring, { width: 36, height: 36, duration: 0.35, ease: 'power2.out' });
        gsap.to(dot, { scale: 1, duration: 0.2 });
        gsap.to(ringLabel, { opacity: 0, scale: 0.5, duration: 0.2 });
      });
    });

    /* ── NAV HIDE/SHOW ───────────────────── */
    const navbar = document.getElementById('navbar');
    let lastScrollY = 0;
    lenis.on('scroll', ({ scroll }) => {
      const dir = scroll - lastScrollY;
      if (scroll > 100) {
        gsap.to(navbar, { y: dir > 3 ? -100 : 0, duration: 0.5, ease: 'power2.out' });
      } else {
        gsap.to(navbar, { y: 0, duration: 0.4 });
      }
      lastScrollY = scroll;
    });

    /* ── NAVIGATION DOUCE ────────────────── */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) lenis.scrollTo(target, { offset: -80, duration: 1.8 });
      });
    });

    /* ─────────────────────────────────────────
       3.  HERO — ouverture cinématique
    ───────────────────────────────────────── */
    const heroTL = gsap.timeline({ defaults: { ease: 'expo.out', force3D: true } });

    // Rideau qui s'ouvre
    heroTL
      .to('.hero-curtain.left',  { xPercent: -100, duration: 1.4, ease: 'expo.inOut' })
      .to('.hero-curtain.right', { xPercent: 100,  duration: 1.4, ease: 'expo.inOut' }, '<')

      // Image fond apparaît
      .to('.hero-img-bg img', { opacity: 1, scale: 1, duration: 1.6, ease: 'power2.out' }, '-=0.8')

      // Orbes
      .to('.hero-orb', { opacity: 1, duration: 1.2, stagger: 0.2 }, '-=1.2')

      // Eyebrow line
      .to('.eyebrow-line', { scaleX: 1, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.8')
      .to('.eyebrow-text', { opacity: 1, duration: 0.5 }, '-=0.4')

      // Titre monumentale
      .to('.title-inner', { y: 0, duration: 1.0, stagger: 0.12 }, '-=0.5')
      .to('.title-period', { y: 0, duration: 0.8 }, '-=0.5')

      // Meta items
      .to(['.meta-item', '.meta-dot'], { y: 0, opacity: 1, duration: 0.7, stagger: 0.06 }, '-=0.4')
      .to('.hero-sub', { y: 0, opacity: 1, duration: 0.6 }, '-=0.3')

      // Miniatures flottantes
      .to('.float-1', { opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.3)' }, '-=0.4')
      .to('.float-2', { opacity: 1, y: 0, duration: 0.8, delay: 0.1, ease: 'back.out(1.3)' }, '<')
      .to('.float-3', { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'back.out(1.3)' }, '<')

      // Numéro et scroll hint
      .to('.scene-number', { opacity: 1, duration: 0.5 }, '-=0.3')
      .to('.scroll-hint', { opacity: 1, duration: 0.5 }, '-=0.3');

    // Préparer les floats
    gsap.set(['.float-1','.float-2','.float-3'], { y: 30 });

    /* Parallaxe hero au scroll */
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1.5,
      onUpdate: self => {
        const p = self.progress;
        gsap.set('.hero-img-bg img', { y: p * 150, scale: 1 + p * 0.05 });
        gsap.set('.hero-content', { y: p * 80 });
        gsap.set('.hero-orb', { y: p * -60 });
        gsap.set('.float-1', { y: 30 + p * -120 });
        gsap.set('.float-2', { y: 0  + p * -90  });
        gsap.set('.float-3', { y: 0  + p * -60  });
      }
    });

    /* ─────────────────────────────────────────
       4.  SECTION HEADERS — slide + line grow
    ───────────────────────────────────────── */
    document.querySelectorAll('.section-header').forEach(header => {
      const num   = header.querySelector('.section-num');
      const title = header.querySelector('.section-title');
      const line  = header.querySelector('.section-line');
      const count = header.querySelector('.section-count');

      gsap.set(line, { scaleX: 0, transformOrigin: 'left' });
      gsap.set([num, title], { y: 30, opacity: 0 });
      if (count) gsap.set(count, { opacity: 0 });

      ScrollTrigger.create({
        trigger: header,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
          tl.to(num,   { y: 0, opacity: 1, duration: 0.6 })
            .to(title, { y: 0, opacity: 1, duration: 0.7 }, '-=0.4')
            .to(line,  { scaleX: 1, duration: 1.2, ease: 'power3.out' }, '-=0.5');
          if (count) tl.to(count, { opacity: 1, duration: 0.4 }, '-=0.3');
        }
      });
    });

    /* ─────────────────────────────────────────
       5.  GALERIE — entrées scrubbed + parallaxe
    ───────────────────────────────────────── */
    document.querySelectorAll('.artwork').forEach((art, i) => {
      const img  = art.querySelector('.artwork-img-wrap img');
      const cap  = art.querySelector('.artwork-caption');
      const wrap = art.querySelector('.artwork-img-wrap');

      // Entrance depuis le bas
      gsap.from(art, {
        scrollTrigger: {
          trigger: art,
          start: 'top 90%',
          end: 'top 55%',
          scrub: 0.8,
        },
        y: 80,
        opacity: 0,
        scale: 0.97,
        ease: 'none',
        force3D: true,
      });

      // Parallaxe image dans le cadre
      gsap.to(img, {
        scrollTrigger: {
          trigger: art,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
        y: -60,
        ease: 'none',
        force3D: true,
      });

      // Caption slide up
      if (cap) {
        gsap.from(cap, {
          scrollTrigger: {
            trigger: art,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          },
          y: 20,
          opacity: 0,
          duration: 0.6,
          delay: 0.15 * (i % 3),
          ease: 'power3.out',
        });
      }
    });

    /* ─────────────────────────────────────────
       6.  À PROPOS — image parallaxe + texte
    ───────────────────────────────────────── */
    const aboutSection = document.getElementById('about');
    const aboutImg = document.querySelector('.about-image-frame');

    // Image parallaxe
    gsap.to(aboutImg, {
      scrollTrigger: {
        trigger: aboutSection,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.8,
      },
      y: -80,
      ease: 'none',
      force3D: true,
    });

    // Titre about — mots masqués
    document.querySelectorAll('.about-title-line').forEach((line, i) => {
      const inner = document.createElement('span');
      inner.className = 'inner-word';
      inner.innerHTML = line.innerHTML;
      line.innerHTML = '';
      line.appendChild(inner);

      gsap.from(inner, {
        scrollTrigger: {
          trigger: line,
          start: 'top 88%',
          toggleActions: 'play none none reverse'
        },
        y: '110%',
        duration: 0.9,
        delay: i * 0.12,
        ease: 'expo.out',
        force3D: true,
      });
    });

    // Paragraphes
    document.querySelectorAll('.about-p').forEach((p, i) => {
      gsap.from(p, {
        scrollTrigger: { trigger: p, start: 'top 90%', toggleActions: 'play none none reverse' },
        y: 25, opacity: 0, duration: 0.8,
        delay: i * 0.1, ease: 'power3.out',
      });
    });

    // Stats
    gsap.from('.stat', {
      scrollTrigger: { trigger: '.about-stats', start: 'top 85%', toggleActions: 'play none none reverse' },
      y: 30, opacity: 0, duration: 0.7,
      stagger: 0.1, ease: 'power3.out',
    });

    // Tags
    gsap.to('.about-tags span', {
      scrollTrigger: { trigger: '.about-tags', start: 'top 88%', toggleActions: 'play none none reverse' },
      y: 0, opacity: 1, duration: 0.5,
      stagger: 0.07, ease: 'back.out(1.5)',
    });

    /* ─────────────────────────────────────────
       7.  CONTACT — titre masqué + fond parallaxe
    ───────────────────────────────────────── */
    // Contact background parallaxe
    gsap.to('.contact-bg-art img', {
      scrollTrigger: {
        trigger: '#contact',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2,
      },
      y: -100,
      scale: 1.15,
      ease: 'none',
      force3D: true,
    });

    // Titre contact — lignes masquées
    document.querySelectorAll('.ct-line').forEach((line, i) => {
      const inner = document.createElement('span');
      inner.className = 'inner-word';
      inner.innerHTML = line.innerHTML;
      line.innerHTML = '';
      line.appendChild(inner);

      gsap.from(inner, {
        scrollTrigger: {
          trigger: '#contact',
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        y: '110%',
        duration: 1.1,
        delay: i * 0.18,
        ease: 'expo.out',
        force3D: true,
      });
    });

    gsap.to('.contact-sub', {
      scrollTrigger: { trigger: '.contact-sub', start: 'top 88%', toggleActions: 'play none none reverse' },
      y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
    });

    gsap.to('.contact-link', {
      scrollTrigger: { trigger: '.contact-link', start: 'top 90%', toggleActions: 'play none none reverse' },
      y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: 'power3.out',
    });

    /* ── MARQUEE GSAP ────────────────────── */
    const track = document.querySelector('.marquee-track');
    if (track) {
      const w = track.scrollWidth / 3;
      gsap.to(track, {
        x: -w,
        duration: 22,
        ease: 'none',
        repeat: -1,
        modifiers: { x: gsap.utils.unitize(x => parseFloat(x) % w) }
      });
    }

    /* ── TRANSITIONS DE SCÈNE (zoom entrée) ── */
    document.querySelectorAll('.scene').forEach((scene, i) => {
      if (i === 0) return;
      gsap.fromTo(scene,
        { opacity: 0.6, scale: 0.97 },
        {
          scrollTrigger: {
            trigger: scene,
            start: 'top 90%',
            end: 'top 30%',
            scrub: 1.2,
          },
          opacity: 1,
          scale: 1,
          ease: 'none',
          force3D: true,
        }
      );
    });

    /* ─────────────────────────────────────────
       8.  LIGHTBOX — galerie navigable
    ───────────────────────────────────────── */
    const lightbox  = document.getElementById('lightbox');
    const lbImg     = document.getElementById('lightbox-img');
    const lbNum     = document.getElementById('lightbox-num');
    const lbTitle   = document.getElementById('lightbox-title');
    const lbDesc    = document.getElementById('lightbox-desc');
    const lbClose   = document.querySelector('.lightbox-close');
    const lbPrev    = document.querySelector('.lightbox-prev');
    const lbNext    = document.querySelector('.lightbox-next');
    const artworks  = [...document.querySelectorAll('.artwork')];
    let currentIdx  = 0;

    function openLightbox(idx) {
      const art  = artworks[idx];
      const src  = art.querySelector('img').src;
      const data = artworkData[idx] || {};
      currentIdx = idx;

      lbImg.src       = src;
      lbNum.textContent   = data.num   || '';
      lbTitle.textContent = data.title || '';
      lbDesc.textContent  = data.desc  || '';

      gsap.set(lightbox, { display: 'flex' });
      gsap.set(lbImg, { scale: 1.08, opacity: 0 });
      gsap.to(lightbox, { opacity: 1, duration: 0.4, ease: 'power2.out' });
      gsap.to(lbImg,    { scale: 1, opacity: 1, duration: 0.6, ease: 'expo.out' });
      lenis.stop();
    }

    function closeLightbox() {
      gsap.to(lightbox, {
        opacity: 0, duration: 0.35, ease: 'power2.in',
        onComplete: () => { gsap.set(lightbox, { display: 'none' }); lenis.start(); }
      });
    }

    artworks.forEach((art, i) => {
      art.addEventListener('click', () => openLightbox(i));
    });

    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', () => openLightbox((currentIdx - 1 + artworks.length) % artworks.length));
    lbNext.addEventListener('click', () => openLightbox((currentIdx + 1) % artworks.length));
    document.querySelector('.lightbox-overlay').addEventListener('click', closeLightbox);

    // Navigation clavier
    document.addEventListener('keydown', e => {
      if (!lightbox.style.display || lightbox.style.display === 'none') return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') openLightbox((currentIdx + 1) % artworks.length);
      if (e.key === 'ArrowLeft')  openLightbox((currentIdx - 1 + artworks.length) % artworks.length);
    });

    /* ─────────────────────────────────────────
       9.  RESIZE debounced
    ───────────────────────────────────────── */
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 250);
    });

  } // end initAnimations

});
