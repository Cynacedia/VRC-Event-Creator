# Guide de configuration de l'intégration calendrier

Ce guide vous accompagne dans la configuration de la génération de fichiers calendrier (.ics) et de l'envoi par webhook Discord pour VRC Event Creator. Une fois configurée, la création d'un événement VRChat peut automatiquement générer un fichier d'invitation calendrier et éventuellement le publier dans un canal Discord.

---

## Présentation

L'intégration calendrier crée des fichiers `.ics` standard qui peuvent être importés dans Outlook, Apple Calendar, Google Calendar et d'autres applications de calendrier. Ces fichiers contiennent les détails de l'événement et des rappels optionnels.

Il existe deux méthodes de livraison (mutuellement exclusives par événement) :

- **Webhook Discord** — Publie le fichier `.ics` dans un canal Discord avec un embed de l'événement ou un lien vers l'événement Discord
- **Sauvegarde automatique** — Enregistre le fichier `.ics` dans un répertoire local automatiquement

Si un webhook Discord est configuré et que l'événement est paramétré pour être publié sur Discord, le webhook est utilisé. Sinon, les fichiers sont enregistrés dans le répertoire local configuré.

---

## Étape 1 : Activer la génération de fichiers calendrier

1. Ouvrez **Paramètres** > **Général**
2. Cochez **« Activer la génération de fichiers calendrier »**

Cela rend les options de calendrier disponibles dans les modèles et lors de la création d'événements.

## Étape 2 : Configurer la méthode de livraison

### Option A : Webhook Discord (recommandé)

Un webhook publie le fichier calendrier dans un canal Discord spécifique. Aucun bot n'est nécessaire pour le webhook lui-même.

1. Dans Discord, faites un clic droit sur le canal où vous souhaitez que les fichiers calendrier soient publiés
2. Cliquez sur **Modifier le canal** > **Intégrations** > **Webhooks** > **Nouveau webhook**
3. Copiez l'URL du webhook
4. Dans VRC Event Creator, allez dans **Paramètres** > **Intégration Discord** > sélectionnez votre groupe
5. Cochez **« Publier .ics sur Discord »** et collez l'URL du webhook
6. Cliquez sur **« Tester le Webhook »** pour vérifier, puis sur **« Enregistrer »**

Si vous avez également configuré la création d'événements Discord (jeton de bot), le webhook publiera un lien vers l'événement Discord au lieu d'un embed autonome. Le fichier `.ics` est joint dans les deux cas.

### Option B : Sauvegarde automatique dans un répertoire local

1. Dans **Paramètres** > **Informations sur l'application**, cherchez **Répertoire de sauvegarde du calendrier**
2. Cliquez sur **« Créer par défaut »** (crée `Documents/VRC Event Creator .ics/`) ou **« Parcourir »** pour choisir un emplacement personnalisé
3. Les fichiers sont enregistrés automatiquement sous `{répertoire}/{Nom du groupe}/{Nom de l'événement - Date}.ics`

---

## Étape 3 : Configurer les modèles

1. Allez dans **Gérer les modèles** et modifiez (ou créez) un modèle
2. Dans l'onglet **Bases**, cochez **« Créer une invitation calendrier .ics »**
3. Dans l'onglet **Planning**, une nouvelle carte **« Rappels calendrier .ics »** apparaît
4. Cochez **« Activer les rappels calendrier .ics »** et ajoutez vos intervalles de rappel préférés
5. Enregistrez le modèle

Les rappels utilisent des intervalles prédéfinis compatibles avec toutes les applications de calendrier principales : 5 min, 10 min, 15 min, 30 min, 1 heure, 2 heures, 4 heures, 8 heures, 12 heures, 1 jour, 2 jours, 1 semaine.

> **Remarque :** Certaines applications de calendrier (comme Outlook) n'utilisent que le premier rappel. Le rappel le plus long est placé en premier pour une meilleure compatibilité. Google Calendar ignore les rappels personnalisés lors de l'importation et utilise vos paramètres de notification par défaut.

---

## Étape 4 : Créer des événements

Lors de la création d'un événement (manuellement ou par automatisation) :

- L'étape **Date** affiche un bouton **« Créer une invitation calendrier .ics »** (hérité du modèle sélectionné, ou configurable manuellement)
- En dessous, **« Activer les rappels calendrier .ics »** vous permet de personnaliser les rappels par événement
- L'étape **Détails** affiche **« Publier sur Discord »** qui contrôle à la fois l'événement Discord et l'envoi par webhook

Tous les paramètres du modèle peuvent être modifiés par événement.

---

## Fonctionnement global

| Événements Discord | Webhook | Calendrier | Ce qui se passe à la création de l'événement |
|---|---|---|---|
| Activé + configuré | Configuré | Activé | L'événement Discord est créé, le webhook publie le lien de l'événement + .ics |
| Désactivé ou non configuré | Configuré | Activé | Le webhook publie un embed avec les détails de l'événement + .ics |
| Indifférent | Non configuré | Activé + répertoire défini | Le fichier .ics est automatiquement enregistré dans le répertoire local |
| Indifférent | Non configuré | Activé + aucun répertoire | Pas de livraison .ics (sauvegarde manuelle uniquement) |

---

## FAQ

### Quelles applications de calendrier prennent en charge les fichiers .ics ?

Toutes les principales : Outlook, Apple Calendar, Google Calendar, Thunderbird et toute application compatible avec le standard iCalendar.

### Les rappels fonctionnent-ils dans toutes les applications de calendrier ?

Les rappels multiples fonctionnent dans Apple Calendar et Thunderbird. Outlook n'utilise que le premier rappel. Google Calendar ignore totalement les rappels lors de l'importation.

### Puis-je utiliser les webhooks sans la création d'événements Discord ?

Oui. Le webhook et le jeton de bot sont des fonctionnalités indépendantes. Vous pouvez utiliser les webhooks pour la livraison de calendriers sans configurer de bot Discord.

### L'URL du webhook est-elle confidentielle ?

Oui — toute personne possédant l'URL du webhook peut envoyer des messages dans ce canal. Traitez-la comme un mot de passe. Elle est chiffrée et stockée localement à l'aide du stockage sécurisé de votre système d'exploitation.

---

## Dépannage

| Problème | Solution |
|---|---|
| Aucun fichier .ics généré | Vérifiez que « Activer la génération de fichiers calendrier » est activé dans Paramètres > Général, et que « Créer une invitation calendrier .ics » est coché dans le modèle ou l'événement |
| Le webhook ne publie pas | Vérifiez l'URL du webhook avec « Tester le Webhook » dans les paramètres Discord. Vérifiez que « Publier .ics sur Discord » est activé pour le groupe |
| Les rappels ne fonctionnent pas dans Outlook | Outlook ne prend en charge que le premier rappel. L'application place le plus long en premier pour la compatibilité |
| Les rappels ne fonctionnent pas dans Google Calendar | Google Calendar ignore les rappels personnalisés lors de l'importation .ics. Configurez les rappels manuellement après l'importation |
| La sauvegarde automatique ne fonctionne pas | Vérifiez qu'un répertoire de sauvegarde est configuré dans Paramètres > Informations sur l'application |
| Les fichiers sont enregistrés au mauvais endroit | Les fichiers sont enregistrés sous `{répertoire}/{Nom du groupe}/`. Vérifiez le nom du groupe et le chemin du répertoire |
