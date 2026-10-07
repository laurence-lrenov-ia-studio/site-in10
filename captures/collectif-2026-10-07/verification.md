# Intégration du collectif — vérification locale

Commit de sécurité avant intervention : `65104f6`.

## Fichiers du site modifiés ou ajoutés

- `index.html`
- `assets/site-public-global.css`
- `assets/site-public-global.js`
- `assets/collectif-data.js`
- `assets/photos/collectif/alison-i.jpg`
- `assets/photos/collectif/amelie-d.png`
- `assets/photos/collectif/audrey-h.png`
- `assets/photos/collectif/camille-g.png`
- `assets/photos/collectif/christine-g.jpg`
- `assets/photos/collectif/clothilde-b.jpg`
- `assets/photos/collectif/corinne-c.jpg`
- `assets/photos/collectif/elodie-b.jpg`
- `assets/photos/collectif/florie-anne-p.jpg`
- `assets/photos/collectif/gwenaelle-d.jpg`
- `assets/photos/collectif/jenny-m.jpg`
- `assets/photos/collectif/jonathan-l.jpg`
- `assets/photos/collectif/julie-c.jpg`
- `assets/photos/collectif/laetitia-t.jpg`
- `assets/photos/collectif/laura-j.jpg`
- `assets/photos/collectif/lou-g.png`
- `assets/photos/collectif/lucia-d.png`
- `assets/photos/collectif/magali-p.jpg`
- `assets/photos/collectif/marion-c.png`
- `assets/photos/collectif/nathalie-b.jpg`
- `assets/photos/collectif/ophelie-p.png`
- `assets/photos/collectif/severine-s.png`
- `assets/photos/collectif/victoria-f.jpg`

## Contrôles

- 23 profils et 23 portraits chargés ; Julie C. puis Audrey H. ; Andreia exclue.
- Noms affichés et noms des fichiers publics limités au prénom et à l’initiale.
- Texte validé conservé en cinq paragraphes ; données séparées du rendu.
- Portraits copiés sans retouche ; images des PDF extraites avec leur transparence.
- Navigation des pages Accueil, Accompagnement, Collectif, Formations et Contact vérifiée.
- Carte : sélection du département 33 et état aria-pressed vérifiés ; code original conservé.
- 29 formations, dont 21 IA ; fichiers du catalogue et dates inchangés.
- Formats 1440, 1280, 768 et 390 px : aucun débordement horizontal.
- Aucune exception JavaScript et aucune requête locale échouée pendant les contrôles.
- Ressources locales référencées par le HTML présentes ; chemins des portraits relatifs.
- Aucun ajout de connexion au Google Sheet, de backend ou de base de données.
- Syntaxe JavaScript et git diff --check vérifiés. Pas de validation W3C externe effectuée.

## Prévisualisation

Ouvrir le fichier index.html du dépôt dans un navigateur, puis cliquer sur « Le Collectif ».
Les captures texte-*.png et portraits-*.png couvrent les quatre tailles testées.
carte-mobile.png montre une carte au format 390 px.

Aucun push ni déploiement. Validation visuelle de Laurence attendue avant le commit final et le push.
