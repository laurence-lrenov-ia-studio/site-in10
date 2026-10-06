/* Interactions des pages publiques hors catalogue et carte. */
(() => {
  const members = {
    founders: {
      status: 'Fondatrices · données existantes',
      name: 'Julie & Audrey',
      skills: 'Office management (Julie) ; assistance administrative indépendante (Audrey).',
      zone: 'Localisation et zone d’intervention à confirmer avant publication.',
      description: 'À l’origine des In10pensables, elles ont créé le collectif pour relier les besoins des entreprises aux bonnes compétences.'
    },
    'demo-a': {
      status: 'DÉMONSTRATION · profil fictif, non membre du collectif',
      name: 'Profil de démonstration A',
      skills: 'À renseigner après validation d’un profil réel.',
      zone: 'À renseigner après validation d’un profil réel.',
      description: 'Cette fiche montre la présentation prévue pour les membres du collectif. Aucune identité, compétence ou localisation réelle n’est représentée.'
    },
    'demo-b': {
      status: 'DÉMONSTRATION · profil fictif, non membre du collectif',
      name: 'Profil de démonstration B',
      skills: 'À renseigner après validation d’un profil réel.',
      zone: 'À renseigner après validation d’un profil réel.',
      description: 'Cette fiche montre la présentation prévue pour les membres du collectif. Aucune identité, compétence ou localisation réelle n’est représentée.'
    }
  };

  const dialog = document.getElementById('member-dialog');
  if (dialog) {
    document.querySelectorAll('[data-member]').forEach(button => {
      button.addEventListener('click', () => {
        const member = members[button.dataset.member];
        if (!member) return;
        document.getElementById('member-dialog-status').textContent = member.status;
        document.getElementById('member-dialog-title').textContent = member.name;
        document.getElementById('member-dialog-skills').textContent = member.skills;
        document.getElementById('member-dialog-zone').textContent = member.zone;
        document.getElementById('member-dialog-description').textContent = member.description;
        dialog.showModal();
      });
    });
    dialog.querySelector('.public-dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
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
