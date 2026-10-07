/* Interactions des pages publiques hors catalogue et carte. */
(() => {
  const memberGrid = document.getElementById('collective-members');
  if (memberGrid) {
    (window.collectifMembers || []).forEach(member => {
      const card = document.createElement('article');
      card.className = 'collective-card';
      const portrait = document.createElement('img');
      portrait.src = member.photo;
      portrait.alt = 'Portrait de ' + member.name;
      portrait.loading = 'lazy';
      portrait.width = 480;
      portrait.height = 480;
      const body = document.createElement('div');
      body.className = 'collective-card-body';
      const name = document.createElement('h3');
      name.textContent = member.name;
      const specialty = document.createElement('p');
      specialty.textContent = member.specialty;
      body.append(name, specialty);
      if (member.territory) {
        const territory = document.createElement('p');
        territory.className = 'collective-territory';
        territory.textContent = member.territory;
        body.appendChild(territory);
      }
      card.append(portrait, body);
      memberGrid.appendChild(card);
    });
  }

  document.querySelectorAll('[data-local-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const status = form.querySelector('.public-form-status');
      status.textContent = 'L’envoi n’est pas encore disponible dans cette version de présentation. Vos données n’ont pas été transmises.';
      status.hidden = false;
    });
  });
})();
