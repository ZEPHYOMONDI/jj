/* ============================================================
   DIGITAL DIALOGUE – script.js
   Handles: scroll animations, admin-driven breaking ticker,
   site logo sync, comment form, newsletter, lightbox,
   sliding gallery, post "Read More" modal, live search,
   back-to-top.
============================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────
   1. SCROLL FADE-IN OBSERVER
────────────────────────────────────────────────────────── */
(function initFadeIn() {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  elements.forEach((el) => observer.observe(el));
})();

/* ──────────────────────────────────────────────────────────
   2. BACK TO TOP BUTTON
────────────────────────────────────────────────────────── */
(function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 400);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ──────────────────────────────────────────────────────────
   3. BREAKING NEWS TICKER – rendered from admin data
────────────────────────────────────────────────────────── */
function renderBreakingTicker() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;

  const items = pubGet(PUB_KEY_BREAKING, DEFAULT_BREAKING);
  if (!items.length) {
    track.innerHTML = '<span class="ticker-item">No breaking news right now.</span>';
    return;
  }

  const html = items.map(item => `
    <span class="ticker-item"><i class="far fa-clock me-1"></i>${escapeHtml(item.time || '')} &mdash; ${escapeHtml(item.text)} &nbsp;&nbsp;&nbsp;</span>`
  ).join('');

  // Duplicate content so the ticker loops seamlessly
  track.innerHTML = html + html;
}

/* ──────────────────────────────────────────────────────────
   4. SITE LOGO / PHOTO – admin-controlled only
   The public site can no longer change this image; it is set
   from the Settings panel in admin.js and synced here.
────────────────────────────────────────────────────────── */
function renderSiteLogo() {
  const settings = pubGet(PUB_KEY_SETTINGS, {});
  const logoSrc  = settings.logo || 'images/backgroundimage.jpeg';

  ['siteLogoImg', 'footerLogoImg', 'profileImg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.src = logoSrc;
  });
}

/* ──────────────────────────────────────────────────────────
   5. COMMENT FORM
────────────────────────────────────────────────────────── */
(function initCommentForm() {
  const form      = document.getElementById('commentForm');
  const container = document.getElementById('commentsContainer');
  if (!form || !container) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name  = document.getElementById('commentName').value.trim();
    const email = document.getElementById('commentEmail').value.trim();
    const text  = document.getElementById('commentText').value.trim();

    if (!name || !email || !text) {
      showToast('Please fill in all fields before posting.', 'warning');
      return;
    }

    // Build initials avatar colour from name
    const colors   = ['#1d3557','#e63946','#2a9d8f','#457b9d','#f4a261','#3a0ca3'];
    const color    = colors[Math.floor(Math.random() * colors.length)];
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const now      = new Date();
    const dateStr  = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr  = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const card = document.createElement('div');
    card.className = 'comment-card new-comment';
    card.innerHTML = `
      <img src="https://placehold.co/48x48/${color.replace('#','')}/${encodeURIComponent('ffffff')}?text=${initials}"
           alt="${initials}" class="comment-avatar" />
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-name">${escapeHtml(name)}</span>
          <span class="comment-date"><i class="far fa-clock me-1"></i>${dateStr} · ${timeStr}</span>
        </div>
        <p class="comment-text">${escapeHtml(text)}</p>
        <div class="comment-actions">
          <button class="btn-like" onclick="likeComment(this)">
            <i class="fas fa-thumbs-up me-1"></i><span>0</span>
          </button>
          <button class="btn-reply"><i class="fas fa-reply me-1"></i>Reply</button>
        </div>
      </div>`;

    // Prepend new comment with a fade-in
    card.style.opacity = '0';
    card.style.transform = 'translateY(-12px)';
    container.prepend(card);

    requestAnimationFrame(() => {
      card.style.transition = 'opacity .4s ease, transform .4s ease';
      card.style.opacity    = '1';
      card.style.transform  = 'translateY(0)';
    });

    form.reset();
    showToast('Your comment has been posted!', 'success');

    // ── Persist to localStorage so admin can see it ──
    try {
      const stored = JSON.parse(localStorage.getItem('dd_comments') || 'null') ||
                     DEFAULT_COMMENTS;
      stored.unshift({
        id:    Date.now(),
        name:  name,
        email: email,
        text:  text,
        date:  dateStr + ' · ' + timeStr,
        likes: 0,
      });
      localStorage.setItem('dd_comments', JSON.stringify(stored));
    } catch (err) { /* storage unavailable – silent fail */ }
  });
})();

/* ──────────────────────────────────────────────────────────
   6. LIKE BUTTON
────────────────────────────────────────────────────────── */
function likeComment(btn) {
  const countEl = btn.querySelector('span');
  const liked   = btn.classList.toggle('liked');
  countEl.textContent = parseInt(countEl.textContent, 10) + (liked ? 1 : -1);
}

/* ──────────────────────────────────────────────────────────
   7. NEWSLETTER FORM
────────────────────────────────────────────────────────── */
(function initNewsletter() {
  const forms = [
    document.getElementById('newsletterForm'),
    document.getElementById('footerNewsletterForm')
  ];
  forms.forEach(form => {
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = this.querySelector('input[type="email"]');
      if (!input || !input.value.trim()) return;
      showToast('You\'re subscribed! Welcome to Digital Dialogue.', 'success');
      input.value = '';
    });
  });
})();

/* ──────────────────────────────────────────────────────────
   8. GALLERY LIGHTBOX
────────────────────────────────────────────────────────── */
(function initLightbox() {
  const overlay    = document.getElementById('lightboxOverlay');
  const lightImg   = document.getElementById('lightboxImg');
  const videoWrap  = document.getElementById('lightboxVideoWrap');
  const videoFrame = document.getElementById('lightboxVideo');
  const closeBtn   = document.getElementById('lightboxClose');
  if (!overlay || !lightImg) return;

  // Open on "View Photo" / "Watch Video" button click
  document.addEventListener('click', function (e) {
    const viewBtn = e.target.closest('.btn-view-photo');
    if (!viewBtn) return;

    const galleryItem = viewBtn.closest('.gallery-item');
    if (!galleryItem) return;

    const videoUrl = galleryItem.dataset.video;

    if (videoUrl && videoWrap && videoFrame) {
      videoFrame.src = videoUrl;
      videoWrap.classList.remove('d-none');
      lightImg.classList.add('d-none');
    } else {
      const img = galleryItem.querySelector('img');
      if (!img) return;
      lightImg.src = img.src;
      lightImg.alt = img.alt;
      lightImg.classList.remove('d-none');
      if (videoWrap) videoWrap.classList.add('d-none');
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  // Close handlers
  function closeLightbox() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
      lightImg.src = '';
      lightImg.classList.remove('d-none');
      if (videoFrame) videoFrame.src = '';
      if (videoWrap) videoWrap.classList.add('d-none');
    }, 300);
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });
})();

/* ──────────────────────────────────────────────────────────
   9. SEARCH BAR – filters real posts and links to results
────────────────────────────────────────────────────────── */
function runSiteSearch(rawQuery) {
  const query = (rawQuery || '').trim().toLowerCase();
  if (!query) return;

  const all       = pubGet(PUB_KEY_POSTS, DEFAULT_POSTS);
  const published = all.filter(p => p.status === 'published');
  const matches   = published.filter(p =>
    p.title.toLowerCase().includes(query) ||
    (p.excerpt  || '').toLowerCase().includes(query) ||
    (p.category || '').toLowerCase().includes(query) ||
    (p.author   || '').toLowerCase().includes(query)
  );

  openSearchModal(query, matches);
}

(function initSearch() {
  const input = document.getElementById('searchInput');
  const btn   = document.querySelector('.search-btn');
  if (!input) return;

  input.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    runSiteSearch(this.value);
  });

  if (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      runSiteSearch(input.value);
    });
  }
})();

function openSearchModal(query, matches) {
  const overlay = document.getElementById('searchModalOverlay');
  const body    = document.getElementById('searchModalBody');
  const queryEl = document.getElementById('searchModalQuery');
  if (!overlay || !body) return;

  queryEl.textContent = query;

  body.innerHTML = matches.length ? matches.map(p => `
    <div class="search-result-item" data-id="${p.id}">
      <img src="${p.image || 'images/backgroundimage.jpeg'}" alt="${escapeHtml(p.title)}" loading="lazy" />
      <div>
        <h6>${escapeHtml(p.title)}</h6>
        <p>${escapeHtml(p.excerpt || '')}</p>
      </div>
    </div>`).join('') : `
    <div class="search-empty-state">
      <i class="fas fa-magnifying-glass"></i>
      <p>No stories found for "${escapeHtml(query)}".</p>
    </div>`;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  body.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.dataset.id);
      closeSearchModal();
      openPostModal(id);
    });
  });
}

function closeSearchModal() {
  const overlay = document.getElementById('searchModalOverlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

(function initSearchModal() {
  const overlay = document.getElementById('searchModalOverlay');
  const closeBtn = document.getElementById('searchModalClose');
  if (!overlay) return;

  if (closeBtn) closeBtn.addEventListener('click', closeSearchModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeSearchModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearchModal(); });
})();

/* ──────────────────────────────────────────────────────────
   10. "READ MORE" – full article modal
────────────────────────────────────────────────────────── */
function openPostModal(id) {
  const all  = pubGet(PUB_KEY_POSTS, DEFAULT_POSTS);
  const post = all.find(p => p.id === id);
  if (!post) return;

  const overlay   = document.getElementById('postModalOverlay');
  const img       = document.getElementById('postModalImg');
  const category  = document.getElementById('postModalCategory');
  const title     = document.getElementById('postModalTitle');
  const author    = document.getElementById('postModalAuthor');
  const date      = document.getElementById('postModalDate');
  const text      = document.getElementById('postModalText');
  const videoWrap = document.getElementById('postModalVideoWrap');
  const videoEl   = document.getElementById('postModalVideo');
  if (!overlay) return;

  img.src            = post.image || 'images/backgroundimage.jpeg';
  img.alt            = post.title;
  category.textContent = post.category || '';
  category.className = `card-category ${catClass(post.category)}`;
  title.textContent  = post.title;
  author.textContent = post.author || '';
  date.textContent   = post.date || '';
  text.textContent   = post.content || post.excerpt || '';

  if (post.videoUrl) {
    videoEl.src = post.videoUrl;
    videoWrap.classList.remove('d-none');
  } else {
    videoEl.src = '';
    videoWrap.classList.add('d-none');
  }

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePostModal() {
  const overlay = document.getElementById('postModalOverlay');
  const videoEl = document.getElementById('postModalVideo');
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  if (videoEl) videoEl.src = '';
}

(function initPostModal() {
  const overlay  = document.getElementById('postModalOverlay');
  const closeBtn = document.getElementById('postModalClose');
  if (!overlay) return;

  // Delegated click for any "Read More" button rendered by renderPublicPosts()
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-read-more');
    if (!btn) return;
    e.preventDefault();
    const id = parseInt(btn.dataset.id);
    if (id) openPostModal(id);
  });

  if (closeBtn) closeBtn.addEventListener('click', closePostModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closePostModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePostModal(); });
})();

/* ──────────────────────────────────────────────────────────
   11. ACTIVE NAV LINK on scroll
────────────────────────────────────────────────────────── */
(function initActiveNav() {
  const sections  = document.querySelectorAll('section[id], footer[id]');
  const navLinks  = document.querySelectorAll('.navbar-nav .nav-link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.toggle(
              'active',
              link.getAttribute('href') === `#${entry.target.id}`
            );
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach(sec => observer.observe(sec));
})();

/* ──────────────────────────────────────────────────────────
   12. TOAST NOTIFICATION
────────────────────────────────────────────────────────── */
function showToast(message, type = 'info') {
  const existing = document.getElementById('jb-toast');
  if (existing) existing.remove();

  const colors = {
    success: '#2a9d8f',
    warning: '#f4a261',
    info:    '#457b9d',
    error:   '#e63946',
  };
  const icons = {
    success: 'fa-circle-check',
    warning: 'fa-triangle-exclamation',
    info:    'fa-circle-info',
    error:   'fa-circle-xmark',
  };

  const toast = document.createElement('div');
  toast.id = 'jb-toast';
  toast.setAttribute('role', 'alert');
  toast.style.cssText = `
    position: fixed;
    bottom: 5rem;
    right: 1.5rem;
    background: ${colors[type] || colors.info};
    color: #fff;
    padding: .75rem 1.2rem;
    border-radius: 10px;
    font-family: 'Poppins', sans-serif;
    font-size: .82rem;
    font-weight: 500;
    box-shadow: 0 8px 24px rgba(0,0,0,.25);
    display: flex;
    align-items: center;
    gap: .6rem;
    z-index: 9999;
    max-width: 320px;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity .3s ease, transform .3s ease;
  `;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i>${message}`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity   = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

/* ──────────────────────────────────────────────────────────
   13. HTML ESCAPE UTILITY
────────────────────────────────────────────────────────── */
function escapeHtml(str) {
  const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' };
  return str.replace(/[&<>"']/g, m => map[m]);
}

/* ──────────────────────────────────────────────────────────
   14. PUBLIC DATA RENDERING  (reads from admin localStorage)
────────────────────────────────────────────────────────── */

/* ── Shared storage keys (must match admin.js) ── */
const PUB_KEY_POSTS    = 'dd_posts';
const PUB_KEY_COMMENTS = 'dd_comments';
const PUB_KEY_GALLERY  = 'dd_gallery';
const PUB_KEY_BREAKING = 'dd_breaking';
const PUB_KEY_SETTINGS = 'dd_settings';

/* ── Default fallback data ── */
const DEFAULT_POSTS = [
  { id: 1, title: 'World Leaders Summit Ends With Landmark Climate Agreement',
    category: 'Politics', author: 'Joseph Adesanya',
    excerpt: 'Delegates from 190 nations signed a binding accord pledging net-zero emissions by 2045.',
    content: 'Delegates from 190 nations signed a binding accord pledging net-zero emissions by 2045. The agreement, reached after two weeks of intense negotiation, sets binding interim targets for 2030 and 2035 and establishes a $200 billion fund to help developing nations transition to renewable energy.',
    image: '', status: 'published', date: '2026-07-08' },
  { id: 2, title: 'National Team Books Final Spot in World Cup Qualifier',
    category: 'Breaking News', author: 'Mwachilimu',
    excerpt: 'A dramatic stoppage-time goal secured qualification as thousands of fans celebrated.',
    content: 'A dramatic stoppage-time goal secured qualification as thousands of fans celebrated across the country. The winning strike came in the 94th minute, sparking scenes of jubilation in stadiums and living rooms alike.',
    image: '', status: 'published', date: '2026-07-06' },
  { id: 3, title: 'New Vaccine Shows 98% Efficacy in Phase-3 Trials',
    category: 'Health', author: 'Linda Mensah',
    excerpt: 'Researchers published peer-reviewed results confirming the vaccine\'s safety.',
    content: 'Researchers published peer-reviewed results confirming the vaccine\'s safety and efficacy across all age groups tested. Regulatory approval is expected within the coming months following review by health authorities.',
    image: '', status: 'published', date: '2026-07-04' },
  { id: 4, title: 'Central Bank Hike Signals Tighter Credit Conditions Ahead',
    category: 'Business', author: 'Linda Mensah',
    excerpt: 'Analysts warn the 25-basis-point increase will slow mortgage approvals.',
    content: 'Analysts warn the 25-basis-point increase will slow mortgage approvals and cool an overheated housing market. The central bank cited persistent inflation pressures as the primary driver behind the decision.',
    image: '', status: 'published', date: '2026-07-05' },
  { id: 5, title: 'Crewed Lunar Mission Confirmed for Late 2027 Launch',
    category: 'Breaking News', author: 'Joseph Adesanya',
    excerpt: 'The agency outlined a mission profile allowing a 21-day lunar stay.',
    content: 'The agency outlined a mission profile allowing a 21-day lunar stay, the longest crewed surface mission in history. Four astronauts will conduct geological surveys near the lunar south pole.',
    image: '', status: 'published', date: '2026-07-03' },
  { id: 6, title: 'Education Reform Bill Passes in Parliament With Strong Majority',
    category: 'Education', author: 'Joseph Adesanya',
    excerpt: 'The sweeping legislation introduces new funding formulas and digital literacy curricula.',
    content: 'The sweeping legislation introduces new funding formulas and digital literacy curricula for schools nationwide. Lawmakers say the reforms will take effect at the start of the next academic year.',
    image: '', status: 'published', date: '2026-07-08' },
];

const DEFAULT_COMMENTS = [
  { id: 1, name: 'James Onyango', email: 'james@email.com',
    text: 'Excellent coverage on the climate summit! It\'s refreshing to see in-depth reporting.',
    date: 'July 8, 2026 · 10:24 AM', likes: 24 },
  { id: 2, name: 'Peter Mwaniki', email: 'peter@email.com',
    text: 'The health and business sections keep getting better! Would love to see a deep-dive series.',
    date: 'July 7, 2026 · 3:15 PM', likes: 18 },
  { id: 3, name: 'Waingo', email: 'waingo@email.com',
    text: 'Proud supporter since day one. Digital Dialogue continues to set the standard for journalism.',
    date: 'July 6, 2026 · 9:05 AM', likes: 41 },
];

const DEFAULT_GALLERY = [
  { id: 1, caption: 'World Summit 2026',     date: '2026-07-08', image: '', videoUrl: '' },
  { id: 2, caption: 'Championship Finals',   date: '2026-07-06', image: '', videoUrl: '' },
  { id: 3, caption: 'Tech Expo Demo Day',    date: '2026-07-05', image: '', videoUrl: '' },
  { id: 4, caption: 'Harvest Festival 2026', date: '2026-07-04', image: '', videoUrl: '' },
  { id: 5, caption: 'Lunar Mission Launch',  date: '2026-07-03', image: '', videoUrl: '' },
  { id: 6, caption: 'Medical Research Lab',  date: '2026-07-02', image: '', videoUrl: '' },
];

/* ── Default breaking news ticker items (shown until admin adds their own) ── */
const DEFAULT_BREAKING = [
  { id: 1, time: '12:45 PM', text: 'Global climate summit reaches historic carbon agreement' },
  { id: 2, time: '11:30 AM', text: 'Tech giant unveils next-generation AI chip that outperforms all rivals' },
  { id: 3, time: '10:15 AM', text: 'World Cup qualifier: National team secures spot in final round' },
  { id: 4, time: '09:00 AM', text: 'Central bank raises interest rates by 25 basis points amid inflation concerns' },
  { id: 5, time: '08:20 AM', text: 'Space agency announces crewed lunar mission for 2027' },
  { id: 6, time: '07:45 AM', text: 'Health ministry confirms new vaccine achieves 98% efficacy in trials' },
];

function pubGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

/* ── Category → CSS class map ── */
const CAT_CLASS = {
  'politics':      'cat-politics',
  'business':      'cat-biz',
  'health':        'cat-health',
  'education':     'cat-education',
  'entertainment': 'cat-entertainment',
  'breaking news': 'cat-world',
};
function catClass(cat) {
  return CAT_CLASS[(cat || '').toLowerCase()] || 'cat-world';
}

function renderPublicPosts() {
  const all       = pubGet(PUB_KEY_POSTS, DEFAULT_POSTS);
  const published = all.filter(p => p.status === 'published');
  const trendingGrid = document.getElementById('trendingGrid');
  const latestGrid   = document.getElementById('latestGrid');
  if (!trendingGrid || !latestGrid) return;

  trendingGrid.innerHTML = published.slice(0, 6).map(p => `
    <div class="col-sm-6 col-xl-4">
      <article class="news-card">
        <div class="news-card-img-wrap">
          <img src="${p.image || 'images/backgroundimage.jpeg'}" alt="${escapeHtml(p.category)}" class="news-card-img" loading="lazy" />
          <span class="card-category ${catClass(p.category)}">${escapeHtml(p.category)}</span>
        </div>
        <div class="news-card-body">
          <h6 class="news-card-title">${escapeHtml(p.title)}</h6>
          <p class="news-card-desc">${escapeHtml(p.excerpt)}</p>
          <div class="news-card-meta">
            <span><i class="far fa-calendar-alt me-1"></i>${p.date || ''}</span>
            <a href="#" class="btn-read-more" data-id="${p.id}">Read More <i class="fas fa-arrow-right"></i></a>
          </div>
        </div>
      </article>
    </div>`).join('') || '<p class="text-muted p-3">No trending posts yet.</p>';

  latestGrid.innerHTML = published.slice(0, 3).map(p => `
    <div class="col-md-6 col-xl-4">
      <article class="latest-card">
        <img src="${p.image || 'images/backgroundimage.jpeg'}" alt="${escapeHtml(p.title)}" loading="lazy" />
        <div class="latest-card-body">
          <h6>${escapeHtml(p.title)}</h6>
          <p>${escapeHtml(p.excerpt)}</p>
          <div class="latest-meta">
            <span><i class="fas fa-user-pen me-1"></i>${escapeHtml(p.author)}</span>
            <span><i class="far fa-calendar me-1"></i>${p.date || ''}</span>
          </div>
          <a href="#" class="btn btn-sm btn-primary-custom mt-3 d-inline-block btn-read-more" data-id="${p.id}">Read More</a>
        </div>
      </article>
    </div>`).join('') || '<p class="text-muted p-3">No latest posts yet.</p>';
}

function renderPublicGallery() {
  const items = pubGet(PUB_KEY_GALLERY, DEFAULT_GALLERY);
  const track = document.getElementById('galleryGrid');
  if (!track) return;

  if (!items.length) {
    track.innerHTML = '<p class="text-muted p-3">No gallery items yet.</p>';
    return;
  }

  const itemHtml = items.map(item => `
      <div class="gallery-item" data-video="${item.videoUrl ? escapeHtml(item.videoUrl) : ''}">
        <img src="${item.image || 'images/backgroundimage.jpeg'}" alt="${escapeHtml(item.caption)}" loading="lazy" />
        ${item.videoUrl ? '<span class="gallery-video-badge"><i class="fas fa-play"></i></span>' : ''}
        <div class="gallery-overlay">
          <p class="gallery-caption">${escapeHtml(item.caption)}</p>
          <span class="gallery-date"><i class="far fa-calendar me-1"></i>${item.date || ''}</span>
          <button class="btn-view-photo">${item.videoUrl
            ? '<i class="fas fa-play me-1"></i>Watch Video'
            : '<i class="fas fa-expand me-1"></i>View Photo'}</button>
        </div>
      </div>`).join('');

  // Duplicate the set so the CSS slide animation (-50%) loops seamlessly
  track.innerHTML = itemHtml + itemHtml;
}

function renderPublicComments() {
  const comments  = pubGet(PUB_KEY_COMMENTS, DEFAULT_COMMENTS);
  const container = document.getElementById('commentsContainer');
  if (!container) return;
  container.innerHTML = comments.map(c => `
    <div class="comment-card">
      <img src="images/backgroundimage.jpeg" alt="${escapeHtml(c.name)}" class="comment-avatar" />
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-name">${escapeHtml(c.name)}</span>
          <span class="comment-date"><i class="far fa-clock me-1"></i>${c.date}</span>
        </div>
        <p class="comment-text">${escapeHtml(c.text)}</p>
        <div class="comment-actions">
          <button class="btn-like" onclick="likeComment(this)">
            <i class="fas fa-thumbs-up me-1"></i><span>${c.likes || 0}</span>
          </button>
          <button class="btn-reply"><i class="fas fa-reply me-1"></i>Reply</button>
        </div>
        ${c.reply ? `
        <div class="admin-reply-card">
          <div class="admin-reply-header">
            <span class="admin-reply-badge"><i class="fas fa-shield-halved me-1"></i>${escapeHtml(c.reply.author || 'Admin')}</span>
            <span class="comment-date"><i class="far fa-clock me-1"></i>${c.reply.date}</span>
          </div>
          <p class="admin-reply-text">${escapeHtml(c.reply.text)}</p>
        </div>` : ''}
      </div>
    </div>`).join('') || '<p class="text-muted p-3">No comments yet. Be the first!</p>';
}

/* ── 15. CATEGORY CARD CLICK FILTER
────────────────────────────────────────────────────────── */
(function initCategoryFilter() {
  document.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('click', function () {
      const cat = this.querySelector('span')?.textContent.trim().toLowerCase() || '';
      const trending = document.getElementById('trending');
      if (trending) {
        trending.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast(`Showing "${cat}" stories`, 'info');
      }
    });
  });
})();

/* ──────────────────────────────────────────────────────────
   16. INIT PUBLIC RENDER  – waits for DOM to be ready
────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  renderSiteLogo();
  renderBreakingTicker();
  renderPublicPosts();
  renderPublicGallery();
  renderPublicComments();
});

/* Live-refresh the public site if the admin updates content
   from the admin panel in another tab/window. */
window.addEventListener('storage', function (e) {
  if (e.key === PUB_KEY_SETTINGS) renderSiteLogo();
  if (e.key === PUB_KEY_BREAKING) renderBreakingTicker();
  if (e.key === PUB_KEY_POSTS)    renderPublicPosts();
  if (e.key === PUB_KEY_GALLERY)  renderPublicGallery();
  if (e.key === PUB_KEY_COMMENTS) renderPublicComments();
});