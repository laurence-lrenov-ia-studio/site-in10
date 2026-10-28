/* Comportement isolé du catalogue. La navigation go() existante est conservée. */
(function () {
  'use strict';
  var root = document.getElementById('p-training');
  if (!root) return;
  var dialog = root.querySelector('#catalog-details');
  var content = root.querySelector('#catalog-detail-content');
  var filters = root.querySelectorAll('[data-catalog-filter]');
  var count = root.querySelector('#catalog-count');
  var previousOverflow;

  // Source unique des statuts et des sessions. Les horaires sont affichés lorsqu’ils sont renseignés.
  var programming = window.IN10_TRAINING_PROGRAMMING;
  if (!programming) return;
  var cpfReference;
  var cpfCardReference;
  var registrationLinks = {};
  // Les dates IA validées viennent exclusivement de programmation-formations.js.
  // Les sessions des autres organismes restent indépendantes.
  var courseConfiguration = {
    'mentions-devis-factures': { status: 'open', sessions: [{ date: '2026-10-27', time: '14h–16h' }, { date: '2026-11-03', time: '14h–16h' }] },
    'rgpd-cnil-registre': { status: 'open', sessions: [{ date: '2026-10-29', time: '14h–16h' }, { date: '2026-11-05', time: '14h–16h' }] },
    'sous-traitants-prestataires': { status: 'open', sessions: [{ date: '2026-10-31', time: '14h–16h' }, { date: '2026-11-17', time: '14h–16h' }] }
  };
  var validStatuses = ['open', 'upcoming', 'hidden'];
  function formatDate(value) {
    var date = new Date(value + 'T12:00:00');
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }

  function formatShortDate(value) {
    var date = new Date(value + 'T12:00:00');
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(date);
  }

  /* Le catalogue IA associe les formations disponibles toute l'année et les
     prochaines sessions programmées. Les deux ensembles restent complémentaires. */
  function rebuildIaProgramming() {
    var universe = root.querySelector('[data-catalog-universe="ia"]');
    var oldGrid = universe && universe.querySelector('.catalog-grid');
    if (!universe || !oldGrid) return;
    var legacyCards = new Map(Array.from(oldGrid.querySelectorAll('.catalog-card[data-course]')).map(function (card) { return [card.dataset.course, card]; }));

    var programme = [
      { id: 'services-personnaliser-ia', title: 'Personnaliser son IA', duration: '1 h 30', publicPrice: '79 €', memberPrice: '69 €', hook: 'Configurez votre IA pour qu’elle comprenne votre activité, votre contexte, votre ton et votre façon de travailler.', format: 'Visio', learn: ['Configurer votre activité, votre contexte, votre rôle et vos interlocuteurs.', 'Définir votre ton, vos préférences, vos règles récurrentes et vos interdits.', 'Tester la personnalisation sur de vraies demandes et l’ajuster.'], takeaway: 'Un profil de référence corrigé par vous, un environnement IA personnalisé et une méthode pour le tenir à jour.', audience: 'Professionnels qui veulent utiliser une IA conversationnelle dans leur activité.', prerequisites: 'Aucun prérequis.' },
      { id: 'services-documents-ia', title: 'Créer ses documents professionnels avec l’IA', duration: '1 h 30', publicPrice: '79 €', memberPrice: '69 €', hook: 'Passez de vos informations au document professionnel final sans perdre des heures sur la structure et la rédaction.', format: 'Visio', learn: ['Cadrer le besoin et valider le plan avant de rédiger.', 'Produire section par section et vérifier les sources et les promesses.', 'Corriger localement, puis décliner le document dans d’autres formats.'], takeaway: 'Un plan de document validable et une méthode en six étapes pour rédiger, vérifier, corriger et décliner vos documents.', audience: 'Professionnels qui produisent des documents engageants ou récurrents.', prerequisites: 'Aucun prérequis.' },
      { id: 'services-notion-base', title: 'Découvrir Notion et créer sa première base', duration: '1 h 30', publicPrice: '79 €', memberPrice: '69 €', hook: 'Construire dès la première séance une base Notion utile à son activité.', learn: ['Comprendre pages, bases, propriétés et vues.', 'Définir ce que l’on souhaite suivre.', 'Créer les propriétés utiles et les premières vues.', 'Tester la base avec de vraies informations.'], takeaway: 'Une première base Notion fonctionnelle, adaptée à votre besoin.' },
      { id: 'services-mission-client', title: 'Gérer une mission client de A à Z avec l’IA', duration: '2 h 30', publicPrice: '119 €', memberPrice: '99 €', hook: 'Transformer une mission client réelle en méthode claire, suivie et réutilisable.', learn: ['Structurer la demande.', 'Identifier les informations et documents nécessaires.', 'Découper la mission en actions.', 'Suivre attentes, échéances et validations.', 'Préparer productions, demandes de pièces et relances.', 'Formaliser une méthode réutilisable.'], takeaway: 'Votre propre méthode de gestion de mission, une trame de suivi et vos consignes IA réutilisables.' },
      { id: 'services-notion-dashboard', title: 'Construire son tableau de bord avec Notion', duration: '2 h 30', publicPrice: '139 €', memberPrice: '119 €', hook: 'Regroupez au même endroit ce que vous devez réellement suivre pour piloter votre activité.', format: 'Visio', learn: ['Définir les informations et indicateurs à suivre.', 'Construire les vues adaptées à votre usage.', 'Mettre en place une structure qui pourra évoluer.'], takeaway: 'Un dashboard fonctionnel, des vues adaptées, des informations utiles et une structure réutilisable et évolutive.', audience: 'Professionnels connaissant les bases de Notion et disposant d’un cas d’usage réel.', prerequisites: 'Être autonome avec une IA conversationnelle, connaître les bases de Notion, disposer d’un compte Notion et venir avec un cas d’usage réel.' },
      { id: 'services-donnees-ia', title: 'Exploiter ses données avec l’IA', duration: '1 h 30', publicPrice: '79 €', memberPrice: '69 €', hook: 'Faites parler vos données pour repérer ce qui compte vraiment et faciliter vos décisions.', format: 'Visio', learn: ['Distinguer la donnée, le calcul et le constat.', 'Repérer l’interprétation, l’hypothèse et la recommandation.', 'Relire les conclusions avant d’en faire une décision.'], takeaway: 'Une grille de lecture distinguant données, calculs, constats, hypothèses et recommandations, à appliquer à vos analyses.', audience: 'Professionnels qui analysent des données pour suivre leur activité ou prendre des décisions.', prerequisites: 'Aucun prérequis.' },
      { id: 'services-google-dashboard', title: 'Construire son tableau de bord avec Google Workspace', duration: '2 h 30', publicPrice: '139 €', memberPrice: '119 €', hook: 'Construire dans votre environnement Google l’outil de suivi dont vous avez réellement besoin.', learn: ['Définir les informations à piloter.', 'Structurer données, statuts et échéances.', 'Créer les indicateurs utiles.', 'Mobiliser selon le besoin Sheets, Forms, Drive, Agenda ou Tasks.', 'Tester sur de vraies données.'], takeaway: 'Votre tableau de bord Google Workspace fonctionnel, avec ses premières vues et indicateurs.' },
      { id: 'services-notebooklm', title: 'Exploiter ses documents et ses sources avec NotebookLM', duration: '1 h 30', publicPrice: '79 €', memberPrice: '69 €', hook: 'Transformez vos propres documents en une source de réponses, d’idées et de contenus immédiatement exploitables.', format: 'Visio', learn: ['Organiser les documents qui serviront de sources de référence.', 'Formuler des demandes à partir de ces sources pour obtenir des réponses et des synthèses utiles.', 'Vérifier les éléments à retenir avant de les réutiliser.'], takeaway: 'Une méthode pour exploiter vos propres documents comme base de réponses, d’idées et de contenus.', audience: 'Professionnels qui travaillent à partir de documents et de sources propres à leur activité.' },
      { id: 'services-priorites', title: 'Organiser ses priorités, échéances et relances', duration: '2 h 30', publicPrice: '119 €', memberPrice: '99 €', hook: 'Savoir chaque jour quoi faire, quoi surveiller et quoi relancer.', learn: ['Distinguer actions, attentes, échéances, relances, récurrences et vigilances.', 'Définir ses règles de priorité.', 'Structurer ses vues quotidiennes et hebdomadaires.', 'Utiliser l’IA pour préparer le suivi et les relances.'], takeaway: 'Votre méthode personnelle de pilotage, vos règles et une organisation directement utilisable.' }
    ];

    universe.querySelector('.catalog-universe-heading h2').textContent = 'IA & outils professionnels';
    universe.querySelector('.catalog-universe-heading p').textContent = 'Des formations-ateliers pour construire ses propres méthodes et outils de travail. On ne vient pas regarder une démonstration. On travaille directement sur son activité. Selon la formation, on vient avec un besoin, un dossier ou un outil réel et on repart avec une méthode ou une première version fonctionnelle.';
    oldGrid.remove();

    function addTemplate(id, html) {
      var template = document.createElement('template');
      template.id = 'catalog-template-' + id;
      template.innerHTML = html;
      root.appendChild(template);
    }
    function list(items) { return items ? '<ul>' + items.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul>' : ''; }
    function prices(item) { return '<div class="catalog-card-prices"><p>Tarif public<br><strong>' + item.publicPrice + '</strong></p><p class="catalog-member">Tarif In10<br><strong>' + item.memberPrice + '</strong></p></div>'; }
    function environments(item) { return item.environments ? '<div class="catalog-environments"><strong>Choisissez votre environnement</strong>' + item.environments.map(function (environment) { return '<span>' + environment + '</span>'; }).join('') + '</div>' : ''; }
    function practicalFacts(item) {
      var nextSession = '';
      return '<section class="catalog-detail-block catalog-practical-info"><h3>Informations pratiques</h3><dl class="catalog-detail-facts">' + nextSession + '<div><dt>Durée</dt><dd>' + item.duration + '</dd></div><div><dt>Tarif public</dt><dd>' + item.publicPrice + '</dd></div><div><dt>Tarif In10</dt><dd>' + item.memberPrice + '</dd></div>' + (item.format ? '<div><dt>Format</dt><dd>' + item.format + '</dd></div>' : '') + (item.environments ? '<div><dt>Choisissez votre environnement</dt><dd>' + item.environments.join('<br>') + '</dd></div>' : '') + '</dl></section>';
    }

    var cpf = document.createElement('aside');
    cpf.className = 'catalog-cpf-feature';
    cpf.dataset.catalogSubuniverse = 'cpf-rs7311';
    cpf.innerHTML = '<p class="catalog-funding-kicker">Formation longue · CPF</p><article class="catalog-card catalog-card--cpf" data-course="cpf-rs7311"><h4>Améliorer l’efficacité de sa TPE à l’aide de l’IA — Certification RS7311</h4><p class="catalog-card-hook">Intégrer concrètement l’IA dans son activité pour gagner en efficacité et construire un plan d’action adapté à sa TPE.</p><div class="catalog-cpf-facts"><span>36 h</span><span>Formation mixte</span><span>Éligible CPF</span><span>Certification RS7311</span></div><button class="catalog-detail-button" type="button" data-catalog-open="cpf-rs7311" aria-label="Voir le détail : Améliorer l’efficacité de sa TPE à l’aide de l’IA — Certification RS7311">Voir le détail →</button></article>';
    universe.appendChild(cpf);
    courseConfiguration['cpf-rs7311'] = { status: 'open', sessions: [] };
    addTemplate('cpf-rs7311', '<article class="catalog-detail catalog-cpf-detail"><p class="catalog-detail-eyebrow">Formation longue · CPF</p><h2>Améliorer l’efficacité de sa TPE à l’aide de l’IA — Certification RS7311</h2><div class="catalog-detail-facts"><div><dt>Durée</dt><dd>36 h</dd></div><div><dt>Format</dt><dd>Formation mixte</dd></div><div><dt>Financement</dt><dd>Éligible CPF</dd></div><div><dt>Certification</dt><dd>RS7311</dd></div></div><section class="catalog-detail-block"><h3>À quoi sert cette formation ?</h3><p>Intégrer concrètement l’IA dans son activité pour gagner en efficacité, automatiser certaines tâches, mieux produire, analyser ses données et construire un plan d’action adapté à sa TPE.</p></section><section class="catalog-detail-block"><h3>Vous allez notamment apprendre à :</h3><ul><li>identifier les usages IA réellement utiles dans votre activité ;</li><li>automatiser certaines tâches et workflows ;</li><li>produire plus efficacement avec l’IA ;</li><li>analyser et synthétiser des données ;</li><li>construire un plan d’implémentation concret pour votre entreprise.</li></ul></section><section class="catalog-detail-block"><h3>Le parcours en bref</h3><ol><li>Comprendre les opportunités de l’IA pour sa TPE</li><li>Cartographier et automatiser les tâches récurrentes</li><li>Produire efficacement avec l’IA</li><li>Analyser, synthétiser et piloter</li><li>Intégrer l’IA dans son organisation</li><li>Préparer son projet certifiant</li></ol></section><section class="catalog-detail-block"><h3>Public</h3><p>Dirigeants et collaborateurs de TPE ayant un projet concret d’intégration de l’IA.</p></section><section class="catalog-detail-block"><h3>Prérequis</h3><p>Utiliser les outils bureautiques courants, avoir déjà testé une IA générative et disposer d’un projet métier concret.</p></section><p class="catalog-external-cta"><a class="btn" href="https://labacademie.qualiobee.fr/qualiobee/formation/1991d821-8e33-4b00-b5c8-c6ef01a25b40/registration" target="_blank" rel="noopener noreferrer">Voir le programme complet et s’inscrire <span aria-hidden="true">↗</span></a></p></article>');

    var services = document.createElement('section');
    services.className = 'catalog-all-formations';
    services.innerHTML = '<div class="catalog-all-formations-heading"><h3>Toutes les formations</h3><p>Retrouvez l’ensemble des ateliers disponibles, avec ou sans date programmée.</p></div><div class="catalog-grid"></div>';
    var grid = services.querySelector('.catalog-grid');
    programme.forEach(function (item) {
      courseConfiguration[item.id] = { status: 'open', sessions: [], duration: item.duration };
      var card = document.createElement('article');
      card.className = 'catalog-card'; card.dataset.course = item.id;
      card.innerHTML = '<h4>' + item.title + '</h4><p class="catalog-card-hook">' + item.hook + '</p><div class="catalog-meta"><span>' + item.duration + '</span></div>' + environments(item) + prices(item) + '<button class="catalog-detail-button" type="button" data-catalog-open="' + item.id + '" aria-label="Voir le détail : ' + item.title + '">Voir le détail →</button>';
      grid.appendChild(card);
      addTemplate(item.id, '<article class="catalog-detail"><p class="catalog-detail-eyebrow">Services aux entreprises</p><h2>' + item.title + '</h2><p class="catalog-detail-lead">' + item.hook + '</p>' + (item.learn ? '<section class="catalog-detail-block"><h3>Pendant l’atelier</h3>' + list(item.learn) + '</section>' : '') + (item.takeaway ? '<section class="catalog-detail-block"><h3>Vous repartez avec</h3><p>' + item.takeaway + '</p></section>' : '') + (item.audience ? '<section class="catalog-detail-block"><h3>Public</h3><p>' + item.audience + '</p></section>' : '') + (item.prerequisites ? '<section class="catalog-detail-block"><h3>Prérequis</h3><p>' + item.prerequisites + '</p></section>' : '') + practicalFacts(item) + '</article>');
    });

    function restoreLegacyCourse(specification) {
      var sourceCard = legacyCards.get(specification.id);
      var sourceTemplate = root.querySelector('#catalog-template-' + specification.id);
      if (!sourceCard || !sourceTemplate) return;
      var card = sourceCard.cloneNode(true);
      var title = card.querySelector('h4');
      var button = card.querySelector('[data-catalog-open]');
      if (specification.title && title) title.textContent = specification.title;
      if (specification.hook && card.querySelector('.catalog-card-hook')) card.querySelector('.catalog-card-hook').textContent = specification.hook;
      if (specification.meta && card.querySelector('.catalog-meta')) card.querySelector('.catalog-meta').innerHTML = specification.meta;
      if (button) {
        button.dataset.catalogOpen = specification.id;
        button.setAttribute('aria-label', 'Voir le détail : ' + (specification.title || (title && title.textContent)));
      }
      courseConfiguration[specification.id] = {
        status: 'open',
        sessions: specification.sessions || [],
        duration: specification.duration,
        intersession: specification.intersession
      };
      grid.appendChild(card);

      var detailTitle = sourceTemplate.content.querySelector('h2');
      if (specification.title && detailTitle) detailTitle.textContent = specification.title;
      if (specification.organization) {
        var organization = document.createElement('section');
        organization.className = 'catalog-detail-block';
        organization.innerHTML = '<h3>Organisation</h3><p>' + specification.organization + '</p>';
        sourceTemplate.content.appendChild(organization);
      }
    }

    [
      { id: 'contenus-ia', title: 'Créer ses contenus avec l’IA' },
      { id: 'visuels-ia', title: 'Créer ses visuels professionnels avec ChatGPT' },
      { id: 'routines-ia', title: 'Créer ses routines IA' },
      { id: 'espace-notion', title: 'Structurer son espace Notion avec l’IA' },
      { id: 'generateur-contenus', title: 'Construire son générateur de contenus' },
      { id: 'generateur-visuels', title: 'Construire son générateur de visuels' },
      { id: 'tableau-pilotage', title: 'Construire son tableau de pilotage' },
      { id: 'mini-outil', title: 'Construire son mini-outil métier' },
      { id: 'ia-methodes', title: 'IA & Méthodes' },
      { id: 'communication-ia', title: 'Communication & IA' },
      { id: 'pilotage-ia', title: 'Pilotage & IA' }
    ].forEach(restoreLegacyCourse);
    universe.appendChild(services);
  }

  function createCommunicationDomain() {
    var main = root.querySelector('#catalogue-formations');
    var source = root.querySelector('.catalog-card[data-course="documents-ia"]');
    if (!main || !source) return;
    var universe = document.createElement('div');
    universe.dataset.catalogUniverse = 'communication';
    universe.innerHTML = '<div class="catalog-universe-heading"><h2>Communication &amp; image professionnelle</h2><p>Des formations pour créer et diffuser des contenus professionnels avec les bons outils.</p></div><div class="catalog-grid"></div>';
    var card = source.cloneNode(true);
    card.dataset.course = 'videos-smartphone';
    card.querySelector('h4').textContent = 'Réaliser des vidéos professionnelles avec votre smartphone';
    card.querySelector('.catalog-card-hook').textContent = 'Tournez, montez et encodez des vidéos professionnelles avec votre smartphone.';
    var meta = card.querySelector('.catalog-meta');
    if (meta) meta.innerHTML = '<span>3 jours · 21 h</span><span>Présentiel</span>';
    var prices = card.querySelector('.catalog-card-prices');
    if (prices) prices.innerHTML = '<p>Tarif individuel 2026/2027<br><strong>1 575 € net / personne</strong></p>';
    var button = card.querySelector('[data-catalog-open]');
    if (button) { button.dataset.catalogOpen = 'videos-smartphone'; button.setAttribute('aria-label', 'Voir le détail : Réaliser des vidéos professionnelles avec votre smartphone'); }
    universe.querySelector('.catalog-grid').appendChild(card);
    main.appendChild(universe);
    var template = document.createElement('template');
    template.id = 'catalog-template-videos-smartphone';
    template.innerHTML = '<article class="catalog-detail"><p class="catalog-detail-eyebrow">Communication &amp; image professionnelle · Bettina Bussière</p><h2>Réaliser des vidéos professionnelles avec votre smartphone</h2><p class="catalog-detail-lead">Une formation de 3 jours pour réaliser, monter et encoder des vidéos professionnelles avec un smartphone.</p><div class="catalog-detail-prices"><p>Tarif individuel 2026/2027 : <strong>1 575 € net / personne</strong></p></div><h3>Programme</h3><ul><li>Définir son projet vidéo, son scénario et son découpage technique.</li><li>Maîtriser les réglages et les techniques de tournage avec un smartphone.</li><li>Transférer les images, monter, titrer, sous-titrer et encoder la vidéo.</li></ul><p>Formation individuelle en présentiel. Les frais éventuels de déplacement, repas ou hébergement restent à la charge du participant.</p></article>';
    root.appendChild(template);
    var filter = document.createElement('button');
    filter.type = 'button'; filter.className = 'catalog-filter'; filter.dataset.catalogFilter = 'communication'; filter.dataset.catalogFilterLabel = 'Communication & image professionnelle'; filter.setAttribute('aria-pressed', 'false'); filter.textContent = 'Communication & image professionnelle';
    root.querySelector('.catalog-filters').appendChild(filter);
  }

  function todayKey() {
    return new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  }

  function registrationFor(id) {
    var template = root.querySelector('#catalog-template-' + id);
    var specific = template && Array.from(template.content.querySelectorAll('a[href]')).find(function (link) {
      try { return /(^|\.)(billetweb\.fr|qualiobee\.fr)$/.test(new URL(link.href).hostname); } catch (error) { return false; }
    });
    if (specific) registrationLinks[id] = specific.href;
    return registrationLinks[id] || programming.registration;
  }

  function appendFacts(article, pairs) {
    var facts = document.createElement('dl');
    facts.className = 'catalog-detail-facts catalog-approved-facts';
    pairs.forEach(function (pair) {
      if (!pair[1]) return;
      var row = document.createElement('div'), term = document.createElement('dt'), value = document.createElement('dd');
      term.textContent = pair[0]; value.textContent = pair[1]; row.append(term, value); facts.appendChild(row);
    });
    article.appendChild(facts);
  }

  // La programmation validée prime sur les anciennes sessions du catalogue et du Hub.
  // Les autres organismes et leurs contenus restent gérés par leur source existante.
  function applyValidatedProgramming() {
    var universe = root.querySelector('[data-catalog-universe="ia"]');
    var services = universe.querySelector('.catalog-all-formations');
    var groups = {};
    [
      ['ai', programming.aiHeading, programming.aiSubtitle],
      ['enter', programming.enterHeading, programming.enterSubtitle],
      ['pass', '🎓 Pass IA 360°', '3 journées en présentiel en Gironde · 1 920 € net · 4 à 7 personnes · Finançable']
    ].forEach(function (entry) {
      var section = universe.querySelector('[data-training-format="' + entry[0] + '"]');
      if (!section) {
        section = document.createElement('section'); section.className = 'catalog-format-section'; section.dataset.trainingFormat = entry[0];
        var heading = document.createElement('div'); heading.className = 'catalog-all-formations-heading';
        var title = document.createElement('h3'); title.textContent = entry[1];
        var subtitle = document.createElement('p'); subtitle.textContent = entry[2]; heading.append(title, subtitle);
        var grid = document.createElement('div'); grid.className = 'catalog-grid'; section.append(heading, grid); services.before(section);
      }
      groups[entry[0]] = section.querySelector('.catalog-grid');
    });
    services.querySelector('h3').textContent = 'Autres formations et outils';
    services.querySelector('.catalog-all-formations-heading p').textContent = 'Des formations complémentaires, à programmer selon votre besoin.';
    Object.keys(programming.courses).forEach(function (key) {
      var definition = programming.courses[key], format = programming.formats[definition.kind];
      var id = definition.id;
      var card = root.querySelector('.catalog-card[data-course="' + id + '"]');
      if (!card) {
        card = document.createElement('article'); card.className = 'catalog-card'; card.dataset.course = id;
        card.innerHTML = '<h4></h4><div class="catalog-meta"></div><div class="catalog-card-prices"></div><button type="button" class="catalog-detail-button">Voir le détail →</button>';
      }
      var template = root.querySelector('#catalog-template-' + id);
      if (!template) {
        template = document.createElement('template'); template.id = 'catalog-template-' + id;
        template.innerHTML = '<article class="catalog-detail"><h2></h2></article>'; root.appendChild(template);
      }
      registrationFor(id);
      var article = template.content.querySelector('.catalog-detail') || template.content;
      template.content.querySelector('h2').textContent = definition.title;
      // Retirer uniquement les anciennes modalités commerciales et les anciennes dates.
      article.querySelectorAll('.catalog-detail-facts, .catalog-detail-prices, .catalog-practical-info, .catalog-environments, .catalog-approved-cta').forEach(function (element) { element.remove(); });
      article.querySelectorAll('.catalog-detail-block').forEach(function (block) {
        var title = block.querySelector('h3');
        if (title && (title.textContent === 'Organisation' || title.textContent === 'Prochaines sessions' || (format.funding && title.textContent === 'Financement'))) block.remove();
      });
      article.querySelectorAll('p').forEach(function (paragraph) { if (/Travail intersession/.test(paragraph.textContent)) paragraph.remove(); });
      card.querySelector('h4').textContent = definition.title;
      card.dataset.trainingKind = definition.kind;
      var meta = card.querySelector('.catalog-meta'); meta.replaceChildren();
      [definition.kind === 'PASS' ? format.duration : definition.kind + ' · ' + format.duration, format.format, format.participants].forEach(function (text) {
        var span = document.createElement('span'); span.textContent = text; meta.appendChild(span);
      });
      card.querySelectorAll('.catalog-environments, .catalog-financing-badge').forEach(function (element) { element.remove(); });
      if (format.funding) {
        var badge = document.createElement('span'); badge.className = 'catalog-financing-badge'; badge.textContent = format.funding; meta.after(badge);
      }
      var prices = card.querySelector('.catalog-card-prices');
      if (!prices) { prices = document.createElement('div'); prices.className = 'catalog-card-prices'; card.appendChild(prices); }
      prices.replaceChildren();
      var publicPrice = definition.price || format.price, memberPrice = definition.memberPrice || format.memberPrice;
      [['Tarif public', publicPrice], ['Membre In10pensables', memberPrice]].forEach(function (entry) {
        if (!entry[1]) return;
        var p = document.createElement('p'); p.append(document.createTextNode(entry[0]), document.createElement('br'));
        var strong = document.createElement('strong'); strong.textContent = entry[1]; p.appendChild(strong); prices.appendChild(p);
      });
      var button = card.querySelector('[data-catalog-open], .catalog-detail-button');
      button.dataset.catalogOpen = id; button.setAttribute('aria-label', 'Voir le détail : ' + definition.title);
      button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', 'catalog-details');
      appendFacts(article, [['Format', definition.kind + ' · ' + format.format], ['Durée', format.duration], ['Horaires', format.hours], ['Tarif public', publicPrice], ['Tarif membre In10pensables', memberPrice], ['Participants', format.participants], ['Financement', format.funding], ['Sur place', format.meals], ['Votre outil', /CTRL|CMD/.test(definition.kind) ? 'ChatGPT, Claude ou Gemini' : '']]);
      var cta = document.createElement('p'); cta.className = 'catalog-external-cta catalog-approved-cta';
      var link = document.createElement('a'); link.className = 'btn'; link.href = registrationFor(id); link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Informations & inscription ↗'; cta.appendChild(link); article.appendChild(cta);
      groups[definition.kind === 'ENTER' ? 'enter' : definition.kind === 'PASS' ? 'pass' : 'ai'].appendChild(card);
      courseConfiguration[id] = { status: 'open', duration: format.duration, sessions: programming.sessions.filter(function (session) { return session.courseId === id; }) };
    });
    // Le parcours CPF et son vrai CTA restent intacts, y compris après une réponse Hub.
    if (cpfReference && cpfCardReference) {
      root.querySelector('#catalog-template-cpf-rs7311').content.replaceChildren(cpfReference.cloneNode(true));
      root.querySelector('.catalog-card[data-course="cpf-rs7311"]').replaceWith(cpfCardReference.cloneNode(true));
    }
  }

  function configureCards() {
    root.querySelectorAll('.catalog-card[data-course]').forEach(function (card) {
      var id = card.dataset.course;
      var config = courseConfiguration[id] || { sessions: [] };
      card.dataset.catalogStatus = validStatuses.indexOf(config.status) > -1 ? config.status : 'open';
      card.hidden = card.dataset.catalogStatus === 'hidden';
      card.querySelectorAll('.catalog-course-status, .catalog-next-session').forEach(function (element) { element.remove(); });
      var sessions = config.sessions || [];
      var upcoming = sessions.filter(function (session) { return (session.dates ? session.dates[session.dates.length - 1] : session.date) >= todayKey(); });
      var status = document.createElement('span');
      status.className = 'catalog-course-status catalog-course-status--' + (upcoming.length ? 'open' : 'unscheduled');
      status.textContent = upcoming.length ? 'Prochaine session : ' + formatShortDate(upcoming[0].date) : 'À VENIR';
      card.querySelector('h4').after(status);
      if (upcoming[0] && upcoming[0].dates) {
        var dates = document.createElement('p'); dates.className = 'catalog-next-session';
        dates.textContent = upcoming[0].label + ' · ' + upcoming[0].dates.map(formatShortDate).join(' / ');
        status.after(dates);
      }
      var template = root.querySelector('#catalog-template-' + id);
      if (!template) return;
      template.content.querySelectorAll('.catalog-session-list').forEach(function (element) { element.remove(); });
      if (!sessions.length) return;
      var block = document.createElement('section'); block.className = 'catalog-detail-block catalog-session-list';
      var title = document.createElement('h3'); title.textContent = 'Sessions programmées'; block.appendChild(title);
      var list = document.createElement('ul');
      sessions.forEach(function (session) {
        var item = document.createElement('li');
        item.textContent = (session.label ? session.label + ' · ' : '') + (session.dates ? session.dates.map(formatDate).join(' / ') : formatDate(session.date)) + (session.time ? ' · ' + session.time : '');
        list.appendChild(item);
      });
      block.appendChild(list);
      (template.content.querySelector('.catalog-detail') || template.content).appendChild(block);
    });
  }

  function visibleCards(scope) {
    return Array.from(scope.querySelectorAll('.catalog-card')).filter(function (card) { return !card.hidden; });
  }

  function buildDomains() {
    var main = root.querySelector('#catalogue-formations');
    var toolbar = main.querySelector('.catalog-toolbar');
    var universes = Array.from(main.querySelectorAll('[data-catalog-universe]'));
    var list = document.createElement('div');
    list.className = 'catalog-domain-list';
    var contentZone = document.createElement('div');
    contentZone.className = 'catalog-domain-content-zone';
    universes.forEach(function (universe) {
      var heading = universe.querySelector('.catalog-universe-heading');
      var titleText = heading.querySelector('h2').textContent;
      var introText = heading.querySelector('p').textContent;
      var details = document.createElement('details');
      details.className = 'catalog-domain';
      details.dataset.catalogDomain = universe.dataset.catalogUniverse;
      var summary = document.createElement('summary');
      summary.className = 'catalog-domain-heading';
      var title = document.createElement('h2');
      title.textContent = titleText;
      var intro = document.createElement('p');
      intro.textContent = introText;
      var stats = document.createElement('small');
      stats.dataset.catalogDomainStats = '';
      summary.append(title, intro, stats);
      details.appendChild(summary);
      Array.from(universe.children).forEach(function (child) {
        if (child !== heading) universe.appendChild(child);
      });
      heading.remove();
      universe.classList.add('catalog-domain-content');
      universe.hidden = true;
      list.appendChild(details);
      contentZone.appendChild(universe);
    });
    toolbar.insertAdjacentElement('afterend', list);
    list.insertAdjacentElement('afterend', contentZone);

    list.querySelectorAll('.catalog-domain').forEach(function (domain) {
      domain.addEventListener('toggle', function () {
        if (!domain.open) {
          var closingPanel = root.querySelector('[data-catalog-universe="' + domain.dataset.catalogDomain + '"]');
          if (closingPanel) closingPanel.hidden = true;
          return;
        }
        list.querySelectorAll('.catalog-domain').forEach(function (other) {
          if (other !== domain) other.open = false;
        });
        root.querySelectorAll('[data-catalog-universe]').forEach(function (panel) {
          panel.hidden = panel.dataset.catalogUniverse !== domain.dataset.catalogDomain;
        });
      });
    });

    root.querySelectorAll('.catalog-topic').forEach(function (topic) {
      topic.addEventListener('toggle', function () {
        if (!topic.open) return;
        var siblings = topic.parentElement.querySelectorAll('.catalog-topic');
        siblings.forEach(function (other) { if (other !== topic) other.open = false; });
      });
    });
  }

  function updateTopicStats() {
    root.querySelectorAll('.catalog-topic').forEach(function (topic) {
      var cards = visibleCards(topic);
      var open = cards.filter(function (card) { return card.dataset.catalogStatus === 'open'; }).length;
      var upcoming = cards.filter(function (card) { return card.dataset.catalogStatus === 'upcoming'; }).length;
      var stats = topic.querySelector('[data-catalog-topic-stats]');
      if (stats) {
        var labels = [cards.length + (cards.length === 1 ? ' formation' : ' formations')];
        if (open) labels.push(open + (open === 1 ? ' proposée' : ' proposées'));
        if (upcoming) labels.push(upcoming + ' à venir');
        stats.textContent = labels.join(' · ');
      }
      topic.hidden = cards.length === 0;
    });
  }

  function updateDomainStats() {
    root.querySelectorAll('.catalog-domain').forEach(function (domain) {
      var panel = root.querySelector('[data-catalog-universe="' + domain.dataset.catalogDomain + '"]');
      var cards = panel ? visibleCards(panel) : [];
      var stats = domain.querySelector('[data-catalog-domain-stats]');
      if (stats) stats.textContent = cards.length + (cards.length === 1 ? ' formation' : ' formations');
    });
  }

  function updateSummary() {
    var visible = visibleCards(root);
    var sessions = getScheduledSessions();
    var today = new Date();
    var currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
    var todayKey = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    var thisMonth = sessions.filter(function (session) { return session.date.slice(0, 7) === currentMonth; }).length;
    var upcoming = sessions.filter(function (session) { return session.date >= todayKey; }).length;
    var metrics = [
      { selector: '[data-catalog-summary="visible"]', value: visible.length, label: 'formations au catalogue' },
      { selector: '[data-catalog-summary="open"]', value: thisMonth, label: 'sessions ce mois-ci' },
      { selector: '[data-catalog-summary="upcoming"]', value: upcoming, label: 'sessions à venir' }
    ];
    metrics.forEach(function (metric) {
      root.querySelectorAll(metric.selector).forEach(function (item) {
        item.parentElement.innerHTML = '<strong ' + metric.selector.slice(1, -1) + '>' + metric.value + '</strong> ' + metric.label;
      });
    });
  }

  function getScheduledSessions() {
    var sessions = [];
    Object.keys(courseConfiguration).forEach(function (id) {
      var config = courseConfiguration[id];
      var card = root.querySelector('.catalog-card[data-course="' + id + '"]');
      if (!card || config.status === 'hidden') return;
      (config.sessions || []).forEach(function (session) {
        (session.dates || [session.date]).forEach(function (date, index) {
          sessions.push({
            courseId: id, kind: session.kind || '', date: date, start: session.start || session.time || '',
            time: session.time || '', label: session.label || '', day: session.dates ? index + 1 : 0,
            title: card.querySelector('h4').textContent, domain: card.closest('[data-catalog-universe]').dataset.catalogUniverse
          });
        });
      });
    });
    sessions.sort(function (a, b) { return (a.date + a.start).localeCompare(b.date + b.start); });
    return sessions;
  }

  function calendarTodayKey() {
    var today = new Date();
    return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  }

  function buildSessionsCalendar() {
    var previousCalendar = root.querySelector('.catalog-sessions-calendar');
    var selectedMonth = previousCalendar && previousCalendar.querySelector('[aria-selected="true"]');
    var preferredMonth = selectedMonth && selectedMonth.dataset.catalogMonth;
    if (previousCalendar) previousCalendar.remove();
    // Tous les organismes, sans borne mensuelle ; les données historiques restent intactes.
    var today = calendarTodayKey();
    var sessions = getScheduledSessions().filter(function (session) { return session.date >= today; });
    if (!sessions.length) return;
    var section = document.createElement('section');
    section.className = 'catalog-sessions-calendar';
    section.innerHTML = '<div class="catalog-calendar-heading"><p class="catalog-upcoming-kicker">Prochaines formations</p><h2>Les dates à retenir</h2><p>Retrouvez les prochaines formations proposées par Les In10pensables.</p></div><div class="catalog-calendar-months" role="tablist" aria-label="Mois de formation"></div><div class="catalog-calendar-panel" role="tabpanel" id="catalog-calendar-panel"></div>';
    var groups = new Map();
    sessions.forEach(function (session) {
      var key = session.date.slice(0, 7);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(session);
    });
    var monthKeys = Array.from(groups.keys());
    var monthButtons = section.querySelector('.catalog-calendar-months');
    var panel = section.querySelector('.catalog-calendar-panel');
    function showMonth(key) {
      panel.replaceChildren();
      panel.setAttribute('aria-labelledby', 'catalog-month-' + key);
      monthButtons.querySelectorAll('button').forEach(function (button) {
        var active = button.dataset.catalogMonth === key;
        button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1;
      });
      var dates = new Map();
      groups.get(key).forEach(function (session) {
        if (!dates.has(session.date)) dates.set(session.date, []);
        dates.get(session.date).push(session);
      });
      dates.forEach(function (items, date) {
        var day = document.createElement('article'); day.className = 'catalog-calendar-day';
        var heading = document.createElement('h3'); heading.textContent = formatDate(date); day.appendChild(heading);
        items.forEach(function (session) {
          var button = document.createElement('button');
          button.type = 'button'; button.className = 'catalog-calendar-session'; button.dataset.catalogOpen = session.courseId;
          button.dataset.sessionDate = date; button.dataset.sessionStart = session.start; button.dataset.sessionKind = session.kind;
          button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', 'catalog-details');
          var title = document.createElement('strong'); title.textContent = session.title;
          var time = document.createElement('span'); time.textContent = session.time;
          button.append(title, time);
          day.appendChild(button);
        });
        panel.appendChild(day);
      });
    }
    monthKeys.forEach(function (key, index) {
      var button = document.createElement('button');
      button.type = 'button'; button.id = 'catalog-month-' + key; button.dataset.catalogMonth = key;
      button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', panel.id); button.setAttribute('aria-selected', String(index === 0));
      button.textContent = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(key + '-01T12:00:00'));
      button.addEventListener('click', function () { showMonth(key); });
      button.addEventListener('keydown', function (event) {
        var target;
        if (event.key === 'ArrowRight') target = (index + 1) % monthKeys.length;
        if (event.key === 'ArrowLeft') target = (index + monthKeys.length - 1) % monthKeys.length;
        if (event.key === 'Home') target = 0;
        if (event.key === 'End') target = monthKeys.length - 1;
        if (target === undefined) return;
        event.preventDefault(); showMonth(monthKeys[target]); monthButtons.children[target].focus();
      });
      monthButtons.appendChild(button);
    });
    showMonth(groups.has(preferredMonth) ? preferredMonth : monthKeys[0]);
    root.querySelector('#catalogue-formations .catalog-domain-content-zone').after(section);
  }

  // Correspondance stable avec les identifiants publiés par le Hub.
  var hubCourseIds = ['mentions-devis-factures', 'rgpd-cnil-registre', 'sous-traitants-prestataires', 'cpf-rs7311', 'services-personnaliser-ia', 'services-documents-ia', 'services-notion-base', 'services-mission-client', 'services-notion-dashboard', 'services-donnees-ia', 'services-google-dashboard', 'services-notebooklm', 'services-priorites', 'contenus-ia', 'visuels-ia', 'routines-ia', 'espace-notion', 'generateur-contenus', 'generateur-visuels', 'tableau-pilotage', 'mini-outil', 'ia-methodes', 'communication-ia', 'pilotage-ia', 'sst-initial', 'mac-sst', 'referent-sst-duerp', 'duerp', 'videos-smartphone'];
  var hubEquivalentCards = {
    'FOR-005': ['personnaliser-ia', 'personnaliser-claude'],
    'FOR-006': ['documents-ia', 'documents-claude'],
    'FOR-009': ['dashboard-notion'],
    'FOR-010': ['donnees-ia', 'donnees-claude'],
    'FOR-014': ['contenus-ia', 'contenus-claude'],
    'FOR-015': ['visuels-ia']
  };
  function hubValue(record, key) {
    return record && (record[key] !== undefined ? record[key] : record[key.toLowerCase()]);
  }
  function hubText(record, key) {
    var value = hubValue(record, key);
    return value === null || value === undefined ? '' : String(value).trim();
  }
  function hubDate(value) {
    var match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/);
    if (!match || !formatDate(match[1])) return '';
    return match[1];
  }
  function hubDomain(record) {
    var category = hubText(record, 'CATEGORIE').toLowerCase();
    if (/santé|sécurité|prévention/.test(category)) return 'prevention';
    if (/communication|image/.test(category)) return 'communication';
    if (/gestion|administratif|conformité/.test(category)) return 'administratif';
    return 'ia';
  }
  function applyHubPublicData(formations, sessions) {
    if (!Array.isArray(formations) || !Array.isArray(sessions)) return;
    var published = formations.filter(function (item) { return hubText(item, 'ID_FORMATION') && hubText(item, 'TITRE_FORMATION'); });
    if (!published.length && !sessions.length) return;
    var today = new Date();
    var todayKey = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    var cardsByHubId = new Map();
    published.forEach(function (item) {
      var hubId = hubText(item, 'ID_FORMATION');
      var index = /^FOR-(\d+)$/.exec(hubId);
      var knownId = index && hubCourseIds[Number(index[1]) - 1];
      var equivalents = (knownId ? [knownId] : []).concat(hubEquivalentCards[hubId] || []);
      var card = equivalents.map(function (id) { return root.querySelector('.catalog-card[data-course="' + id + '"]'); }).filter(Boolean)[0];
      if (!card) card = root.querySelector('.catalog-card[data-course="' + hubId + '"]');
      var courseId = card ? card.dataset.course : hubId;
      if (!card) {
        var domain = hubDomain(item);
        var grid = root.querySelector('[data-catalog-universe="' + domain + '"] .catalog-grid');
        if (!grid) grid = root.querySelector('[data-catalog-universe="ia"] .catalog-grid');
        if (!grid) grid = root.querySelector('.catalog-topic-grid');
        if (!grid) return;
        card = document.createElement('article');
        card.className = 'catalog-card';
        card.dataset.course = courseId;
        var eyebrow = document.createElement('div'); eyebrow.className = 'catalog-eyebrow'; card.appendChild(eyebrow);
        var title = document.createElement('h4'); card.appendChild(title);
        var hook = document.createElement('p'); hook.className = 'catalog-card-hook'; card.appendChild(hook);
        var meta = document.createElement('div'); meta.className = 'catalog-meta'; card.appendChild(meta);
        var button = document.createElement('button'); button.type = 'button'; button.className = 'catalog-detail-button'; button.dataset.catalogOpen = courseId; button.textContent = 'Voir le détail →'; button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', 'catalog-details'); card.appendChild(button);
        grid.appendChild(card);
      }
      equivalents.forEach(function (id) {
        var duplicate = root.querySelector('.catalog-card[data-course="' + id + '"]');
        if (duplicate && duplicate !== card) duplicate.remove();
      });
      var titleText = hubText(item, 'TITRE_FORMATION');
      card.querySelector('h4').textContent = titleText;
      var cardHook = card.querySelector('.catalog-card-hook');
      if (cardHook) cardHook.textContent = hubText(item, 'DESCRIPTION_COURTE');
      var cardCategory = card.querySelector('.catalog-eyebrow');
      if (cardCategory && hubText(item, 'CATEGORIE')) cardCategory.textContent = hubText(item, 'CATEGORIE');
      var cardMeta = card.querySelector('.catalog-meta');
      if (cardMeta) {
        cardMeta.replaceChildren();
        ['DUREE_AFFICHEE', 'FORMAT_PAR_DEFAUT'].forEach(function (key) {
          var value = hubText(item, key);
          if (value) { var span = document.createElement('span'); span.textContent = value; cardMeta.appendChild(span); }
        });
      }
      var cardPrices = card.querySelector('.catalog-card-prices');
      if (cardPrices) {
        var prices = cardPrices.querySelectorAll('strong');
        var publicPrice = hubText(item, 'TARIF_PUBLIC_TTC');
        var memberPrice = hubText(item, 'TARIF_MEMBRE_TTC');
        if (/^\d+(?:[.,]\d+)?$/.test(publicPrice)) publicPrice += ' € TTC';
        if (/^\d+(?:[.,]\d+)?$/.test(memberPrice)) memberPrice += ' € TTC';
        if (prices[0] && publicPrice) prices[0].textContent = publicPrice;
        if (prices[1] && memberPrice) prices[1].textContent = memberPrice;
      }
      var openButton = card.querySelector('[data-catalog-open]');
      if (openButton) openButton.setAttribute('aria-label', 'Voir le détail : ' + titleText);
      registrationFor(courseId);
      var template = root.querySelector('#catalog-template-' + courseId);
      if (!template) { template = document.createElement('template'); template.id = 'catalog-template-' + courseId; root.appendChild(template); }
      var article = document.createElement('article'); article.className = 'catalog-detail';
      var detailTitle = document.createElement('h2'); detailTitle.textContent = titleText; article.appendChild(detailTitle);
      var facts = [['DUREE_AFFICHEE', 'Durée'], ['FORMAT_PAR_DEFAUT', 'Format'], ['TARIF_PUBLIC_TTC', 'Tarif public TTC'], ['TARIF_MEMBRE_TTC', 'Tarif membre TTC'], ['FINANCEMENT', 'Financement'], ['FORMATEUR', 'Formation proposée par']];
      var factList = document.createElement('dl'); factList.className = 'catalog-detail-facts';
      facts.forEach(function (entry) {
        var value = hubText(item, entry[0]);
        if (!value) return;
        if (/^TARIF_/.test(entry[0]) && /^\d+(?:[.,]\d+)?$/.test(value)) value += ' € TTC';
        var pair = document.createElement('div');
        var term = document.createElement('dt'); term.textContent = entry[1];
        var description = document.createElement('dd'); description.textContent = value;
        pair.append(term, description); factList.appendChild(pair);
      });
      if (factList.childElementCount) article.appendChild(factList);
      [['DESCRIPTION_DETAILLEE', 'À quoi sert cette formation ?'], ['PENDANT_ATELIER', 'Ce que vous allez apprendre'], ['VOUS_REPARTEZ_AVEC', 'Vous repartez avec'], ['PUBLIC_CIBLE', 'Pour qui ?'], ['PREREQUIS', 'Prérequis']].forEach(function (entry) {
        var value = hubText(item, entry[0]);
        if (!value) return;
        var block = document.createElement('section'); block.className = 'catalog-detail-block';
        var heading = document.createElement('h3'); heading.textContent = entry[1];
        var paragraph = document.createElement('p'); paragraph.textContent = value;
        block.append(heading, paragraph); article.appendChild(block);
      });
      var registration = hubText(item, 'LIEN_INSCRIPTION');
      if (/^https:\/\//.test(registration)) {
        var link = document.createElement('a'); link.href = registration; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Voir le programme et s’inscrire ↗';
        var wrapper = document.createElement('p'); wrapper.className = 'catalog-external-cta'; wrapper.appendChild(link); article.appendChild(wrapper);
      }
      template.content.replaceChildren(article);
      cardsByHubId.set(hubId, card);
      if (!courseConfiguration[courseId]) courseConfiguration[courseId] = { status: 'open', sessions: [] };
      else courseConfiguration[courseId].status = 'open';
    });
    sessions.forEach(function (session) {
      var hubId = hubText(session, 'ID_FORMATION');
      if (cardsByHubId.has(hubId)) return;
      var index = /^FOR-(\d+)$/.exec(hubId);
      var knownId = index && hubCourseIds[Number(index[1]) - 1];
      var equivalents = (knownId ? [knownId] : []).concat(hubEquivalentCards[hubId] || []);
      var card = equivalents.map(function (id) { return root.querySelector('.catalog-card[data-course="' + id + '"]'); }).filter(Boolean)[0];
      if (card) cardsByHubId.set(hubId, card);
    });
    var byId = new Map();
    sessions.forEach(function (session) {
      var hubId = hubText(session, 'ID_FORMATION');
      var date = hubDate(hubValue(session, 'DATE_SESSION'));
      if (!hubId || !date || date < todayKey) return;
      if (!byId.has(hubId)) byId.set(hubId, []);
      var start = hubText(session, 'HEURE_DEBUT');
      var end = hubText(session, 'HEURE_FIN');
      byId.get(hubId).push({ date: date, time: start && end ? start + '–' + end : start, label: hubText(session, 'LIBELLE_SESSION') });
    });
    byId.forEach(function (items, hubId) {
      var card = cardsByHubId.get(hubId);
      if (!card) return;
      items.sort(function (a, b) { return a.date.localeCompare(b.date); });
      if (!courseConfiguration[card.dataset.course]) courseConfiguration[card.dataset.course] = { status: 'open', sessions: [] };
      courseConfiguration[card.dataset.course].sessions = items;
    });
    cardsByHubId.forEach(function (card) {
      var config = courseConfiguration[card.dataset.course];
      var label = card.querySelector('.catalog-course-status');
      if (!label) { label = document.createElement('span'); card.querySelector('h4').after(label); }
      label.className = 'catalog-course-status catalog-course-status--' + (config.sessions.length ? 'open' : 'unscheduled');
      label.textContent = config.sessions.length ? 'Prochaine session : ' + formatShortDate(config.sessions[0].date) : 'À VENIR';
      card.dataset.catalogStatus = 'open';
      var detail = root.querySelector('#catalog-template-' + card.dataset.course).content.querySelector('.catalog-detail');
      if (config.sessions.length && detail) {
        var block = document.createElement('section'); block.className = 'catalog-detail-block';
        var heading = document.createElement('h3'); heading.textContent = 'Prochaines sessions'; block.appendChild(heading);
        var list = document.createElement('ul');
        config.sessions.forEach(function (session) { var row = document.createElement('li'); row.textContent = formatDate(session.date) + (session.time ? ' · ' + session.time : ''); list.appendChild(row); });
        block.appendChild(list); detail.appendChild(block);
      }
    });
    applyValidatedProgramming();
    configureCards();
    var calendar = root.querySelector('.catalog-sessions-calendar');
    if (calendar) calendar.remove();
    buildSessionsCalendar();
    updateCatalogue('all', 'Toutes les formations', false);
  }

  function updateFilterLabels() {
    filters.forEach(function (button) {
      var baseLabel = button.dataset.catalogFilterLabel || button.textContent;
      if (button.dataset.catalogFilter === 'all') {
        button.textContent = baseLabel;
        return;
      }
      var universe = root.querySelector('[data-catalog-universe="' + button.dataset.catalogFilter + '"]');
      button.textContent = baseLabel + ' · ' + (universe ? visibleCards(universe).length : 0);
    });
  }

  function updateCatalogue(selected, label, openSelected) {
    updateTopicStats();
    updateDomainStats();
    updateSummary();
    updateFilterLabels();
    var selectedDomain = root.querySelector('.catalog-domain[data-catalog-domain="' + selected + '"]');
    root.querySelectorAll('[data-catalog-universe]').forEach(function (universe) { universe.hidden = true; });
    root.querySelectorAll('.catalog-domain').forEach(function (domain) { domain.open = false; });
    if (openSelected && selected !== 'all' && selectedDomain) selectedDomain.open = true;
    var activePanel = root.querySelector('[data-catalog-universe]:not([hidden])');
    var visible = activePanel ? visibleCards(activePanel).length : visibleCards(root).length;
    count.textContent = visible + ' formations · ' + label;
  }

  createCommunicationDomain();
  filters = root.querySelectorAll('[data-catalog-filter]');
  rebuildIaProgramming();
  cpfReference = root.querySelector('#catalog-template-cpf-rs7311').content.cloneNode(true);
  cpfCardReference = root.querySelector('.catalog-card[data-course="cpf-rs7311"]').cloneNode(true);
  applyValidatedProgramming();
  configureCards();
  buildDomains();
  buildSessionsCalendar();
  updateCatalogue('all', 'Toutes les formations', false);

  // Une page laissée ouverte suit aussi le changement de jour, sans appel au Hub.
  var calendarDate = calendarTodayKey();
  function refreshCalendarDate() {
    var currentDate = calendarTodayKey();
    if (currentDate === calendarDate) return;
    calendarDate = currentDate;
    buildSessionsCalendar();
  }
  window.setInterval(refreshCalendarDate, 60000);
  window.addEventListener('focus', refreshCalendarDate);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) refreshCalendarDate();
  });

  root.querySelector('[data-catalog-scroll]').addEventListener('click', function () {
    root.querySelector('#catalogue-formations').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  filters.forEach(function (button) {
    button.addEventListener('click', function () {
      var selected = button.dataset.catalogFilter;
      filters.forEach(function (filter) { filter.setAttribute('aria-pressed', String(filter === button)); });
      updateCatalogue(selected, selected === 'all' ? 'Toutes les formations' : button.dataset.catalogFilterLabel, true);
    });
  });
  root.querySelectorAll('[data-catalog-open-domain]').forEach(function (button) {
    button.addEventListener('click', function () {
      var filter = root.querySelector('[data-catalog-filter="' + button.dataset.catalogOpenDomain + '"]');
      if (filter) filter.click();
    });
  });

  root.addEventListener('click', function (event) {
    var button = event.target.closest('[data-catalog-open]');
    if (button && root.contains(button)) {
      var template = root.querySelector('#catalog-template-' + button.dataset.catalogOpen);
      if (!template) return;
      content.replaceChildren(template.content.cloneNode(true));
      content.querySelector('h2').id = 'catalog-detail-title';
      var registration = root.querySelector('[data-catalog-contact]');
      registration.href = registrationFor(button.dataset.catalogOpen);
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      dialog.scrollTop = 0;
    }
  });
  root.querySelector('[data-catalog-close]').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') return;
    var controls = Array.from(dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(function (el) { return el.getClientRects().length > 0; });
    if (!controls.length) return;
    var first = controls[0];
    var last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  dialog.addEventListener('click', function (event) {
    var rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', function () { document.body.style.overflow = previousOverflow; });
  window.applyHubPublicData = applyHubPublicData;
})();
