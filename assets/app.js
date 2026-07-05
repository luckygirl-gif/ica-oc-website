// ---- Language toggle (shared across pages) ----
function applyLang(lang){
  document.documentElement.setAttribute('data-lang', lang);
  document.body.setAttribute('data-lang', lang);
  document.querySelectorAll('[data-en]').forEach(function(el){
    var val = el.getAttribute('data-'+lang);
    if(val === null) return;
    if(val.indexOf('<') !== -1){ el.innerHTML = val; } else { el.textContent = val; }
  });
  var en = document.getElementById('enBtn'), ko = document.getElementById('koBtn');
  if(en) en.classList.toggle('active', lang==='en');
  if(ko) ko.classList.toggle('active', lang==='ko');
  document.documentElement.lang = (lang==='ko') ? 'ko' : 'en';
  try{ localStorage.setItem('ica-lang', lang); }catch(e){}
  if(window.__icaFit) window.__icaFit(); // KO/EN differ in height — refit immediately
}
function setLang(lang){ applyLang(lang); }
(function(){
  var saved = 'en';
  try{ saved = localStorage.getItem('ica-lang') || 'en'; }catch(e){}
  try{ var q = new URLSearchParams(location.search).get('lang'); if(q==='ko'||q==='en'){ saved=q; } }catch(e){}
  applyLang(saved);
})();

// ---- Highlight the current page in the nav ----
(function(){
  var file = (location.pathname.split('/').pop() || 'index.html');
  if(file === '') file = 'index.html';
  document.querySelectorAll('.nav-links a[data-page]').forEach(function(a){
    if(a.getAttribute('data-page') === file) a.classList.add('active');
  });
})();

// ---- Mobile menu ----
function toggleMenu(){ var n = document.getElementById('navLinks'); if(n) n.classList.toggle('open'); }
document.querySelectorAll('#navLinks a').forEach(function(a){
  a.addEventListener('click', function(){ var n = document.getElementById('navLinks'); if(n) n.classList.remove('open'); });
});

// ---- Scroll reveal ----
var io = new IntersectionObserver(function(entries){
  entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
}, {threshold:.12});
document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

// ---- First-viewport auto-fit (closed loop) ----
// CSS spacing is calc(FLOOR + FLEX*var(--fit)). We MEASURE the page's first-viewport
// block; if its bottom overflows, we solve for the exact --fit that makes it fit
// (overflow is ~linear in --fit), then nudge down for line-wrap nonlinearity.
// Runs on load, resize, font load, and language switch — so it self-corrects on any
// monitor/device without hiding, clipping, or scaling any real content.
(function(){
  function bottomOf(el){ return el.getBoundingClientRect().bottom + window.scrollY; }
  function fitTarget(){
    var pg = document.querySelector('.page-programs .prog-grid .pillar'); // programs: 1st lab row
    if(pg) return pg;
    if(document.querySelector('.contact-grid'))                    // contact: WHOLE page,
      return document.querySelector('footer');                     // footer included
    var why = document.querySelector('#why .prog-grid');           // about: hero + the 3
    if(why) return why;                                            // "why struggle" cards
    var hc = document.querySelector('.hero-card');                 // home: hero-inner is
    var ce = document.querySelector('.hero-center');               // viewport-locked, so
    if(hc && ce) return bottomOf(hc) >= bottomOf(ce) ? hc : ce;    // fit its tallest child
    return hc || ce;
  }
  var fillSec = null;                          // section currently carrying fill padding
  function fit(){
    var root = document.documentElement;
    root.style.setProperty('--fit','1');
    if(fillSec){ fillSec.style.paddingBottom = ''; fillSec = null; }
    if(window.innerWidth <= 980) return;      // tablet/mobile: natural flow, scrolling is fine
    var el = fitTarget(); if(!el) return;      // pages with no strict first-viewport block
    var limit = window.innerHeight - 18;       // keep an 18px breathing margin
    var over1 = bottomOf(el) - limit;
    if(over1 > 0){                             // TOO TALL → compress spacing
      root.style.setProperty('--fit','0');
      var over0 = bottomOf(el) - limit;
      if(over0 <= 0){
        var f = -over0 / (over1 - over0);      // linear solve: overflow(f) = 0
        f = Math.max(0, Math.min(1, f - 0.03));
        root.style.setProperty('--fit', f.toFixed(3));
        var guard = 0;                         // line wraps can bend the line — verify & nudge
        while(bottomOf(el) > limit && f > 0 && guard < 20){
          f = Math.max(0, f - 0.05); guard++;
          root.style.setProperty('--fit', f.toFixed(3));
        }
      }                                        // else: impossible even fully compact — stay at 0
    }
    // TOO SHORT → FILL: pad the first-screen section so the NEXT section starts
    // exactly at the fold. The first screen always ends right below its content —
    // nothing ever peeks in half-cut, on any viewport, either language.
    var sec = el.closest('section');
    if(sec){
      var extra = window.innerHeight - (sec.getBoundingClientRect().bottom + window.scrollY);
      if(extra > 0){
        sec.style.paddingBottom = (parseFloat(getComputedStyle(sec).paddingBottom) || 0) + extra + 'px';
        fillSec = sec;
      }
    }
  }
  var raf = null;
  function queue(){ if(raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(fit); }
  window.addEventListener('resize', queue);
  window.addEventListener('load', queue);
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(queue); }
  window.__icaFit = fit;                       // synchronous refit (used by applyLang & tests)
  fit();
})();
