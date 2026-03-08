# Guide de configuration de l'intégration Discord

Ce guide vous accompagne dans la configuration de l'intégration Discord pour VRC Event Creator. Une fois configurée, la création d'un événement VRChat générera automatiquement un **événement Discord** correspondant dans votre serveur.

---

## Présentation

L'intégration utilise un **bot Discord** que vous créez et contrôlez vous-même. Il n'a besoin que d'une seule permission : **Créer des événements**. Il ne lit pas les messages, ne rejoint pas les salons vocaux et ne fait rien d'autre. Votre jeton de bot est chiffré et stocké localement — il n'est envoyé nulle part, sauf à l'API Discord lors de la création d'événements.

Chaque groupe VRChat peut être lié à un serveur Discord. Vous pouvez réutiliser le même bot pour plusieurs groupes/serveurs, ou utiliser des bots distincts.

---

## Étape 1 : Créer une application Discord

1. Rendez-vous sur le [Discord Developer Portal](https://discord.com/developers/applications)
2. Cliquez sur **« New Application »** en haut à droite
3. Donnez-lui un nom et cliquez sur **Create**

## Étape 2 : Créer le bot

1. Cliquez sur **« Bot »** dans la barre latérale gauche
2. Cliquez sur **« Reset Token »** (ou **« Copy »** si le jeton est encore visible)
3. **Copiez le jeton immédiatement** — vous ne pourrez plus le voir ensuite
4. Laissez les Privileged Gateway Intents désactivés — le bot n'en a pas besoin

> **Gardez votre jeton de bot confidentiel.** Toute personne possédant le jeton peut agir en tant que votre bot. Si vous le partagez accidentellement, réinitialisez-le immédiatement dans le Developer Portal.

## Étape 3 : Inviter le bot sur votre serveur

1. Cliquez sur **« OAuth2 »** dans la barre latérale gauche
2. Faites défiler jusqu'à **« OAuth2 URL Generator »**
3. Sous **Scopes**, cochez **`bot`**
4. Sous **Bot Permissions**, cochez **`Create Events`**
5. Copiez l'URL générée en bas, ouvrez-la dans votre navigateur, sélectionnez votre serveur et autorisez

Le bot apparaîtra dans votre liste de membres mais restera hors ligne — il n'a pas besoin d'être « en cours d'exécution ». L'application communique directement avec l'API Discord via le jeton.

## Étape 4 : Obtenir l'identifiant de votre serveur

1. Dans Discord, allez dans **Paramètres utilisateur** > **Avancés** et activez le **Mode développeur**
2. Faites un clic droit sur le nom de votre serveur et cliquez sur **« Copier l'identifiant du serveur »**

## Étape 5 : Configurer dans VRC Event Creator

1. Ouvrez **Paramètres** > **Options avancées** > cochez **« Activer l'intégration Discord »**
2. Sélectionnez le groupe VRChat que vous souhaitez lier, entrez votre jeton de bot et l'identifiant du serveur, puis enregistrez
3. Utilisez **« Vérifier le jeton du bot »** pour confirmer que le jeton fonctionne

Chaque modèle d'événement dispose d'un bouton **« Synchroniser avec Discord »** dans l'onglet Basics. Il est activé par défaut lorsque l'intégration Discord est active. Vous pouvez ensuite le désactiver pour les événements que vous ne souhaitez pas publier sur Discord.

**La synchronisation Discord ne bloque jamais la création d'événements VRChat.** Si quelque chose ne fonctionne pas côté Discord, votre événement VRChat est tout de même créé normalement.

---

## FAQ

### Puis-je utiliser un bot que j'ai déjà ?

Oui, tant qu'il dispose de la permission **Créer des événements** sur le serveur cible.

### Et si plusieurs membres de l'équipe créent des événements ?

Chaque personne qui crée des événements a besoin du jeton de bot sur sa machine. Options :
- **Partager le jeton** avec les membres de confiance
- **Désigner une personne pour gérer la synchronisation Discord** tandis que les autres désactivent « Synchroniser avec Discord »
- **Créer des bots distincts** par membre de l'équipe

### Mon jeton de bot est-il en sécurité ?

Votre jeton de bot est chiffré à l'aide du stockage sécurisé de votre système d'exploitation (Windows DPAPI / macOS Keychain / Linux Secret Service) et stocké localement. Il n'est envoyé nulle part, sauf à l'API Discord.

### Puis-je supprimer des événements Discord depuis l'application ?

Non, l'application ne fait que les créer. Gérez les événements Discord directement dans Discord.

---

## Dépannage

| Problème | Solution |
|---|---|
| « Jeton de bot invalide » | Réinitialisez le jeton dans le Developer Portal et collez le nouveau |
| « Le bot n'a pas la permission de créer des événements » | Réinvitez le bot avec la permission Créer des événements, ou ajoutez-la via Paramètres du serveur > Rôles |
| « Serveur Discord introuvable » | Vérifiez l'identifiant du serveur (clic droit sur le serveur > Copier l'identifiant du serveur) |
| « Limite de requêtes Discord atteinte » | Attendez une minute et réessayez |
| Événements créés dans VRChat mais pas dans Discord | Vérifiez que « Synchroniser avec Discord » est activé et que le groupe dispose d'un jeton de bot + identifiant de serveur valides |
