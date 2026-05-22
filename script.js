/* ===== KOCO. — SCRIPT CINÉMATIQUE ===== */
/* GSAP + ScrollTrigger + Lenis */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Lenis smooth scroll ----
  const lenis = new Lenis({
    duration: 1.4,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // ScrollTrigger + Lenis sync
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // ---- Progress bar ----
  const progressFill = document.getElementById('progress-fill');
  lenis.on('scroll', ({ progress }) => {
    progressFill.style.width = (progress * 100) + '%';
  });

  // ---- Custom Cursor ----
  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');
  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    gsap.set(cursorDot, { x: mouseX, y: mouseY });
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    gsap.set(cursorRing, { x: ringX, y: ringY });
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Cursor hover effect
  document.querySelectorAll('a, .artwork, button, .overlay-close').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  // ---- HERO animations ----
  const heroTl = gsap.timeline({ delay: 0.2 });
  
  // Title split animation
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    const text = heroTitle.textContent;
    heroTitle.innerHTML = text.split('').map(c => 
      `<span class="char" style="display:inline-block;overflow:hidden"><span style="display:inline-block">${c === '.' ? '.' : c}</span></span>`
    ).join('');
    
    heroTl.from('.hero-title .char span', {
      y: '110%',
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.06,
    })
    .to('.hero-sub', { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, '-=0.4')
    .to('.hero-loc', { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, '-=0.5')
    .to('.hero-scroll-hint', { opacity: 1, duration: 0.6 }, '-=0.2');
  }

  // Hero parallax background
  gsap.to('.hero-bg', {
    yPercent: 30,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    }
  });

  // Hero title parallax
  gsap.to('.hero-content', {
    y: 150,
    opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
    }
  });

  // ---- SECTION LABELS (entrée pour toutes les sections) ----
  gsap.utils.toArray('.section-label').forEach(label => {
    gsap.to(label, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: label,
        start: 'top 85%',
      }
    });
  });

  // ---- GALLERY animations ----
  gsap.utils.toArray('.artwork').forEach((art, i) => {
    const imgWrap = art.querySelector('.artwork-img-wrap');
    const info = art.querySelector('.artwork-info');
    const img = art.querySelector('img');

    // Fade in staggered
    gsap.from(imgWrap, {
      y: 80,
      opacity: 0,
      duration: 1.2,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: art,
        start: 'top 85%',
      },
      delay: (i % 3) * 0.15,
    });

    // Info animation
    gsap.to(info, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: art,
        start: 'top 75%',
      },
      delay: (i % 3) * 0.1 + 0.2,
    });

    // Parallax on scroll
    gsap.to(img, {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: {
        trigger: art,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      }
    });
  });

  // Artwork click → overlay
  const overlay = document.querySelector('.artwork-overlay');
  const overlayImg = overlay ? overlay.querySelector('img') : null;

  if (overlay) {
    document.querySelectorAll('.artwork').forEach(art => {
      art.addEventListener('click', () => {
        const src = art.querySelector('img').src;
        overlayImg.src = src;
        overlay.classList.add('active');
        lenis.stop();
      });
    });

    overlay.querySelector('.overlay-close').addEventListener('click', () => {
      overlay.classList.remove('active');
      lenis.start();
    });

    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        lenis.start();
      }
    });
  }

  // ---- ABOUT animations ----
  gsap.to('.about-title', {
    opacity: 1,
    y: 0,
    duration: 1.2,
    ease: 'expo.out',
    scrollTrigger: {
      trigger: '#about',
      start: 'top 70%',
    }
  });

  gsap.utils.toArray('.about-text p').forEach((p, i) => {
    gsap.to(p, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: p,
        start: 'top 80%',
      },
      delay: i * 0.12,
    });
  });

  gsap.utils.toArray('.about-tags span').forEach((tag, i) => {
    gsap.to(tag, {
      opacity: 1,
      duration: 0.5,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.about-tags',
        start: 'top 85%',
      },
      delay: i * 0.08,
    });
  });

  gsap.to('.about-img', {
    opacity: 1,
    x: 0,
    duration: 1.4,
    ease: 'expo.out',
    scrollTrigger: {
      trigger: '.about-img',
      start: 'top 75%',
    }
  });

  // About image parallax
  gsap.to('.about-img img', {
    yPercent: -15,
    ease: 'none',
    scrollTrigger: {
      trigger: '#about',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 2,
    }
  });

  // ---- CONTACT animations ----
  // Title word by word
  const contactTitle = document.querySelector('.contact-title');
  if (contactTitle) {
    const words = contactTitle.textContent.split(' ');
    contactTitle.innerHTML = words.map(w => 
      `<span class="word-wrap" style="display:inline-block;overflow:hidden"><span style="display:inline-block;transform:translateY(110%)">${w}</span></span>`
    ).join(' ');

    gsap.to('.contact-title .word-wrap span', {
      y: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: {
        trigger: '#contact',
        start: 'top 70%',
      }
    });
  }

  gsap.to('.contact-content p', {
    opacity: 1,
    duration: 0.8,
    ease: 'expo.out',
    scrollTrigger: {
      trigger: '.contact-content',
      start: 'top 75%',
    },
    delay: 0.3,
  });

  gsap.to('.contact-link', {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'expo.out',
    scrollTrigger: {
      trigger: '.contact-link',
      start: 'top 85%',
    },
    delay: 0.2,
  });

  // ---- Navbar scroll effect ----
  ScrollTrigger.create({
    start: 'top -80',
    onUpdate: self => {
      const nav = document.getElementById('navbar');
      if (self.direction === 1) {
        gsap.to(nav, { y: -100, duration: 0.4, ease: 'expo.out' });
      } else {
        gsap.to(nav, { y: 0, duration: 0.4, ease: 'expo.out' });
      }
    }
  });

  // ---- Smooth anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) lenis.scrollTo(target, { duration: 1.8, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    });
  });

  // ---- ScrollTrigger refresh after fonts load ----
  document.fonts.ready.then(() => ScrollTrigger.refresh());
});
