# Cooldown TFT Cup

## Description
Ce bot permet la gestion d'un tournoi TFT :
* Dans un Google Spreadsheet tel que ce [template](https://docs.google.com/spreadsheets/d/1ETkajlzHUM8eeHYE3xW8xMpJ-5SqHlDiNRsp5K9o1jo)
* Avec des inscriptions et checkins sur Battlefy
* Pour un tournoi de maximum 32 participants
* Déclenchement du début automatique avec un cron
* Géré par un message dans un channel Discord privé
* Actions éxécutées par des clics sur des réactions

## Configuration
* Renommer le fichier `.example.env` en `.env` et le compléter avec vos IDs et Tokens
* Changer l'ID du Spreadsheet dans `main.js:16`, `main.js:134`, et `/modules/msgGestion.js:69`
* Vous pouvez changer la date du cron dans `main.js:64` (voir la [syntaxe](https://www.npmjs.com/package/node-cron))
* Vous pouvez changer les IDs des admins dans `main.js:40`
* Faites en sorte que l'email Google du bot ai les droits éditeur sur le Spreadsheet
* Faites en sorte que votre bot ai les droits administateurs sur Discord ou au moins :
    * Droit d'accès au channel de gestion du tournoi
    * Droit de suppression des messages
    * Droit de suppression des réactions

## Utilisation
* A la date du cron (*de base les jeudis à 19h*) un message indiquant le début de la phase de checkin sera posté dans le channel de gestion sur Discord
    * Au même moment des checkins automatiques auront lieu toutes les 5 minutes jusqu'a passer à la phase suivante
    * Deux boutons seront disponibles pour faire un checkin manuel ou bien passer a la phase suivante
* Lors du passage à la phase suivante (phase de qualification) le message sera édité et les boutons remplacés
    * Les poules de qualifications seront générées aléatoirement en fonction du dernier checkin effectué
    * Les 4 premiers boutons (**A**, **B**, **C**, **D**) permettront de récupérer les games des joueurs de chaque poule 
        * La game doit être complètement terminée avant de pouvoir être récupérée
        * Le premier clic récupèrera la game 1 de la poule, le second clic la game 2 de cette poule
    * Le dernier bouton permettra de passer à la phase suivante
* De nouveau quand on passe à la phase suivante (phase de demis) le message sera édité et les boutons remplacés
    * Le bot sélectionnera les 16 meilleurs joueurs qui passeront en demi
        * S'il y a une égalité critique le bot retriera les joueurs en fonction de leurs tops
        * Il previendra tout de même par un message et un ping qu'il y a eu une égalité et le résultat du tri
    * Les 2 premiers boutons (**A**, **B**) permettront de récupérer les games des joueurs (*même règles qu'au dessus*)
    * Le dernier bouton permettra de passer à la phase suivante
* Le passage à la phase finale sélectionnera les 8 meilleurs joueurs depuis le debut du tournoi
    * S'il y a égalité critique il n'y aura pas de tri, mais le message sera édité et un ping sera envoyé pour prévenir
    * Les deux boutons disponibles permettront de récupérer le résultat de la game et de terminer le tournoi

## Debug
Si l'utilisation normale c'est mal déroulée ou que vous souhaitez debuger quelque chose vous pouvez utiliser la commande `/tournoi-help` dans le channel de gestion. Cette dernière vous indiquera les différentes commandes disponibles éxecutant les différentes fonctions du bot.

## Mise en prod
```shell
> node -v
v12+
> npm -v
v6+

> git clone
> npm install
> npm run start
```