/* Interactions des pages publiques hors catalogue et carte. */
(() => {
  const memberGrid = document.getElementById('collective-members');
  function renderCollectifMembers(members) {
    if (!memberGrid) return;
    const founders = document.getElementById('collective-founders');
    memberGrid.replaceChildren();
    if (founders) founders.replaceChildren();
    members.forEach((member, index) => {
      const card = document.createElement('article');
      card.className = 'collective-card';
      if (member.profileId) card.dataset.profileId = member.profileId;
      const photo = document.createElement('button');
      photo.type = 'button';
      photo.className = 'collective-photo-preview';
      photo.setAttribute('aria-label', (member.staticProfile ? 'Aperçu de démonstration pour ' : member.description ? 'Présentation de ' : 'Portrait de ') + member.name);
      if (member.photo) {
        const portrait = document.createElement('img');
        portrait.alt = member.hubPhoto && member.photoAlt ? member.photoAlt : 'Portrait de ' + member.name;
        portrait.loading = 'lazy';
        portrait.width = 480;
        portrait.height = 480;
        portrait.addEventListener('error', () => {
          if (member.photoFallback && portrait.getAttribute('src') !== member.photoFallback) {
            portrait.alt = 'Portrait de ' + member.name;
            portrait.src = member.photoFallback;
          } else portrait.remove();
        });
        portrait.src = member.photo;
        photo.appendChild(portrait);
      }
      // CONTENU TEMPORAIRE / DÉMO À REMPLACER : aucune information métier vérifiée.
      const demo = document.createElement('span');
      demo.className = 'collective-photo-demo';
      const demoText = document.createElement('span');
      if (member.staticProfile) {
        demo.dataset.contentStatus = 'temporary-demo-replace';
        const demoLabel = document.createElement('strong');
        demoLabel.textContent = 'Démo · à remplacer';
        demoText.textContent = 'Présentation de démonstration. Description du profil à venir.';
        demo.append(demoLabel, demoText);
        photo.appendChild(demo);
      } else if (member.description) {
        demo.dataset.contentStatus = 'hub-public';
        demoText.textContent = member.description;
        demo.appendChild(demoText);
        photo.appendChild(demo);
      }
      const body = document.createElement('div');
      body.className = 'collective-card-body';
      const name = document.createElement('h3');
      name.textContent = member.name;
      const specialty = document.createElement('p');
      specialty.className = 'collective-specialty';
      if (member.staticProfile && member.founderIndex === 0) {
        specialty.append('Office Manager / RAF', document.createElement('br'), 'Conseillère en immobilier');
      } else specialty.textContent = member.specialty;
      body.append(name, specialty);
      if (member.founderIndex !== undefined) {
        const label = document.createElement('span');
        label.className = 'collective-founder-label';
        label.textContent = 'Co-fondatrice';
        name.after(label);
      }
      if (member.territory || (member.staticProfile && member.founderIndex === 0)) {
        const territory = document.createElement('p');
        territory.className = 'collective-territory';
        territory.textContent = member.staticProfile && member.founderIndex === 0 ? 'Margaux-Cantenac · Gironde' : member.territory;
        body.appendChild(territory);
      }
      card.append(photo, body);
      (member.founderIndex !== undefined ? founders || memberGrid : memberGrid).appendChild(card);
    });
  }
  window.renderCollectifMembers = renderCollectifMembers;
  renderCollectifMembers((window.collectifMembers || []).map((member, index) => ({ ...member, staticProfile: true, ...(index < 2 ? { founderIndex: index } : {}) })));

  // Corriger les textes affichés sans modifier les données du catalogue partenaires.
  const training = document.getElementById('p-training');
  const inclusiveTerms = [
    ['Professionnels', 'Professionnel(le)s'],
    ['Indépendants, dirigeants de TPE/PME, assistants administratifs', 'Indépendant(e)s, dirigeant(e)s de TPE/PME, assistant(e)s administratif(ve)s'],
    ['Tout salarié', 'Tout(e) salarié(e)'],
    ['des salariés capables', 'des salarié(e)s capables'],
    ['les salariés déjà formés', 'les salarié(e)s déjà formé(e)s'],
    ['Référents ou futurs référents', 'Référent(e)s ou futur(e)s référent(e)s'],
    ['dirigeants de TPE/PME', 'dirigeant(e)s de TPE/PME'],
    ['Indépendants,', 'Indépendant(e)s,'],
    ['Dirigeant,', 'Dirigeant(e),'],
    ['salarié chargé du DUERP', 'salarié(e) chargé(e) du DUERP'],
    ['Dirigeant de TPE/PME ou salarié chargé du DUERP', 'Dirigeant(e) de TPE/PME ou salarié(e) chargé(e) du DUERP']
  ];
  function correctTrainingText() {
    if (!training) return;
    const walker = document.createTreeWalker(training, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest('script,style')) continue;
      let corrected = node.nodeValue;
      inclusiveTerms.forEach(([from, to]) => { corrected = corrected.split(from).join(to); });
      if (node.nodeValue !== corrected) node.nodeValue = corrected;
    }
  }
  correctTrainingText();
  if (training) new MutationObserver(correctTrainingText).observe(training, { childList: true, subtree: true });

  document.querySelectorAll('[data-local-form]').forEach(form => {
    let sending = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (sending || !form.reportValidity()) return;
      const status = form.querySelector('.public-form-status');
      const button = form.querySelector('button[type="submit"]');
      const buttonLabel = button.textContent;
      sending = true;
      button.disabled = true;
      button.textContent = 'Envoi…';
      form.setAttribute('aria-busy', 'true');
      status.hidden = false;
      status.textContent = 'Envoi en cours…';
      try {
        const data = new FormData(form);
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(data).toString()
        });
        if (!response.ok) throw new Error('Échec de l’envoi du formulaire');
        form.reset();
        status.textContent = 'Votre message a bien été envoyé. Nous revenons vers vous rapidement.';
      } catch (error) {
        status.textContent = 'Votre message n’a pas été envoyé. Vous pouvez nous écrire à contact@in10pensables.fr ou nous appeler au 06 60 06 34 08.';
      } finally {
        sending = false;
        button.disabled = false;
        button.textContent = buttonLabel;
        form.removeAttribute('aria-busy');
      }
    });
  });
})();
