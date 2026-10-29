// ==============================================================================
// BEN DAOUD RÉPARATION - LOGIQUE DE L'APPLICATION (FRANÇAIS)
// ==============================================================================

// Liste des ateliers demandés par défaut
const DEFAULT_ATELIERS = [
  { id: '1', nom: 'Brahim', specialite: 'Réparation générale', actif: true },
  { id: '2', nom: 'Oro', specialite: 'Bijouterie / Or & Argent', actif: true },
  { id: '3', nom: 'Bouchaib', specialite: 'Horlogerie / Mécanique', actif: true },
  { id: '4', nom: 'Youssef', specialite: 'Électronique / Précision', actif: true },
  { id: '5', nom: 'Miyara', specialite: 'Polissage / Finition', actif: true },
  { id: '6', nom: 'Aissam', specialite: 'Soudure & Ajustement', actif: true },
  { id: '7', nom: 'Hamza', specialite: 'Diagnostic & Restauration', actif: true }
];

// État global de l'application
let state = {
  articles: [],
  ateliers: [],
  currentFilter: 'all',
  currentAtelierFilter: '',
  searchQuery: '',
  supabase: null,
  isOnline: false,
  selectedPhotoBase64: null,
  activeArticleForModal: null,
  activeTicketArticle: null
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  initLucide();
  loadLocalData();
  setupDateTimeDefaults();
  initSupabase();
  registerServiceWorker();
  renderAll();
});

function initLucide() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ------------------------------------------------------------------------------
// CHARGEMENT ET SAUVEGARDE LOCALE (LocalStorage)
// ------------------------------------------------------------------------------
function loadLocalData() {
  // Chargement des ateliers
  const savedAteliers = localStorage.getItem('bdr_ateliers');
  if (savedAteliers) {
    try {
      state.ateliers = JSON.parse(savedAteliers);
    } catch (e) {
      state.ateliers = [...DEFAULT_ATELIERS];
    }
  } else {
    state.ateliers = [...DEFAULT_ATELIERS];
    saveAteliersLocally();
  }

  // Chargement des articles
  const savedArticles = localStorage.getItem('bdr_articles');
  if (savedArticles) {
    try {
      state.articles = JSON.parse(savedArticles);
    } catch (e) {
      state.articles = [];
    }
  } else {
    // Exemples initiaux pour la boutique
    state.articles = [
      {
        id: 'bdr-demo-1',
        numero_recu: 'BDR-2026-0001',
        client_nom: 'El Idrissi',
        client_prenom: 'Karim',
        client_telephone: '0661234567',
        description_article: 'Montre automatique Seiko 5',
        photo_url: '',
        recu_demande: true,
        prix_estime: 250,
        avance: 100,
        reste: 150,
        date_reception: new Date().toISOString(),
        date_envoi_atelier: new Date().toISOString().split('T')[0],
        atelier_nom: 'Bouchaib',
        statut: 'en_atelier',
        notes: 'Changement de ressort et révision complète.'
      },
      {
        id: 'bdr-demo-2',
        numero_recu: 'BDR-2026-0002',
        client_nom: 'Benani',
        client_prenom: 'Fatima',
        client_telephone: '0670987654',
        description_article: 'Bague solitaire or 18k avec pierre',
        photo_url: '',
        recu_demande: true,
        prix_estime: 180,
        avance: 180,
        reste: 0,
        date_reception: new Date(Date.now() - 86400000).toISOString(),
        date_envoi_atelier: new Date().toISOString().split('T')[0],
        atelier_nom: 'Oro',
        statut: 'pret',
        notes: 'Sertissage et polissage.'
      }
    ];
    saveArticlesLocally();
  }
}

function saveArticlesLocally() {
  localStorage.setItem('bdr_articles', JSON.stringify(state.articles));
}

function saveAteliersLocally() {
  localStorage.setItem('bdr_ateliers', JSON.stringify(state.ateliers));
}

function setupDateTimeDefaults() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  const formattedDate = `${year}-${month}-${day}`;

  const dateReceptionInput = document.getElementById('dateReception');
  if (dateReceptionInput) dateReceptionInput.value = formattedDateTime;

  const dateEnvoiInput = document.getElementById('dateEnvoiAtelier');
  if (dateEnvoiInput) dateEnvoiInput.value = formattedDate;

  updateAutoTicketBadge();
}

function updateAutoTicketBadge() {
  const count = state.articles.length + 1;
  const num = `BDR-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
  const badge = document.getElementById('formAutoTicket');
  if (badge) badge.textContent = num;
}

// ------------------------------------------------------------------------------
// CONNEXION SUPABASE
// ------------------------------------------------------------------------------
function initSupabase() {
  const url = localStorage.getItem('bdr_supabase_url');
  const key = localStorage.getItem('bdr_supabase_key');

  if (url && key && window.supabase) {
    try {
      state.supabase = window.supabase.createClient(url, key);
      updateConnectionStatus(true, 'Supabase Connecté');
      syncFromSupabase();
    } catch (err) {
      console.error('Erreur Supabase:', err);
      updateConnectionStatus(false, 'Erreur Connexion');
    }
  } else {
    updateConnectionStatus(false, 'Mode Local');
  }

  const urlInput = document.getElementById('supabaseUrlInput');
  const keyInput = document.getElementById('supabaseKeyInput');
  if (urlInput && url) urlInput.value = url;
  if (keyInput && key) keyInput.value = key;
}

function updateConnectionStatus(isOnline, text) {
  state.isOnline = isOnline;
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  if (dot) {
    dot.className = `status-dot ${isOnline ? 'online' : 'offline'}`;
  }
  if (txt) {
    txt.textContent = text;
  }
}

async function testSupabaseConnection() {
  const url = document.getElementById('supabaseUrlInput').value.trim();
  const key = document.getElementById('supabaseKeyInput').value.trim();
  const feedback = document.getElementById('connectionFeedback');

  if (!url || !key) {
    showFeedback('Veuillez saisir l\'URL et la clé Supabase.', 'error');
    return;
  }

  feedback.style.display = 'block';
  feedback.style.backgroundColor = '#f1f5f9';
  feedback.style.color = '#334155';
  feedback.textContent = 'Test de connexion en cours...';

  try {
    const tempClient = window.supabase.createClient(url, key);
    const { data, error } = await tempClient.from('ateliers').select('count', { count: 'exact', head: true });
    
    if (error) throw error;

    showFeedback(' Connexion réussie à Supabase ! Vos tables sont prêtes.', 'success');
  } catch (err) {
    showFeedback(`❌ Erreur de connexion : ${err.message || 'Vérifiez l\'URL et la clé et l\'exécution du script SQL'}.`, 'error');
  }
}

function showFeedback(msg, type) {
  const feedback = document.getElementById('connectionFeedback');
  feedback.style.display = 'block';
  if (type === 'success') {
    feedback.style.backgroundColor = '#ecfdf5';
    feedback.style.color = '#065f46';
    feedback.style.border = '1px solid #a7f3d0';
  } else {
    feedback.style.backgroundColor = '#fef2f2';
    feedback.style.color = '#991b1b';
    feedback.style.border = '1px solid #fecaca';
  }
  feedback.textContent = msg;
}

async function handleSaveSupabaseConfig(e) {
  e.preventDefault();
  const url = document.getElementById('supabaseUrlInput').value.trim();
  const key = document.getElementById('supabaseKeyInput').value.trim();

  localStorage.setItem('bdr_supabase_url', url);
  localStorage.setItem('bdr_supabase_key', key);

  initSupabase();
  showFeedback(' Configuration sauvegardée avec succès ! Synchronisation en cours...', 'success');
  await syncToSupabase();
}

async function syncFromSupabase() {
  if (!state.supabase) return;
  try {
    const { data: remoteAteliers, error: errAtel } = await state.supabase.from('ateliers').select('*');
    if (!errAtel && remoteAteliers && remoteAteliers.length > 0) {
      state.ateliers = remoteAteliers;
      saveAteliersLocally();
    }

    const { data: remoteArticles, error: errArt } = await state.supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!errArt && remoteArticles) {
      state.articles = remoteArticles;
      saveArticlesLocally();
      renderAll();
    }
  } catch (e) {
    console.warn('Sync from Supabase notice:', e);
  }
}

async function syncToSupabase() {
  if (!state.supabase) return;
  try {
    for (const a of state.ateliers) {
      await state.supabase.from('ateliers').upsert({
        nom: a.nom,
        specialite: a.specialite || null,
        telephone: a.telephone || null,
        actif: a.actif !== false
      }, { onConflict: 'nom' });
    }
    for (const art of state.articles) {
      await state.supabase.from('articles').upsert({
        numero_recu: art.numero_recu,
        client_nom: art.client_nom,
        client_prenom: art.client_prenom,
        client_telephone: art.client_telephone,
        description_article: art.description_article,
        photo_url: art.photo_url,
        recu_demande: art.recu_demande,
        prix_estime: art.prix_estime || 0,
        avance: art.avance || 0,
        reste: art.reste || 0,
        date_reception: art.date_reception,
        date_envoi_atelier: art.date_envoi_atelier || null,
        date_pret: art.date_pret || null,
        date_livraison: art.date_livraison || null,
        atelier_nom: art.atelier_nom || null,
        statut: art.statut || 'recu',
        notes: art.notes || null
      }, { onConflict: 'numero_recu' });
    }
    renderAll();
  } catch (err) {
    console.error('Sync to Supabase error:', err);
  }
}

// ------------------------------------------------------------------------------
// NAVIGATION & ONGLETS (TABS)
// ------------------------------------------------------------------------------
function switchTab(tabId) {
  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.remove('active');
  });
  const targetView = document.getElementById(`tab-${tabId}`);
  if (targetView) targetView.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
  initLucide();
}

// ------------------------------------------------------------------------------
// GESTION DE LA PHOTO (CAMÉRA DU TÉLÉPHONE)
// ------------------------------------------------------------------------------
function handlePhotoSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const maxDim = 900;
      let width = img.width;
      let height = img.height;

      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
      state.selectedPhotoBase64 = compressedBase64;

      const previewContainer = document.getElementById('photoPreviewContainer');
      const previewImg = document.getElementById('photoPreviewImg');
      previewImg.src = compressedBase64;
      previewContainer.style.display = 'block';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removeSelectedPhoto() {
  state.selectedPhotoBase64 = null;
  const photoInput = document.getElementById('photoInput');
  if (photoInput) photoInput.value = '';
  const previewContainer = document.getElementById('photoPreviewContainer');
  if (previewContainer) previewContainer.style.display = 'none';
}

function calculateBalance() {
  const prix = parseFloat(document.getElementById('prixEstime').value) || 0;
  const avance = parseFloat(document.getElementById('avance').value) || 0;
  const reste = Math.max(0, prix - avance);
  document.getElementById('reste').value = reste;
}

// ------------------------------------------------------------------------------
// ENREGISTRER UN DÉPÔT (NOUVEAU)
// ------------------------------------------------------------------------------
async function handleSaveArticle(event) {
  event.preventDefault();

  const clientNom = document.getElementById('clientNom').value.trim();
  const clientPrenom = document.getElementById('clientPrenom').value.trim();
  const clientTelephone = document.getElementById('clientTelephone').value.trim();
  const descriptionArticle = document.getElementById('descriptionArticle').value.trim();
  const dateReception = document.getElementById('dateReception').value || new Date().toISOString();
  const dateEnvoiAtelier = document.getElementById('dateEnvoiAtelier').value || null;
  const atelierNom = document.getElementById('atelierSelect').value || null;
  const prixEstime = parseFloat(document.getElementById('prixEstime').value) || 0;
  const avance = parseFloat(document.getElementById('avance').value) || 0;
  const reste = Math.max(0, prixEstime - avance);
  const notes = document.getElementById('notesArticle').value.trim();
  const recuDemande = document.getElementById('recuDemandeSwitch').checked;

  const count = state.articles.length + 1;
  const numeroRecu = `BDR-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  let photoUrl = state.selectedPhotoBase64 || '';

  // Upload photo to Supabase Storage if active
  if (state.supabase && state.selectedPhotoBase64 && state.selectedPhotoBase64.startsWith('data:image')) {
    try {
      const fileName = `${numeroRecu}-${Date.now()}.jpg`;
      const base64Data = state.selectedPhotoBase64.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const { data: uploadData, error: uploadErr } = await state.supabase.storage
        .from('article-photos')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (!uploadErr) {
        const { data: publicUrlData } = state.supabase.storage
          .from('article-photos')
          .getPublicUrl(fileName);
        if (publicUrlData) {
          photoUrl = publicUrlData.publicUrl;
        }
      }
    } catch (e) {
      console.warn('Storage upload notice, falling back to local image data:', e);
    }
  }

  let initialStatus = 'recu';
  if (atelierNom && dateEnvoiAtelier) {
    initialStatus = 'en_atelier';
  }

  const newArticle = {
    id: 'art-' + Date.now(),
    numero_recu: numeroRecu,
    client_nom: clientNom,
    client_prenom: clientPrenom,
    client_telephone: clientTelephone,
    description_article: descriptionArticle,
    photo_url: photoUrl,
    recu_demande: recuDemande,
    prix_estime: prixEstime,
    avance: avance,
    reste: reste,
    date_reception: dateReception,
    date_envoi_atelier: dateEnvoiAtelier,
    atelier_nom: atelierNom,
    statut: initialStatus,
    notes: notes,
    created_at: new Date().toISOString()
  };

  // Add to local state
  state.articles.unshift(newArticle);
  saveArticlesLocally();

  // If Supabase is connected, insert to remote database
  if (state.supabase) {
    try {
      await state.supabase.from('articles').insert({
        numero_recu: newArticle.numero_recu,
        client_nom: newArticle.client_nom,
        client_prenom: newArticle.client_prenom,
        client_telephone: newArticle.client_telephone,
        description_article: newArticle.description_article,
        photo_url: newArticle.photo_url,
        recu_demande: newArticle.recu_demande,
        prix_estime: newArticle.prix_estime,
        avance: newArticle.avance,
        reste: newArticle.reste,
        date_reception: newArticle.date_reception,
        date_envoi_atelier: newArticle.date_envoi_atelier,
        atelier_nom: newArticle.atelier_nom,
        statut: newArticle.statut,
        notes: newArticle.notes
      });
    } catch (err) {
      console.error('Remote insert notice:', err);
    }
  }

  // Reset form
  document.getElementById('newArticleForm').reset();
  removeSelectedPhoto();
  setupDateTimeDefaults();

  // If client requested a receipt: Show receipt modal immediately!
  // "ola bgha client reçu na3tih lih ola mabghach ghi nom o prénom baraka"
  if (recuDemande) {
    openTicketModal(newArticle);
  } else {
    alert(` Dépôt enregistré avec succès pour ${clientPrenom} ${clientNom} !`);
    switchTab('articles');
  }

  renderAll();
}

// ------------------------------------------------------------------------------
// RENDU ET FILTRES (RENDERING & FILTERS)
// ------------------------------------------------------------------------------
function renderAll() {
  renderAtelierSelects();
  renderArticlesList();
  renderAteliersTab();
  updateStats();
  initLucide();
}

function updateStats() {
  const total = state.articles.length;
  const enAtelier = state.articles.filter(a => a.statut === 'en_atelier').length;
  const pret = state.articles.filter(a => a.statut === 'pret').length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statAtelier').textContent = enAtelier;
  document.getElementById('statPret').textContent = pret;
}

function renderAtelierSelects() {
  const atelierSelect = document.getElementById('atelierSelect');
  const filterAtelierSelect = document.getElementById('filterAtelierSelect');

  const optionsHtml = state.ateliers
    .filter(a => a.actif !== false)
    .map(a => `<option value="${escapeHtml(a.nom)}">${escapeHtml(a.nom)}${a.specialite ? ' (' + escapeHtml(a.specialite) + ')' : ''}</option>`)
    .join('');

  if (atelierSelect) {
    const currentVal = atelierSelect.value;
    atelierSelect.innerHTML = `<option value="">-- En attente d'envoi --</option>` + optionsHtml;
    atelierSelect.value = currentVal;
  }

  if (filterAtelierSelect) {
    const currentVal = filterAtelierSelect.value;
    filterAtelierSelect.innerHTML = `<option value="">Tous les Ateliers</option>` + optionsHtml;
    filterAtelierSelect.value = currentVal;
  }
}

function setFilter(button, filterName) {
  document.querySelectorAll('.filter-pills .pill').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
  state.currentFilter = filterName;
  renderArticlesList();
}

function filterArticles() {
  state.searchQuery = document.getElementById('searchInput').value.trim().toLowerCase();
  state.currentAtelierFilter = document.getElementById('filterAtelierSelect').value;
  renderArticlesList();
}

function renderArticlesList() {
  const container = document.getElementById('articlesList');
  const emptyState = document.getElementById('emptyState');

  let filtered = state.articles;

  // Filtrage par statut
  if (state.currentFilter === 'today') {
    const today = new Date().toISOString().split('T')[0];
    filtered = filtered.filter(a => a.date_reception && a.date_reception.startsWith(today));
  } else if (state.currentFilter !== 'all') {
    filtered = filtered.filter(a => a.statut === state.currentFilter);
  }

  // Filtrage par atelier
  if (state.currentAtelierFilter) {
    filtered = filtered.filter(a => a.atelier_nom === state.currentAtelierFilter);
  }

  // Recherche
  if (state.searchQuery) {
    const q = state.searchQuery;
    filtered = filtered.filter(a => {
      const full = `${a.client_nom} ${a.client_prenom} ${a.client_telephone || ''} ${a.numero_recu || ''} ${a.description_article || ''} ${a.atelier_nom || ''}`.toLowerCase();
      return full.includes(q);
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  container.innerHTML = filtered.map(art => {
    const statusBadges = {
      recu: `<span class="badge badge-recu">🟡 Reçu</span>`,
      en_atelier: `<span class="badge badge-en_atelier">🔵 Atelier : ${escapeHtml(art.atelier_nom || 'Non spécifié')}</span>`,
      pret: `<span class="badge badge-pret">🟢 Prêt (Wajad)</span>`,
      livre: `<span class="badge badge-livre">✅ Livré</span>`
    };

    const statusBadge = statusBadges[art.statut] || statusBadges.recu;
    const thumbnail = art.photo_url 
      ? `<img src="${escapeHtml(art.photo_url)}" alt="Article" class="article-thumbnail">`
      : `<div class="article-thumbnail" style="display:flex;align-items:center;justify-content:center;color:#94a3b8;"><i data-lucide="package" style="width:24px;height:24px;"></i></div>`;

    const dateRecFormatted = art.date_reception ? formatDate(art.date_reception) : '-';

    return `
      <div class="article-card" onclick="openArticleDetailModal('${art.id}')">
        <div class="article-card-header">
          <div class="article-meta-left">
            ${thumbnail}
            <div class="article-client-info">
              <h4>${escapeHtml(art.client_prenom)} ${escapeHtml(art.client_nom)}</h4>
              <p>
                <i data-lucide="phone" style="width:13px;height:13px;"></i>
                ${art.client_telephone ? escapeHtml(art.client_telephone) : 'Non renseigné'}
              </p>
            </div>
          </div>
          <div style="text-align: right;">
            ${statusBadge}
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700; margin-top:4px;">
              ${escapeHtml(art.numero_recu)}
            </div>
          </div>
        </div>

        <div style="font-weight:600; font-size:0.92rem; color:#1e293b;">
          ${escapeHtml(art.description_article)}
        </div>

        <div class="article-details-row">
          <span><i data-lucide="calendar" style="width:14px;height:14px;"></i> Reçu : ${dateRecFormatted}</span>
          ${art.atelier_nom ? `<span><i data-lucide="wrench" style="width:14px;height:14px;"></i> Chez : <strong>${escapeHtml(art.atelier_nom)}</strong></span>` : ''}
          ${art.prix_estime ? `<span><i data-lucide="coins" style="width:14px;height:14px;"></i> Reste : <strong style="color:${art.reste > 0 ? 'var(--danger)' : 'var(--success)'};">${art.reste} DH</strong></span>` : ''}
        </div>

        <!-- Actions Rapides -->
        <div class="article-quick-actions" onclick="event.stopPropagation()">
          ${art.client_telephone ? `
            <button class="btn btn-sm btn-whatsapp" onclick="sendWhatsAppReadyMessage('${art.id}')" title="Envoyer message WhatsApp au client">
              <i data-lucide="message-circle" style="width:14px;height:14px;"></i> Sifat WhatsApp (Wajad)
            </button>
          ` : ''}

          <button class="btn btn-sm btn-outline" onclick="openTicketModalById('${art.id}')" title="Voir Reçu">
            <i data-lucide="receipt" style="width:14px;height:14px;"></i> Reçu
          </button>

          <button class="btn btn-sm btn-outline" onclick="openArticleDetailModal('${art.id}')" style="margin-left:auto;">
            <i data-lucide="edit-3" style="width:14px;height:14px;"></i> Gérer
          </button>
        </div>
      </div>
    `;
  }).join('');

  initLucide();
}

// ------------------------------------------------------------------------------
// GESTION DES ATELIERS (BRAHIM, ORO, BOUCHAIB, ETC.)
// ------------------------------------------------------------------------------
function renderAteliersTab() {
  const container = document.getElementById('ateliersContainer');
  if (!container) return;

  container.innerHTML = state.ateliers.map(a => {
    const countInAtelier = state.articles.filter(art => art.atelier_nom === a.nom && art.statut === 'en_atelier').length;

    return `
      <div class="atelier-card">
        <div class="atelier-name">
          <i data-lucide="user-check" style="width:18px;height:18px;color:var(--accent);"></i>
          <span>${escapeHtml(a.nom)}</span>
        </div>
        <div style="font-size:0.8rem; color:var(--text-muted);">
          ${a.specialite ? escapeHtml(a.specialite) : 'Atelier partenaire'}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
          <span class="count-badge">
            <strong style="color:var(--accent);">${countInAtelier}</strong> article(s) en cours
          </span>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-outline" onclick="openEditAtelierModal('${a.id}')" style="padding:4px 8px;" title="Modifier">
              <i data-lucide="edit-2" style="width:12px;height:12px;"></i>
            </button>
            <button class="btn btn-sm btn-danger-outline" onclick="deleteAtelier('${a.id}')" style="padding:4px 8px;" title="Supprimer">
              <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  initLucide();
}

function openAddAtelierModal() {
  document.getElementById('atelierModalTitle').textContent = '➕ Ajouter un Nouvel Atelier';
  document.getElementById('atelierForm').reset();
  document.getElementById('atelierIdInput').value = '';
  document.getElementById('atelierModal').classList.add('active');
}

function openEditAtelierModal(id) {
  const atelier = state.ateliers.find(a => a.id === id);
  if (!atelier) return;

  document.getElementById('atelierModalTitle').textContent = '✏️ Modifier l\'Atelier';
  document.getElementById('atelierIdInput').value = atelier.id;
  document.getElementById('atelierNomInput').value = atelier.nom;
  document.getElementById('atelierTelephoneInput').value = atelier.telephone || '';
  document.getElementById('atelierSpecialiteInput').value = atelier.specialite || '';
  document.getElementById('atelierModal').classList.add('active');
}

function closeAtelierModal() {
  document.getElementById('atelierModal').classList.remove('active');
}

async function handleSaveAtelier(event) {
  event.preventDefault();
  const id = document.getElementById('atelierIdInput').value;
  const nom = document.getElementById('atelierNomInput').value.trim();
  const telephone = document.getElementById('atelierTelephoneInput').value.trim();
  const specialite = document.getElementById('atelierSpecialiteInput').value.trim();

  if (!nom) return;

  if (id) {
    const atelier = state.ateliers.find(a => a.id === id);
    if (atelier) {
      const oldNom = atelier.nom;
      atelier.nom = nom;
      atelier.telephone = telephone;
      atelier.specialite = specialite;

      state.articles.forEach(art => {
        if (art.atelier_nom === oldNom) art.atelier_nom = nom;
      });
      saveArticlesLocally();
    }
  } else {
    const newAtelier = {
      id: 'atel-' + Date.now(),
      nom: nom,
      telephone: telephone,
      specialite: specialite,
      actif: true
    };
    state.ateliers.push(newAtelier);
  }

  saveAteliersLocally();

  if (state.supabase) {
    try {
      await state.supabase.from('ateliers').upsert({
        nom: nom,
        telephone: telephone || null,
        specialite: specialite || null,
        actif: true
      }, { onConflict: 'nom' });
    } catch (e) {
      console.warn('Supabase atelier sync notice:', e);
    }
  }

  closeAtelierModal();
  renderAll();
}

async function deleteAtelier(id) {
  const atelier = state.ateliers.find(a => a.id === id);
  if (!atelier) return;

  if (!confirm(`Voulez-vous vraiment supprimer l'atelier "${atelier.nom}" ?`)) {
    return;
  }

  state.ateliers = state.ateliers.filter(a => a.id !== id);
  saveAteliersLocally();

  if (state.supabase) {
    try {
      await state.supabase.from('ateliers').delete().eq('nom', atelier.nom);
    } catch (e) {
      console.warn('Supabase delete notice:', e);
    }
  }

  renderAll();
}

// ------------------------------------------------------------------------------
// MODAL DÉTAIL ARTICLE & STATUT
// ------------------------------------------------------------------------------
function openArticleDetailModal(id) {
  const article = state.articles.find(a => a.id === id);
  if (!article) return;

  state.activeArticleForModal = article;

  document.getElementById('modalArticleTitle').textContent = `${article.numero_recu} - ${article.client_prenom} ${article.client_nom}`;

  const atelierOptions = state.ateliers
    .filter(a => a.actif !== false)
    .map(a => `<option value="${escapeHtml(a.nom)}" ${article.atelier_nom === a.nom ? 'selected' : ''}>${escapeHtml(a.nom)}</option>`)
    .join('');

  const photoHtml = article.photo_url ? `
    <div style="text-align:center; margin-bottom:14px;">
      <img src="${escapeHtml(article.photo_url)}" alt="Photo Article" style="max-height:180px; width:auto; border-radius:10px; border:1px solid #cbd5e1;">
    </div>
  ` : '';

  const dateReceptionFormatted = article.date_reception ? formatDate(article.date_reception) : 'Non renseignée';
  const dateEnvoiFormatted = article.date_envoi_atelier ? article.date_envoi_atelier : '';

  const content = document.getElementById('modalArticleContent');
  content.innerHTML = `
    ${photoHtml}
    
    <div style="background:#f8fafc; padding:12px; border-radius:10px; margin-bottom:14px; border:1px solid var(--border);">
      <div style="font-weight:700; font-size:1rem; color:var(--primary);">${escapeHtml(article.description_article)}</div>
      <div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">
        Client: <strong>${escapeHtml(article.client_prenom)} ${escapeHtml(article.client_nom)}</strong> • Tél: <a href="tel:${article.client_telephone}">${escapeHtml(article.client_telephone || 'Aucun')}</a>
      </div>
      <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">
        Reçu le: ${dateReceptionFormatted}
      </div>
    </div>

    <!-- Statut Workflow Selector -->
    <div class="form-group">
      <label class="form-label">Statut Actuel de l'Article :</label>
      <select id="modalStatutSelect" class="form-control" onchange="handleModalStatusChange(this.value)">
        <option value="recu" ${article.statut === 'recu' ? 'selected' : ''}>🟡 Reçu (En attente d'envoi)</option>
        <option value="en_atelier" ${article.statut === 'en_atelier' ? 'selected' : ''}>🔵 En Atelier (Envoyé en réparation)</option>
        <option value="pret" ${article.statut === 'pret' ? 'selected' : ''}>🟢 Prêt / Wajad (Réparation terminée)</option>
        <option value="livre" ${article.statut === 'livre' ? 'selected' : ''}>✅ Livré au Client (Terminé)</option>
      </select>
    </div>

    <!-- Atelier Assignment -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Atelier :</label>
        <select id="modalAtelierSelect" class="form-control">
          <option value="">-- Aucun --</option>
          ${atelierOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Date d'Envoi :</label>
        <input type="date" id="modalDateEnvoi" class="form-control" value="${dateEnvoiFormatted}">
      </div>
    </div>

    <!-- Price details -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Prix Total (DH) :</label>
        <input type="number" id="modalPrix" class="form-control" value="${article.prix_estime || 0}">
      </div>
      <div class="form-group">
        <label class="form-label">Avance (DH) :</label>
        <input type="number" id="modalAvance" class="form-control" value="${article.avance || 0}">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Notes & Remarques :</label>
      <textarea id="modalNotes" class="form-control" rows="2">${escapeHtml(article.notes || '')}</textarea>
    </div>
  `;

  // Footer Actions
  const footer = document.getElementById('modalArticleFooter');
  footer.innerHTML = `
    <button class="btn btn-whatsapp" onclick="sendWhatsAppReadyMessage('${article.id}')" title="Notifier le client">
      <i data-lucide="message-circle" style="width:16px;height:16px;"></i> Sifat WhatsApp (Wajad)
    </button>
    <button class="btn btn-outline" onclick="openTicketModalById('${article.id}')">
      <i data-lucide="receipt" style="width:16px;height:16px;"></i> Reçu
    </button>
    <button class="btn btn-accent" onclick="saveArticleModalChanges()">
      <i data-lucide="check" style="width:16px;height:16px;"></i> Enregistrer
    </button>
  `;

  document.getElementById('articleDetailModal').classList.add('active');
  initLucide();
}

function closeArticleModal() {
  document.getElementById('articleDetailModal').classList.remove('active');
  state.activeArticleForModal = null;
}

function handleModalStatusChange(newStatus) {
  // Optionnel: suggestion visuelle
}

async function saveArticleModalChanges() {
  if (!state.activeArticleForModal) return;

  const art = state.activeArticleForModal;
  const newStatus = document.getElementById('modalStatutSelect').value;
  const newAtelier = document.getElementById('modalAtelierSelect').value;
  const newDateEnvoi = document.getElementById('modalDateEnvoi').value;
  const newPrix = parseFloat(document.getElementById('modalPrix').value) || 0;
  const newAvance = parseFloat(document.getElementById('modalAvance').value) || 0;
  const newReste = Math.max(0, newPrix - newAvance);
  const newNotes = document.getElementById('modalNotes').value.trim();

  let datePret = art.date_pret;
  if (newStatus === 'pret' && art.statut !== 'pret') {
    datePret = new Date().toISOString();
  }
  let dateLivraison = art.date_livraison;
  if (newStatus === 'livre' && art.statut !== 'livre') {
    dateLivraison = new Date().toISOString();
  }

  art.statut = newStatus;
  art.atelier_nom = newAtelier || null;
  art.date_envoi_atelier = newDateEnvoi || null;
  art.prix_estime = newPrix;
  art.avance = newAvance;
  art.reste = newReste;
  art.notes = newNotes;
  art.date_pret = datePret;
  art.date_livraison = dateLivraison;

  saveArticlesLocally();

  if (state.supabase) {
    try {
      await state.supabase.from('articles').update({
        statut: art.statut,
        atelier_nom: art.atelier_nom,
        date_envoi_atelier: art.date_envoi_atelier,
        prix_estime: art.prix_estime,
        avance: art.avance,
        reste: art.reste,
        notes: art.notes,
        date_pret: art.date_pret,
        date_livraison: art.date_livraison
      }).eq('numero_recu', art.numero_recu);
    } catch (e) {
      console.warn('Supabase update notice:', e);
    }
  }

  closeArticleModal();
  renderAll();

  // Si le statut est passé à prêt, proposer l'envoi WhatsApp
  if (newStatus === 'pret' && art.client_telephone) {
    if (confirm(` L'article est prêt (Wajad) ! Voulez-vous envoyer un message WhatsApp à ${art.client_prenom} maintenant ?`)) {
      sendWhatsAppReadyMessage(art.id);
    }
  }
}

// ------------------------------------------------------------------------------
// ENVOI NOTIFICATION WHATSAPP ("PRODUIT WAJAD")
// ------------------------------------------------------------------------------
function formatMoroccanPhoneForWhatsApp(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '212' + cleaned.substring(1);
  } else if (!cleaned.startsWith('212')) {
    cleaned = '212' + cleaned;
  }
  return cleaned;
}

function sendWhatsAppReadyMessage(articleId) {
  const article = state.articles.find(a => a.id === articleId);
  if (!article) return;

  if (!article.client_telephone) {
    alert('Numéro de téléphone non renseigné pour ce client.');
    return;
  }

  const phone = formatMoroccanPhoneForWhatsApp(article.client_telephone);
  const clientNomComplet = `${article.client_prenom} ${article.client_nom}`;
  const articleNom = article.description_article;
  const numRecu = article.numero_recu;
  const resteDH = article.reste || 0;

  let messageText = `Salam ${clientNomComplet},\n\nL'article dyalk (*${articleNom}*) rah wajad 3nd *Ben Daoud Réparation*.\nMerhba bik tji takhdo f ay weqt !\n\n📋 Réf Reçu : *${numRecu}*`;

  if (resteDH > 0) {
    messageText += `\n💰 Reste à payer : *${resteDH} DH*`;
  } else {
    messageText += `\n💰 Reste à payer : *0 DH (Khales)*`;
  }

  messageText += `\n\nChoukran bzaf 3la thiqa dyalk !`;

  const encodedUrl = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
  window.open(encodedUrl, '_blank');
}

// ------------------------------------------------------------------------------
// MODAL REÇU CLIENT & IMPRESSION
// ------------------------------------------------------------------------------
function openTicketModalById(articleId) {
  const article = state.articles.find(a => a.id === articleId);
  if (article) openTicketModal(article);
}

function openTicketModal(article) {
  state.activeTicketArticle = article;

  document.getElementById('ticketRecuNum').textContent = article.numero_recu;
  document.getElementById('ticketDateReception').textContent = formatDate(article.date_reception);
  document.getElementById('ticketClientNom').textContent = `${article.client_prenom} ${article.client_nom}`;
  document.getElementById('ticketClientTel').textContent = article.client_telephone || 'Non renseigné';
  document.getElementById('ticketArticleDesc').textContent = article.description_article;
  document.getElementById('ticketPrixEstime').textContent = `${article.prix_estime || 0} DH`;
  document.getElementById('ticketAvance').textContent = `${article.avance || 0} DH`;
  document.getElementById('ticketReste').textContent = `${article.reste || 0} DH`;

  const photoBox = document.getElementById('ticketPhotoBox');
  const photoImg = document.getElementById('ticketPhotoImg');
  if (article.photo_url) {
    photoImg.src = article.photo_url;
    photoBox.style.display = 'block';
  } else {
    photoBox.style.display = 'none';
  }

  document.getElementById('ticketModal').classList.add('active');
}

function closeTicketModal() {
  document.getElementById('ticketModal').classList.remove('active');
  state.activeTicketArticle = null;
}

function shareTicketWhatsApp() {
  if (!state.activeTicketArticle) return;
  const art = state.activeTicketArticle;
  if (!art.client_telephone) {
    alert('Numéro de téléphone non renseigné pour ce client.');
    return;
  }

  const phone = formatMoroccanPhoneForWhatsApp(art.client_telephone);
  const client = `${art.client_prenom} ${art.client_nom}`;

  const messageText = `Salam ${client},\n\nVoici votre reçu de dépôt chez *Ben Daoud Réparation* :\n\n📋 Numéro : *${art.numero_recu}*\n💍 Article : *${art.description_article}*\n📅 Date : ${formatDate(art.date_reception)}\n💵 Avance : ${art.avance || 0} DH\n💰 Reste : *${art.reste || 0} DH*\n\nNous vous contacterons dès que votre article sera prêt !\nMerci pour votre confiance.`;

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
  window.open(url, '_blank');
}

// ------------------------------------------------------------------------------
// SAUVEGARDE DE SECOURS (EXPORT JSON)
// ------------------------------------------------------------------------------
function exportDataBackup() {
  const backupData = {
    export_date: new Date().toISOString(),
    app: 'Ben Daoud Réparation',
    articles: state.articles,
    ateliers: state.ateliers
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bendaoud-reparation-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ------------------------------------------------------------------------------
// SERVICE WORKER REGISTRATION (PWA)
// ------------------------------------------------------------------------------
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker enregistré:', reg.scope))
      .catch(err => console.log('SW registration notice:', err));
  }
}

// ------------------------------------------------------------------------------
// UTILITAIRES
// ------------------------------------------------------------------------------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
}
