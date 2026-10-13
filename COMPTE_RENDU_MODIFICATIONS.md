# Modifications du site du 13 octobre 2026

Les modifications ont été appliquées au site existant à partir du document PAGES_SITE_MODIF.docx et de ses 17 captures. Aucun déploiement n’a été effectué. Le raccordement du formulaire Contact reste à terminer : aucun service d’envoi ni endpoint n’est disponible dans les fichiers ou n’a été précisé pendant cette intervention.

## Fichiers du site

- `index.html` : modifications ciblées du contenu et des sections publiques.
- `assets/site-word-modifications.css` : styles complémentaires des changements demandés, chargés après les styles existants.
- `assets/site-public-global.js` : présentation des co-fondatrices, alignement des profils et corrections inclusives des textes affichés du catalogue.
- `netlify/index.html`, `netlify/assets/site-word-modifications.css` et `netlify/assets/site-public-global.js` : copie locale synchronisée, sans publication.

Le dossier `validation/word-2026-10-13/` contient l’extraction du document de référence, une sauvegarde avant modification, le script de contrôle, les résultats JSON et les captures de vérification.

## Modifications page par page

### Accueil

- Logo agrandi avec le fichier existant, menu sans articles et nouvel onglet Réseau.
- Grande photo existante dans son cadre arrondi et ses marges conservées. Encart clair conservé et descendu sous la photo ; phrase du réseau et slogan ajoutés entre la photo et l’encart.
- Section « Répondre à votre besoin » : étiquette, titre et deux paragraphes remplacés conformément au Word, avec correction inclusive du mot dirigeant. Phrase sous le trait conservée.
- « Notre méthode » : étiquette corrigée, hauteur commune des titres sur ordinateur et paragraphes alignés, espace insécable avant les deux-points.
- Bloc final « Parlons de votre situation » supprimé avec son décor attaché.

### Accompagnement

- Bandeau et section « De la demande à la mission » conservés ; signature commune sous le bandeau.
- Section « Si votre besoin est défini » ajoutée avant l’audit : deux colonnes, cinq points, encadré centré, huit étiquettes en quatre colonnes sur ordinateur, mention « Liste non exhaustive » et bouton Contact.
- Audit : titre de droite corrigé, liste et textes conservés, encadré du rapport déplacé sous les deux colonnes.
- Formulaire provisoire supprimé et remplacé par les deux cartes Contact et WhatsApp. Lien WhatsApp vers `https://wa.me/33660063408`.

### Collectif

- Texte de « L’idée du collectif » remplacé et justifié.
- Julie puis Audrey dans un groupe de cartes en tête, mention « Co-fondatrice » ; les autres profils apparaissent dessous. Julie : fonction sur deux lignes et localisation Margaux-Cantenac · Gironde.
- Format, portraits et données publiques des autres membres conservés. Ligne de localisation placée en bas des cartes pour l’aligner dans chaque rangée.
- Titre de couverture corrigé (« et en Martinique »). Liste textuelle redondante supprimée. La carte conserve son comportement et ses zones existantes en attendant les villes précises à fournir.
- Phrase provisoire de candidature supprimée ; bouton « En savoir plus » vers Réseau.

### Réseau

- Ancienne page « Rejoindre » adaptée dans le même site, accessible par l’onglet Réseau et par Collectif.
- Encart centré sur la photo existante en attendant le nouveau visuel, textes inclusifs demandés et signature commune.
- Six cartes d’avantages, dont les informations In10-App et l’accompagnement en prospection avec la réserve commerciale demandée. Aucun développement de fonctionnalité In10-App.
- Encart existant « Ce que le réseau apporte » et ses quatre points conservés ; titre corrigé en « seul(e) ».
- Rendez-vous mensuel, quatre étapes de candidature, tarifs indiqués dans le Word, deux profils d’adhésion et bandeau final ajoutés.
- Trois liens de candidature vers `https://in10-app.netlify.app/`, selon l’adresse confirmée par l’utilisateur. Le parcours n’a pas été modifié.
- Encarts « Trouver des missions… » et « Vous vous reconnaissez ? » supprimés.

### Formations

- Catalogue, calendriers, prix, identifiants et données partenaires conservés.
- Signature commune ajoutée ; corrections inclusives appliquées aux textes affichés, y compris aux fiches générées par le catalogue, sans modification des fichiers de données.
- Aucune inscription, réservation, paiement ou automatisation Google Sheet ajoutée : le Word présente ces points comme des questions et pistes à discuter.

### Contact

- Introduction complétée par « une proposition de service ».
- Texte provisoire de gauche remplacé par « Vous êtes… » et les trois profils numérotés.
- Formulaire conservé ; « Secteur d’activité » remplacé par « Fonction », mention de présentation supprimée.
- Validation des champs conservée. Aucun faux succès : sans service d’envoi, un message saisi n’est pas transmis et la personne est orientée vers l’adresse mail ou le téléphone.
- **Raccordement à réaliser avant mise en ligne** : service d’envoi et configuration vers `contact@in10pensables.fr` attendus. Aucun envoi de mail réel testé.

### Éléments communs

- Menu Accueil · Accompagnement · Collectif · Réseau · Formations · Contact.
- Phrase du réseau et slogan sur les six pages ; slogan en pied de page.
- Colonne « Nous contacter » avec téléphone et email cliquables, mention © 2026.
- Justification des textes demandés et désactivation de la césure automatique ; styles, marges et composants existants conservés hors changements explicitement demandés.

## Éléments volontairement laissés en attente

- Logo haute définition : fichier à fournir ; le logo existant a seulement été agrandi.
- Nouvelles photos Collectif et Réseau : à fournir. Aucune image inventée ni harmonisation des portraits.
- Descriptions de deux à trois lignes au survol et informations manquantes des freelances : contenus à fournir par J.A.
- Villes précises par département et leur mise à jour : liste à fournir ; aucune conversion approximative des zones d’intervention en villes de résidence.
- Gestion des profils et case de visibilité : future gestion éditoriale, non développée.
- Harmonisation des fonds des photos : décision à prendre.
- Pages Mentions légales, Politique de confidentialité et CGV, ainsi que leurs liens : textes à fournir ; aucune page vide ni texte légal inventé.
- Inscription, paiement et suivi des formations, tarifs adhérents, outils et Google Sheet : questions au prestataire, décisions à prendre ; facturation partenaire à vérifier avec l’expert-comptable.
- Confirmation automatique par email et sa signature : question au prestataire, non développée.
- Service d’envoi du formulaire : information technique requise, demandée à l’utilisateur mais non disponible à ce stade.

## Contrôles effectués

- Chrome local : six pages aux largeurs 1440, 768, 390 et 320 px (24 vues). Aucun débordement horizontal du document, aucune erreur JavaScript, aucun visuel chargé en erreur dans les contrôles réalisés.
- Captures complètes après défilement et inspection visuelle sur ordinateur et mobile ; la photo arrondie et l’encart clair de l’Accueil sont conservés.
- Une signature et un titre principal par page.
- Alignement mesuré des paragraphes des trois étapes de l’Accueil : même position verticale.
- Navigation Accompagnement vers Contact, ouverture/fermeture du menu mobile et accès à Réseau.
- Vérification des trois URL de candidature, du lien WhatsApp et des liens mail/téléphone, sans démarrer une candidature ni envoyer de message.
- Formulaire Contact : labels et rejet d’un formulaire vide vérifiés. Envoi réel non vérifiable faute de service.
- Carte : sélection de Gironde et affichage de sa fiche existante vérifiés.
- Catalogue : filtre Gestion administrative fonctionnel ; fichiers catalogue et données partenaires comparés à Git et inchangés.
- Scripts inline existants comparés avant/après et inchangés. Aucun backend ni fichier de l’In10-App modifié.
- Copie locale `netlify/` comparée aux trois fichiers du site modifiés : identique.
- `git diff --check` réussi.
