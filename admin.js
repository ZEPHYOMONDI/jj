/* ============================================================
   DIGITAL DIALOGUE – admin.js
   All admin dashboard logic: auth, posts, comments, gallery,
   settings, stats, navigation, toast, confirm modal.
============================================================ */
'use strict';

/* ── Storage keys ───────────────────────────────────────── */
const KEY_AUTH     = 'dd_admin_auth';
const KEY_POSTS    = 'dd_posts';
const KEY_COMMENTS = 'dd_comments';
const KEY_GALLERY  = 'dd_gallery';
const KEY_BREAKING = 'dd_breaking';
const KEY_SETTINGS = 'dd_settings';
const KEY_CREDS    = 'dd_creds';

/* ── Default credentials ────────────────────────────────── */
const DEFAULT_USER = 'admin';
const DEFAULT_PASS = 'admin123';

/* ── Seed data ──────────────────────────────────────────── */
const SEED_POSTS = [
  { id: 1, title: 'World Leaders Summit Ends With Landmark Climate Agreement', category: 'Politics',
    author: 'Joseph Adesanya', excerpt: 'Delegates from 190 nations signed a binding accord pledging net-zero emissions by 2045.',
    content: 'Full article content here...', status: 'published', date: '2026-07-08', views: 12450 },
  { id: 2, title: 'National Team Books Final Spot in World Cup Qualifier', category: 'Breaking News',
    author: 'Mwachilimu', excerpt: 'A dramatic stoppage-time goal secured qualification.',
    content: 'Full article content here...', status: 'published', date: '2026-07-06', views: 8730 },
  { id: 3, title: 'New Vaccine Shows 98% Efficacy in Phase-3 Trials', category: 'Health',
    author: 'Linda Mensah', excerpt: 'Researchers published peer-reviewed results confirming the vaccine safety.',
    content: 'Full article content here...', status: 'published', date: '2026-07-04', views: 6520 },
  { id: 4, title: 'Start-Up Secures Record $5 Billion Series C Funding', category: 'Business',
    author: 'Linda Mensah', excerpt: 'The fintech company plans to expand into 40 new markets.',
    content: 'Full article content here...', status: 'draft', date: '2026-07-06', views: 3410 },
];
const SEED_COMMENTS = [
  { id: 1, name: 'James Onyango', email: 'james@email.com', text: 'Excellent coverage on the climate summit!', date: '2026-07-08 10:24', likes: 24 },
  { id: 2, name: 'Peter Mwaniki',  email: 'peter@email.com', text: 'The health and business sections keep getting better!', date: '2026-07-07 15:15', likes: 18 },
  { id: 3, name: 'Waingo',         email: 'waingo@email.com', text: 'Proud supporter since day one. Keep up the great work!', date: '2026-07-06 09:05', likes: 41 },
];
const SEED_GALLERY = [
  { id: 1, caption: 'World Summit 2026',      date: '2026-07-08', image: '', videoUrl: '' },
  { id: 2, caption: 'Championship Finals',    date: '2026-07-06', image: '', videoUrl: '' },
  { id: 3, caption: 'Tech Expo Demo Day',     date: '2026-07-05', image: '', videoUrl: '' },
  { id: 4, caption: 'Harvest Festival 2026',  date: '2026-07-04', image: '', videoUrl: '' },
  { id: 5, caption: 'Lunar Mission Launch',   date: '2026-07-03', image: '', videoUrl: '' },
  { id: 6, caption: 'Medical Research Lab',   date: '2026-07-02', image: '', videoUrl: '' },
];
const SEED_BREAKING = [
  { id: 1, time: '12:45 PM', text: 'Global climate summit reaches historic carbon agreement' },
  { id: 2, time: '11:30 AM', text: 'Tech giant unveils next-generation AI chip that outperforms all rivals' },
  { id: 3, time: '10:15 AM', text: 'World Cup qualifier: National team secures spot in final round' },
  { id: 4, time: '09:00 AM', text: 'Central bank raises interest rates by 25 basis points amid inflation concerns' },
  { id: 5, time: '08:20 AM', text: 'Space agency announces crewed lunar mission for 2027' },
  { id: 6, time: '07:45 AM', text: 'Health ministry confirms new vaccine achieves 98% efficacy in trials' },
];

/* ── Storage helpers ────────────────────────────────────── */
const store = {
  get: (key, fallback = null) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  remove: (key)   => localStorage.removeItem(key),
};

function getPosts()    { return store.get(KEY_POSTS,    SEED_POSTS);    }
function getComments() { return store.get(KEY_COMMENTS, SEED_COMMENTS); }
function getGallery()  { return store.get(KEY_GALLERY,  SEED_GALLERY);  }
function getBreaking() { return store.get(KEY_BREAKING, SEED_BREAKING); }
function getSettings() {
  return store.get(KEY_SETTINGS, {
    siteName: 'Digital Dialogue', tagline: 'Your Trusted News Source',
    email: 'info@josephblog.com', phone: '+254 726 273051', address: '123 Nairobi, Kenya',
    logo: '',
  });
}
function getCreds() {
  return store.get(KEY_CREDS, { username: DEFAULT_USER, password: DEFAULT_PASS });
}

function savePosts(p)    { store.set(KEY_POSTS, p);    refreshBadges(); refreshStats(); }
function saveComments(c) { store.set(KEY_COMMENTS, c); refreshBadges(); refreshStats(); }
function saveGallery(g)  { store.set(KEY_GALLERY, g);  refreshStats(); }
function saveBreaking(b) { store.set(KEY_BREAKING, b); refreshBadges(); }

/* ── Generate ID ────────────────────────────────────────── */
function genId() { return Date.now(); }

/* ============================================================
   AUTH
============================================================ */
function isLoggedIn() { return store.get(KEY_AUTH) === true; }

function initLogin() {
  const form    = document.getElementById('loginForm');
  const userEl  = document.getElementById('loginUser');
  const passEl  = document.getElementById('loginPass');
  const errEl   = document.getElementById('loginError');
  const toggle  = document.getElementById('togglePass');

  // Show/hide password
  toggle.addEventListener('click', () => {
    const isPass = passEl.type === 'password';
    passEl.type  = isPass ? 'text' : 'password';
    toggle.querySelector('i').className = isPass ? 'fas fa-eye-slash' : 'fas fa-eye';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const creds = getCreds();
    if (userEl.value.trim() === creds.username && passEl.value === creds.password) {
      store.set(KEY_AUTH, true);
      errEl.classList.add('d-none');
      showDashboard();
    } else {
      errEl.classList.remove('d-none');
      passEl.value = '';
      passEl.focus();
    }
  });
}

function showDashboard() {
  document.getElementById('loginScreen').classList.add('d-none');
  document.getElementById('dashboard').classList.remove('d-none');
  initDashboard();
}

function logout() {
  store.remove(KEY_AUTH);
  document.getElementById('dashboard').classList.add('d-none');
  document.getElementById('loginScreen').classList.remove('d-none');
  document.getElementById('loginForm').reset();
  document.getElementById('loginError').classList.add('d-none');
}

/* ============================================================
   NAVIGATION
============================================================ */
function initNav() {
  // Sidebar nav links
  document.querySelectorAll('.sidebar-nav .nav-item[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.section);
      closeSidebar();
    });
  });

  // "+" buttons inside content that switch section
  document.querySelectorAll('[data-section]').forEach(btn => {
    if (!btn.closest('.sidebar-nav')) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(btn.dataset.section);
      });
    }
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });

  // Mobile sidebar toggle
  document.getElementById('sidebarToggle').addEventListener('click', openSidebar);
  document.getElementById('sidebarClose').addEventListener('click', closeSidebar);

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebarOverlay';
  overlay.addEventListener('click', closeSidebar);
  document.body.appendChild(overlay);
}

function navigateTo(section) {
  // Deactivate all
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(l => l.classList.remove('active'));

  // Activate target
  const el = document.getElementById('section-' + section);
  if (el) el.classList.add('active');
  const link = document.querySelector(`.sidebar-nav .nav-item[data-section="${section}"]`);
  if (link) link.classList.add('active');

  // Update topbar title
  const titles = {
    overview: 'Overview', posts: 'Posts', addPost: 'Add / Edit Post',
    comments: 'Comments', gallery: 'Gallery', breaking: 'Breaking News', settings: 'Settings',
  };
  document.getElementById('topbarTitle').textContent = titles[section] || section;

  // Refresh content
  if (section === 'overview')  renderOverview();
  if (section === 'posts')     renderPostsTable();
  if (section === 'comments')  renderCommentsTable();
  if (section === 'gallery')   renderGalleryAdmin();
  if (section === 'breaking')  renderBreakingAdmin();
  if (section === 'settings')  loadSettings();
  if (section === 'addPost')   resetPostForm();
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

/* ============================================================
   STATS & BADGES
============================================================ */
function refreshStats() {
  const posts    = getPosts();
  const comments = getComments();
  const gallery  = getGallery();
  const views    = posts.reduce((acc, p) => acc + (p.views || 0), 0);

  setText('statPosts',    posts.length);
  setText('statComments', comments.length);
  setText('statGallery',  gallery.length);
  setText('statViews',    views.toLocaleString());
}

function refreshBadges() {
  setText('postsBadge',    getPosts().length);
  setText('commentsBadge', getComments().length);
  setText('breakingBadge', getBreaking().length);
}

/* ============================================================
   OVERVIEW
============================================================ */
function renderOverview() {
  refreshStats();
  const posts = getPosts().slice(0, 5);
  const tbody = document.querySelector('#overviewPostsTable tbody');
  tbody.innerHTML = posts.length ? posts.map((p, i) => postRow(p, i + 1, true)).join('') : emptyRow(6);
  bindPostActions();
}

/* ============================================================
   POSTS
============================================================ */
function renderPostsTable(filter = '') {
  let posts = getPosts();
  if (filter) posts = posts.filter(p =>
    p.title.toLowerCase().includes(filter) ||
    p.category.toLowerCase().includes(filter) ||
    p.author.toLowerCase().includes(filter)
  );

  const tbody   = document.querySelector('#postsTable tbody');
  const emptyEl = document.getElementById('postsEmpty');
  tbody.innerHTML = posts.length ? posts.map((p, i) => postRow(p, i + 1, false)).join('') : emptyRow(7);
  emptyEl.classList.toggle('d-none', posts.length > 0);

  bindPostActions();
}

function postRow(p, i, compact) {
  const badge = p.status === 'published'
    ? `<span class="badge-published"><i class="fas fa-check-circle me-1"></i>Published</span>`
    : `<span class="badge-draft"><i class="fas fa-pencil me-1"></i>Draft</span>`;

  const authorCol = compact ? '' : `<td>${esc(p.author)}</td>`;
  return `
    <tr data-id="${p.id}">
      <td>${i}</td>
      <td><strong>${esc(p.title)}</strong></td>
      <td><span class="badge-draft" style="background:rgba(69,123,157,.2);color:#7ec8e3">${esc(p.category)}</span></td>
      ${authorCol}
      <td>${p.date || '—'}</td>
      <td>${badge}</td>
      <td>
        <button class="tbl-btn edit-post-btn" data-id="${p.id}"><i class="fas fa-pen"></i> Edit</button>
        <button class="tbl-btn danger delete-post-btn" data-id="${p.id}"><i class="fas fa-trash"></i> Delete</button>
      </td>
    </tr>`;
}

function emptyRow(cols) {
  return `<tr><td colspan="${cols}" style="text-align:center;color:#94a3b8;padding:2rem">No records found.</td></tr>`;
}

function bindPostActions() {
  // Delegated listeners are attached once per table (guarded by a data flag),
  // so this is safe to call on every render and works for both the Overview
  // table and the full Posts table without ever double-binding.
  ['#overviewPostsTable', '#postsTable'].forEach(sel => {
    const table = document.querySelector(sel);
    if (!table || table.dataset.actionsBound) return;
    table.dataset.actionsBound = 'true';
    table.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.edit-post-btn');
      if (editBtn) { editPost(parseInt(editBtn.dataset.id)); return; }
      const delBtn = e.target.closest('.delete-post-btn');
      if (delBtn) { confirmDelete('post', parseInt(delBtn.dataset.id)); }
    });
  });
}

function editPost(id) {
  const post = getPosts().find(p => p.id === id);
  if (!post) return;
  document.getElementById('postId').value       = post.id;
  document.getElementById('pTitle').value       = post.title;
  document.getElementById('pCategory').value    = post.category;
  document.getElementById('pAuthor').value      = post.author;
  document.getElementById('pExcerpt').value     = post.excerpt;
  document.getElementById('pContent').value     = post.content;
  document.getElementById('pStatus').value      = post.status;
  document.getElementById('pDate').value        = post.date || '';

  // Restore image preview
  if (post.image && initPostForm._setImagePreview) {
    initPostForm._setImagePreview(post.image);
  } else if (initPostForm._clearImageField) {
    initPostForm._clearImageField();
  }

  // Restore video
  const videoInput       = document.getElementById('pVideoUrl');
  const videoPreviewWrap = document.getElementById('videoPreviewWrap');
  const videoFrame       = document.getElementById('videoPreview');
  videoInput.value = post.videoUrl || '';
  if (post.videoUrl) {
    videoFrame.src = post.videoUrl;
    videoPreviewWrap.classList.remove('d-none');
  } else {
    videoFrame.src = '';
    videoPreviewWrap.classList.add('d-none');
  }

  document.getElementById('postFormTitle').innerHTML =
    '<i class="fas fa-pen me-2"></i>Edit Post';
  document.getElementById('postSubmitBtn').innerHTML =
    '<i class="fas fa-save me-2"></i>Update Post';
  navigateTo('addPost');
}

function deletePost(id) {
  savePosts(getPosts().filter(p => p.id !== id));
  renderPostsTable();
  renderOverview();
  toast('Post deleted.', 'success');
}

function initPostForm() {
  // Post search
  document.getElementById('postSearch').addEventListener('input', function () {
    renderPostsTable(this.value.trim().toLowerCase());
  });

  // Set today's date as default
  document.getElementById('pDate').value = new Date().toISOString().split('T')[0];

  // ── Image upload ──────────────────────────────────────
  const imageInput    = document.getElementById('pImage');
  const imageZone     = document.getElementById('imageUploadZone');
  const imageZoneBody = document.getElementById('imageZoneBody');
  const previewWrap   = document.getElementById('imagePreviewWrap');
  const previewImg    = document.getElementById('imagePreview');
  const imageData     = document.getElementById('pImageData');
  const clearImageBtn = document.getElementById('clearImage');

  imageZone.addEventListener('click', () => imageInput.click());
  imageZone.addEventListener('dragover', e => { e.preventDefault(); imageZone.classList.add('drag-over'); });
  imageZone.addEventListener('dragleave', () => imageZone.classList.remove('drag-over'));
  imageZone.addEventListener('drop', e => {
    e.preventDefault();
    imageZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) loadImageFile(file);
  });
  imageInput.addEventListener('change', () => {
    if (imageInput.files[0]) loadImageFile(imageInput.files[0]);
  });
  clearImageBtn.addEventListener('click', e => {
    e.stopPropagation();
    clearImageField();
  });

  function loadImageFile(file) {
    if (!file.type.startsWith('image/')) { toast('Please select an image file.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('Image must be under 5 MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function setImagePreview(src) {
    imageData.value   = src;
    previewImg.src    = src;
    imageZoneBody.classList.add('d-none');
    previewWrap.classList.remove('d-none');
  }

  function clearImageField() {
    imageData.value = '';
    imageInput.value = '';
    previewImg.src  = '';
    imageZoneBody.classList.remove('d-none');
    previewWrap.classList.add('d-none');
  }

  // ── Video URL preview ─────────────────────────────────
  const videoInput      = document.getElementById('pVideoUrl');
  const videoPreviewWrap = document.getElementById('videoPreviewWrap');
  const videoFrame      = document.getElementById('videoPreview');
  const clearVideoBtn   = document.getElementById('clearVideo');

  videoInput.addEventListener('input', () => {
    const url = videoInput.value.trim();
    if (url) {
      videoFrame.src = url;
      videoPreviewWrap.classList.remove('d-none');
    } else {
      clearVideoField();
    }
  });
  clearVideoBtn.addEventListener('click', () => clearVideoField());

  function clearVideoField() {
    videoInput.value = '';
    videoFrame.src   = '';
    videoPreviewWrap.classList.add('d-none');
  }

  // expose helpers for editPost / resetPostForm
  initPostForm._setImagePreview = setImagePreview;
  initPostForm._clearImageField = clearImageField;
  initPostForm._clearVideoField = clearVideoField;

  // ── Form submit ───────────────────────────────────────
  document.getElementById('postForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id    = document.getElementById('postId').value;
    const posts = getPosts();
    const newPost = {
      id:       id ? parseInt(id) : genId(),
      title:    document.getElementById('pTitle').value.trim(),
      category: document.getElementById('pCategory').value,
      author:   document.getElementById('pAuthor').value.trim(),
      excerpt:  document.getElementById('pExcerpt').value.trim(),
      content:  document.getElementById('pContent').value.trim(),
      status:   document.getElementById('pStatus').value,
      date:     document.getElementById('pDate').value,
      image:    document.getElementById('pImageData').value || '',
      videoUrl: document.getElementById('pVideoUrl').value.trim(),
      views:    0,
    };

    if (!newPost.title || !newPost.category || !newPost.author || !newPost.excerpt || !newPost.content) {
      toast('Please fill in all required fields.', 'error'); return;
    }

    if (id) {
      const idx = posts.findIndex(p => p.id === parseInt(id));
      if (idx !== -1) { newPost.views = posts[idx].views; posts[idx] = newPost; }
    } else {
      posts.unshift(newPost);
    }

    savePosts(posts);
    toast(id ? 'Post updated successfully!' : 'Post published successfully!', 'success');
    resetPostForm();
    navigateTo('posts');
  });

  // Cancel
  document.getElementById('postCancelBtn').addEventListener('click', () => {
    resetPostForm();
    navigateTo('posts');
  });
}

function resetPostForm() {
  document.getElementById('postForm').reset();
  document.getElementById('postId').value = '';
  document.getElementById('pDate').value  = new Date().toISOString().split('T')[0];
  document.getElementById('postFormTitle').innerHTML  = '<i class="fas fa-plus-circle me-2"></i>Add New Post';
  document.getElementById('postSubmitBtn').innerHTML  = '<i class="fas fa-save me-2"></i>Save Post';
  // Clear image & video
  if (initPostForm._clearImageField) initPostForm._clearImageField();
  if (initPostForm._clearVideoField) initPostForm._clearVideoField();
}

/* ============================================================
   COMMENTS
============================================================ */
function renderCommentsTable() {
  const comments = getComments();
  const tbody    = document.querySelector('#commentsTable tbody');
  const emptyEl  = document.getElementById('commentsEmpty');

  tbody.innerHTML = comments.length
    ? comments.map((c, i) => `
        <tr data-id="${c.id}">
          <td>${i + 1}</td>
          <td>
            <strong>${esc(c.name)}</strong><br>
            <span style="font-size:.7rem;color:#94a3b8">${esc(c.email)}</span>
          </td>
          <td style="max-width:320px;white-space:normal">${esc(c.text)}</td>
          <td>
            ${c.reply
              ? `<div class="admin-reply-preview"><i class="fas fa-reply me-1"></i>${esc(c.reply.text)}</div>`
              : `<span class="admin-reply-none">No reply yet</span>`}
          </td>
          <td style="white-space:nowrap">${c.date}</td>
          <td>
            <button class="tbl-btn reply-comment-btn" data-id="${c.id}">
              <i class="fas fa-reply"></i> ${c.reply ? 'Edit Reply' : 'Reply'}
            </button>
            <button class="tbl-btn danger delete-comment-btn" data-id="${c.id}">
              <i class="fas fa-trash"></i> Delete
            </button>
          </td>
        </tr>`).join('')
    : emptyRow(6);

  emptyEl.classList.toggle('d-none', comments.length > 0);

  document.querySelectorAll('.delete-comment-btn').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete('comment', parseInt(btn.dataset.id)));
  });
  document.querySelectorAll('.reply-comment-btn').forEach(btn => {
    btn.addEventListener('click', () => openReplyModal(parseInt(btn.dataset.id)));
  });
}

function deleteComment(id) {
  saveComments(getComments().filter(c => c.id !== id));
  renderCommentsTable();
  toast('Comment deleted.', 'success');
}

/* ── Admin reply to a comment ───────────────────────────── */
let _replyCommentId = null;

function openReplyModal(id) {
  const comment = getComments().find(c => c.id === id);
  if (!comment) return;

  _replyCommentId = id;
  document.getElementById('replyOriginalName').textContent = comment.name;
  document.getElementById('replyOriginalText').textContent = comment.text;
  document.getElementById('replyText').value = comment.reply ? comment.reply.text : '';
  document.getElementById('replyDeleteBtn').classList.toggle('d-none', !comment.reply);

  const modal = new bootstrap.Modal(document.getElementById('replyModal'));
  modal.show();
}

function saveReply() {
  const text = document.getElementById('replyText').value.trim();
  if (!text) { toast('Please write a reply before sending.', 'error'); return; }
  if (_replyCommentId === null) return;

  const comments = getComments();
  const idx = comments.findIndex(c => c.id === _replyCommentId);
  if (idx === -1) return;

  comments[idx].reply = {
    text,
    author: getCreds().username,
    date: new Date().toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }),
  };
  saveComments(comments);
  renderCommentsTable();
  bootstrap.Modal.getInstance(document.getElementById('replyModal')).hide();
  toast('Reply sent.', 'success');
}

function removeReply() {
  if (_replyCommentId === null) return;
  const comments = getComments();
  const idx = comments.findIndex(c => c.id === _replyCommentId);
  if (idx === -1) return;

  delete comments[idx].reply;
  saveComments(comments);
  renderCommentsTable();
  bootstrap.Modal.getInstance(document.getElementById('replyModal')).hide();
  toast('Reply removed.', 'success');
}

function initReplyModal() {
  document.getElementById('replySaveBtn').addEventListener('click', saveReply);
  document.getElementById('replyDeleteBtn').addEventListener('click', () => {
    confirmAction('Remove Reply', 'This will remove your reply from this comment.', removeReply);
  });
}

function initCommentControls() {
  document.getElementById('clearAllComments').addEventListener('click', () => {
    confirmAction('Delete All Comments', 'This will permanently delete all comments. Continue?', () => {
      saveComments([]);
      renderCommentsTable();
      toast('All comments deleted.', 'success');
    });
  });
}

/* ============================================================
   GALLERY
============================================================ */
function renderGalleryAdmin() {
  const gallery = getGallery();
  const grid    = document.getElementById('galleryAdminGrid');
  const emptyEl = document.getElementById('galleryEmpty');

  grid.innerHTML = gallery.length
    ? gallery.map(item => `
        <div class="gallery-admin-item" data-id="${item.id}">
          <img src="${item.image || 'images/backgroundimage.jpeg'}" alt="${esc(item.caption)}" />
          ${item.videoUrl ? '<span class="gallery-admin-video-badge"><i class="fas fa-video"></i> Video</span>' : ''}
          <div class="gallery-admin-info">
            <p>${esc(item.caption)}</p>
            <span><i class="far fa-calendar me-1"></i>${item.date}</span>
          </div>
          <div class="gallery-admin-actions">
            <button class="tbl-btn danger delete-gallery-btn" data-id="${item.id}" style="font-size:.72rem">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
        </div>`).join('')
    : '';

  emptyEl.classList.toggle('d-none', gallery.length > 0);

  document.querySelectorAll('.delete-gallery-btn').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete('gallery', parseInt(btn.dataset.id)));
  });
}

function deleteGalleryItem(id) {
  saveGallery(getGallery().filter(g => g.id !== id));
  renderGalleryAdmin();
  toast('Gallery item removed.', 'success');
}

function initGalleryControls() {
  const addBtn    = document.getElementById('addGalleryBtn');
  const formEl    = document.getElementById('galleryForm');
  const saveBtn   = document.getElementById('saveGalleryBtn');
  const cancelBtn = document.getElementById('cancelGalleryBtn');

  // ── Gallery image upload ──────────────────────────────
  const gImageInput   = document.getElementById('gImage');
  const gZone         = document.getElementById('galleryUploadZone');
  const gZoneBody     = document.getElementById('galleryZoneBody');
  const gPreviewWrap  = document.getElementById('galleryPreviewWrap');
  const gPreviewImg   = document.getElementById('galleryImagePreview');
  const gImageData    = document.getElementById('gImageData');
  const gClearBtn     = document.getElementById('clearGalleryImage');

  gZone.addEventListener('click', () => gImageInput.click());
  gZone.addEventListener('dragover',  e => { e.preventDefault(); gZone.classList.add('drag-over'); });
  gZone.addEventListener('dragleave', () => gZone.classList.remove('drag-over'));
  gZone.addEventListener('drop', e => {
    e.preventDefault(); gZone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) loadGalleryFile(e.dataTransfer.files[0]);
  });
  gImageInput.addEventListener('change', () => {
    if (gImageInput.files[0]) loadGalleryFile(gImageInput.files[0]);
  });
  gClearBtn.addEventListener('click', e => { e.stopPropagation(); clearGalleryUpload(); });

  function loadGalleryFile(file) {
    if (!file.type.startsWith('image/')) { toast('Please select an image file.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024)    { toast('Image must be under 5 MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      gImageData.value = ev.target.result;
      gPreviewImg.src  = ev.target.result;
      gZoneBody.classList.add('d-none');
      gPreviewWrap.classList.remove('d-none');
    };
    reader.readAsDataURL(file);
  }

  function clearGalleryUpload() {
    gImageData.value = '';
    gImageInput.value = '';
    gPreviewImg.src  = '';
    gZoneBody.classList.remove('d-none');
    gPreviewWrap.classList.add('d-none');
  }

  // ── Gallery video URL preview ─────────────────────────
  const gVideoInput      = document.getElementById('gVideoUrl');
  const gVideoPreviewWrap = document.getElementById('gVideoPreviewWrap');
  const gVideoFrame      = document.getElementById('gVideoPreview');
  const gClearVideoBtn   = document.getElementById('clearGVideo');

  gVideoInput.addEventListener('input', () => {
    const url = gVideoInput.value.trim();
    if (url) {
      gVideoFrame.src = url;
      gVideoPreviewWrap.classList.remove('d-none');
    } else {
      clearGalleryVideo();
    }
  });
  gClearVideoBtn.addEventListener('click', () => clearGalleryVideo());

  function clearGalleryVideo() {
    gVideoInput.value = '';
    gVideoFrame.src   = '';
    gVideoPreviewWrap.classList.add('d-none');
  }

  addBtn.addEventListener('click', () => {
    formEl.classList.toggle('d-none');
    document.getElementById('gDate').value = new Date().toISOString().split('T')[0];
  });

  cancelBtn.addEventListener('click', () => {
    formEl.classList.add('d-none');
    document.getElementById('gCaption').value = '';
    clearGalleryUpload();
    clearGalleryVideo();
  });

  saveBtn.addEventListener('click', () => {
    const caption  = document.getElementById('gCaption').value.trim();
    const date     = document.getElementById('gDate').value;
    const image    = document.getElementById('gImageData').value;
    const videoUrl = document.getElementById('gVideoUrl').value.trim();
    if (!caption) { toast('Please enter a caption.', 'error'); return; }
    if (!image && !videoUrl) { toast('Please add a photo, a video, or both.', 'error'); return; }
    const gallery = getGallery();
    gallery.push({
      id: genId(),
      caption,
      date:  date || new Date().toISOString().split('T')[0],
      image: image || '',
      videoUrl: videoUrl || '',
    });
    saveGallery(gallery);
    renderGalleryAdmin();
    formEl.classList.add('d-none');
    document.getElementById('gCaption').value = '';
    clearGalleryUpload();
    clearGalleryVideo();
    toast('Gallery item added.', 'success');
  });
}

/* ============================================================
   BREAKING NEWS
============================================================ */
function renderBreakingAdmin() {
  const items   = getBreaking();
  const tbody   = document.querySelector('#breakingTable tbody');
  const emptyEl = document.getElementById('breakingEmpty');

  tbody.innerHTML = items.length
    ? items.map((item, i) => `
        <tr data-id="${item.id}">
          <td>${i + 1}</td>
          <td style="white-space:nowrap">${esc(item.time || '—')}</td>
          <td>${esc(item.text)}</td>
          <td>
            <button class="tbl-btn danger delete-breaking-btn" data-id="${item.id}">
              <i class="fas fa-trash"></i> Delete
            </button>
          </td>
        </tr>`).join('')
    : emptyRow(4);

  emptyEl.classList.toggle('d-none', items.length > 0);

  document.querySelectorAll('.delete-breaking-btn').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete('breaking', parseInt(btn.dataset.id)));
  });
}

function deleteBreakingItem(id) {
  saveBreaking(getBreaking().filter(b => b.id !== id));
  renderBreakingAdmin();
  toast('Breaking news item removed.', 'success');
}

function initBreakingControls() {
  const addBtn    = document.getElementById('addBreakingBtn');
  const formEl    = document.getElementById('breakingForm');
  const saveBtn   = document.getElementById('saveBreakingBtn');
  const cancelBtn = document.getElementById('cancelBreakingBtn');

  addBtn.addEventListener('click', () => {
    formEl.classList.toggle('d-none');
  });

  cancelBtn.addEventListener('click', () => {
    formEl.classList.add('d-none');
    document.getElementById('bTime').value = '';
    document.getElementById('bText').value = '';
  });

  saveBtn.addEventListener('click', () => {
    const time = document.getElementById('bTime').value.trim();
    const text = document.getElementById('bText').value.trim();
    if (!text) { toast('Please enter a headline.', 'error'); return; }
    const items = getBreaking();
    items.push({ id: genId(), time, text });
    saveBreaking(items);
    renderBreakingAdmin();
    formEl.classList.add('d-none');
    document.getElementById('bTime').value = '';
    document.getElementById('bText').value = '';
    toast('Breaking news item added.', 'success');
  });
}

/* ============================================================
   SETTINGS
============================================================ */
function loadSettings() {
  const s = getSettings();
  setValue('sSiteName', s.siteName);
  setValue('sTagline',  s.tagline);
  setValue('sEmail',    s.email);
  setValue('sPhone',    s.phone);
  setValue('sAddress',  s.address);

  // Restore logo preview
  if (s.logo && initSettings._setLogoPreview) {
    initSettings._setLogoPreview(s.logo);
  } else if (initSettings._clearLogoField) {
    initSettings._clearLogoField();
  }

  const creds = getCreds();
  setValue('aUsername', creds.username);
}

function initSettings() {
  // ── Site Logo upload ──────────────────────────────────
  const logoInput    = document.getElementById('sLogo');
  const logoZone     = document.getElementById('logoUploadZone');
  const logoZoneBody = document.getElementById('logoZoneBody');
  const logoPreviewWrap = document.getElementById('logoPreviewWrap');
  const logoPreviewImg  = document.getElementById('logoImagePreview');
  const logoData     = document.getElementById('sLogoData');
  const clearLogoBtn  = document.getElementById('clearLogoImage');

  logoZone.addEventListener('click', () => logoInput.click());
  logoZone.addEventListener('dragover', e => { e.preventDefault(); logoZone.classList.add('drag-over'); });
  logoZone.addEventListener('dragleave', () => logoZone.classList.remove('drag-over'));
  logoZone.addEventListener('drop', e => {
    e.preventDefault();
    logoZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) loadLogoFile(file);
  });
  logoInput.addEventListener('change', () => {
    if (logoInput.files[0]) loadLogoFile(logoInput.files[0]);
  });
  clearLogoBtn.addEventListener('click', e => {
    e.stopPropagation();
    clearLogoField();
  });

  function loadLogoFile(file) {
    if (!file.type.startsWith('image/')) { toast('Please select an image file.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('Image must be under 5 MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function setLogoPreview(src) {
    logoData.value = src;
    logoPreviewImg.src = src;
    logoZoneBody.classList.add('d-none');
    logoPreviewWrap.classList.remove('d-none');
  }

  function clearLogoField() {
    logoData.value = '';
    logoInput.value = '';
    logoPreviewImg.src = '';
    logoZoneBody.classList.remove('d-none');
    logoPreviewWrap.classList.add('d-none');
  }

  initSettings._setLogoPreview = setLogoPreview;
  initSettings._clearLogoField = clearLogoField;

  // Site settings form
  document.getElementById('settingsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    store.set(KEY_SETTINGS, {
      siteName: getValue('sSiteName'),
      tagline:  getValue('sTagline'),
      email:    getValue('sEmail'),
      phone:    getValue('sPhone'),
      address:  getValue('sAddress'),
      logo:     getValue('sLogoData'),
    });
    toast('Settings saved successfully!', 'success');
  });

  // Account form
  document.getElementById('accountForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = getValue('aUsername').trim();
    const newPass  = getValue('aPassword');
    const confirm  = getValue('aPasswordConfirm');

    if (!username) { toast('Username cannot be empty.', 'error'); return; }
    if (newPass && newPass !== confirm) { toast('Passwords do not match.', 'error'); return; }

    const creds = getCreds();
    store.set(KEY_CREDS, {
      username,
      password: newPass || creds.password,
    });
    setValue('aPassword', '');
    setValue('aPasswordConfirm', '');
    toast('Account updated successfully!', 'success');
  });

  // Danger zone
  document.getElementById('deleteAllPosts').addEventListener('click', () => {
    confirmAction('Delete All Posts', 'This will permanently delete ALL posts. This cannot be undone.', () => {
      savePosts([]);
      toast('All posts deleted.', 'success');
    });
  });

  document.getElementById('deleteAllComments').addEventListener('click', () => {
    confirmAction('Delete All Comments', 'This will permanently delete ALL comments.', () => {
      saveComments([]);
      toast('All comments deleted.', 'success');
    });
  });

  document.getElementById('resetAll').addEventListener('click', () => {
    confirmAction('Reset Everything', 'This resets ALL posts, comments, gallery, breaking news and settings to defaults. Cannot be undone!', () => {
      store.remove(KEY_POSTS);
      store.remove(KEY_COMMENTS);
      store.remove(KEY_GALLERY);
      store.remove(KEY_BREAKING);
      store.remove(KEY_SETTINGS);
      store.remove(KEY_CREDS);
      refreshStats();
      refreshBadges();
      loadSettings();
      toast('Everything has been reset to defaults.', 'warning');
    });
  });
}

/* ============================================================
   CONFIRM MODAL
============================================================ */
let _confirmCallback = null;

function confirmDelete(type, id) {
  const labels = { post: 'post', comment: 'comment', gallery: 'gallery item', breaking: 'breaking news item' };
  confirmAction(
    `Delete ${labels[type] || type}`,
    `Are you sure you want to delete this ${labels[type]}? This cannot be undone.`,
    () => {
      if (type === 'post')     deletePost(id);
      if (type === 'comment')  deleteComment(id);
      if (type === 'gallery')  deleteGalleryItem(id);
      if (type === 'breaking') deleteBreakingItem(id);
    }
  );
}

function confirmAction(title, body, callback) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmBody').textContent  = body;
  _confirmCallback = callback;
  const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
  modal.show();
}

function initConfirmModal() {
  document.getElementById('confirmOk').addEventListener('click', () => {
    if (typeof _confirmCallback === 'function') _confirmCallback();
    _confirmCallback = null;
    bootstrap.Modal.getInstance(document.getElementById('confirmModal')).hide();
  });
}

/* ============================================================
   TOAST
============================================================ */
let _toastTimer = null;
function toast(message, type = 'info') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const el = document.getElementById('adminToast');
  el.className = `admin-toast ${type}`;
  el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i>${message}`;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ============================================================
   CLOCK
============================================================ */
function initClock() {
  function tick() {
    const now = new Date();
    document.getElementById('topbarTime').textContent =
      now.toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  }
  tick();
  setInterval(tick, 60000);
}

/* ============================================================
   UTILITIES
============================================================ */
function esc(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])
  );
}
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function getValue(id)     { const el = document.getElementById(id); return el ? el.value : ''; }
function setValue(id, val){ const el = document.getElementById(id); if (el) el.value = val; }

/* ============================================================
   INIT
============================================================ */
function initDashboard() {
  initNav();
  initPostForm();
  initCommentControls();
  initReplyModal();
  initGalleryControls();
  initBreakingControls();
  initSettings();
  initConfirmModal();
  initClock();
  refreshBadges();
  navigateTo('overview');
  // Set admin name from stored creds
  setText('adminName', getCreds().username);
}

document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  // Auto-restore session if already logged in
  if (isLoggedIn()) showDashboard();
});