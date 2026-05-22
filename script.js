/* ═══════════════════════════════════════════════════
   KOCO. — EXPÉRIENCE IMMERSIVE ORYZO-STYLE
   Scroll = timeline. Pas de pages. Pas de défilement.
   Juste une transformation continue dans l'espace.
═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  /* ─── Config scènes ─────────────────────────────── */
  const SCENES      = 4;
  const SCENE_DEPTH = 1200; // px de scroll par scène

  /* ─── Données œuvres ────────────────────────────── */
  const ARTWORKS = [
    { num:'01', title:'Sans titre 01', desc:'Acrylique sur toile — 2025' },
    { num:'02', title:'Sans titre 02', desc:'Acrylique et spray sur toile — 2025' },
    { num:'03', title:'Sans titre 03', desc:'Acrylique sur toile — 2025' },
    { num:'04', title:'Sans titre 04', desc:'Acrylique sur toile — 2025' },
    { num:'05', title:'Sans titre 05', desc:'Acrylique et stylo sur toile — 2025' },
    { num:'06', title:'Sans titre 06', desc:'Acrylique et spray sur toile — 2025' },
    { num:'07', title:'Sans titre 07', desc:'Acrylique sur toile — 2025' },
  ];

  /* ─── GPU bootstrap ─────────────────────────────── */
  gsap.set('*', { force3D: true });

  /* ══════════════════════════════════════════════════
     1. LOADER
  ══════════════════════════════════════════════════ */
  const loader      = document.getElementById('loader');
  const loaderBar   = loader.querySelector('.loader-bar');
  const loaderLetters = loader.querySelectorAll('.loader-text span');
  const loaderCounter = loader.querySelector('.loader-counter');

  let count = 0;
  gsap.to(loaderCounter, { opacity: 1, duration: 0.4 });
  const tick = setInterval(() => {
    count += Math.ceil(Math.random() * 14);
    if (count >= 100) { count = 100; clearInterval(tick); }
    loaderCounter.textContent = String(count).padStart(3,'0');
  }, 55);

  gsap.to(loaderBar, { width: '100%', duration: 2.2, ease: 'power2.inOut' });
  gsap.to(loaderLetters, { y: 0, duration: 1, stagger: 0.08, ease: 'expo.out', delay: 0.3 });

  const loaderExit = gsap.timeline({ delay: 2.3 });
  loaderExit
    .to(loaderLetters, { y: '-110%', duration: 0.7, stagger: 0.05, ease: 'expo.in' })
    .to(loaderCounter, { opacity: 0, duration: 0.3 }, '<')
    .to(loader, { yPercent: -100, duration: 0.85, ease: 'expo.inOut' }, '-=0.1')
    .set(loader, { display: 'none' })
    .add(() => boot(), '-=0.15');

  /* ══════════════════════════════════════════════════
     2. BOOT — tout s'initialise après le loader
  ══════════════════════════════════════════════════ */
  function boot() {

    /* ── Lenis : scroll natif → virtuel ────────────── */
    const lenis = new Lenis({
      duration: 2.0,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    });
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.on('scroll', ScrollTrigger.update);

    /* ── Hauteur du body (driver invisible) ─────────── */
    document.body.style.height = (SCENES * SCENE_DEPTH + window.innerHeight) + 'px';

    /* ── Progress bar ───────────────────────────────── */
    const progressFill = document.getElementById('progress-fill');
    lenis.on('scroll', ({ progress }) => {
      gsap.set(progressFill, { width: (progress * 100) + '%' });
    });

    /* ── Curseur magnétique ─────────────────────────── */
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    const rl   = ring.querySelector('.cursor-label');
    let mx=0, my=0, rx=0, ry=0;
    document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; });
    gsap.ticker.add(() => {
      gsap.set(dot,  { x: mx, y: my });
      rx += (mx-rx)*0.1; ry += (my-ry)*0.1;
      gsap.set(ring, { x: rx, y: ry });
    });
    document.querySelectorAll('a,button').forEach(el => {
      el.addEventListener('mouseenter', () => { gsap.to(ring,{width:52,height:52,duration:0.3,ease:'power2.out'}); gsap.to(dot,{scale:0,duration:0.2}); });
      el.addEventListener('mouseleave', () => { gsap.to(ring,{width:34,height:34,duration:0.3,ease:'power2.out'}); gsap.to(dot,{scale:1,duration:0.2}); gsap.to(rl,{opacity:0,scale:0.5,duration:0.2}); });
    });
    document.querySelectorAll('.artwork').forEach(el => {
      el.addEventListener('mouseenter', () => { gsap.to(ring,{width:68,height:68,duration:0.4,ease:'back.out(2)'}); gsap.to(dot,{scale:0,duration:0.2}); gsap.to(rl,{opacity:1,scale:1,duration:0.3}); });
      el.addEventListener('mouseleave', () => { gsap.to(ring,{width:34,height:34,duration:0.35}); gsap.to(dot,{scale:1,duration:0.2}); gsap.to(rl,{opacity:0,scale:0.5,duration:0.2}); });
    });

    /* ── Nav clics → scroll vers scène ─────────────── */
    document.querySelectorAll('[data-scene]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const s = parseInt(a.dataset.scene);
        lenis.scrollTo(s * SCENE_DEPTH, { duration: 1.8, easing: t => Math.min(1, 1.001 - Math.pow(2,-10*t)) });
      });
    });

    /* ══════════════════════════════════════════════════
       3. SCÈNES FIXED — la magie
       Le scroll déplace une valeur virtuelle "progress" (0→1)
       On répartit ce progress en N tranches, une par scène.
    ══════════════════════════════════════════════════ */

    const scenes = {
      hero:    document.getElementById('scene-hero'),
      gallery: document.getElementById('scene-gallery'),
      about:   document.getElementById('scene-about'),
      contact: document.getElementById('scene-contact'),
    };

    /* ── État des scènes ─────────────────────────────── */
    // Chaque scène a un range [start, end] en px de scroll
    const ranges = [
      { id: 'hero',    start: 0,              end: SCENE_DEPTH },
      { id: 'gallery', start: SCENE_DEPTH,    end: SCENE_DEPTH*2 },
      { id: 'about',   start: SCENE_DEPTH*2,  end: SCENE_DEPTH*3 },
      { id: 'contact', start: SCENE_DEPTH*3,  end: SCENE_DEPTH*4 },
    ];

    /* ── Intro Hero ─────────────────────────────────── */
    const heroTL = gsap.timeline({ defaults: { ease: 'expo.out' } });
    heroTL
      .to('.eyebrow-line',  { scaleX:1, opacity:1, duration:0.6, transformOrigin:'left' })
      .to('.eyebrow-text',  { opacity:1, duration:0.5 }, '-=0.3')
      .to('.title-inner',   { y:0, duration:1.0, stagger:0.14 }, '-=0.4')
      .to('.title-period',  { y:0, duration:0.8 }, '-=0.5')
      .to('.meta-item',     { y:0, opacity:1, duration:0.7, stagger:0.07 }, '-=0.4')
      .to('.meta-dot',      { opacity:1, duration:0.4, stagger:0.07 }, '<')
      .to('.hero-sub',      { opacity:1, duration:0.6 }, '-=0.3')
      .to(['.float-1','.float-2','.float-3'], {
          opacity:1, y:0, duration:0.9, stagger:0.12, ease:'back.out(1.3)'
        }, '-=0.5')
      .to('.scene-number',  { opacity:1, duration:0.5 }, '-=0.4')
      .to('.scroll-hint',   { opacity:1, duration:0.5 }, '-=0.4');

    /* Préparer les floats */
    gsap.set(['.float-1','.float-2','.float-3'], { y:40 });

    /* ── Fonction : progress local [0→1] pour une scène ─ */
    function localP(scroll, range) {
      return gsap.utils.clamp(0, 1, (scroll - range.start) / (range.end - range.start));
    }

    /* ── Fonctions de transition ─────────────────────── */
    // Entrée d'une scène (0→1) : elle arrive de l'arrière (scale + opacity)
    function sceneIn(el, p) {
      // p: 0 = invisible derrière, 1 = pleinement visible
      const ease = gsap.parseEase('power2.out');
      const ep   = ease(p);
      gsap.set(el, {
        opacity:    gsap.utils.interpolate(0, 1, ep),
        scale:      gsap.utils.interpolate(1.06, 1, ep),
        filter:     `blur(${gsap.utils.interpolate(8, 0, ep)}px)`,
        willChange: 'transform, opacity, filter',
      });
    }

    // Sortie d'une scène (0→1) : elle part vers l'avant (scale down + opacity)
    function sceneOut(el, p) {
      const ease = gsap.parseEase('power2.in');
      const ep   = ease(p);
      gsap.set(el, {
        opacity:    gsap.utils.interpolate(1, 0, ep),
        scale:      gsap.utils.interpolate(1, 0.94, ep),
        filter:     `blur(${gsap.utils.interpolate(0, 12, ep)}px)`,
      });
    }

    /* ── Ambiance : orbes qui vivent en permanence ────── */
    gsap.to('.s-hero-bg img', { scale: 1.12, duration: 12, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    // Fond contact subtil
    gsap.to('.contact-bg-wrap img', { scale: 1.1, duration: 16, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    // Marquee
    const mTrack = document.querySelector('.marquee-track');
    if (mTrack) {
      const mw = mTrack.scrollWidth / 3;
      gsap.to(mTrack, { x:-mw, duration:20, ease:'none', repeat:-1,
        modifiers:{ x: gsap.utils.unitize(x => parseFloat(x) % mw) }
      });
    }

    /* ── MAIN SCROLL HANDLER ─────────────────────────── */
    let currentScene = 0;
    let heroAnimated = false;

    // Animations internes de chaque scène (lancées une fois à l'entrée)
    const sceneEnterFns = {
      gallery: animateGalleryIn,
      about:   animateAboutIn,
      contact: animateContactIn,
    };
    const sceneEntered = { gallery:false, about:false, contact:false };

    lenis.on('scroll', ({ scroll }) => {
      const totalMax = SCENES * SCENE_DEPTH;
      const gp = scroll / totalMax; // progress global 0→1
      const rawScene = scroll / SCENE_DEPTH;
      const newScene = Math.min(Math.floor(rawScene), SCENES-1);

      /* Mise à jour progress bar */
      gsap.set(progressFill, { width: (gp * 100) + '%' });

      /* ── Logique de transition par scène ─────────── */
      ranges.forEach((range, i) => {
        const el = scenes[range.id];
        if (!el) return;

        const p = localP(scroll, range);

        if (i === 0) {
          // HERO : sort vers le bas quand on scroll
          if (p < 0.7) {
            // reste visible
            gsap.set(el, { opacity: 1, scale: 1, filter: 'blur(0px)' });
            // parallaxe fond
            gsap.set('.s-hero-bg img', { y: scroll * 0.25 });
            gsap.set('.s-hero-content', { y: scroll * 0.15, opacity: 1 });
            gsap.set('.float-1', { y: 40 - scroll * 0.18 });
            gsap.set('.float-2', { y: 0  - scroll * 0.13 });
            gsap.set('.float-3', { y: 0  - scroll * 0.10 });
          } else {
            // sort
            const exitP = (p - 0.7) / 0.3;
            sceneOut(el, exitP);
            gsap.set('.s-hero-content', { y: scroll * 0.15, opacity: gsap.utils.interpolate(1, 0, exitP) });
          }
        } else {
          // Autres scènes
          const prevRange = ranges[i-1];
          const transP = localP(scroll, {
            start: prevRange.end - SCENE_DEPTH * 0.35,
            end:   prevRange.end + SCENE_DEPTH * 0.15,
          });
          const outP = (i < SCENES-1) ? localP(scroll, {
            start: range.end - SCENE_DEPTH * 0.3,
            end:   range.end,
          }) : 0;

          if (transP <= 0) {
            gsap.set(el, { opacity:0, scale:1.06, filter:'blur(8px)' });
          } else if (outP > 0 && i < SCENES-1) {
            // sortie
            sceneOut(el, outP);
          } else {
            // entrée / visible
            sceneIn(el, transP);
            el.classList.add('is-active');

            // Déclencher anim interne une seule fois
            const key = range.id;
            if (!sceneEntered[key] && transP > 0.4 && sceneEnterFns[key]) {
              sceneEntered[key] = true;
              sceneEnterFns[key]();
            }
          }
        }
      });

      /* Parallaxe images galerie sur le scroll interne */
      if (rawScene >= 1 && rawScene < 2) {
        const gScroll = scroll - SCENE_DEPTH;
        document.querySelectorAll('.artwork-img-wrap').forEach((w, i) => {
          gsap.set(w.querySelector('img'), { y: gScroll * 0.04 * (i%2===0?1:-0.7) });
        });
      }
    });

    /* ══════════════════════════════════════════════════
       4. ANIMATIONS INTERNES PAR SCÈNE
    ══════════════════════════════════════════════════ */

    function animateGalleryIn() {
      // Label header
      gsap.from('.gallery-label', { y: -20, opacity: 0, duration: 0.8, ease: 'expo.out' });
      gsap.from('.gl-line', { scaleX: 0, duration: 1.2, ease: 'power3.out', transformOrigin: 'left', delay: 0.2 });
      // Artworks : entrée en cascade
      gsap.from('.artwork', {
        y: 40, opacity: 0, scale: 0.97,
        duration: 0.9, stagger: { amount: 0.5, from: 'start' },
        ease: 'expo.out', delay: 0.1
      });
    }

    function animateAboutIn() {
      // Titre
      gsap.to('.abt-inner', { y: 0, duration: 1.0, stagger: 0.12, ease: 'expo.out', delay: 0.1 });
      // Paragraphes
      gsap.to('.about-p', { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out', delay: 0.3 });
      // Stats
      gsap.to('.about-stats', { opacity: 1, duration: 0.7, delay: 0.5, ease: 'power2.out' });
      // Tags
      gsap.to('.about-tags span', { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'back.out(1.5)', delay: 0.6 });
      // Image about — parallaxe lente
      gsap.to('.about-left img', { scale: 1.06, duration: 10, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }

    function animateContactIn() {
      // Label line
      gsap.to('.cl-line', { scaleX: 1, duration: 1.0, ease: 'power3.out', delay: 0.1 });
      gsap.from('.contact-label', { y: -20, opacity: 0, duration: 0.7, ease: 'expo.out' });
      // Titre lignes
      gsap.to('.ct-inner', { y: 0, duration: 1.1, stagger: 0.18, ease: 'expo.out', delay: 0.15 });
      // Sub + link
      gsap.to('.contact-sub',  { opacity: 1, duration: 0.7, delay: 0.55, ease: 'power3.out' });
      gsap.to('.contact-link', { opacity: 1, y: 0, duration: 0.7, delay: 0.7, ease: 'power3.out' });
    }

    /* ══════════════════════════════════════════════════
       5. LIGHTBOX
    ══════════════════════════════════════════════════ */
    const lb      = document.getElementById('lightbox');
    const lbImg   = document.getElementById('lightbox-img');
    const lbNum   = document.getElementById('lightbox-num');
    const lbTitle = document.getElementById('lightbox-title');
    const lbDesc  = document.getElementById('lightbox-desc');
    const artworks = [...document.querySelectorAll('.artwork')];
    let current = 0;

    function openLb(i) {
      const art = artworks[i]; current = i;
      const data = ARTWORKS[parseInt(art.dataset.index)] || ARTWORKS[i] || {};
      lbImg.src = art.querySelector('img').src;
      lbNum.textContent   = data.num   || '';
      lbTitle.textContent = data.title || '';
      lbDesc.textContent  = data.desc  || '';
      gsap.set(lb, { display:'flex' });
      gsap.set(lbImg, { scale:1.1, opacity:0 });
      gsap.to(lb,    { opacity:1, duration:0.4, ease:'power2.out' });
      gsap.to(lbImg, { scale:1, opacity:1, duration:0.6, ease:'expo.out' });
      lenis.stop();
    }
    function closeLb() {
      gsap.to(lb, { opacity:0, duration:0.35, ease:'power2.in',
        onComplete: () => { gsap.set(lb,{display:'none'}); lenis.start(); }
      });
    }
    artworks.forEach((a,i) => a.addEventListener('click', ()=>openLb(i)));
    document.querySelector('.lightbox-close').addEventListener('click', closeLb);
    document.querySelector('.lightbox-prev').addEventListener('click', () => openLb((current-1+artworks.length)%artworks.length));
    document.querySelector('.lightbox-next').addEventListener('click', () => openLb((current+1)%artworks.length));
    document.querySelector('.lightbox-overlay').addEventListener('click', closeLb);
    document.addEventListener('keydown', e => {
      if (lb.style.display==='none'||!lb.style.display) return;
      if(e.key==='Escape') closeLb();
      if(e.key==='ArrowRight') openLb((current+1)%artworks.length);
      if(e.key==='ArrowLeft')  openLb((current-1+artworks.length)%artworks.length);
    });

    /* ── Resize ──────────────────────────────────────── */
    let resizeT;
    window.addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        document.body.style.height = (SCENES * SCENE_DEPTH + window.innerHeight) + 'px';
        ScrollTrigger.refresh();
      }, 250);
    });

  } // boot()

});
