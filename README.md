# Site public Les In10pensables

Site statique : `index.html` et `assets/` contiennent les sources de publication. Aucun build ni installation de dépendances n’est nécessaire.

`apps-script-site-public.gs` contient le source de l’API publique Google Apps Script. Son déploiement est indépendant de Netlify ; ce fichier ne doit pas être inclus dans le paquet du site statique.

## Déploiement Netlify

1. Créer un dossier autonome `deploy-<date>-<objet>` dans `C:/PROJETS_GITHUB/site-in10`.
2. Y copier le fichier source `index.html` et le dossier `assets/` avec toute leur arborescence.
3. Déployer ce dossier sur le projet Netlify existant. Conserver les attributs `data-netlify` et `netlify-honeypot` du formulaire dans le source : Netlify les traite lors de la publication. Ne pas remplacer le source par une copie téléchargée du site publié.
4. Vérifier la navigation, les images, le collectif, le catalogue et le formulaire après publication, puis supprimer le dossier autonome local après validation.

Les dossiers de déploiement, validations, captures, exports et sauvegardes locales sont ignorés par Git. Ils ne constituent pas les sources du site. Les réglages du projet Netlify et le déploiement Apps Script sont gérés séparément sur leurs services respectifs.
