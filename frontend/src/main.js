// src/main.js

/**
 * Configura la barra de navegación para mostrar los botones correctos
 * dependiendo de si el usuario ha iniciado sesión o no.
 */
function setupAuthNav() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const navLoggedOut = document.getElementById('nav-links-logged-out');
  const navLoggedIn = document.getElementById('nav-links-logged-in');
  const heroLoggedOut = document.getElementById('hero-actions-logged-out');
  const heroLoggedIn = document.getElementById('hero-actions-logged-in');

  // Si los elementos no existen, no hacer nada.
  if (!navLoggedOut || !navLoggedIn || !heroLoggedOut || !heroLoggedIn) {
    return;
  }

  if (token && user) {
    // Usuario ha iniciado sesión
    navLoggedOut.style.display = 'none';
    heroLoggedOut.style.display = 'none';

    navLoggedIn.style.display = 'flex';
    heroLoggedIn.style.display = 'block';

    const userNameNav = document.getElementById('userNameNav');
    if (userNameNav) {
      userNameNav.innerHTML = `Hola, <strong>${user.first_name || 'Usuario'}</strong>`;
    }
    
    const logoutBtnNav = document.getElementById('logoutBtnNav');
    if (logoutBtnNav) {
      logoutBtnNav.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('chat_history');
        window.location.reload();
      });
    }
  } else {
    // Usuario no ha iniciado sesión
    navLoggedOut.style.display = 'flex';
    heroLoggedOut.style.display = 'flex';
    navLoggedIn.style.display = 'none';
    heroLoggedIn.style.display = 'none';
  }
}

/**
 * Configura la funcionalidad del carrusel de imágenes.
 */
function setupCarousel() {
  const slides = document.querySelectorAll('.carousel .slide');
  const dots = document.querySelectorAll('.carousel .dot');
  if (!slides.length || !dots.length) return;

  let currentSlide = 0;
  const slideInterval = setInterval(nextSlide, 5000);

  function goToSlide(n) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    currentSlide = (n + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => goToSlide(i));
  });
}

/**
 * Configura la funcionalidad de acordeón para las preguntas frecuentes.
 */
function setupFaq() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const q = item.querySelector('.faq-q');
    q.addEventListener('click', () => item.classList.toggle('open'));
  });
}

// Calificación de usuarios (frontend local)
function setupRatings() {
  const summary = document.getElementById('ratingSummary');
  const avgEl = document.getElementById('ratingAverage');
  const cntEl = document.getElementById('ratingCount');
  const picker = document.getElementById('ratingPicker');
  const submitBtn = document.getElementById('ratingSubmit');
  const feedback = document.getElementById('ratingFeedback');
  const cardsEl = document.getElementById('ratingCards');
  if (!summary || !avgEl || !cntEl) return;

  const LS_KEY = 'ratings_v1';
  const LS_COMMENTS = 'rating_comments_v2';
  const load = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k) || 'null') || fallback; } catch { return fallback; }
  };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  let ratings = load(LS_KEY, [5,5,4,5,4,5]); // base visible
  let comments = load(LS_COMMENTS, [
    { s:5, t:'Me ayudó a entender mis gastos sin ser experta. El velocímetro es clarísimo.', name:'Laura G.', role:'Empleada', a:'https://i.pravatar.cc/100?img=47' },
    { s:4, t:'El resumen tributario me dio tranquilidad para planear.', name:'Carlos R.', role:'Independiente', a:'https://i.pravatar.cc/100?img=12' },
    { s:5, t:'En una semana bajé 12% comida fuera. Recomendado.', name:'Diana M.', role:'Diseñadora', a:'https://i.pravatar.cc/100?img=31' }
  ]);

  let selected = 0;
  function renderSummary() {
    const sum = ratings.reduce((a,c)=>a+Number(c||0),0);
    const avg = ratings.length ? (sum/ratings.length) : 0;
    const rounded = Math.round(avg*10)/10;
    avgEl.textContent = rounded.toFixed(1);
    cntEl.textContent = String(ratings.length);
    const stars = summary.querySelectorAll('.star');
    stars.forEach((st, i)=>{
      st.classList.toggle('active', i < Math.round(avg));
    });
    if (cardsEl) {
      cardsEl.innerHTML = comments.slice(0,6).map(c=>`
        <li class="review-card">
          <div class="review-avatar"><img src="${c.a || 'https://i.pravatar.cc/100?u='+encodeURIComponent(c.name||'user')}" alt="${c.name||'Usuario'}"/></div>
          <div class="review-body">
            <div class="review-name">${c.name||'Usuario'}</div>
            <div class="review-role">${c.role||''}</div>
            <div class="review-stars">${'★'.repeat(c.s)}${'☆'.repeat(5-c.s)}</div>
            <div class="review-text">${c.t}</div>
          </div>
        </li>`).join('');
    }
  }

  function setPicker(val){
    selected = val;
    picker.querySelectorAll('.star').forEach((b,i)=>{
      const on = i < val; b.classList.toggle('active', on); b.setAttribute('aria-checked', on && i===val-1 ? 'true':'false');
    });
  }

  if (picker) {
    picker.querySelectorAll('.star').forEach(btn=>{
      btn.addEventListener('mouseenter', ()=>{
        const v = Number(btn.dataset.value||0); setPicker(v);
      });
      btn.addEventListener('click', ()=>{
        const v = Number(btn.dataset.value||0); setPicker(v);
      });
    });
    picker.addEventListener('mouseleave', ()=> setPicker(selected));
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', ()=>{
      if (!selected) { if (feedback) feedback.textContent = 'Elige una calificación.'; return; }
      ratings.push(selected); save(LS_KEY, ratings);
      comments.unshift({ s:selected, t:'Buena experiencia. Siento más control del gasto.', name:'Usuario', role:'Miembro', a:`https://i.pravatar.cc/100?u=${Date.now()}` });
      save(LS_COMMENTS, comments.slice(0,12));
      if (feedback) feedback.textContent = '¡Gracias por calificar!';
      renderSummary();
    });
  }

  renderSummary();
}

// --- Inicialización de la página ---
document.addEventListener('DOMContentLoaded', () => {
  setupAuthNav();
  setupCarousel();
  setupFaq();
  setupRatings();
});
