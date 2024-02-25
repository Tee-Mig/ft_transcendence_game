import { useContext, useEffect, useRef, useState } from "react";
import { WebsocketContext } from "../context/WebsocketContext";
import { GameData } from "../types/types";
import { PlayerProperties, PongData } from "../classes/Classes";
import Button from "./Button";
import { checkBallBoundsY, checkBallCollision, resetGame, updateDirectionPlayer1, updateDirectionPlayer2, whereBallHitPlayer } from "../pongFunctions/pongFunctions";
import { Socket } from "socket.io-client";
import Input from "./Input";
import Backdrop from "./Backdrop";

export const Websocket = () => {

	// pong settings
	const ballSpeed: number = 7; // TODO probleme5: seulement pour le premier point apres server gere

	// * pour canvas du jeu
	const [width, setWidth] = useState(0);
	const [height, setHeight] = useState(0);
	const [windowDimension, detectDim] = useState<{ winWidth: number, winHeight: number }>({
		winWidth: window.innerWidth,
		winHeight: window.innerHeight
	})

	const [defaultWindowDimension, setDefaultWindowSize] = useState<{ winWidth: number, winHeight: number }>({
		winWidth: 1920,
		winHeight: 1080
	})

	let [playerSideReact, setPlayerSideReact] = useState<string | undefined>();
	let [contextReact, setContextReact] = useState<CanvasRenderingContext2D | null>(null);
	let context: CanvasRenderingContext2D | null = null;
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const socket = useContext(WebsocketContext);
	const [name, setName] = useState<string>('');
	let [gameId, setGameId] = useState<string>("Generate a game id");
	let [playerCode, setPlayerCode] = useState<string>('');
	let playerToWatch: string | undefined;
	let [playerLeft, setPlayerLeft] = useState<boolean>(false);
	let [resultOk, setresultOk] = useState<boolean>(false);
	let [searchInput, setSearchInput] = useState<boolean>(false);
	let [welcomePage, setWelcomePage] = useState<boolean>(true);
	let [loadingPage, setLoadingPage] = useState<boolean>(false);
	let [pong, setPong] = useState<boolean>(false);
	let [pongEnd, setPongEnd] = useState<boolean>(false);
	let [pongResult, setPongResult] = useState<string>("none");
	let [idReact, setIdReact] = useState<string | undefined>();
	let gameData: GameData | undefined;
	let [gameDataReact, setGameDataReact] = useState<GameData | undefined>(undefined);
	let side: string | undefined;
	let id: string | undefined;
	let currentCanvasWidth: number = window.innerWidth / 1.3;
	let currentCanvasHeight: number = window.innerWidth / 1.3;
	let mode: string = "normal"; // * mode de jeu(normal or rainbow)
	let [modeReact, setModeReact] = useState<string>(mode);

	// * background color(0, 0, 0)
	let [colorBack1, setColorBack1] = useState<number>(0);
	let [colorBack2, setColorBack2] = useState<number>(0);
	let [colorBack3, setColorBack3] = useState<number>(0);

	// * pour regler lags des joueurs entre serveur et client
	let [sequenceNumberPlayer1, setSequenceNumberPlayer1] = useState<number>(0);
	let [sequenceNumberPlayer2, setSequenceNumberPlayer2] = useState<number>(0);
	let [playerInputsPlayer1, setPlayerInputsPlayer1] = useState<{ sequenceNumberPlayer1: number, dy: number }[]>([]);
	let [playerInputsPlayer2, setPlayerInputsPlayer2] = useState<{ sequenceNumberPlayer2: number, dy: number }[]>([]);
	const _playerInputsPlayer1: { sequenceNumberPlayer1: number, dy: number }[] = [];
	const _playerInputsPlayer2: { sequenceNumberPlayer2: number, dy: number }[] = [];
	let _sequenceNumberPlayer1: number = 0;
	let _sequenceNumberPlayer2: number = 0;

	// TODO probleme6: changer/modifier pour reduire les lags ?
	// * pour regler lags de la ball entre serveur et client
	let [ballMovements1, setBallMovements1] = useState<{ sequenceNumber1: number, dx: number, dy: number }[]>([]);
	let [ballMovements2, setBallMovements2] = useState<{ sequenceNumber2: number, dx: number, dy: number }[]>([]);
	let [sequenceNumberReact, setSequenceNumber] = useState<number>(0);
	let sequenceNumber1: number = 0;
	let sequenceNumber2: number = 0;

	let [keysReact, setKeysReact] = useState<{ w: boolean, s: boolean }>({ w: false, s: false })

	const limitTimeBetweenCode: number = 3 * 60000; // 3 minutes between the generation of new code
	let [nowReact, setNowReact] = useState<number>(0);
	let now: number = 0;


	let inviteCode: string = "null";

	const keys = {
		w: {
			isPressed: false
		},
		s: {
			isPressed: false
		},
	}

	// TODO mettre image localement ? car pas reussi a charger localement
	const loadingImg = 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExemxnNm9rMXJ3aGl4YW1tYzl1eHN2eHc0bHd1ZnR0ODN0emhkd2N3byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/vbeNMLuswd7RR25lah/giphy.gif';
	const jamCat = 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExOXQ1NWcyNDhnemxwZG81MTczdjlkNzg4czA5bjRqMnN3b3Z3bXI5eiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/bRTe2TGxczPVH50vxO/giphy.webp';

	const detectSize = () => {
		detectDim({
			winWidth: window.innerWidth,
			winHeight: window.innerHeight
		})
	}

	useEffect(() => {
		// socket.on('connect', () => {
		// 	console.log('New client connected');
		// });

		socket.on('found', (backendPlayers: GameData) => {
			if (id == undefined) {
				if (backendPlayers.p1!.p1Info.id === socket.id) {
					id = socket.id;
					setIdReact(id);
					side = backendPlayers.p1!.p1Side;
				}
				else if (backendPlayers.p2!.p2Info.id === socket.id) {
					id = socket.id;
					setIdReact(id);
					side = backendPlayers.p2!.p2Side;
				}
			}

			// TODO a mettre a jour en React -> mettre catJam au centre de canvas en transparent
			// if (mode === "rainbow")
			// 	document.getElementById("catJam")!.style.display = "inline";
			if (id === backendPlayers.p1!.p1Info.id) {

				let pongData = new PongData(defaultWindowDimension.winWidth / 2, defaultWindowDimension.winHeight / 2, mode, ballSpeed);
				backendPlayers!.p1!.pongData = pongData;

				gameData = backendPlayers;
				setGameDataReact(gameData);
				setPong(true);
				setresultOk(false);
				setLoadingPage(false);

				socket.emit('updatePlayers', gameData);
			}
			else if (id === backendPlayers.p2!.p2Info.id) {
				let pongData = new PongData(defaultWindowDimension.winWidth / 2, defaultWindowDimension.winHeight / 2, mode, ballSpeed);
				backendPlayers!.p2!.pongData = pongData;

				gameData = backendPlayers;
				setGameDataReact(gameData);
				setPong(true);
				setresultOk(false);
				setLoadingPage(false);

				socket.emit('updatePlayers', gameData);
			}
		})

		// TODO probleme3: dessine en double le score et la balle ?
		socket.on('watchGame', (info: { gameData: GameData, playerId: string }) => {
			gameData = info.gameData;
			setGameDataReact(gameData);
			id = info.playerId;
			setIdReact(id);

			setPong(true);
			setresultOk(false);
			setSearchInput(false);
		})

		socket.on('nameAlreadyUsed', () => {
			setWelcomePage(true);
			setSearchInput(false);
			alert("Name already used");
		})

		socket.on('nameNotAlreadyUsed', () => {
			setWelcomePage(false);
			setSearchInput(true);
		})

		socket.on("gameNotFound", () => {
			setSearchInput(true);
			setLoadingPage(false);
			alert("Game not found");
		})

		socket.on("playerNotFound", () => {
			alert("Player not found");
		})

		socket.on("noGameToWatch", () => {
			alert("No game to watch");
		})

		socket.on("updateGame", (backendPlayers: GameData[]) => {
			let myGameid
			myGameid = backendPlayers.findIndex((element: GameData) => element.p1!.p1Info.id === id || element.p2!.p2Info.id === id);
			if (myGameid !== -1) {
				gameData = backendPlayers[myGameid]
				if (side === "right") {
					const lastBackendInputId1 = playerInputsPlayer1.findIndex((input: { sequenceNumberPlayer1: number, dy: number }) => {
						return gameData!.p1!.sequenceNumber === input.sequenceNumberPlayer1;
					})
					if (lastBackendInputId1 !== -1)
						playerInputsPlayer1.splice(0, lastBackendInputId1 + 1);
					playerInputsPlayer1.forEach((input: { sequenceNumberPlayer1: number, dy: number }) => {
						gameData!.p1!.pongData!._player1Properties._y += input.dy;
						gameData!.p2!.pongData!._player1Properties._y += input.dy;
					});
				}
				else if (side === "left") {
					const lastBackendInputId2 = playerInputsPlayer2.findIndex((input: { sequenceNumberPlayer2: number, dy: number }) => {
						return gameData!.p2!.sequenceNumber === input.sequenceNumberPlayer2;
					})
					if (lastBackendInputId2 !== -1)
						playerInputsPlayer2.splice(0, lastBackendInputId2 + 1);
					playerInputsPlayer2.forEach((input: { sequenceNumberPlayer2: number, dy: number }) => {
						gameData!.p2!.pongData!._player2Properties._y += input.dy;
						gameData!.p1!.pongData!._player2Properties._y += input.dy;
					});
				}

				if (gameData.p1!.pongData && gameData.p1!.p1Info.id == id) {
					const lastBackendBallMovementId = ballMovements1.findIndex((move: { sequenceNumber1: number, dx: number, dy: number }) => {
						return gameData!.p1!.pongData!._ballProperties._sequenceNumber === move.sequenceNumber1;
					})

					if (lastBackendBallMovementId !== -1)
						ballMovements1.splice(0, lastBackendBallMovementId + 1);
					ballMovements1.forEach((move: { sequenceNumber1: number, dx: number, dy: number }) => {
						gameData!.p1!.pongData!._ballProperties._x += move.dx;
						gameData!.p1!.pongData!._ballProperties._y += move.dy;
					})
				}

				else if (gameData.p2!.pongData && gameData.p2!.p2Info.id == id) {
					const lastBackendBallMovementId = ballMovements2.findIndex((move: { sequenceNumber2: number, dx: number, dy: number }) => {
						return gameData!.p2!.pongData!._ballProperties._sequenceNumber === move.sequenceNumber2;
					})

					if (lastBackendBallMovementId !== -1)
						ballMovements2.splice(0, lastBackendBallMovementId + 1);
					ballMovements2.forEach((move: { sequenceNumber2: number, dx: number, dy: number }) => {
						gameData!.p2!.pongData!._ballProperties._x += move.dx;
						gameData!.p2!.pongData!._ballProperties._y += move.dy;
					})
				}

				setGameDataReact(gameData);
			}
		})

		socket.on("endGame", (gameDataBack: GameData) => {
			if (gameDataBack) {
				if ((gameDataBack!.p1!.p1Info.id === id || gameDataBack!.p2!.p2Info.id === id)) {
					setPongEnd(true);
					if (gameDataBack!.p1!.p1Info.id === id) {
						setPongResult(gameDataBack!.p1!.pongData!._player1Properties._endResult);
					}
					else if (gameDataBack!.p2!.p2Info.id === id) {
						setPongResult(gameDataBack!.p2!.pongData!._player2Properties._endResult);
					}
				}
			}
		})

		socket.on("playerDisconnetion", (gameDataBack: GameData) => {
			if (gameDataBack !== null) {
				if ((gameDataBack!.p1!.p1Info.id === id || gameDataBack!.p2!.p2Info.id === id)) {
					setPong(false);
					setSearchInput(true);
					setPlayerLeft(true);
					setresultOk(true);
					setLoadingPage(false)
				}
			}
			socket.emit("removeGameBackend", gameDataBack);
		})

		return () => {
			// Unregistering events...
			// socket.off('connect');

			socket.off('found');
			socket.off('watchGame');
			socket.off('nameAlreadyUsed');
			socket.off('nameNotAlreadyUsed');
			socket.off('gameNotFound');
			socket.off('playerNotFound');
			socket.off('noGameToWatch');
			socket.off('updateGame');
			socket.off('endGame');
			socket.off('playerDisconnetion');
		}
	}, []);

	function cancelSearch() {
		setSearchInput(true);
		setLoadingPage(false);
		socket.emit('cancelSearch');
	}

	// TODO probleme2: pour notifier que l'autre joueur est parti -> a finir/refaire
	// function quitPong() {
	// 	setPong(false);
	// 	setPongEnd(false);
	// 	setSearchInput(true);

	// 	setGameId("Generate a game id");
	// 	now = Date.now()
	// 	setNowReact(now);

	// 	gameData = gameDataReact;

	// 	socket.emit('quitPong', gameData);
	// }

	// TODO bien reinitialiser les valeurs de pongData !!!!!!!!!!!!!!!!!!!!!
	const goToWelcomePage = () => {
		setPong(false);
		setPongEnd(false);
		setSearchInput(true);

		setGameId("Generate a game id");
		now = Date.now()
		setNowReact(now);

		// TODO ces 2 la marchent pas ?
		gameData = undefined;
		setGameDataReact(gameData);
		id = undefined;
		setIdReact(undefined);
	}

	// TODO probleme2: finir pour notifier si le joueur est parti au moment de demander retry
	function askRetry() {
		setPong(false);
		setLoadingPage(true);
		setPongEnd(false);
		gameData = gameDataReact;
		id = idReact;
		if (gameData!.p1!.p1Info.id === id) {
			gameData!.p1!.pongData!._player1Properties._retry = 1;
			gameData!.p2!.pongData!._player1Properties._retry = 1;
		}
		else if (gameData!.p2!.p2Info.id === id) {
			gameData!.p1!.pongData!._player2Properties._retry = 1;
			gameData!.p2!.pongData!._player2Properties._retry = 1;
		}
		socket.emit('askRetry', gameData);
	}

	function searchPlayer() {
		setLoadingPage(true);
		setSearchInput(false);
		socket.emit('searchPlayer', name);
	}

	function confirmName() {
		if (name === '') {
			alert("Invalid name");
		}
		else {
			socket.emit('checkPlayerName', name);
		}
	};

	function joinPrivateGame() {
		if (playerCode === null || playerCode === '') {
			alert("Enter a valid code");
		}
		else {
			let obj:
				{
					inviteCode: string,
					name: string
				} =
			{
				inviteCode: playerCode,
				name: name
			}
			setLoadingPage(true);
			setSearchInput(false);
			socket.emit("foundPrivate", obj);
		}
	}

	function genStringInviteCode(len: number): string {
		const hex = '0123456789abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		let output = '';
		for (let i = 0; i < len; ++i) {
			output += hex.charAt(Math.floor(Math.random() * hex.length));
		}
		return output;
	}

	function generateGameId() {
		if (Date.now() > now + limitTimeBetweenCode || now == 0) {
			if (gameId !== "Generate a game id")
				socket.emit("deletePrivateGame", { inviteCode });
			now = Date.now()
			setNowReact(now);
			inviteCode = genStringInviteCode(15);
			setGameId(inviteCode);

			let obj:
				{
					inviteCode: string,
					name: string
				} =
			{
				inviteCode: inviteCode,
				name: name
			}
			socket.emit("createPrivateGame", obj);
		}
		else {
			alert("You need to wait before generating a new code(" + (Math.round(((limitTimeBetweenCode - (Date.now() - now)) / 1000 / 60))) + " minute(s))");
		}
	}

	// TODO probleme3: dessine en double le score et la balle ?
	function watchPlayer() {
		socket.emit("watchPlayer", playerToWatch)
	}


	const draw = () => {
		// console.log("context ===");
		// console.log(context);
		if (context && gameDataReact) {
			// player 1 view
			if (gameDataReact.p1 && gameDataReact.p1!.pongData && gameDataReact.p1!.p1Info.id === idReact) {
				context.clearRect(0, 0, gameDataReact.p1!.pongData._pongCanvasWidth, gameDataReact.p1!.pongData._pongCanvasHeight);

				// color background
				context.fillStyle = `rgb(${colorBack1}, ${colorBack2}, ${colorBack3})`;
				context.fillRect(0, 0, gameDataReact.p1!.pongData._pongCanvasWidth, gameDataReact.p1!.pongData._pongCanvasHeight);

				// draw player1
				context.fillStyle = "violet";
				context.fillRect(
					gameDataReact.p1!.pongData._player1Properties._x,
					gameDataReact.p1!.pongData._player1Properties._y,
					gameDataReact.p1!.pongData._player1Properties._width,
					gameDataReact.p1!.pongData._player1Properties._height
				);
				// draw player2
				context.fillStyle = "violet";
				context.fillRect(
					gameDataReact.p1!.pongData._player2Properties._x,
					gameDataReact.p1!.pongData._player2Properties._y,
					gameDataReact.p1!.pongData._player2Properties._width,
					gameDataReact.p1!.pongData._player2Properties._height
				);

				// draw ball
				context.fillStyle = "violet";
				context.fillRect(
					gameDataReact.p1!.pongData._ballProperties._x,
					gameDataReact.p1!.pongData._ballProperties._y,
					gameDataReact.p1!.pongData._ballProperties._width,
					gameDataReact.p1!.pongData._ballProperties._height
				);

				// draw scores
				context.font = `${gameDataReact.p1!.pongData._fontSize}px sans-serif`;
				context.fillText(
					gameDataReact.p1!.pongData._player1Properties._score.toString(),
					gameDataReact.p1!.pongData._pongCanvasWidth / 4.3,
					gameDataReact.p1!.pongData._pongCanvasHeight / 9
				);
				context.fillText(
					gameDataReact.p1!.pongData._player2Properties._score.toString(),
					gameDataReact.p1!.pongData._pongCanvasWidth * 4 / 5 - gameDataReact.p1!.pongData._pongCanvasWidth / 15,
					gameDataReact.p1!.pongData._pongCanvasHeight / 9
				);

				for (let i = gameDataReact.p1!.pongData._pongCanvasHeight / 50; i < gameDataReact.p1!.pongData._pongCanvasHeight; i += gameDataReact.p1!.pongData._pongCanvasWidth / 30) {
					context.fillRect(
						gameDataReact.p1!.pongData._pongCanvasWidth / 2 - ((gameDataReact.p1!.pongData._pongCanvasWidth / 160) / 2),
						i,
						gameDataReact.p1!.pongData._pongCanvasWidth / 160,
						gameDataReact.p1!.pongData._pongCanvasWidth / 160
					);
				}
			}

			// player 2 view
			else if (gameDataReact.p2 && gameDataReact.p2!.pongData && gameDataReact.p2!.p2Info.id === idReact) {
				context.clearRect(0, 0, gameDataReact.p2!.pongData._pongCanvasWidth, gameDataReact.p2!.pongData._pongCanvasHeight);

				// color background
				context.fillStyle = `rgb(${colorBack1}, ${colorBack2}, ${colorBack3})`;
				context.fillRect(0, 0, gameDataReact.p2!.pongData._pongCanvasWidth, gameDataReact.p2!.pongData._pongCanvasHeight);

				// draw player1
				context.fillStyle = "violet";
				context.fillRect(
					gameDataReact.p2!.pongData._player1Properties._x,
					gameDataReact.p2!.pongData._player1Properties._y,
					gameDataReact.p2!.pongData._player1Properties._width,
					gameDataReact.p2!.pongData._player1Properties._height
				);
				// draw player2
				context.fillStyle = "violet";
				context.fillRect(
					gameDataReact.p2!.pongData._player2Properties._x,
					gameDataReact.p2!.pongData._player2Properties._y,
					gameDataReact.p2!.pongData._player2Properties._width,
					gameDataReact.p2!.pongData._player2Properties._height
				);

				// draw ball
				context.fillStyle = "violet";
				context.fillRect(
					gameDataReact.p2!.pongData._ballProperties._x,
					gameDataReact.p2!.pongData._ballProperties._y,
					gameDataReact.p2!.pongData._ballProperties._width,
					gameDataReact.p2!.pongData._ballProperties._height
				);

				// draw scores
				context.font = `${gameDataReact.p2!.pongData._fontSize}px sans-serif`;
				context.fillText(
					gameDataReact.p2!.pongData._player1Properties._score.toString(),
					gameDataReact.p2!.pongData._pongCanvasWidth / 4.3,
					gameDataReact.p2!.pongData._pongCanvasHeight / 9
				);
				context.fillText(
					gameDataReact.p2!.pongData._player2Properties._score.toString(),
					gameDataReact.p2!.pongData._pongCanvasWidth * 4 / 5 - gameDataReact.p2!.pongData._pongCanvasWidth / 15,
					gameDataReact.p2!.pongData._pongCanvasHeight / 9
				);

				for (let i = gameDataReact.p2!.pongData._pongCanvasHeight / 50; i < gameDataReact.p2!.pongData._pongCanvasHeight; i += gameDataReact.p2!.pongData._pongCanvasWidth / 30) {
					context.fillRect(
						gameDataReact.p2!.pongData._pongCanvasWidth / 2 - ((gameDataReact.p2!.pongData._pongCanvasWidth / 160) / 2),
						i,
						gameDataReact.p2!.pongData._pongCanvasWidth / 160,
						gameDataReact.p2!.pongData._pongCanvasWidth / 160
					);
				}
			}
		}
	}

	// TODO mettre a jour avec pongData unique pour chaque joueur -> sert a mettre le background en multi couleurs avec mode "rainbow"
	// const changeBackgroundColor = () => {
	// 	if ((colorBack3 + 50) < 255)
	// 		setColorBack3(((nc) => (nc + 50)))
	// 	else {
	// 		setColorBack3((() => 0));
	// 		if ((colorBack2 + 50) < 255)
	// 			setColorBack2(((nc) => (nc + 50)))
	// 		else {
	// 			setColorBack2((() => 0));
	// 			if ((colorBack1 + 50) < 255)
	// 				setColorBack1(((nc) => (nc + 50)))
	// 			else
	// 				setColorBack1((() => 0));
	// 		}
	// 	}
	// 	if (context !== null) {
	// 		context.fillStyle = `rgb(${colorBack1}, ${colorBack2}, ${colorBack3})`;
	// 	}
	// }

	// useEffect(() => {
	// 	if (mode === "rainbow") {
	// 		const interval = setInterval(changeBackgroundColor, 500);
	// 		return () => { clearInterval(interval) };
	// 	}
	// }, [colorBack1, colorBack2, colorBack3])

	const movePlayers = () => {
		let objBack: {
			keycode: string,
			side: string | undefined,
			gameData: GameData | undefined,
			sequenceNumberPlayer1: number,
			sequenceNumberPlayer2: number
		} = {
			keycode: "null",
			side: side,
			gameData: gameData,
			sequenceNumberPlayer1: 0,
			sequenceNumberPlayer2: 0
		}

		if (keys.w.isPressed) {
			objBack.keycode = "KeyW";
			if (side === "right" && gameData!.p1!.pongData!._player1Properties && gameData!.p1!.pongData!._player1Properties._y >= 0) {
				sequenceNumberPlayer1++;
				playerInputsPlayer1.push({ sequenceNumberPlayer1, dy: -gameData!.p1!.pongData!._player1Properties._speedY })
				objBack.sequenceNumberPlayer1 = sequenceNumberPlayer1;
				gameData!.p1!.pongData!._player1Properties._y -= gameData!.p1!.pongData!._player1Properties._speedY;
				gameData!.p2!.pongData!._player1Properties._y -= gameData!.p2!.pongData!._player1Properties._speedY;
			}
			else if (side === "left" && gameData!.p2!.pongData!._player2Properties && gameData!.p2!.pongData!._player2Properties._y >= 0) {
				sequenceNumberPlayer2++;
				playerInputsPlayer2.push({ sequenceNumberPlayer2, dy: -gameData!.p2!.pongData!._player2Properties._speedY })
				objBack.sequenceNumberPlayer2 = sequenceNumberPlayer2;
				objBack.gameData!.p2!.pongData!._player2Properties._y -= objBack.gameData!.p2!.pongData!._player2Properties._speedY;
				objBack.gameData!.p1!.pongData!._player2Properties._y -= objBack.gameData!.p1!.pongData!._player2Properties._speedY;
			}
			if (gameData)
				setGameDataReact(gameData);
			socket.emit('keydown', objBack);
		}
		if (keys.s.isPressed) {
			objBack.keycode = "KeyS";
			if (side === "right" && gameData!.p1!.pongData!._player1Properties && gameData!.p1!.pongData!._player1Properties._y <= (gameData!.p1!.pongData!._pongCanvasHeight - gameData!.p1!.pongData!._player1Properties._height)) {
				sequenceNumberPlayer1++;
				playerInputsPlayer1.push({ sequenceNumberPlayer1, dy: gameData!.p1!.pongData!._player1Properties._speedY })
				objBack.sequenceNumberPlayer1 = sequenceNumberPlayer1;
				objBack.gameData!.p1!.pongData!._player1Properties._y += objBack.gameData!.p1!.pongData!._player1Properties._speedY;
				objBack.gameData!.p2!.pongData!._player1Properties._y += objBack.gameData!.p2!.pongData!._player1Properties._speedY;
			}
			else if (side === "left" && gameData!.p2!.pongData!._player2Properties && gameData!.p2!.pongData!._player2Properties._y <= (gameData!.p2!.pongData!._pongCanvasHeight - gameData!.p2!.pongData!._player2Properties._height)) {
				sequenceNumberPlayer2++;
				playerInputsPlayer2.push({ sequenceNumberPlayer2, dy: gameData!.p2!.pongData!._player2Properties._speedY })
				objBack.sequenceNumberPlayer2 = sequenceNumberPlayer2;
				objBack.gameData!.p2!.pongData!._player2Properties._y += objBack.gameData!.p2!.pongData!._player2Properties._speedY;
				objBack.gameData!.p1!.pongData!._player2Properties._y += objBack.gameData!.p1!.pongData!._player2Properties._speedY;
			}
			if (gameData)
				setGameDataReact(gameData);
			socket.emit('keydown', objBack);
		}
	}

	useEffect(() => {
		const interval = setInterval(movePlayers, 15);
		return () => { clearInterval(interval) };
	}, [])

	const moveBall = () => {
		if (context && gameData) {
			if (gameData.p1!.pongData && gameData.p1!.p1Info.id == id) {

				let p1PongData = gameData!.p1!.pongData;
				sequenceNumber1++;
				ballMovements1.push({ sequenceNumber1, dx: p1PongData._ballProperties._speedX, dy: p1PongData._ballProperties._speedY })

				if (checkBallBoundsY(p1PongData._ballProperties._y + p1PongData._ballProperties._speedY, p1PongData))
					p1PongData._ballProperties._speedY *= -1;

				if (checkBallCollision(p1PongData._ballProperties, p1PongData._player1Properties, p1PongData) && p1PongData._ballProperties._speedX < 0) {
					if (p1PongData._ballProperties._x <= p1PongData._player1Properties._x + p1PongData._player1Properties._width) {
						updateDirectionPlayer1(whereBallHitPlayer(p1PongData._ballProperties, p1PongData._player1Properties), p1PongData._ballProperties, p1PongData);
						p1PongData._ballProperties._speedX *= -1;
					}
				}

				else if (checkBallCollision(p1PongData._ballProperties, p1PongData._player2Properties, p1PongData) && p1PongData._ballProperties._speedX > 0) {
					if (p1PongData._ballProperties._x + p1PongData._ballProperties._width >= p1PongData._player2Properties._x) {
						updateDirectionPlayer2(whereBallHitPlayer(p1PongData._ballProperties, p1PongData._player2Properties), p1PongData._ballProperties, p1PongData);
						p1PongData._ballProperties._speedX *= -1;
					}
				}

				if (p1PongData._ballProperties._x < 0) {
					p1PongData._player2Properties._score++;
					if (p1PongData._player2Properties._score < 1)
						resetGame(1, p1PongData);
					else {
						p1PongData._ballProperties._speedX = 0;
						p1PongData._ballProperties._speedY = 0;
					}
				}
				else if (p1PongData._ballProperties._x > p1PongData._pongCanvasWidth) {
					p1PongData._player1Properties._score++;
					if (p1PongData._player1Properties._score < 1)
						resetGame(-1, p1PongData);
					else {
						p1PongData._ballProperties._speedX = 0;
						p1PongData._ballProperties._speedY = 0;
					}
				}
				setGameDataReact(gameData);

				socket.emit("updateBall", { gameData: gameData, sequenceNumber: sequenceNumber1 });
			}

			else if (gameData.p2!.pongData && gameData.p2!.p2Info.id == id) {
				let p2PongData = gameData!.p2!.pongData;
				sequenceNumber2++;
				ballMovements2.push({ sequenceNumber2, dx: p2PongData._ballProperties._speedX, dy: p2PongData._ballProperties._speedY })

				if (checkBallBoundsY(p2PongData._ballProperties._y + p2PongData._ballProperties._speedY, p2PongData))
					p2PongData._ballProperties._speedY *= -1;

				if (checkBallCollision(p2PongData._ballProperties, p2PongData._player1Properties, p2PongData) && p2PongData._ballProperties._speedX < 0) {
					if (p2PongData._ballProperties._x <= p2PongData._player1Properties._x + p2PongData._player1Properties._width) {
						updateDirectionPlayer1(whereBallHitPlayer(p2PongData._ballProperties, p2PongData._player1Properties), p2PongData._ballProperties, p2PongData);
						p2PongData._ballProperties._speedX *= -1;
					}
				}

				else if (checkBallCollision(p2PongData._ballProperties, p2PongData._player2Properties, p2PongData) && p2PongData._ballProperties._speedX > 0) {
					if (p2PongData._ballProperties._x + p2PongData._ballProperties._width >= p2PongData._player2Properties._x) {
						updateDirectionPlayer2(whereBallHitPlayer(p2PongData._ballProperties, p2PongData._player2Properties), p2PongData._ballProperties, p2PongData);
						p2PongData._ballProperties._speedX *= -1;
					}
				}

				if (p2PongData._ballProperties._x < 0) {
					p2PongData._player2Properties._score++;
					if (p2PongData._player2Properties._score < 1)
						resetGame(1, p2PongData);
					else {
						p2PongData._ballProperties._speedX = 0;
						p2PongData._ballProperties._speedY = 0;
					}
				}
				else if (p2PongData._ballProperties._x > p2PongData._pongCanvasWidth) {
					p2PongData._player1Properties._score++;
					if (p2PongData._player1Properties._score < 1)
						resetGame(-1, p2PongData);
					else {
						p2PongData._ballProperties._speedX = 0;
						p2PongData._ballProperties._speedY = 0;
					}
				}
				setGameDataReact(gameData);

				socket.emit("updateBall", { gameData: gameData, sequenceNumber: sequenceNumber2 });
			}
			else
				console.log("else");
		}
	}

	useEffect(() => {
		const interval = setInterval(moveBall, 15);
		return () => { clearInterval(interval) };
	}, [])

	const isKeyPressed = (event: any) => {
		switch (event.code) {
			case "KeyW":
				keys.w.isPressed = true;
				break;
			case "KeyS":
				keys.s.isPressed = true;
				break;
		}
	}

	const isKeyRelease = (event: any) => {
		switch (event.code) {
			case "KeyW":
				keys.w.isPressed = false;
				break;
			case "KeyS":
				keys.s.isPressed = false;
				break;
		}
	}

	useEffect(() => {
		document.addEventListener('keydown', isKeyPressed, true);
		document.addEventListener('keyup', isKeyRelease, true);

		return () => document.removeEventListener('keydown', isKeyPressed);
	}, [])

	useEffect(() => {
		window.addEventListener('resize', detectSize);

		//TODO probleme4: ici pour rendre le jeu responsive avec les valeurs windowDimension.winHeight et windowDimension.winWidth
		//TODO qui change en fonction de la taille actuelle de l'ecran --> creer une fonction dans Pongdata car il a seulement un constructeur
		//TODO qui reinitialise la position de la balle et des joueurs

		// if (gameDataReact) {
		// 	if (gameDataReact.p1 && gameDataReact.p1!.p1Info.id == idReact) {
		// 		gameData = gameDataReact;
		// 		gameData!.p1!.pongData = new PongData(windowDimension.winWidth, windowDimension.winHeight, mode, ballSpeed);
		// 		setGameDataReact(gameData);
		// 		socket.emit('updatePlayers', gameData);
		// 	}
		// 	else if (gameDataReact.p2 && gameDataReact.p2!.p2Info.id == idReact) {
		// 		gameData = gameDataReact;
		// 		gameData!.p2!.pongData = new PongData(windowDimension.winWidth, windowDimension.winHeight, mode, ballSpeed);
		// 		setGameDataReact(gameData);
		// 		socket.emit('updatePlayers', gameData);
		// 	}
		// }
		console.log("Je dois resize");

		return () => {
			window.removeEventListener('resize', detectSize);
		}
	}, [windowDimension])

	// TODO changer resolution selon taille de la fenetre
	useEffect(() => {
		const canvas = canvasRef.current;
		context = canvas!.getContext('2d')
		setContextReact(context);

		let animationFrameId: number;

		const render = () => {
			draw();
			animationFrameId = window.requestAnimationFrame(render);

		}
		render()
		return (() => { window.cancelAnimationFrame(animationFrameId) });
	}, [draw])

	return (
		<div>
			<div>
				<h1
					className="flex mb-12 mt-3 items-center text-5xl font-extrabold dark:text-white justify-center"
				>Pong</h1>
			</div>
			<div className="mainLayer">
				{
					welcomePage &&
					<div className="putNameDiv">
						<Input
							id="inputName"
							placeholder="Name"
							type="text"
							value=""
							updateString={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
						/>
						<br />
						<Button
							className="button"
							id="buttonName"
							text="Confirm name"
							click={confirmName}
						/>
					</div>
				}
				{
					searchInput &&
					<div className="searchDiv">
						<Button
							className="button"
							id="buttonSearchPlayer"
							text="Search player"
							click={searchPlayer}
						/>
						<br />
						<Input
							id="inputGameId"
							placeholder="Game id"
							type="text"
							value=""
							updateString={(e: any) => setPlayerCode(e.target.value)}
						/>
						<br />
						<Button
							className="button"
							id="buttonGameId"
							text="Join game"
							click={joinPrivateGame}
						/>

						<div className="generateCodeId">
							{
								gameId === "Generate a game id"
								&& <Button
									className="button"
									text={gameId}
									click={generateGameId}
								/>
							}
							{
								gameId !== "Generate a game id"
								&& (Date.now() < nowReact + limitTimeBetweenCode)
								&& gameId !== "Generate a game id"
								&& <Button
									className="button"
									text={gameId}
									click={() => { navigator.clipboard.writeText(gameId) }}
								/>
							}
							{
								gameId !== "Generate a game id"
								&& <Button
									className="button"
									id="copyButton"
									text="copy"
									click={() => { navigator.clipboard.writeText(gameId) }}
								/>
							}
						</div>

						{
							<div className="inputRegion">
								<Input
									id="inputWatchGame"
									placeholder="Player's name"
									type="text"
									value=""
									updateString={(e: any) => (playerToWatch = e.target.value)}
								/>
								<br />
								<Button
									className="button"
									id="buttonWatchGame"
									text="Watch game"
									click={watchPlayer}
								/>
							</div>

						}
					</div>
				}
				{
					loadingPage &&
					<div className="loadingPage">
						<img src={loadingImg} id="loadingImg"></img>
						<br />
						<Button
							className="button"
							id="buttonCancel"
							text="Cancel"
							click={cancelSearch}
						/>
					</div>
				}

				{
					pong &&
					<div>
						<strong>Width = {windowDimension.winWidth}</strong>
						<strong>Height = {windowDimension.winHeight}</strong>
					</div>
				}

				<canvas
					// id="pongCanvas"
					// className="px-[50%]"
					hidden={!pong}
					ref={canvasRef}
					width={defaultWindowDimension.winWidth / 2}
					height={defaultWindowDimension.winHeight / 2}
				// width={window.innerWidth}
				// height={window.innerHeight}
				/>

				{
					// *bouton pour quitter une partie de pong
					pong &&
					<div className="quitDiv">
						<Button
							className="button"
							id="buttonQuit"
							text="Quit"
							click={goToWelcomePage}
						/>
					</div>
				}

				{/* {
					// TODO mettre le gif en mode rainbo
					!searchInput && modeReact === "rainbow" && pong &&
					<img src={jamCat} id="dancingCat"></img>
				} */}

				{
					// TODO mettre Backdrop pour qu'on puisse pas cliquer sur les boutons derrieres?
					pongEnd &&
					<div id="messageEndPong">
						<h1 className="flex items-center text-3xl font-extrabold dark:text-white justify-center">{pongResult} !</h1>
						{
							!playerLeft && !resultOk && <div>
								<h1 className="flex items-center text-3xl font-extrabold dark:text-white justify-center pb-0 mb-5 mt-1">Retry ?</h1>

								<Button id="yesButton" className="button" text="yes" click={askRetry} />
								<Button id="noButton" className="button" text="no" click={goToWelcomePage} />
							</div>
						}
						{
							resultOk && <Button id="okEndPong" className="button" text="ok" click={goToWelcomePage} />
						}
						{/* {<Backdrop onClick={setFalseLeftPlayer} />} */}
					</div>
				}
				{
					// TODO mettre Backdrop pour qu'on puisse pas cliquer sur les boutons derrieres?
					playerLeft &&
					<div id="messageOnCenter">
						<h1 className="flex items-center text-3xl font-extrabold dark:text-white justify-center">Your opponent left</h1>
						<Button id="okOpponentLeft" className="button" text="ok" click={() => (setPlayerLeft(false), setresultOk(true))} />
						{/* {<Backdrop onClick={setFalseLeftPlayer} />} */}
					</div>
				}

			</div>

		</div>
	);
};
