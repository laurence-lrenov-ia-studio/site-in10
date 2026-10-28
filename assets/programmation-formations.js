/* Programmation validée. Sources en lecture seule : dates-in10-texte.txt et
   dates-in10-bloc.html. Les dates ne sont définies qu'ici : cartes, fiches et
   calendrier utilisent les mêmes sessions. */
(function () {
  'use strict';
  var formats = {
    CTRL: { duration: '1 h 30', minutes: 90, format: 'Visio', price: '79 €', memberPrice: '69 €', participants: 'Minimum 6 inscrits' },
    CMD: { duration: '2 h 30', minutes: 150, format: 'Visio', price: '119 à 139 €', participants: 'Minimum 6 inscrits' },
    ENTER: { duration: '7 h', format: 'Visio', price: '399 € net', participants: '6 à 12 participants', hours: '9 h–12 h 30 / 13 h 30–17 h', funding: 'Finançable' },
    PASS: { duration: '3 journées', format: 'Présentiel en Gironde', price: '1 920 € net', participants: '4 à 7 personnes', hours: '9 h–12 h 30 / 13 h 30–17 h', funding: 'Finançable', meals: 'Repas sur place' }
  };
  var courses = {
    personnaliser: { id: 'services-personnaliser-ia', title: 'Personnaliser son IA', kind: 'CTRL' },
    documents: { id: 'services-documents-ia', title: 'Créer ses documents professionnels avec l’IA', kind: 'CTRL' },
    notion: { id: 'services-notion-base', title: 'Découvrir Notion et créer sa première base', kind: 'CTRL' },
    mission: { id: 'services-mission-client', title: 'Gérer une mission client de A à Z avec l’IA', kind: 'CMD', price: '119 €', memberPrice: '99 €' },
    notionDashboard: { id: 'services-notion-dashboard', title: 'Construire son tableau de bord avec Notion', kind: 'CMD', price: '139 €', memberPrice: '119 €' },
    donnees: { id: 'services-donnees-ia', title: 'Exploiter ses données avec l’IA', kind: 'CTRL' },
    googleDashboard: { id: 'services-google-dashboard', title: 'Construire son tableau de bord avec Google Workspace', kind: 'CMD', price: '139 €', memberPrice: '119 €' },
    notebook: { id: 'services-notebooklm', title: 'NotebookLM : documents et sources', kind: 'CTRL' },
    priorites: { id: 'services-priorites', title: 'Organiser ses priorités, échéances et relances', kind: 'CMD', price: '119 €', memberPrice: '99 €' },
    contenus: { id: 'contenus-ia', title: 'Créer ses contenus avec l’IA', kind: 'CTRL' },
    visuels: { id: 'visuels-ia', title: 'Créer ses visuels professionnels avec l’IA', kind: 'CTRL' },
    strategie: { id: 'strategie-communication-ia', title: 'Stratégie de communication', kind: 'CTRL' },
    quotidien: { id: 'alleger-quotidien-ia', title: 'Alléger son quotidien', kind: 'CTRL' },
    baseNotebook: { id: 'base-documentaire-notebooklm', title: 'Base documentaire NotebookLM', kind: 'CMD' },
    methodes: { id: 'ia-methodes', title: 'IA & Méthodes', kind: 'ENTER' },
    communication: { id: 'communication-ia', title: 'Communication & IA', kind: 'ENTER' },
    pilotage: { id: 'pilotage-ia', title: 'Pilotage & IA', kind: 'ENTER' },
    pass: { id: 'pass-ia-360', title: 'Pass IA 360°', kind: 'PASS' }
  };
  var days = [
    ['2026-11-03', ['notion', '09:30']],
    ['2026-11-05', ['visuels', '09:30']],
    ['2026-11-10', ['personnaliser', '09:00'], ['contenus', '11:00'], ['mission', '14:00']],
    ['2026-11-24', ['donnees', '09:00'], ['documents', '14:00'], ['notion', '16:00']],
    ['2026-12-01', ['personnaliser', '09:00'], ['documents', '11:00'], ['contenus', '14:00'], ['visuels', '16:00']],
    ['2026-12-03', ['methodes', '09:00']],
    ['2026-12-08', ['documents', '09:00'], ['donnees', '11:00'], ['priorites', '14:00']],
    ['2026-12-10', ['communication', '09:00']],
    ['2026-12-15', ['personnaliser', '09:00'], ['strategie', '11:00'], ['notion', '14:00'], ['quotidien', '16:00']],
    ['2027-01-05', ['documents', '09:00'], ['contenus', '11:00'], ['notionDashboard', '14:00']],
    ['2027-01-12', ['personnaliser', '09:00'], ['donnees', '11:00'], ['documents', '14:00'], ['notebook', '16:00']],
    ['2027-01-14', ['pilotage', '09:00']],
    ['2027-01-19', ['documents', '09:00'], ['visuels', '11:00'], ['baseNotebook', '14:00']],
    ['2027-01-21', ['methodes', '09:00']],
    ['2027-01-26', ['personnaliser', '09:00'], ['notion', '11:00'], ['contenus', '14:00'], ['strategie', '16:00']],
    ['2027-02-02', ['documents', '09:00'], ['quotidien', '11:00'], ['mission', '14:00']],
    ['2027-02-09', ['personnaliser', '09:00'], ['contenus', '11:00'], ['donnees', '14:00'], ['notion', '16:00']],
    ['2027-02-16', ['documents', '09:00'], ['strategie', '11:00'], ['googleDashboard', '14:00']],
    ['2027-02-18', ['communication', '09:00']],
    ['2027-02-23', ['personnaliser', '09:00'], ['donnees', '11:00'], ['visuels', '14:00'], ['notebook', '16:00']],
    ['2027-02-25', ['pilotage', '09:00']],
    ['2027-03-02', ['documents', '09:00'], ['notion', '11:00'], ['priorites', '14:00']],
    ['2027-03-09', ['personnaliser', '09:00'], ['contenus', '11:00'], ['documents', '14:00'], ['quotidien', '16:00']],
    ['2027-03-11', ['methodes', '09:00']],
    ['2027-03-16', ['documents', '09:00'], ['donnees', '11:00'], ['notionDashboard', '14:00']],
    ['2027-03-18', ['communication', '09:00']],
    ['2027-03-23', ['personnaliser', '09:00'], ['strategie', '11:00'], ['contenus', '14:00'], ['visuels', '16:00']],
    ['2027-03-30', ['documents', '09:00'], ['notion', '11:00'], ['baseNotebook', '14:00']]
  ];
  var passes = [
    { label: 'Session de décembre', dates: ['2026-11-30', '2026-12-02', '2026-12-07'] },
    { label: 'Session de janvier', dates: ['2027-01-11', '2027-01-13', '2027-01-18'] },
    { label: 'Session de février', dates: ['2027-02-01', '2027-02-03', '2027-02-08'] },
    { label: 'Session de mars', dates: ['2027-03-08', '2027-03-10', '2027-03-15'] }
  ];
  var sessions = [];
  days.forEach(function (day) {
    day.slice(1).forEach(function (slot) {
      var course = courses[slot[0]], format = formats[course.kind];
      var end = '17:00';
      if (format.minutes) {
        var parts = slot[1].split(':');
        var minutes = Number(parts[0]) * 60 + Number(parts[1]) + format.minutes;
        end = String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
      }
      sessions.push({ courseId: course.id, kind: course.kind, date: day[0], start: slot[1], end: end, time: format.hours || slot[1] + '–' + end });
    });
  });
  passes.forEach(function (pass) {
    sessions.push({ courseId: courses.pass.id, kind: 'PASS', date: pass.dates[0], dates: pass.dates, start: '09:00', end: '17:00', time: formats.PASS.hours, label: pass.label });
  });
  sessions.sort(function (a, b) { return (a.date + a.start).localeCompare(b.date + b.start); });
  window.IN10_TRAINING_PROGRAMMING = {
    registration: 'https://calendly.com/laurence-lrenov-ia/30min',
    aiHeading: '💻 Le mardi, c’est AI',
    aiSubtitle: 'Ateliers CTRL & CMD en visio, dans votre outil (ChatGPT, Claude ou Gemini).',
    enterHeading: '🧭 Le jeudi, c’est ENTER',
    enterSubtitle: '7 h · 9 h–12 h 30 / 13 h 30–17 h · 399 € net · 6 à 12 participants · Finançable',
    formats: formats, courses: courses, sessions: sessions
  };
})();
