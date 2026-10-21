/* Chargement unique du Hub public. Le site statique est déjà affiché avant cet appel. */
(function () {
  'use strict';
  var endpoint = 'https://script.google.com/macros/s/AKfycbxyi1S9TMtarwRlqJRBAGF19LC00D9sT02A71qFxJpOmVqvWFybWhFWY4PIMBGCAAxm/exec?action=all';

  function field(record, names) {
    for (var i = 0; i < names.length; i++) {
      var value = record[names[i]];
      if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
    }
    return '';
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
    } catch (error) {
      return '';
    }
  }
  function applyProfiles(profiles) {
    if (!Array.isArray(profiles) || !profiles.length || typeof window.renderCollectifMembers !== 'function') return;
    var staticMembers = (window.collectifMembers || []).map(function (member, index) {
      return Object.assign({}, member, { staticProfile: true }, index < 2 ? { founderIndex: index } : {});
    });
    var members = staticMembers.slice();
    var seenIds = new Set();
    profiles.forEach(function (profile) {
      if (!profile || typeof profile !== 'object') return;
      var id = field(profile, ['ID_PROFIL_PUBLIC', 'id_profil_public']);
      if (!id || seenIds.has(id)) return;
      var firstName = field(profile, ['PRENOM_AFFICHE', 'prenom_affiche']);
      var initial = field(profile, ['INITIALE_NOM', 'initiale_nom']);
      if (initial && !initial.endsWith('.')) initial += '.';
      var name = firstName ? [firstName, initial].filter(Boolean).join(' ') : '';
      if (!name) name = field(profile, ['NOM_AFFICHAGE', 'nom_affichage', 'NOM_PUBLIC', 'nom_public', 'NOM_COMPLET', 'nom_complet', 'name']);
      if (!name) name = [field(profile, ['PRENOM', 'prenom']), field(profile, ['NOM', 'nom'])].filter(Boolean).join(' ');
      if (!name) return;
      seenIds.add(id);
      var position = members.findIndex(function (current) { return current.profileId === id; });
      var order = field(profile, ['ORDRE', 'ordre']);
      var functions = [field(profile, ['FONCTION_1', 'fonction_1']), field(profile, ['FONCTION_2', 'fonction_2'])].filter(Boolean);
      var location = [field(profile, ['VILLE', 'ville']), field(profile, ['DEPARTEMENT', 'departement']), field(profile, ['REGION', 'region'])].filter(Boolean);
      var hubPhoto = photoUrl(field(profile, ['LIEN_PHOTO_DRIVE', 'lien_photo_drive', 'PHOTO_URL', 'photo_url', 'URL_PHOTO', 'url_photo', 'PHOTO_URL_DRIVE', 'photo_url_drive', 'PHOTO', 'photo']));
      var member = {
        profileId: id,
        hubOrder: order !== '' && Number.isFinite(Number(order)) ? Number(order) : null,
        name: name,
        specialty: functions.length ? functions.join(' · ') : field(profile, ['SPECIALITE', 'specialite', 'SPECIALITE_AFFICHEE', 'specialite_affichee', 'METIER', 'metier', 'EXPERTISE', 'expertise', 'specialty']),
        territory: location.length ? location.join(' · ') : field(profile, ['TERRITOIRE', 'territoire', 'ZONE_GEOGRAPHIQUE', 'zone_geographique', 'LOCALISATION', 'localisation', 'territory']),
        photo: hubPhoto,
        photoFallback: position >= 0 ? members[position].photo : '',
        hubPhoto: !!hubPhoto,
        photoAlt: field(profile, ['TEXTE_ALTERNATIF_PHOTO', 'texte_alternatif_photo']),
        description: field(profile, ['DESCRIPTION_COURTE_SITE', 'description_courte_site'])
      };
      if (position < 0) {
        members.push(member);
        return;
      }
      if (!member.photo) member.photo = members[position].photo;
      if (!member.specialty) member.specialty = members[position].specialty;
      if (!member.territory) member.territory = members[position].territory;
      if (members[position].founderIndex !== undefined) member.founderIndex = members[position].founderIndex;
      members[position] = member;
    });
    if (members.length !== staticMembers.length || members.some(function (member, index) { return member !== staticMembers[index]; })) {
      // ORDRE classe les profils publiés ; les cartes statiques sans ORDRE gardent leur ordre relatif.
      var ordered = members.map(function (member, index) { return { member: member, index: index }; });
      ordered.sort(function (a, b) {
        var first = a.member.hubOrder;
        var second = b.member.hubOrder;
        if (first !== null && first !== undefined && second !== null && second !== undefined && first !== second) return first - second;
        if (first !== null && first !== undefined && (second === null || second === undefined)) return -1;
        if (second !== null && second !== undefined && (first === null || first === undefined)) return 1;
        return a.index - b.index;
      });
      window.renderCollectifMembers(ordered.map(function (entry) { return entry.member; }));
    }
  }
  async function loadPublicHubData() {
    try {
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 30000);
      var response;
      try { response = await fetch(endpoint, { signal: controller.signal }); }
      finally { clearTimeout(timer); }
      if (!response.ok) throw new Error('Hub HTTP ' + response.status);
      var data = await response.json();
      if (!data || data.ok !== true) throw new Error('Hub response invalid');
      if (Array.isArray(data.profiles) && data.profiles.length) applyProfiles(data.profiles);
      if (typeof window.applyHubPublicData === 'function') {
        window.applyHubPublicData(Array.isArray(data.formations) ? data.formations : [], Array.isArray(data.sessions) ? data.sessions : []);
      }
    } catch (error) {
      console.warn('Données publiques du Hub indisponibles ; contenu du site conservé.', error);
    }
  }
  window.loadPublicHubData = loadPublicHubData;
  loadPublicHubData();
})();
