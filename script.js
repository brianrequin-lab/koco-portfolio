/* ===== KOCO. — SCRIPT ===== */

(function() {
     'use strict';

   /* ── CURSOR ─────────────────── */
   var cursor = document.getElementById('cursor');
     var follower = document.getElementById('cursor-follower');
     var mouseX = 0, mouseY = 0;
     var followerX = 0, followerY = 0;

   document.addEventListener('mousemove', function(e) {
          mouseX = e.clientX;
          mouseY = e.clientY;
          if (cursor) {
                   cursor.style.left = mouseX + 'px';
                   cursor.style.top = mouseY + 'px';
          }
   });

   function animateFollower() {
          followerX += (mouseX - followerX) * 0.12;
          followerY += (mouseY - followerY) * 0.12;
          if (follower) {
                   follower.style.left = followerX + 'px';
                   follower.style.top = followerY + 'px';
          }
          requestAnimationFrame(animateFollower);
   }
     animateFollower();

   var hoverTargets = document.querySelectorAll('a, button, .artwork');
     hoverTargets.forEach(function(el) {
            el.addEventListener('mouseenter', function() { document.body.classList.add('cursor-hover'); });
            el.addEventListener('mouseleave', function() { document.body.classList.remove('cursor-hover'); });
     });

   /* ── LOADER ─────────────────── */
   var loader = document.getElementById('loader');
     var loaderNum = document.getElementById('loader-num');
     var count = 0;
     var duration = 1800;
     var start = null;

   function animateCount(ts) {
          if (!start) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          count = Math.round(eased * 100);
          if (loaderNum) loaderNum.textContent = count;
          if (progress < 1) {
                   requestAnimationFrame(animateCount);
          } else {
                   setTimeout(function() {
                              if (loader) loader.classList.add('hidden');
                              initReveal();
                   }, 300);
          }
   }
     requestAnimationFrame(animateCount);

   /* ── NAV ACTIVE ─────────────── */
   var navLinks = document.querySelectorAll('.nav-link');
     var sections = document.querySelectorAll('.section');

   function updateNav() {
          var scrollY = window.pageYOffset;
          var winH = window.innerHeight;
          sections.forEach(function(sec) {
                   var top = sec.offsetTop;
                   var h = sec.offsetHeight;
                   if (scrollY >= top - winH * 0.4 && scrollY < top + h - winH * 0.4) {
                              var id = sec.id;
                              navLinks.forEach(function(link) {
                                           link.classList.toggle('active', link.dataset.section === id);
                              });
                   }
          });
   }
     window.addEventListener('scroll', updateNav, { passive: true });

   /* ── NAV SMOOTH SCROLL ───────── */
   navLinks.forEach(function(link) {
          link.addEventListener('click', function(e) {
                   var target = document.querySelector(link.getAttribute('href'));
                   if (target) {
                              e.preventDefault();
                              target.scrollIntoView({ behavior: 'smooth' });
                   }
          });
   });
     var navLogo = document.querySelector('.nav-logo');
     if (navLogo) {
            navLogo.addEventListener('click', function(e) {
                     e.preventDefault();
                     window.scrollTo({ top: 0, behavior: 'smooth' });
            });
     }

   /* ── HERO PARALLAX ───────────── */
   var heroBgImg = document.getElementById('hero-img');
     function onScroll() {
            var scrollY = window.pageYOffset;
            if (heroBgImg && scrollY < window.innerHeight * 1.5) {
                     heroBgImg.style.transform = 'scale(1.08) translateY(' + scrollY * 0.25 + 'px)';
            }
     }
     window.addEventListener('scroll', onScroll, { passive: true });

   /* ── SCROLL REVEAL ───────────── */
   function initReveal() {
          // Hero words
       var words = document.querySelectorAll('.hero-word');
          words.forEach(function(w, i) {
                   setTimeout(function() { w.classList.add('visible'); }, i * 120);
          });
          var sub = document.querySelector('.hero-sub');
          if (sub) setTimeout(function() { sub.classList.add('visible'); }, 400);

       // Observer for all reveal elements
       var opts = { threshold: 0.15, rootMargin: '0px 0px -60px 0px' };
          var observer = new IntersectionObserver(function(entries) {
                   entries.forEach(function(entry) {
                              if (entry.isIntersecting) {
                                           var el = entry.target;
                                           // stagger for artworks
                                if (el.classList.contains('reveal-artwork')) {
                                               var idx = parseInt(el.dataset.index || 0);
                                               setTimeout(function() { el.classList.add('visible'); }, idx * 80);
                                } else if (el.classList.contains('line-wrap')) {
                                               var line = el.querySelector('.reveal-line');
                                               if (line) setTimeout(function() { line.classList.add('visible'); }, 0);
                                               var sibs = el.parentElement ? el.parentElement.querySelectorAll('.line-wrap') : [];
                                               sibs.forEach(function(s, i) {
                                                                var l = s.querySelector('.reveal-line');
                                                                if (l) setTimeout(function() { l.classList.add('visible'); }, i * 120);
                                               });
                                } else {
                                               el.classList.add('visible');
                                }
                                           observer.unobserve(el);
                              }
                   });
          }, opts);

       var targets = document.querySelectorAll(
                '.reveal-up, .reveal-fade, .reveal-artwork, .line-wrap'
              );
          targets.forEach(function(el) { observer.observe(el); });
   }

   /* ── LIGHTBOX ────────────────── */
   var lightbox = document.getElementById('lightbox');
     var lbImg = document.getElementById('lightbox-img');
     var lbClose = document.getElementById('lightbox-close');

   document.querySelectorAll('.artwork').forEach(function(art) {
          art.addEventListener('click', function() {
                   var src = art.querySelector('img');
                   if (src && lightbox && lbImg) {
                              lbImg.src = src.src;
                              lightbox.classList.add('open');
                              document.body.style.overflow = 'hidden';
                   }
          });
   });

   function closeLightbox() {
          if (lightbox) lightbox.classList.remove('open');
          document.body.style.overflow = '';
   }
     if (lbClose) lbClose.addEventListener('click', closeLightbox);
     if (lightbox) lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) closeLightbox();
     });
     document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeLightbox();
     });

})();
