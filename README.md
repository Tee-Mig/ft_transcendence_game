# ft_transcendence_game

Commandes: <br>
-server(dans server-pong): pnpm run start:dev<br>
-client(dans web-pong): pnpm start start:dev<br>
-tailwindcss(dans web-pong): pnpm run dev<br><br>

Les choses a regler:
-probleme1: reinitialiser correctement les donnees du Pong (dans goToWelcomePage partie front)<br><br>
-probleme2: j'arrive pas a initialiser une variable et la changer pour notifier si un joueur est parti avec React<br><br>
-probleme3: regler la fonction pour regarder une autre partie car dessine en double ? (dans watchPlayer partie front)<br><br>
-probleme4: rendre le pong responsive -> adapter le ratio pour que la balle ai la meme trajectoire pour n'importe quelle resolution (creer un setter dans PongData pour ne pas changer la position de la balle et des joueurs)<br><br>
-probleme5: initialiser nouveau jeu dans partie server(sinon le server gere bien les parametres apres)<br><br>
-probleme6: regler les latences entre 2 joueurs (dans updateGame, draw, movePlayer, moveBall partie front)<br><br>

front -> chemin du fichier principal dans "web-pong/src/components/Front.tsx"<br><br>
back -> chemin du fichier principal dans "server-pong/src/gateway/back.ts"<br><br>
