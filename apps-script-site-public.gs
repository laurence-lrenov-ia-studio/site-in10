/**
 * LES IN10PENSABLES — API SITE PUBLIC
 * 1 Hub existant -> 1 Apps Script public -> site public
 * Lecture seule. Aucune écriture dans le Hub.
 */

const SITE_PUBLIC = {
  HUB_ID: '1OAfCY52yshh1O_1nt7yOPn1phjGxlcFZFrMxDbJhPp4',
  TZ: 'Europe/Paris',
  TABS: {
    profiles: 'Profils site',
    formations: 'Formations',
    sessions: 'Sessions formations'
  },

  // LISTES BLANCHES : tout ce qui n'est pas ici ne sort jamais de l'API.
  PUBLIC_FIELDS: {
    profiles: [
      'ID_PROFIL_PUBLIC', 'ORDRE', 'TYPE_PROFIL', 'PRENOM_AFFICHE', 'INITIALE_NOM',
      'FONCTION_1', 'FONCTION_2', 'VILLE', 'DEPARTEMENT', 'REGION',
      'DESCRIPTION_COURTE_SITE', 'LIEN_PHOTO_DRIVE', 'TEXTE_ALTERNATIF_PHOTO'
    ],
    formations: [
      'ID_FORMATION', 'ORDRE', 'TITRE_FORMATION', 'CATEGORIE', 'SOUS_CATEGORIE',
      'DESCRIPTION_COURTE', 'DESCRIPTION_DETAILLEE', 'PENDANT_ATELIER',
      'VOUS_REPARTEZ_AVEC', 'PUBLIC_CIBLE', 'PREREQUIS', 'DUREE_AFFICHEE',
      'FORMAT_PAR_DEFAUT', 'ENVIRONNEMENTS_DISPONIBLES', 'TARIF_PUBLIC_TTC',
      'TARIF_MEMBRE_TTC', 'FINANCEMENT', 'LIEN_INSCRIPTION', 'VISUEL_URL_DRIVE',
      'TEXTE_ALT_VISUEL', 'FORMATEUR'
    ],
    sessions: [
      'ID_SESSION', 'ID_FORMATION', 'LIBELLE_SESSION', 'DATE_SESSION',
      'HEURE_DEBUT', 'HEURE_FIN', 'ENVIRONNEMENT', 'FORMAT', 'LIEU_AFFICHE',
      'STATUT_INSCRIPTIONS', 'JAUGE_MAX', 'DATE_LIMITE_INSCRIPTION',
      'LIEN_INSCRIPTION_SPECIFIQUE'
    ]
  },

  // Seules ces sessions sont publiables. Brouillon / Annulée / Passée restent hors API.
  PUBLIC_SESSION_STATUSES: ['ouverte', 'fermee', 'complete']
};

function doGet(e) {
  const p = (e && e.parameter) || {};
  const action = String(p.action || 'health').toLowerCase().trim();

  try {
    let result;

    if (action === 'health') {
      result = {
        ok: true,
        action: 'health',
        api: 'site-public',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      };
    } else if (['profiles', 'formations', 'sessions', 'all'].includes(action)) {
      const data = readPublicData_(action);

      if (action === 'profiles') {
        result = response_('profiles', data.profiles);
      } else if (action === 'formations') {
        result = response_('formations', data.formations);
      } else if (action === 'sessions') {
        result = response_('sessions', data.sessions);
      } else if (action === 'all') {
        result = {
          ok: true,
          action: 'all',
          profiles: data.profiles,
          formations: data.formations,
          sessions: data.sessions,
          counts: {
            profiles: data.profiles.length,
            formations: data.formations.length,
            sessions: data.sessions.length
          }
        };
      } else {
        result = { ok: false, error: 'Action inconnue' };
      }
    } else {
      result = { ok: false, error: 'Action inconnue' };
    }

    return send_(result, p.callback);
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return send_({ ok: false, error: 'API indisponible' }, p.callback);
  }
}

function readPublicData_(action) {
  action = action || 'all';
  if (action === 'profiles') return { profiles: readCachedPublicProfiles_() };
  const ss = SpreadsheetApp.openById(SITE_PUBLIC.HUB_ID);

  // Les sessions ne sont publiques que si leur formation est publiée.
  const publishedFormationRows = readPublishedFormationRows_(ss);
  const publicSessionRows = readPublicSessionRows_(ss, publishedFormationRows);
  const sessions = publicSessionRows
    .map(r => pick_(r, SITE_PUBLIC.PUBLIC_FIELDS.sessions))
    .sort(sortSessions_);
  if (action === 'sessions') return { sessions };

  const formations = readPublicFormations_(publishedFormationRows, publicSessionRows);
  if (action === 'formations') return { formations };
  return { profiles: readPublicProfiles_(ss), formations, sessions };
}

// Cache partagé du script : uniquement les champs publics après filtrage.
// Changer la version de clé si le contrat public ou ses règles changent.
const PUBLIC_PROFILES_CACHE_KEY = 'site-public:profiles:v1:' + SITE_PUBLIC.HUB_ID;
const PUBLIC_PROFILES_CACHE_TTL_SECONDS = 60;

function readCachedPublicProfiles_() {
  const started = Date.now();
  const metrics = {
    action: 'profiles', cache: 'MISS', cacheReadFailed: false, cacheWriteFailed: false,
    spreadsheetAccessMs: 0, profilesReadMs: 0, transformMs: 0, outcome: 'ERROR'
  };
  let cache;
  try {
    try {
      cache = CacheService.getScriptCache();
      const raw = cache.get(PUBLIC_PROFILES_CACHE_KEY);
      if (raw !== null) {
        const entry = JSON.parse(raw);
        const now = Date.now();
        // L'expiration est aussi vérifiée ici ; un cache invalide reste un MISS.
        if (entry && Number.isFinite(entry.expiresAt) && entry.expiresAt > now &&
            entry.expiresAt <= now + PUBLIC_PROFILES_CACHE_TTL_SECONDS * 1000 &&
            Array.isArray(entry.items) && entry.items.every(function (item) {
              return item && typeof item === 'object' && !Array.isArray(item) &&
                Object.keys(item).every(function (key) {
                  return SITE_PUBLIC.PUBLIC_FIELDS.profiles.includes(key) &&
                    (item[key] === null || ['string', 'number', 'boolean'].includes(typeof item[key]));
                });
            })) {
          metrics.cache = 'HIT';
          metrics.outcome = 'OK';
          return entry.items;
        }
      }
    } catch (error) {
      metrics.cacheReadFailed = true;
    }

    const accessStarted = Date.now();
    let ss;
    try { ss = SpreadsheetApp.openById(SITE_PUBLIC.HUB_ID); }
    finally { metrics.spreadsheetAccessMs = Date.now() - accessStarted; }
    const profiles = readPublicProfiles_(ss, metrics);
    try {
      if (cache) cache.put(PUBLIC_PROFILES_CACHE_KEY, JSON.stringify({
        expiresAt: Date.now() + PUBLIC_PROFILES_CACHE_TTL_SECONDS * 1000,
        items: profiles
      }), PUBLIC_PROFILES_CACHE_TTL_SECONDS);
    } catch (error) {
      // Le cache est facultatif (indisponibilité, limite de taille ou quota).
      metrics.cacheWriteFailed = true;
    }
    metrics.outcome = 'OK';
    return profiles;
  } finally {
    metrics.totalMs = Date.now() - started;
    // Aucun contenu de profil, identifiant ou détail d'erreur dans ces mesures.
    console.log(JSON.stringify(metrics));
  }
}

function readPublicProfiles_(ss, metrics) {
  const readStarted = Date.now();
  let profileRows;
  try { profileRows = readTab_(ss, SITE_PUBLIC.TABS.profiles); }
  finally { if (metrics) metrics.profilesReadMs = Date.now() - readStarted; }
  const transformStarted = Date.now();
  try {
    return profileRows
      .filter(r => isTrue_(r.PUBLIER_SITE) && isValidated_(r.STATUT_CONTROLE))
      .map(r => pick_(r, SITE_PUBLIC.PUBLIC_FIELDS.profiles))
      .sort(sortByOrder_);
  } finally {
    if (metrics) metrics.transformMs = Date.now() - transformStarted;
  }
}

function readPublishedFormationRows_(ss) {
  return readTab_(ss, SITE_PUBLIC.TABS.formations).filter(r =>
    isTrue_(r.PUBLIER_SITE) &&
    isValidated_(r.STATUT_CONTROLE) &&
    text_(r.ID_FORMATION)
  );

}

function readPublicSessionRows_(ss, publishedFormationRows) {
  const publishedFormationIds = new Set(
    publishedFormationRows.map(r => text_(r.ID_FORMATION))
  );

  return readTab_(ss, SITE_PUBLIC.TABS.sessions).filter(r => {
    const status = normalize_(r.STATUT_INSCRIPTIONS);
    return Boolean(
      text_(r.ID_SESSION) &&
      publishedFormationIds.has(text_(r.ID_FORMATION)) &&
      isTrue_(r.AFFICHER_SESSION_SITE) &&
      isValidated_(r.STATUT_CONTROLE) &&
      SITE_PUBLIC.PUBLIC_SESSION_STATUSES.includes(status) &&
      dateKey_(r.DATE_SESSION)
    );
  });

}

function readPublicFormations_(publishedFormationRows, publicSessionRows) {
  const sessionsByFormation = {};
  publicSessionRows.forEach(r => {
    const id = text_(r.ID_FORMATION);
    if (!sessionsByFormation[id]) {
      sessionsByFormation[id] = [];
    }
    sessionsByFormation[id].push(r);
  });

  const today = Utilities.formatDate(new Date(), SITE_PUBLIC.TZ, 'yyyy-MM-dd');

  return publishedFormationRows
    .map(r => {
      const item = pick_(r, SITE_PUBLIC.PUBLIC_FIELDS.formations);
      const candidates = (sessionsByFormation[text_(r.ID_FORMATION)] || [])
        .filter(s => dateKey_(s.DATE_SESSION) >= today)
        .sort(sortSessions_);

      item.prochaineSession = candidates.length
        ? pick_(candidates[0], SITE_PUBLIC.PUBLIC_FIELDS.sessions)
        : null;

      return item;
    })
    .sort(sortByOrder_);

}

function readTab_(ss, tabName) {
  const sheet = ss.getSheetByName(tabName);
  if (!sheet) throw new Error('Onglet introuvable : ' + tabName);

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return [];

  const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  const headers = values.shift().map(text_);

  return values.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      if (header) obj[header] = row[i];
    });
    return obj;
  });
}

function pick_(row, allowedFields) {
  const out = {};
  allowedFields.forEach(field => {
    if (Object.prototype.hasOwnProperty.call(row, field)) {
      out[field] = publicValue_(field, row[field]);
    }
  });
  return out;
}

function publicValue_(field, value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    const pattern = field.startsWith('HEURE_') ? 'HH:mm' : 'yyyy-MM-dd';
    return Utilities.formatDate(value, SITE_PUBLIC.TZ, pattern);
  }
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return String(value).trim();
}

function response_(action, items) {
  return { ok: true, action, count: items.length, items };
}

function isValidated_(value) {
  return normalize_(value) === 'valide';
}

function isTrue_(value) {
  return value === true || ['true', 'vrai', 'oui', '1'].includes(normalize_(value));
}

function normalize_(value) {
  return text_(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function text_(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function dateKey_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, SITE_PUBLIC.TZ, 'yyyy-MM-dd');
  }

  const s = text_(value);
  const fr = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (fr) {
    return fr[3] + '-' + fr[2].padStart(2, '0') + '-' + fr[1].padStart(2, '0');
  }

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? iso[1] + '-' + iso[2] + '-' + iso[3] : '';
}

function sortByOrder_(a, b) {
  const na = Number(a.ORDRE);
  const nb = Number(b.ORDRE);
  const aa = text_(a.ORDRE) !== '' && Number.isFinite(na) ? na : Infinity;
  const bb = text_(b.ORDRE) !== '' && Number.isFinite(nb) ? nb : Infinity;
  return aa === bb ? 0 : aa - bb;
}

function sortSessions_(a, b) {
  const da = dateKey_(a.DATE_SESSION);
  const db = dateKey_(b.DATE_SESSION);
  if (da !== db) return da.localeCompare(db);
  return text_(a.HEURE_DEBUT).localeCompare(text_(b.HEURE_DEBUT));
}

function send_(payload, callback) {
  const json = JSON.stringify(payload);
  const cb = text_(callback);

  // JSONP facultatif pour le raccordement futur du site si le navigateur bloque fetch/CORS.
  if (cb && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(cb)) {
    return ContentService
      .createTextOutput(cb + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/** Test manuel dans l'éditeur Apps Script. Lecture seule. */
function testerApiSitePublic() {
  const data = readPublicData_();
  console.log(JSON.stringify({
    profiles: data.profiles.length,
    formations: data.formations.length,
    sessions: data.sessions.length
  }, null, 2));
}

/**
 * Diagnostic manuel SANS DONNEES PERSONNELLES.
 * Affiche uniquement les en-têtes, nombres de lignes et valeurs de pilotage.
 */
function diagnostiquerApiSitePublic() {
  const ss = SpreadsheetApp.openById(SITE_PUBLIC.HUB_ID);
  const result = {};

  Object.keys(SITE_PUBLIC.TABS).forEach(function(key) {
    const tabName = SITE_PUBLIC.TABS[key];
    const sheet = ss.getSheetByName(tabName);

    if (!sheet) {
      result[key] = { onglet: tabName, trouve: false };
      return;
    }

    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    const headers = lastColumn > 0
      ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(text_).filter(Boolean)
      : [];

    const rows = lastRow >= 2 && lastColumn > 0 ? readTab_(ss, tabName) : [];

    const info = {
      onglet: tabName,
      trouve: true,
      lignesDonnees: rows.length,
      entetes: headers
    };

    if (key === 'profiles' || key === 'formations') {
      info.colonne_PUBLIER_SITE_presente = headers.indexOf('PUBLIER_SITE') !== -1;
      info.colonne_STATUT_CONTROLE_presente = headers.indexOf('STATUT_CONTROLE') !== -1;
      info.nb_PUBLIER_SITE_true = rows.filter(function(r) { return isTrue_(r.PUBLIER_SITE); }).length;
      info.nb_STATUT_CONTROLE_valide = rows.filter(function(r) { return isValidated_(r.STATUT_CONTROLE); }).length;
      info.nb_deux_conditions = rows.filter(function(r) {
        return isTrue_(r.PUBLIER_SITE) && isValidated_(r.STATUT_CONTROLE);
      }).length;
    }

    if (key === 'formations') {
      info.colonne_ID_FORMATION_presente = headers.indexOf('ID_FORMATION') !== -1;
      info.nb_ID_FORMATION_non_vide = rows.filter(function(r) { return Boolean(text_(r.ID_FORMATION)); }).length;
    }

    if (key === 'sessions') {
      info.colonne_ID_SESSION_presente = headers.indexOf('ID_SESSION') !== -1;
      info.colonne_ID_FORMATION_presente = headers.indexOf('ID_FORMATION') !== -1;
      info.colonne_STATUT_INSCRIPTIONS_presente = headers.indexOf('STATUT_INSCRIPTIONS') !== -1;
      info.colonne_DATE_SESSION_presente = headers.indexOf('DATE_SESSION') !== -1;
      info.statuts_inscriptions = valeursDistinctesSansDonneesPrivees_(rows, 'STATUT_INSCRIPTIONS');
      info.nb_sessions_avec_id = rows.filter(function(r) { return Boolean(text_(r.ID_SESSION)); }).length;
      info.nb_sessions_avec_date = rows.filter(function(r) { return Boolean(dateKey_(r.DATE_SESSION)); }).length;
    }

    result[key] = info;
  });

  console.log(JSON.stringify(result, null, 2));
}

function valeursDistinctesSansDonneesPrivees_(rows, field) {
  const counts = {};
  rows.forEach(function(r) {
    const value = text_(r[field]) || '(vide)';
    counts[value] = (counts[value] || 0) + 1;
  });
  return counts;
}
function listerMappingProfilsSite() {
  const ss = SpreadsheetApp.openById(SITE_PUBLIC.HUB_ID);
  const rows = readTab_(ss, SITE_PUBLIC.TABS.profiles);

  const mapping = rows
    .filter(function(r) {
      return Boolean(text_(r.ID_PROFIL_PUBLIC)) &&
             Boolean(text_(r.PRENOM_AFFICHE));
    })
    .map(function(r) {
      return {
        ID_PROFIL_PUBLIC: text_(r.ID_PROFIL_PUBLIC),
        PRENOM_AFFICHE: text_(r.PRENOM_AFFICHE),
        INITIALE_NOM: text_(r.INITIALE_NOM),
        ORDRE: r.ORDRE
      };
    })
    .sort(sortByOrder_);

  console.log(JSON.stringify(mapping, null, 2));
}
function diagnostiquerPublicationProfils() {
  const ss = SpreadsheetApp.openById(SITE_PUBLIC.HUB_ID);
  const rows = readTab_(ss, SITE_PUBLIC.TABS.profiles);

  const diagnostic = rows
    .filter(function(r) {
      return Boolean(text_(r.ID_PROFIL_PUBLIC));
    })
    .map(function(r) {
      return {
        ID: text_(r.ID_PROFIL_PUBLIC),
        PRENOM: text_(r.PRENOM_AFFICHE),
        PUBLIER_SITE: r.PUBLIER_SITE,
        STATUT_CONTROLE: text_(r.STATUT_CONTROLE),
        publierReconnu: isTrue_(r.PUBLIER_SITE),
        valideReconnu: isValidated_(r.STATUT_CONTROLE),
        SORT_DANS_API:
          isTrue_(r.PUBLIER_SITE) &&
          isValidated_(r.STATUT_CONTROLE)
      };
    });

  console.log(JSON.stringify(diagnostic, null, 2));
}
