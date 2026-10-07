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

  // Source unique des statuts et des sessions. Aucune heure n'est renseignée ni affichée.
  var courseConfiguration = {
    'personnaliser-ia': { status: 'open', sessions: [{ date: '2026-10-20' }] }, 'personnaliser-claude': { status: 'open', sessions: [{ date: '2026-10-22' }] },
    'contenus-ia': { status: 'open', sessions: [{ date: '2026-11-17' }] }, 'contenus-claude': { status: 'open', sessions: [{ date: '2026-11-19' }] },
    'visuels-ia': { status: 'open', sessions: [{ date: '2026-12-01' }] },
    'documents-ia': { status: 'open', sessions: [{ date: '2026-10-29' }] }, 'documents-claude': { status: 'open', sessions: [{ date: '2026-10-27' }] }, 'documents-notebooklm': { status: 'open', sessions: [{ date: '2026-12-03' }] },
    'donnees-ia': { status: 'open', sessions: [{ date: '2026-11-24' }] }, 'donnees-claude': { status: 'open', sessions: [{ date: '2026-11-26' }] },
    'routines-ia': { status: 'open', sessions: [{ date: '2026-11-05' }] }, 'espace-notion': { status: 'open', sessions: [{ date: '2026-11-10' }] },
    'ia-methodes': { status: 'open', sessions: [{ date: '2026-12-08', label: 'Séance 1', duration: '3 h 30' }, { date: '2026-12-15', label: 'Séance 2', duration: '3 h 30' }], intersession: 'Travail intersession sur une situation professionnelle réelle entre les deux séances.' },
    'communication-ia': { status: 'open', sessions: [] }, 'pilotage-ia': { status: 'open', sessions: [] },
    'generateur-contenus': { status: 'open', sessions: [] }, 'generateur-visuels': { status: 'open', sessions: [] }, 'tableau-pilotage': { status: 'open', sessions: [] }, 'mini-outil': { status: 'open', sessions: [] },
    'dashboard-notion': { status: 'open', sessions: [{ date: '2026-11-12' }] }, 'rentabilite-tpe-ia': { status: 'open', sessions: [], duration: '36 h' }, 'videos-smartphone': { status: 'open', sessions: [] },
    'mentions-devis-factures': { status: 'open', sessions: [] }, 'rgpd-cnil-registre': { status: 'open', sessions: [] }, 'sous-traitants-prestataires': { status: 'open', sessions: [] },
    'sst-initial': { status: 'open', sessions: [] }, 'mac-sst': { status: 'open', sessions: [] }, 'referent-sst-duerp': { status: 'open', sessions: [] }, 'duerp': { status: 'open', sessions: [] }
  };
  var validStatuses = ['open', 'upcoming', 'hidden'];
  var iaTopics = [
    { title: 'Prendre en main son IA', hook: 'Installez des repères utiles avant de multiplier les outils.', courses: ['personnaliser-ia', 'personnaliser-claude'] },
    { title: 'Créer avec l’IA', hook: 'Produisez des contenus, visuels, documents et analyses plus cohérents.', courses: ['documents-claude', 'documents-ia', 'contenus-ia', 'contenus-claude', 'donnees-ia', 'donnees-claude', 'visuels-ia', 'documents-notebooklm'] },
    { title: 'Structurer son activité avec l’IA', hook: 'Organisez vos méthodes, vos espaces de travail et votre pilotage.', courses: ['routines-ia', 'espace-notion', 'ia-methodes', 'communication-ia', 'pilotage-ia'] },
    { title: 'Construire ses outils avec l’IA', hook: 'Transformez vos méthodes en outils réutilisables pour votre activité.', courses: ['generateur-contenus', 'generateur-visuels', 'tableau-pilotage', 'mini-outil', 'dashboard-notion'] }
  ];

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

  function updateCourseTitle(id, title) {
    var card = root.querySelector('.catalog-card[data-course="' + id + '"]');
    if (card) card.querySelector('h4').textContent = title;
    var template = root.querySelector('#catalog-template-' + id);
    if (template && template.content.querySelector('h2')) template.content.querySelector('h2').textContent = title;
  }

  function updateCourseHook(id, hook) {
    var card = root.querySelector('.catalog-card[data-course="' + id + '"]');
    if (card && card.querySelector('.catalog-card-hook')) card.querySelector('.catalog-card-hook').textContent = hook;
  }

  function cloneCourse(sourceId, id, title, hook) {
    var source = root.querySelector('.catalog-card[data-course="' + sourceId + '"]');
    if (!source) return null;
    var card = source.cloneNode(true);
    card.dataset.course = id;
    card.querySelector('h4').textContent = title;
    if (hook && card.querySelector('.catalog-card-hook')) card.querySelector('.catalog-card-hook').textContent = hook;
    var button = card.querySelector('[data-catalog-open]');
    if (button) { button.dataset.catalogOpen = id; button.setAttribute('aria-label', 'Voir le détail : ' + title); }
    source.parentElement.appendChild(card);
    var sourceTemplate = root.querySelector('#catalog-template-' + sourceId);
    if (sourceTemplate) {
      var template = sourceTemplate.cloneNode(true);
      template.id = 'catalog-template-' + id;
      if (template.content.querySelector('h2')) template.content.querySelector('h2').textContent = title;
      root.appendChild(template);
    }
    return card;
  }

  function preparePreciseIaCourses() {
    updateCourseTitle('personnaliser-ia', 'Personnaliser ChatGPT'); updateCourseHook('personnaliser-ia', 'Faites de ChatGPT un assistant qui connaît déjà votre activité, vos clients et votre façon de travailler.');
    cloneCourse('personnaliser-ia', 'personnaliser-claude', 'Personnaliser Claude', 'Configurez Claude pour qu’il travaille avec votre contexte, votre ton et vos propres règles.');
    updateCourseTitle('contenus-ia', 'Créer ses contenus avec ChatGPT'); updateCourseHook('contenus-ia', 'Produisez plus vite sans perdre votre ton, vos idées ni votre personnalité.');
    cloneCourse('contenus-ia', 'contenus-claude', 'Créer ses contenus avec Claude', 'Transformez votre matière en contenus cohérents, naturels et vraiment adaptés à votre communication.');
    updateCourseTitle('visuels-ia', 'Créer ses visuels professionnels avec ChatGPT'); updateCourseHook('visuels-ia', 'Créez des visuels qui ressemblent vraiment à votre marque au lieu de générer des images génériques.');
    updateCourseTitle('documents-ia', 'Créer ses documents professionnels avec ChatGPT'); updateCourseHook('documents-ia', 'Transformez vos idées et vos informations en documents professionnels prêts à être utilisés.');
    cloneCourse('documents-ia', 'documents-claude', 'Créer ses documents professionnels avec Claude', 'Passez de l’idée au document final sans perdre des heures sur la structure et la mise en forme.');
    cloneCourse('documents-ia', 'documents-notebooklm', 'Exploiter ses documents avec NotebookLM', 'Transformez vos propres documents en une source de réponses, d’idées et de contenus immédiatement exploitable.');
    updateCourseTitle('donnees-ia', 'Exploiter ses données avec ChatGPT'); updateCourseHook('donnees-ia', 'Faites parler vos données pour repérer ce qui compte vraiment dans votre activité.');
    cloneCourse('donnees-ia', 'donnees-claude', 'Exploiter ses données avec Claude', 'Passez de vos tableaux à des constats utiles et à des décisions plus faciles à prendre.');
    updateCourseHook('routines-ia', 'Arrêtez de refaire les mêmes demandes : transformez vos tâches répétitives en routines fiables.');
    updateCourseHook('espace-notion', 'Construisez enfin un espace Notion qui correspond réellement à votre façon de travailler.');
    updateCourseHook('dashboard-notion', 'Regroupez au même endroit ce que vous devez vraiment suivre pour piloter votre activité.');
    updateCourseHook('ia-methodes', 'Intégrez l’IA dans vos vraies méthodes de travail pour gagner du temps sans perdre le contrôle.');
    var featured = cloneCourse('ia-methodes', 'rentabilite-tpe-ia', 'Augmenter la rentabilité de sa TPE grâce à l’IA', 'Une formation spécifique de 36 h dédiée à la rentabilité des TPE grâce à l’IA.');
    if (featured) {
      featured.classList.add('catalog-card--specific');
      var fundingMeta = featured.querySelector('.catalog-meta'); if (fundingMeta) fundingMeta.innerHTML = '<span>36 h</span>';
      var fundingPrices = featured.querySelector('.catalog-card-prices'); if (fundingPrices) fundingPrices.remove();
      var fundingTemplate = root.querySelector('#catalog-template-rentabilite-tpe-ia');
      if (fundingTemplate) fundingTemplate.innerHTML = '<article class="catalog-detail"><p class="catalog-detail-eyebrow">Formation spécifique</p><h2>Augmenter la rentabilité de sa TPE grâce à l’IA</h2><p class="catalog-detail-lead">Durée : 36 h.</p><p>Les objectifs, le programme, les modalités, le tarif, le financement et une éventuelle certification seront publiés à partir de la fiche programme de référence.</p></article>';
    }
  }

  /* Le catalogue IA associe les formations disponibles toute l'année et les
     prochaines sessions programmées. Les deux ensembles restent complémentaires. */
  function rebuildIaProgramming() {
    var universe = root.querySelector('[data-catalog-universe="ia"]');
    var oldGrid = universe && universe.querySelector('.catalog-grid');
    if (!universe || !oldGrid) return;
    var legacyCards = new Map(Array.from(oldGrid.querySelectorAll('.catalog-card[data-course]')).map(function (card) { return [card.dataset.course, card]; }));

    var programme = [
      { id: 'services-personnaliser-ia', date: '2026-10-20', title: 'Personnaliser son IA', duration: '1 h 30', publicPrice: '79 €', memberPrice: '69 €', hook: 'Configurez votre IA pour qu’elle comprenne votre activité, votre contexte, votre ton et votre façon de travailler.', environments: ['ChatGPT — 9h à 10h30', 'Claude — 11h à 12h30'], format: 'Visio', learn: ['Configurer votre activité, votre contexte, votre rôle et vos interlocuteurs.', 'Définir votre ton, vos préférences, vos règles récurrentes et vos interdits.', 'Tester la personnalisation sur de vraies demandes et l’ajuster.'], takeaway: 'Un profil de référence corrigé par vous, un environnement IA personnalisé et une méthode pour le tenir à jour.', audience: 'Professionnels qui veulent utiliser une IA conversationnelle dans leur activité.', prerequisites: 'Aucun prérequis.' },
      { id: 'services-documents-ia', date: '2026-10-27', title: 'Créer ses documents professionnels avec l’IA', duration: '1 h 30', publicPrice: '79 €', memberPrice: '69 €', hook: 'Passez de vos informations au document professionnel final sans perdre des heures sur la structure et la rédaction.', environments: ['ChatGPT — 9h à 10h30', 'Claude — 11h à 12h30'], format: 'Visio', learn: ['Cadrer le besoin et valider le plan avant de rédiger.', 'Produire section par section et vérifier les sources et les promesses.', 'Corriger localement, puis décliner le document dans d’autres formats.'], takeaway: 'Un plan de document validable et une méthode en six étapes pour rédiger, vérifier, corriger et décliner vos documents.', audience: 'Professionnels qui produisent des documents engageants ou récurrents.', prerequisites: 'Aucun prérequis.' },
      { id: 'services-notion-base', date: '2026-11-03', title: 'Découvrir Notion et créer sa première base', duration: '1 h 30', publicPrice: '79 €', memberPrice: '69 €', hook: 'Construire dès la première séance une base Notion utile à son activité.', learn: ['Comprendre pages, bases, propriétés et vues.', 'Définir ce que l’on souhaite suivre.', 'Créer les propriétés utiles et les premières vues.', 'Tester la base avec de vraies informations.'], takeaway: 'Une première base Notion fonctionnelle, adaptée à votre besoin.' },
      { id: 'services-mission-client', date: '2026-11-10', title: 'Gérer une mission client de A à Z avec l’IA', duration: '2 h 30', publicPrice: '119 €', memberPrice: '99 €', hook: 'Transformer une mission client réelle en méthode claire, suivie et réutilisable.', learn: ['Structurer la demande.', 'Identifier les informations et documents nécessaires.', 'Découper la mission en actions.', 'Suivre attentes, échéances et validations.', 'Préparer productions, demandes de pièces et relances.', 'Formaliser une méthode réutilisable.'], takeaway: 'Votre propre méthode de gestion de mission, une trame de suivi et vos consignes IA réutilisables.' },
      { id: 'services-notion-dashboard', date: '2026-11-17', title: 'Construire son tableau de bord avec Notion', duration: '2 h 30', publicPrice: '139 €', memberPrice: '119 €', hook: 'Regroupez au même endroit ce que vous devez réellement suivre pour piloter votre activité.', format: 'Visio', learn: ['Définir les informations et indicateurs à suivre.', 'Construire les vues adaptées à votre usage.', 'Mettre en place une structure qui pourra évoluer.'], takeaway: 'Un dashboard fonctionnel, des vues adaptées, des informations utiles et une structure réutilisable et évolutive.', audience: 'Professionnels connaissant les bases de Notion et disposant d’un cas d’usage réel.', prerequisites: 'Être autonome avec une IA conversationnelle, connaître les bases de Notion, disposer d’un compte Notion et venir avec un cas d’usage réel.' },
      { id: 'services-donnees-ia', date: '2026-11-24', title: 'Exploiter ses données avec l’IA', duration: '1 h 30', publicPrice: '79 €', memberPrice: '69 €', hook: 'Faites parler vos données pour repérer ce qui compte vraiment et faciliter vos décisions.', environments: ['ChatGPT — 9h à 10h30', 'Claude — 11h à 12h30'], format: 'Visio', learn: ['Distinguer la donnée, le calcul et le constat.', 'Repérer l’interprétation, l’hypothèse et la recommandation.', 'Relire les conclusions avant d’en faire une décision.'], takeaway: 'Une grille de lecture distinguant données, calculs, constats, hypothèses et recommandations, à appliquer à vos analyses.', audience: 'Professionnels qui analysent des données pour suivre leur activité ou prendre des décisions.', prerequisites: 'Aucun prérequis.' },
      { id: 'services-google-dashboard', date: '2026-12-01', title: 'Construire son tableau de bord avec Google Workspace', duration: '2 h 30', publicPrice: '139 €', memberPrice: '119 €', hook: 'Construire dans votre environnement Google l’outil de suivi dont vous avez réellement besoin.', learn: ['Définir les informations à piloter.', 'Structurer données, statuts et échéances.', 'Créer les indicateurs utiles.', 'Mobiliser selon le besoin Sheets, Forms, Drive, Agenda ou Tasks.', 'Tester sur de vraies données.'], takeaway: 'Votre tableau de bord Google Workspace fonctionnel, avec ses premières vues et indicateurs.' },
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
      var nextSession = item.date ? '<div><dt>Prochaine session</dt><dd>' + formatDate(item.date) + '</dd></div>' : '';
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
      courseConfiguration[item.id] = { status: 'open', sessions: item.date ? [{ date: item.date }] : [], duration: item.duration };
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
      { id: 'ia-methodes', title: 'IA & Méthodes', meta: '<span>7 h</span><span>2 × 3 h 30</span><span>Visio</span><span>4 à 8 participants</span>', organization: '7 h organisées en 2 × 3 h 30.', duration: '7 h', sessions: [{ date: '2026-12-08', label: 'Séance 1', duration: '3 h 30' }, { date: '2026-12-15', label: 'Séance 2', duration: '3 h 30' }], intersession: 'Travail intersession sur une situation professionnelle réelle entre les deux séances.' },
      { id: 'communication-ia', title: 'Communication & IA', meta: '<span>7 h</span><span>2 × 3 h 30</span><span>Visio</span><span>4 à 8 participants</span>', organization: '7 h organisées en 2 × 3 h 30.' },
      { id: 'pilotage-ia', title: 'Pilotage & IA', meta: '<span>7 h</span><span>2 × 3 h 30</span><span>Visio</span><span>4 à 8 participants</span>', organization: '7 h organisées en 2 × 3 h 30.' }
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

  function configureCards() {
    root.querySelectorAll('.catalog-card[data-course]').forEach(function (card) {
      var config = courseConfiguration[card.dataset.course] || {};
      var status = validStatuses.indexOf(config.status) > -1 ? config.status : 'open';
      card.dataset.catalogStatus = status;
      card.hidden = status === 'hidden';
      var sessions = config.sessions || [];
      var statusLabel = document.createElement('span');
      statusLabel.className = 'catalog-course-status catalog-course-status--' + status;
      statusLabel.textContent = sessions.length > 1 ? 'Sessions : ' + sessions.map(function (session) { return formatShortDate(session.date); }).join(' et ') : sessions.length ? 'Prochaine session : ' + formatShortDate(sessions[0].date) : status === 'upcoming' ? 'À venir' : '';
      if (statusLabel.textContent) card.querySelector('h4').insertAdjacentElement('afterend', statusLabel);
      if (config.intersession) {
        var session = document.createElement('p');
        session.className = 'catalog-next-session';
        session.textContent = config.intersession;
        card.querySelector('.catalog-meta').insertAdjacentElement('afterend', session);
        var detailTemplate = root.querySelector('#catalog-template-' + card.dataset.course);
        var detailContent = detailTemplate && detailTemplate.content.querySelector('.catalog-detail');
        if (detailContent) detailContent.insertAdjacentHTML('beforeend', '<p><strong>' + config.intersession + '</strong></p>');
      }
    });
  }

  function createTopic(topic, cards) {
    var section = document.createElement('details');
    section.className = 'catalog-topic';
    var summary = document.createElement('summary');
    summary.className = 'catalog-topic-heading';
    var title = document.createElement('h3');
    title.textContent = topic.title;
    var hook = document.createElement('p');
    hook.textContent = topic.hook;
    var stats = document.createElement('small');
    stats.dataset.catalogTopicStats = '';
    summary.append(title, hook, stats);
    var grid = document.createElement('div');
    grid.className = 'catalog-grid catalog-topic-grid';
    cards.forEach(function (card) { grid.appendChild(card); });
    section.append(summary, grid);
    return section;
  }

  function buildTopics() {
    var iaGrid = root.querySelector('[data-catalog-universe="ia"] .catalog-grid');
    if (!iaGrid) return;
    var cardsById = new Map(Array.from(iaGrid.querySelectorAll('.catalog-card')).map(function (card) { return [card.dataset.course, card]; }));
    var topicList = document.createElement('div');
    topicList.className = 'catalog-topic-list';
    iaTopics.forEach(function (topic) {
      var cards = topic.courses.map(function (id) { return cardsById.get(id); }).filter(Boolean);
      cards.sort(function (a, b) {
        var aConfig = courseConfiguration[a.dataset.course] || {};
        var bConfig = courseConfiguration[b.dataset.course] || {};
        var aDate = aConfig.sessions && aConfig.sessions[0] ? aConfig.sessions[0].date : '';
        var bDate = bConfig.sessions && bConfig.sessions[0] ? bConfig.sessions[0].date : '';
        if (aDate && bDate) return aDate.localeCompare(bDate);
        if (aDate) return -1;
        if (bDate) return 1;
        return (aConfig.status === 'open' ? -1 : 1) - (bConfig.status === 'open' ? -1 : 1);
      });
      topicList.appendChild(createTopic(topic, cards));
    });
    var funding = cardsById.get('rentabilite-tpe-ia');
    iaGrid.remove();
    if (funding) {
      var fundingBlock = document.createElement('aside');
      fundingBlock.className = 'catalog-specific-feature';
      fundingBlock.innerHTML = '<p class="catalog-funding-kicker">Formation spécifique</p>';
      fundingBlock.appendChild(funding);
      root.querySelector('[data-catalog-universe="ia"]').appendChild(fundingBlock);
    }
    root.querySelector('[data-catalog-universe="ia"]').appendChild(topicList);
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
    root.querySelectorAll('.catalog-card[data-course]').forEach(function (card) {
      var config = courseConfiguration[card.dataset.course] || {};
      (config.sessions || []).forEach(function (session) {
        sessions.push({ date: session.date, label: session.label || '', title: card.querySelector('h4').textContent, domain: card.closest('[data-catalog-universe]').dataset.catalogUniverse });
      });
    });
    sessions.sort(function (a, b) { return a.date.localeCompare(b.date); });
    return sessions;
  }

  function buildSessionsCalendar() {
    var sessions = getScheduledSessions();
    if (!sessions.length) return;
    var section = document.createElement('section');
    section.className = 'catalog-sessions-calendar';
    section.innerHTML = '<div class="catalog-calendar-heading"><p class="catalog-upcoming-kicker">Prochaines sessions</p><h2>Les dates à retenir</h2><p>Les sessions publiées, tous intervenants confondus.</p></div><div class="catalog-calendar-months" role="tablist" aria-label="Mois de formation"></div><div class="catalog-calendar-panel"></div>';
    var groups = new Map();
    sessions.forEach(function (session) {
      var key = session.date.slice(0, 7);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(session);
    });
    var monthKeys = Array.from(groups.keys());
    var monthButtons = section.querySelector('.catalog-calendar-months');
    var panel = section.querySelector('.catalog-calendar-panel');
    function monthLabel(key) {
      return new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(key + '-01T12:00:00'));
    }
    function showMonth(key) {
      panel.replaceChildren();
      monthButtons.querySelectorAll('button').forEach(function (button) { button.setAttribute('aria-selected', String(button.dataset.catalogMonth === key)); });
      groups.get(key).forEach(function (session) {
        var button = document.createElement('button');
        button.type = 'button'; button.className = 'catalog-calendar-session'; button.dataset.catalogOpenDomain = session.domain;
        button.innerHTML = '<strong>' + formatShortDate(session.date) + '</strong><span>' + session.title + (session.label ? ' — ' + session.label : '') + '</span>';
        button.addEventListener('click', function () {
          var filter = root.querySelector('[data-catalog-filter="' + session.domain + '"]');
          if (filter) filter.click();
        });
        panel.appendChild(button);
      });
    }
    monthKeys.forEach(function (key, index) {
      var button = document.createElement('button');
      button.type = 'button'; button.dataset.catalogMonth = key; button.setAttribute('role', 'tab'); button.setAttribute('aria-selected', String(index === 0));
      button.textContent = monthLabel(key);
      button.addEventListener('click', function () { showMonth(key); });
      monthButtons.appendChild(button);
    });
    showMonth(monthKeys[0]);
    root.querySelector('#catalogue-formations .catalog-domain-content-zone').insertAdjacentElement('afterend', section);
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
  preparePreciseIaCourses();
  rebuildIaProgramming();
  configureCards();
  buildDomains();
  buildSessionsCalendar();
  updateCatalogue('all', 'Toutes les formations', false);

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

  root.querySelectorAll('[data-catalog-open]').forEach(function (button) {
    button.addEventListener('click', function () {
      var template = root.querySelector('#catalog-template-' + button.dataset.catalogOpen);
      if (!template) return;
      content.replaceChildren(template.content.cloneNode(true));
      content.querySelector('h2').id = 'catalog-detail-title';
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      dialog.scrollTop = 0;
    });
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
  root.querySelector('[data-catalog-contact]').addEventListener('click', function () {
    dialog.close();
    document.body.style.overflow = previousOverflow;
    go('contact');
  });
})();
