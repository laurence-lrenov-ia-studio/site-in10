/* Profils publics préchargés ; formations chargées à l'ouverture de leur section. */
(function () {
  'use strict';
  var endpoint = 'https://script.google.com/macros/s/AKfycbxyi1S9TMtarwRlqJRBAGF19LC00D9sT02A71qFxJpOmVqvWFybWhFWY4PIMBGCAAxm/exec';
  var requests = new Map();
  var profilesTask;
  var trainingTask;
  function field(record, name) {
    var value = record[name];
    return value === undefined || value === null ? '' : String(value).trim();
  }
  function photoUrl(value) {
    if (!value) return '';
    try {
      var url = new URL(value);
      if (url.protocol !== 'https:') return '';
      if (url.hostname !== 'drive.google.com') return url.href;
      var file = url.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]+)(?:\/|$)/);
      var id = file ? file[1] : /^\/(?:thumbnail|uc|open)$/.test(url.pathname) ? url.searchParams.get('id') : '';
      return id && /^[A-Za-z0-9_-]+$/.test(id) ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w1000' : '';
    } catch (error) { return ''; }
  }
  function applyProfiles(profiles) {
    var seenIds = new Set();
    var members = [];
    // L'API fournit déjà l'ordre public : aucun tri ou registre local.
    profiles.forEach(function (profile) {
      if (!profile || typeof profile !== 'object') return;
      var id = field(profile, 'ID_PROFIL_PUBLIC');
      var firstName = field(profile, 'PRENOM_AFFICHE');
      if (!id || !firstName || seenIds.has(id)) return;
      seenIds.add(id);
      var initial = field(profile, 'INITIALE_NOM');
      if (initial && !initial.endsWith('.')) initial += '.';
      var description = field(profile, 'DESCRIPTION_COURTE_SITE');
      if (/\bd[ée]mo(?:nstration)?\b|[àa] remplacer|description du profil [àa] venir/i.test(description)) description = '';
      var photo = photoUrl(field(profile, 'LIEN_PHOTO_DRIVE'));
      members.push({
        profileId: id,
        name: [firstName, initial].filter(Boolean).join(' '),
        profileType: field(profile, 'TYPE_PROFIL'),
        specialty: ['FONCTION_1', 'FONCTION_2'].map(function (key) { return field(profile, key); }).filter(Boolean).join('\n'),
        territory: ['VILLE', 'DEPARTEMENT', 'REGION'].map(function (key) { return field(profile, key); }).filter(Boolean).join(' · '),
        photo: photo, hubPhoto: !!photo,
        photoAlt: field(profile, 'TEXTE_ALTERNATIF_PHOTO'),
        description: description
      });
    });
    window.renderCollectifMembers(members);
    return members.length;
  }
  function readPublic(action) {
    if (requests.has(action)) return requests.get(action);
    var task = (async function () {
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 30000);
      try {
        var response = await fetch(endpoint + '?action=' + action, { signal: controller.signal });
        if (!response.ok) throw new Error('Hub HTTP ' + response.status);
        var data = await response.json();
        if (!data || data.ok !== true || data.action !== action || !Array.isArray(data.items)) throw new Error('Hub response invalid');
        return data.items;
      } finally { clearTimeout(timer); }
    })();
    requests.set(action, task);
    task.catch(function () { requests.delete(action); });
    return task;
  }
  function collectiveStatus(message, loading) {
    var status = document.getElementById('collective-status');
    var grid = document.getElementById('collective-members');
    if (status) { status.textContent = message; status.hidden = !message; }
    if (grid) { grid.setAttribute('aria-busy', String(loading)); grid.classList.toggle('collective-loading', loading); }
  }
  function loadProfiles() {
    if (profilesTask) return profilesTask;
    collectiveStatus('Chargement du collectif…', true);
    profilesTask = readPublic('profiles').then(function (profiles) {
      var count = applyProfiles(profiles);
      collectiveStatus(count ? '' : 'Aucun profil public disponible pour le moment.', false);
    }).catch(function () {
      window.renderCollectifMembers([]);
      collectiveStatus('Les profils sont momentanément indisponibles. Réessayez en rouvrant cette page.', false);
      profilesTask = null;
    });
    return profilesTask;
  }
  function loadTraining() {
    if (trainingTask) return trainingTask;
    trainingTask = Promise.all([readPublic('formations'), readPublic('sessions')]).then(function (data) {
      if (typeof window.applyHubPublicData === 'function') window.applyHubPublicData(data[0], data[1]);
    }).catch(function () { trainingTask = null; });
    return trainingTask;
  }
  function loadPublicHubData() {
    if (document.getElementById('p-network')?.classList.contains('active')) return loadProfiles();
    if (document.getElementById('p-training')?.classList.contains('active')) return loadTraining();
    return Promise.resolve();
  }
  window.loadPublicHubData = loadPublicHubData;
  // La navigation utilise replaceState et les classes active, sans hashchange.
  var observer = new MutationObserver(loadPublicHubData);
  ['p-network', 'p-training'].forEach(function (id) {
    var page = document.getElementById(id);
    if (page) observer.observe(page, { attributes: true, attributeFilter: ['class'] });
  });
  // Même promesse et même déduplication pour l'accueil et l'arrivée directe.
  loadProfiles();
  loadPublicHubData();
})();
