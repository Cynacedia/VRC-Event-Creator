# Guide de configuration de l'intégration calendrier

Ce guide vous accompagne dans la configuration de la génération de fichiers calendrier (.ics), de la publication par webhook Discord et des événements programmés Discord dans VRC Event Creator. Ces trois fonctionnalités sont entièrement indépendantes — activez n'importe quelle combinaison adaptée à votre flux de travail.

---

## Présentation

VRC Event Creator propose trois actions post-création lorsque vous créez ou automatisez un événement VRChat. Chacune est activable indépendamment par modèle et par événement :

- **« Créer une invitation calendrier .ics »** — Génère un fichier calendrier `.ics` standard avec des rappels optionnels, sauvegardé automatiquement dans un répertoire local
- **« Publier le Webhook Discord »** — Publie une annonce dans un canal Discord via webhook (avec fichier `.ics` en pièce jointe si le calendrier est également activé)
- **« Créer un événement Discord »** — Crée un événement programmé sur votre serveur Discord via bot

Lorsque plusieurs fonctionnalités sont activées, elles se combinent naturellement :

| Événement Discord | Webhook | Calendrier (.ics) | Ce qui se passe |
|---|---|---|---|
| OUI | NON | NON | Seul l'événement Discord est créé |
| NON | OUI | NON | Le webhook publie un embed avec les détails de l'événement |
| NON | NON | OUI | Le fichier `.ics` est sauvegardé dans le répertoire local |
| OUI | OUI | NON | Événement Discord créé + le webhook publie le lien de l'événement |
| OUI | NON | OUI | Événement Discord créé + `.ics` sauvegardé |
| NON | OUI | OUI | Le webhook publie un embed + `.ics` en pièce jointe, également sauvegardé |
| OUI | OUI | OUI | Événement Discord + webhook avec lien de l'événement + `.ics` en pièce jointe + sauvegardé |

---

## Étape 1 : Activer la génération de fichiers calendrier

1. Ouvrez **Paramètres** > **Paramètres avancés**
2. Cochez **« Activer la génération de fichiers calendrier »**

Cela rend le bouton **« Créer une invitation calendrier .ics »** disponible dans les modèles et lors de la création d'événements.

### Répertoire de sauvegarde

Lorsque la génération de fichiers calendrier est activée, les fichiers `.ics` sont toujours sauvegardés dans un répertoire local. L'emplacement par défaut est `Documents/VRC Event Creator .ics/` et est créé lors du premier enregistrement.

Les fichiers sont enregistrés sous `{répertoire}/{Nom du groupe}/{Nom de l'événement - Date}.ics`. Pour modifier l'emplacement, utilisez le bouton **Changer** à côté de **Répertoire de sauvegarde du calendrier** dans **Paramètres** > **Informations sur l'application**.

---

## Étape 2 : Configurer le webhook Discord (optionnel)

Un webhook publie des annonces dans un canal Discord spécifique. Il est indépendant des fichiers calendrier et des événements Discord — vous pouvez l'utiliser avec ou sans l'un ou l'autre.

1. Dans Discord, faites un clic droit sur le canal où vous souhaitez que les annonces soient publiées
2. Cliquez sur **Modifier le canal** > **Intégrations** > **Webhooks** > **Nouveau webhook**
3. Copiez l'URL du webhook
4. Dans VRC Event Creator, allez dans **Paramètres** > **Intégration Discord** > sélectionnez votre groupe
5. Cochez **« Activer le Webhook »** et collez l'URL du webhook
6. Cliquez sur **Tester le Webhook** pour vérifier, puis sur **Enregistrer**

Lorsque le webhook et le calendrier sont tous deux activés pour un événement, le fichier `.ics` est joint à la publication du webhook. Lorsque seul le webhook est activé (sans calendrier), le webhook publie un embed avec les détails de l'événement sans pièce jointe `.ics`.

Si un événement Discord programmé a également été créé, le message du webhook inclut le lien de l'événement Discord au lieu d'un embed.

---

## Étape 3 : Configurer les modèles

1. Allez dans **Gérer les modèles** et modifiez (ou créez) un modèle
2. Dans l'onglet **Bases**, vous verrez jusqu'à trois boutons de publication (selon la configuration) :
   - **« Créer une invitation calendrier .ics »** — visible lorsque la génération de fichiers calendrier est activée
   - **« Créer un événement Discord »** — visible lorsqu'un bot Discord est configuré pour le groupe
   - **« Publier le Webhook Discord »** — visible lorsqu'une URL de webhook est configurée pour le groupe
3. Activez ceux que vous souhaitez pour ce modèle
4. Si le calendrier est activé, l'onglet **Planning** affiche une carte **« Rappels calendrier .ics »**
5. Cochez **« Activer les rappels calendrier .ics »** et ajoutez vos intervalles de rappel préférés
6. Enregistrez le modèle

Les rappels utilisent des intervalles prédéfinis compatibles avec toutes les applications de calendrier principales : 5 min, 10 min, 15 min, 30 min, 1 heure, 2 heures, 4 heures, 8 heures, 12 heures, 1 jour, 2 jours, 1 semaine.

> **Remarque :** Certaines applications de calendrier (comme Outlook) n'utilisent que le premier rappel. Le rappel le plus long est placé en premier pour une meilleure compatibilité. Google Calendar ignore les rappels personnalisés lors de l'importation et utilise vos paramètres de notification par défaut.

---

## Étape 4 : Créer des événements

Lors de la création d'un événement (manuellement ou par automatisation) :

- L'étape **Date** affiche **« Créer une invitation calendrier .ics »** (hérité du modèle, modifiable)
- En dessous, **« Activer les rappels calendrier .ics »** vous permet de personnaliser les rappels par événement
- L'étape **Détails** affiche **« Créer un événement Discord »** et **« Publier le Webhook Discord »** comme boutons séparés
- Tous les paramètres du modèle peuvent être modifiés par événement

---

## FAQ

### Quelles applications de calendrier prennent en charge les fichiers .ics ?

Toutes les principales : Outlook, Apple Calendar, Google Calendar, Thunderbird et toute application compatible avec le standard iCalendar.

### Les rappels fonctionnent-ils dans toutes les applications de calendrier ?

Les rappels multiples fonctionnent dans Apple Calendar et Thunderbird. Outlook n'utilise que le premier rappel. Google Calendar ignore totalement les rappels lors de l'importation.

### Puis-je utiliser les webhooks sans fichiers calendrier ?

Oui. Le webhook publie un embed avec les détails de l'événement même lorsque la génération de fichiers calendrier est désactivée. Activez « Publier le Webhook Discord » dans votre modèle sans activer « Créer une invitation calendrier .ics ».

### Puis-je utiliser les webhooks sans la création d'événements Discord ?

Oui. Le webhook, les événements Discord et les fichiers calendrier sont entièrement indépendants. Toute combinaison fonctionne.

### L'URL du webhook est-elle confidentielle ?

Oui — toute personne possédant l'URL du webhook peut envoyer des messages dans ce canal. Traitez-la comme un mot de passe. Elle est chiffrée et stockée localement à l'aide du stockage sécurisé de votre système d'exploitation.

---

## Dépannage

| Problème | Solution |
|---|---|
| Aucun fichier .ics généré | Vérifiez que « Activer la génération de fichiers calendrier » est activé dans les Paramètres avancés, et que « Créer une invitation calendrier .ics » est coché dans le modèle ou l'événement |
| Le webhook ne publie pas | Vérifiez l'URL du webhook avec « Tester le Webhook » dans les paramètres Discord. Vérifiez que « Activer le Webhook » est activé pour le groupe et que « Publier le Webhook Discord » est coché dans le modèle |
| Le webhook publie mais sans .ics joint | « Créer une invitation calendrier .ics » doit également être activé pour l'événement. Sans cela, le webhook publie uniquement un embed ou un lien d'événement |
| Les rappels ne fonctionnent pas dans Outlook | Outlook ne prend en charge que le premier rappel. L'application place le plus long en premier pour la compatibilité |
| Les rappels ne fonctionnent pas dans Google Calendar | Google Calendar ignore les rappels personnalisés lors de l'importation .ics. Configurez les rappels manuellement après l'importation |
| Les fichiers sont enregistrés au mauvais endroit | Les fichiers sont enregistrés sous `{répertoire}/{Nom du groupe}/`. Le répertoire par défaut est `Documents/VRC Event Creator .ics/`. Modifiable via Paramètres > Informations sur l'application |
