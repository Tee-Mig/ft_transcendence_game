import { OnModuleInit } from "@nestjs/common";
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from 'socket.io'
import { GameData } from '../types/types'
import { info } from "console";
import { PongData } from "src/classes/Classes";
import { checkBallBoundsY, checkBallCollision, resetGame, updateDirectionPlayer1, updateDirectionPlayer2, whereBallHitPlayer } from "src/pongFunctions/pongFunctions";
import { setInterval } from "timers";
import { elementAt } from "rxjs";
import { emit } from "process";
import { Socket } from "dgram";


@WebSocketGateway({
	cors: ['http://localhost:3001'],
})
export class MyGateway implements OnModuleInit {

	@WebSocketServer()
	server: Server;

	// *Pong settings
	endScore: number = 10; // *score needed to win game
	ballSpeed: number = 7; // TODO probleme5: initialiser dans server ?
	mode: string = "normal"; // *game mode(normal or rainbow)

	gameData: GameData[] = []; // *store all games of Pong
	playersList: { id: string, name: string }[] = []; // *matchmaking queue
	privatePlayersList: { [inviteCode: string]: { id: string, name: string }[] } = {}; // *private matchmaking queue
	namesDb: { id: string, name: string }[] = []; // *store all names before searching a player


	onModuleInit() {
		this.server.on('connection', (socket: any) => {

			socket.on('checkPlayerName', (name: string) => {
				if ((this.namesDb.find((element: { id: string, name: string }) => element.name === name) !== undefined)) {
					socket.emit("nameAlreadyUsed");
				}
				else {
					let newName: { id: string, name: string } = { id: socket.id, name: name }
					this.namesDb.push(newName);
					socket.emit("nameNotAlreadyUsed");
				}
			})


			socket.on('searchPlayer', (name: string) => {
				let infoPlayer:
					{
						id: string,
						name: string
					} = {
					id: socket.id,
					name: name
				}
				this.playersList.push(infoPlayer);
				if (this.playersList.length >= 2) {

					let p1Obj: {
						p1Info: { id: string, name: string },
						p1Side: string,
						sequenceNumber: number,
						pongData: PongData
					} = {
						p1Info: this.playersList[0],
						p1Side: "right",
						sequenceNumber: 0,
						pongData: undefined
					}
					let p2Obj: {
						p2Info: { id: string, name: string },
						p2Side: string,
						sequenceNumber: number,
						pongData: PongData
					} = {
						p2Info: this.playersList[1],
						p2Side: "left",
						sequenceNumber: 0,
						pongData: undefined
					}

					let PlayersObj: GameData = {
						p1: p1Obj,
						p2: p2Obj,
					}
					this.gameData.push(PlayersObj);
					this.playersList.splice(0, 2);

					this.server.emit("found", PlayersObj);
				}
			})

			socket.on('updatePlayers', (gameDataFront: GameData) => {
				let idGame = this.gameData.findIndex((element: GameData) => element.p1.p1Info.id === gameDataFront.p1.p1Info.id && element.p2.p2Info.id === gameDataFront.p2.p2Info.id);
				if (idGame !== -1) {
					if (this.gameData[idGame].p1.p1Info.id === socket.id) {
						this.gameData[idGame].p1.pongData = gameDataFront.p1.pongData;
					}
					else if (this.gameData[idGame].p2.p2Info.id === socket.id) {
						this.gameData[idGame].p2.pongData = gameDataFront.p2.pongData;
					}
				}
			})

			// TODO notifier si le jouer en face a refuse un retry(_retry est egal a 2 ?)
			socket.on('askRetry', (gameDataFront: GameData) => {
				if (gameDataFront) {
					let idGame = this.gameData.findIndex((element: GameData) => element.p1.p1Info.id === gameDataFront.p1.p1Info.id && element.p2.p2Info.id === gameDataFront.p2.p2Info.id);
					if (idGame !== -1) {

						if (this.gameData[idGame].p1.pongData && this.gameData[idGame].p1.p1Info.id == socket.id) {
							if (gameDataFront.p1.pongData._player1Properties._retry > 0) {
								this.gameData[idGame].p1.pongData._player1Properties._retry = gameDataFront.p1.pongData._player1Properties._retry;
								this.gameData[idGame].p2.pongData._player1Properties._retry = gameDataFront.p1.pongData._player1Properties._retry;
							}
							if (gameDataFront.p1.pongData._player2Properties._retry > 0) {
								this.gameData[idGame].p1.pongData._player2Properties._retry = gameDataFront.p2.pongData._player2Properties._retry;
								this.gameData[idGame].p2.pongData._player2Properties._retry = gameDataFront.p2.pongData._player2Properties._retry;
							}

							if (this.gameData[idGame].p1!.pongData._player1Properties._retry === 1 &&
								this.gameData[idGame].p1!.pongData._player2Properties._retry === 1) {
								this.gameData[idGame].p1!.pongData._player1Properties._retry === 0;
								this.gameData[idGame].p1!.pongData._player2Properties._retry === 0;
								this.server.emit("found", this.gameData[idGame]);
							}
						}
						else if (this.gameData[idGame].p2.pongData && this.gameData[idGame].p2.p2Info.id == socket.id) {
							if (gameDataFront.p2.pongData._player1Properties._retry > 0) {
								this.gameData[idGame].p1.pongData._player1Properties._retry = gameDataFront.p1.pongData._player1Properties._retry;
								this.gameData[idGame].p2.pongData._player1Properties._retry = gameDataFront.p1.pongData._player1Properties._retry;
							}
							if (gameDataFront.p2.pongData._player2Properties._retry > 0) {
								this.gameData[idGame].p1.pongData._player2Properties._retry = gameDataFront.p2.pongData._player2Properties._retry;
								this.gameData[idGame].p2.pongData._player2Properties._retry = gameDataFront.p2.pongData._player2Properties._retry;
							}

							if (this.gameData[idGame].p2!.pongData._player1Properties._retry === 1 &&
								this.gameData[idGame].p2!.pongData._player2Properties._retry === 1) {
								this.gameData[idGame].p2!.pongData._player1Properties._retry === 0;
								this.gameData[idGame].p2!.pongData._player2Properties._retry === 0;
								this.server.emit("found", this.gameData[idGame]);
							}
						}

						// else if (this.gameData[idGame].pongData._player1Properties._retry === 2 ||
						// 	this.gameData[idGame].pongData._player2Properties._retry === 2)
						// 	this.server.emit("playerDisconnetionRetry", this.gameData[idGame]);
					}
				}
			})

			socket.on("foundPrivate", (e: {
				inviteCode: string,
				name: string
			}) => {
				if (e.inviteCode === null)
					socket.emit("codeNotValid");
				else if (this.privatePlayersList[e.inviteCode] === undefined) {
					socket.emit("gameNotFound");
				}
				else {
					let infoPlayer:
						{
							id: string,
							name: string
						} = {
						id: socket.id,
						name: e.name
					}
					this.privatePlayersList[e.inviteCode].push(infoPlayer);

					if (this.privatePlayersList[e.inviteCode].length >= 2) {
						let p1Obj: {
							p1Info: { id: string, name: string },
							p1Side: string,
							sequenceNumber: number,
							pongData: undefined
						} = {
							p1Info: this.privatePlayersList[e.inviteCode][0],
							p1Side: "right",
							sequenceNumber: 0,
							pongData: undefined
						}
						let p2Obj: {
							p2Info: { id: string, name: string },
							p2Side: string,
							sequenceNumber: number
							pongData: undefined
						} = {
							p2Info: this.privatePlayersList[e.inviteCode][1],
							p2Side: "left",
							sequenceNumber: 0,
							pongData: undefined
						}

						let PlayersObj: GameData = {
							p1: p1Obj,
							p2: p2Obj,
						}
						this.gameData.push(PlayersObj);
						delete this.privatePlayersList[e.inviteCode];

						this.server.emit("found", PlayersObj);
					}
				}
			})

			socket.on("deletePrivateGame", (inviteCode: string) => {
				delete this.privatePlayersList[inviteCode];
			})

			socket.on("createPrivateGame", (e: {
				inviteCode: string,
				name: string
			}) => {
				this.privatePlayersList[e.inviteCode] = [];
			})

			// TODO probleme3: dessine en double le score et la balle ?
			socket.on("watchPlayer", (playerToWatch: string) => {

				if (this.namesDb.find((e: { id: string, name: string }) => e.name === playerToWatch) === undefined)
					socket.emit("playerNotFound");
				else {
					const gameId = this.gameData.findIndex((e: GameData) => e.p1.p1Info.name === playerToWatch || e.p2.p2Info.name === playerToWatch)
					if (gameId !== -1) {
						let findGameId: string;
						if (this.gameData[gameId].p1.p1Info.name === playerToWatch)
							findGameId = this.gameData[gameId].p1.p1Info.id;
						else if (this.gameData[gameId].p2.p2Info.name === playerToWatch)
							findGameId = this.gameData[gameId].p2.p2Info.id;

						let infoPonData: { gameData: GameData, playerId: string } = {
							gameData: this.gameData[gameId],
							playerId: findGameId
						}
						socket.emit('watchGame', infoPonData);
					}
					else
						socket.emit("noGameToWatch");
				}
			})

			socket.on('updateBall', (dataObj: { gameData: GameData, sequenceNumber: number }) => {
				if (dataObj.gameData) {
					let FrontEndData = dataObj.gameData;
					let sequenceNumber = dataObj.sequenceNumber;
					const currentGameId = this.gameData.findIndex((element: GameData) => element.p1.p1Info.id === FrontEndData.p1.p1Info.id && element.p2.p2Info.id === FrontEndData.p2.p2Info.id);
					if (currentGameId !== -1) {
						// player 1
						if (this.gameData[currentGameId].p1.p1Info.id == socket.id && this.gameData[currentGameId].p1.pongData) {
							let currentPlayer = this.gameData[currentGameId].p1;
							currentPlayer.pongData!._ballProperties._sequenceNumber = sequenceNumber;
							currentPlayer.pongData!._ballProperties._x += currentPlayer.pongData!._ballProperties._speedX;
							currentPlayer.pongData!._ballProperties._y += currentPlayer.pongData!._ballProperties._speedY;

							if (checkBallBoundsY(currentPlayer.pongData!._ballProperties._y + currentPlayer.pongData!._ballProperties._speedY, currentPlayer.pongData))
								currentPlayer.pongData!._ballProperties._speedY *= -1;

							if (checkBallCollision(currentPlayer.pongData!._ballProperties, currentPlayer.pongData!._player1Properties, currentPlayer.pongData) && currentPlayer.pongData!._ballProperties._speedX < 0) {
								if (currentPlayer.pongData!._ballProperties._x <= currentPlayer.pongData!._player1Properties._x + currentPlayer.pongData!._player1Properties._width) {
									updateDirectionPlayer1(whereBallHitPlayer(currentPlayer.pongData!._ballProperties, currentPlayer.pongData!._player1Properties), currentPlayer.pongData!._ballProperties, currentPlayer.pongData);
									currentPlayer.pongData!._ballProperties._speedX *= -1;
								}
							}

							else if (checkBallCollision(currentPlayer.pongData!._ballProperties, currentPlayer.pongData!._player2Properties, currentPlayer.pongData) && currentPlayer.pongData!._ballProperties._speedX > 0) {
								if (currentPlayer.pongData!._ballProperties._x + currentPlayer.pongData!._ballProperties._width >= currentPlayer.pongData!._player2Properties._x) {
									updateDirectionPlayer2(whereBallHitPlayer(currentPlayer.pongData!._ballProperties, currentPlayer.pongData!._player2Properties), currentPlayer.pongData!._ballProperties, currentPlayer.pongData);
									currentPlayer.pongData!._ballProperties._speedX *= -1;
								}
							}

							if (currentPlayer.pongData!._ballProperties._x < 0) {
								if (currentPlayer.pongData!._player2Properties._score < (this.endScore - 1)) {
									currentPlayer.pongData!._player2Properties._score++;
									resetGame(1, currentPlayer.pongData, this.ballSpeed);
								}
								else {
									//TODO probleme2: a changer pour avertir si joueur en face est partie
									currentPlayer.pongData!._player2Properties._score++;
									currentPlayer.pongData!._ballProperties._x = currentPlayer.pongData!._pongCanvasWidth / 2;
									currentPlayer.pongData!._ballProperties._y = currentPlayer.pongData!._pongCanvasHeight / 2;
									currentPlayer.pongData!._ballProperties._speedX = 0;
									currentPlayer.pongData!._ballProperties._speedY = 0;
									currentPlayer.pongData!._player2Properties._endResult = "You won"
									currentPlayer.pongData!._player1Properties._endResult = "You lost"
									this.server.emit("endGame", this.gameData[currentGameId]);
								}
							}
							else if (currentPlayer.pongData!._ballProperties._x > currentPlayer.pongData!._pongCanvasWidth) {
								if (currentPlayer.pongData!._player1Properties._score < (this.endScore - 1)) {
									currentPlayer.pongData!._player1Properties._score++;
									resetGame(-1, currentPlayer.pongData, this.ballSpeed);
								}
								else {
									//TODO probleme2: a changer pour avertir si joueur en face est partie
									currentPlayer.pongData!._player1Properties._score++;
									currentPlayer.pongData!._ballProperties._x = currentPlayer.pongData!._pongCanvasWidth / 2;
									currentPlayer.pongData!._ballProperties._y = currentPlayer.pongData!._pongCanvasHeight / 2;
									currentPlayer.pongData!._ballProperties._speedX = 0;
									currentPlayer.pongData!._ballProperties._speedY = 0;
									currentPlayer.pongData!._player2Properties._endResult = "You lost"
									currentPlayer.pongData!._player1Properties._endResult = "You won"
									this.server.emit("endGame", this.gameData[currentGameId]);
								}
							}
						}

						// player 2
						if (this.gameData[currentGameId].p2.p2Info.id == socket.id && this.gameData[currentGameId].p2.pongData) {
							let currentPlayer = this.gameData[currentGameId].p2;
							currentPlayer.pongData!._ballProperties._sequenceNumber = sequenceNumber;
							currentPlayer.pongData!._ballProperties._x += currentPlayer.pongData!._ballProperties._speedX;
							currentPlayer.pongData!._ballProperties._y += currentPlayer.pongData!._ballProperties._speedY;

							if (checkBallBoundsY(currentPlayer.pongData!._ballProperties._y + currentPlayer.pongData!._ballProperties._speedY, currentPlayer.pongData))
								currentPlayer.pongData!._ballProperties._speedY *= -1;

							if (checkBallCollision(currentPlayer.pongData!._ballProperties, currentPlayer.pongData!._player1Properties, currentPlayer.pongData) && currentPlayer.pongData!._ballProperties._speedX < 0) {
								if (currentPlayer.pongData!._ballProperties._x <= currentPlayer.pongData!._player1Properties._x + currentPlayer.pongData!._player1Properties._width) {
									updateDirectionPlayer1(whereBallHitPlayer(currentPlayer.pongData!._ballProperties, currentPlayer.pongData!._player1Properties), currentPlayer.pongData!._ballProperties, currentPlayer.pongData);
									currentPlayer.pongData!._ballProperties._speedX *= -1;
								}
							}

							else if (checkBallCollision(currentPlayer.pongData!._ballProperties, currentPlayer.pongData!._player2Properties, currentPlayer.pongData) && currentPlayer.pongData!._ballProperties._speedX > 0) {
								if (currentPlayer.pongData!._ballProperties._x + currentPlayer.pongData!._ballProperties._width >= currentPlayer.pongData!._player2Properties._x) {
									updateDirectionPlayer2(whereBallHitPlayer(currentPlayer.pongData!._ballProperties, currentPlayer.pongData!._player2Properties), currentPlayer.pongData!._ballProperties, currentPlayer.pongData);
									currentPlayer.pongData!._ballProperties._speedX *= -1;
								}
							}

							if (currentPlayer.pongData!._ballProperties._x < 0) {
								if (currentPlayer.pongData!._player2Properties._score < (this.endScore - 1)) {
									currentPlayer.pongData!._player2Properties._score++;
									resetGame(1, currentPlayer.pongData, this.ballSpeed);
								}
								else {
									//TODO probleme2: a changer pour avertir si joueur en face est partie
									currentPlayer.pongData!._player2Properties._score++;
									currentPlayer.pongData!._ballProperties._x = currentPlayer.pongData!._pongCanvasWidth / 2;
									currentPlayer.pongData!._ballProperties._y = currentPlayer.pongData!._pongCanvasHeight / 2;
									currentPlayer.pongData!._ballProperties._speedX = 0;
									currentPlayer.pongData!._ballProperties._speedY = 0;
									currentPlayer.pongData!._player2Properties._endResult = "You won"
									currentPlayer.pongData!._player1Properties._endResult = "You lost"
									this.server.emit("endGame", this.gameData[currentGameId]);
								}
							}
							else if (currentPlayer.pongData!._ballProperties._x > currentPlayer.pongData!._pongCanvasWidth) {
								if (currentPlayer.pongData!._player1Properties._score < (this.endScore - 1)) {
									currentPlayer.pongData!._player1Properties._score++;
									resetGame(-1, currentPlayer.pongData, this.ballSpeed);
								}
								else {
									//TODO probleme2: a changer pour avertir si joueur en face est partie
									currentPlayer.pongData!._player1Properties._score++;
									currentPlayer.pongData!._ballProperties._x = currentPlayer.pongData!._pongCanvasWidth / 2;
									currentPlayer.pongData!._ballProperties._y = currentPlayer.pongData!._pongCanvasHeight / 2;
									currentPlayer.pongData!._ballProperties._speedX = 0;
									currentPlayer.pongData!._ballProperties._speedY = 0;
									currentPlayer.pongData!._player2Properties._endResult = "You lost"
									currentPlayer.pongData!._player1Properties._endResult = "You won"
									this.server.emit("endGame", this.gameData[currentGameId]);
								}
							}
						}
					}
				}
			})

			socket.on('keydown', (e: {
				keycode: string,
				side: string,
				gameData: GameData,
				sequenceNumberPlayer1: number,
				sequenceNumberPlayer2: number
			}) => {
				if (e.gameData) {
					const currentGameId = this.gameData.findIndex((element: GameData) => element.p1.p1Info.id === e.gameData.p1.p1Info.id && element.p2.p2Info.id === e.gameData.p2.p2Info.id);
					if (currentGameId !== -1) {
						let side = e.side;
						let keycode = e.keycode;
						this.gameData[currentGameId].p1.sequenceNumber = e.sequenceNumberPlayer1
						this.gameData[currentGameId].p2.sequenceNumber = e.sequenceNumberPlayer2
						switch (keycode) {
							case "KeyW":
								if (side === "right" && this.gameData[currentGameId].p1!.pongData!._player1Properties._y >= 0) {
									this.gameData[currentGameId].p1!.pongData!._player1Properties._y -= this.gameData[currentGameId].p1!.pongData!._player1Properties._speedY;
									this.gameData[currentGameId].p2!.pongData!._player1Properties._y -= this.gameData[currentGameId].p2!.pongData!._player1Properties._speedY;
								}
								else if (side === "left" && this.gameData[currentGameId].p2!.pongData!._player2Properties._y >= 0) {
									this.gameData[currentGameId].p2!.pongData!._player2Properties._y -= this.gameData[currentGameId].p2!.pongData!._player2Properties._speedY;
									this.gameData[currentGameId].p1!.pongData!._player2Properties._y -= this.gameData[currentGameId].p1!.pongData!._player2Properties._speedY;
								}
								break;
							case "KeyS":
								if (side === "right" && this.gameData[currentGameId].p1!.pongData!._player1Properties._y <= (this.gameData[currentGameId].p1!.pongData!._pongCanvasHeight - this.gameData[currentGameId].p1!.pongData!._player1Properties._height)) {
									this.gameData[currentGameId].p1!.pongData!._player1Properties._y += this.gameData[currentGameId].p1!.pongData!._player1Properties._speedY;
									this.gameData[currentGameId].p2!.pongData!._player1Properties._y += this.gameData[currentGameId].p2!.pongData!._player1Properties._speedY;
								}
								else if (side === "left" && this.gameData[currentGameId].p2!.pongData!._player2Properties._y <= (this.gameData[currentGameId].p2!.pongData!._pongCanvasHeight - this.gameData[currentGameId].p2!.pongData!._player2Properties._height)) {
									this.gameData[currentGameId].p2!.pongData!._player2Properties._y += this.gameData[currentGameId].p2!.pongData!._player2Properties._speedY;
									this.gameData[currentGameId].p1!.pongData!._player2Properties._y += this.gameData[currentGameId].p1!.pongData!._player2Properties._speedY;
								}
								break;
						}
					}
				}
			})

			// TODO probleme2: pour notifier que l'autre joueur est parti -> a finir/refaire
			// socket.on("quitPong", (gameDataFront: GameData) => {

			// 	let gameRemoved = null
			// 	const removePongId = this.gameData.findIndex((element: GameData) => element.p1.p1Info.id === socket.id || element.p2.p2Info.id === socket.id);
			// 	if (removePongId !== -1) {
			// 		gameRemoved = this.gameData[removePongId];
			// 	}
			// 	this.server.emit("playerDisconnetion", gameRemoved);
			// })

			socket.on("cancelSearch", () => {

				const removePlayerListId = this.playersList.findIndex((element: { id: string, name: string }) => element.id === socket.id);
				if (removePlayerListId !== -1) {
					this.playersList.splice(removePlayerListId, 1);
				}
			})

			socket.on("disconnect", (reason: string) => {

				// * tests pour voir si je supprime bien tout lors de la deconnexion d'un client
				// console.log("test room pong 0 = " + this.gameData[0]);
				// console.log("test room pong 1 = " + this.gameData[1]);
				// console.log("test room pong 2 = " + this.gameData[2]);

				// console.log("test list pong = " + this.playersList[0]);
				// console.log("test list pong = " + this.playersList[1]);
				// console.log("test list pong = " + this.playersList[2]);

				// console.log("test names db = " + this.namesDb[0]);
				// console.log("test names db = " + this.namesDb[1]);
				// console.log("test names db = " + this.namesDb[2]);
				// *enleve la partie de pong
				let gameRemoved = null
				const removePongId = this.gameData.findIndex((element: GameData) => element.p1.p1Info.id === socket.id || element.p2.p2Info.id === socket.id);
				if (removePongId !== -1) {
					gameRemoved = this.gameData[removePongId];
				}

				// *enleve personne si dans la queue
				const removePlayerListId = this.playersList.findIndex((element: { id: string, name: string }) => element.id === socket.id);
				if (removePlayerListId !== -1) {
					this.playersList.splice(removePlayerListId, 1);
				}

				// *enleve nom de la db
				const removeNameId = this.namesDb.findIndex((element: { id: string, name: string }) => element.id === socket.id);
				if (removeNameId !== -1) {
					this.namesDb.splice(removeNameId, 1);
				}

				this.server.emit("playerDisconnetion", gameRemoved);
			})

			socket.on("removeGameBackend", (removeGameData: GameData) => {
				if (removeGameData) {
					const removePongId = this.gameData.findIndex((element: GameData) => element.p1.p1Info.id === removeGameData.p1.p1Info.id && element.p2.p2Info.id === removeGameData.p2.p2Info.id);
					if (removePongId !== -1)
						this.gameData.splice(removePongId, 1);
				}
			})

			let timerId = setInterval(() => {
				this.server.emit('updateGame', this.gameData);
			}, 15);
		});

	}


}