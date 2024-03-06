import { useContext, useEffect, useRef, useState } from "react";
import { WebsocketContext } from "../context/WebsocketContext";
import { GameData } from "../../../server-pong/dist/types/types";
import Button from "./Button";
import { checkBallBoundsY, checkBallCollision, resetGame } from "../pongFunctions/pongFunctions";
import Input from "./Input";

export const Websocket = () => {

	// *pour responsivite du jeu
	const [windowResolution, detectResolution] = useState<{ winWidth: number, winHeight: number }>({
		winWidth: window.innerWidth,
		winHeight: window.innerHeight
	})
	const frameRate: number = 15;

	// *pour canvas du jeu
	const socket = useContext(WebsocketContext);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
	let contextJs: CanvasRenderingContext2D | null = null;

	// *variables jeu
	const [mode, setMode] = useState<string>("normal"); // normal, mode1, mode2
	let side: string | null = null;
	const [sideRender, setSideRender] = useState<string | null>(null);
	let [gameDataRender, setGameDataRender] = useState<GameData | null>(null);
	let gameDataFront: GameData | null = null;
	const [name, setName] = useState<string | null>(null);
	const [resolutionCoef, setResolutionCoef] = useState<{ width: number, height: number }>({
		width: 0,
		height: 0
	});
	const [keys, setKeys] = useState<{ w: { isPressed: boolean }, s: { isPressed: boolean } }>({
		w: { isPressed: false },
		s: { isPressed: false }
	});

	// *variables pour regler lags entre serveur et client
	let playerInputsPlayer1: { sequenceNumberPlayer: number, dy: number }[] = [];
	let playerInputsPlayer2: { sequenceNumberPlayer: number, dy: number }[] = [];
	let sequenceNumberPlayer1: number = 0;
	let sequenceNumberPlayer2: number = 0;
	let ballMovements: { sequenceNumberBall: number, dx: number, dy: number }[] = [];
	let sequenceNumberBall: number = 0;

	// *pour composants agencement -
	const [pong, setPong] = useState<boolean>(false);
	const [searchInput, setSearchInput] = useState<boolean>(false);
	const [welcomePage, setWelcomePage] = useState<boolean>(true);
	const [loadingPage, setLoadingPage] = useState<boolean>(false);
	const [pongResult, setPongResult] = useState<string | null>(null);
	const [playerLeft, setPlayerLeft] = useState<boolean>(false);
	const [resultOk, setResultOk] = useState<boolean>(false);
	const [rainbowMode, setRainbowMode] = useState<boolean>(false);
	const [endBattleWatch, setEndBattleWatch] = useState<boolean>(false);

	// *autres variables
	const [playerCode, setPlayerCode] = useState<string | null>(null);
	const [gameId, setGameId] = useState<string>("Generate a game id");
	let [now, setNow] = useState<number>(0);
	let inviteCode: string = "null";
	const limitTimeBetweenCode: number = 60000; // 1 minute entre 2 codes
	let [playerToWatch, setPlayerToWatch] = useState<string | undefined>();
	let playerId: string | null = null;
	let [playerSide, setPlayerSide] = useState<string | null>(null);
	let [playerIdRender, setPlayerIdRender] = useState<string | null>(null);

	// *variables background pour le mode 2
	let colorBack1: number = 0;
	let colorBack2: number = 0;
	let colorBack3: number = 0;
	let [colorBack1Render, setColorBack1Render] = useState<number>(colorBack1);
	let [colorBack2Render, setColorBack2Render] = useState<number>(colorBack2);
	let [colorBack3Render, setColorBack3Render] = useState<number>(colorBack3);

	const loadingImg = 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExemxnNm9rMXJ3aGl4YW1tYzl1eHN2eHc0bHd1ZnR0ODN0emhkd2N3byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/vbeNMLuswd7RR25lah/giphy.gif';
	const jamCat = 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExOXQ1NWcyNDhnemxwZG81MTczdjlkNzg4czA5bjRqMnN3b3Z3bXI5eiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/bRTe2TGxczPVH50vxO/giphy.webp';

	const detectSize = () => {
		detectResolution({
			winWidth: window.innerWidth,
			winHeight: window.innerHeight
		})
	}

	useEffect(() => {
		socket.on('found', (gameDataBack: GameData) => {
			if (gameDataBack.p1!.p1Info.id === socket.id) {
				side = gameDataBack.p1!.p1Side;
				setSideRender(side);
			}
			else if (gameDataBack.p2!.p2Info.id === socket.id) {
				side = gameDataBack.p2!.p2Side;
				setSideRender(side);
			}

			if (gameDataBack.p1!.p1Info.id === socket.id || gameDataBack.p2!.p2Info.id === socket.id) {

				setResolutionCoef({
					width: windowResolution.winWidth / gameDataBack!.pongData._pongCanvasWidth,
					height: windowResolution.winHeight / gameDataBack!.pongData._pongCanvasHeight
				});

				if (gameDataBack.pongData._mode === "mode2")
					setRainbowMode(true);
				else
					setRainbowMode(false);
				gameDataFront = gameDataBack;
				setGameDataRender(gameDataBack);
				setPong(true);
				setLoadingPage(false);
				setResultOk(false);
			}
		})

		socket.on('watchGame', (info: { playerIdBack: string, playerSideBack: string, gameMode: string }) => {

			if (info.gameMode == "mode2")
				setRainbowMode(true);
			playerId = info.playerIdBack;
			setPlayerSide(info.playerSideBack);
			setPlayerIdRender(playerId);

			setResolutionCoef({
				width: windowResolution.winWidth / 1920,
				height: windowResolution.winHeight / 1080
			});

			setPong(true);
			setResultOk(false);
			setLoadingPage(false);
			setSearchInput(false);
		})

		socket.on("updateGame", (backendPlayers: GameData[]) => {
			let myGameid
			if (playerId === null)
				myGameid = backendPlayers.findIndex((element: GameData) => element.p1!.p1Info.id === socket.id || element.p2!.p2Info.id === socket.id);
			else {
				myGameid = backendPlayers.findIndex((element: GameData) => element.p1!.p1Info.id === playerId || element.p2!.p2Info.id === playerId);
			}
			if (myGameid !== -1) {
				gameDataFront = backendPlayers[myGameid];

				// regle lags joueur 1
				if (side === "right") {
					const lastBackendInputId1 = playerInputsPlayer1.findIndex((input: { sequenceNumberPlayer: number, dy: number }) => {
						return gameDataFront!.p1!.sequenceNumber === input.sequenceNumberPlayer;
					})
					if (lastBackendInputId1 !== -1)
						playerInputsPlayer1.splice(0, lastBackendInputId1 + 1);
					playerInputsPlayer1.forEach((input: { sequenceNumberPlayer: number, dy: number }) => {
						gameDataFront!.pongData!._player1Properties._y += input.dy;
					});
				}
				// regle lags joueur 2
				else if (side === "left") {
					const lastBackendInputId2 = playerInputsPlayer2.findIndex((input: { sequenceNumberPlayer: number, dy: number }) => {
						return gameDataFront!.p2!.sequenceNumber === input.sequenceNumberPlayer;
					})

					if (lastBackendInputId2 !== -1)
						playerInputsPlayer2.splice(0, lastBackendInputId2 + 1);
					playerInputsPlayer2.forEach((input: { sequenceNumberPlayer: number, dy: number }) => {
						gameDataFront!.pongData!._player2Properties._y += input.dy;
					});
				}

				const lastBackendBallMovementId = ballMovements.findIndex((move: { sequenceNumberBall: number, dx: number, dy: number }) => {
					return gameDataFront!.pongData._ballProperties._sequenceNumber === move.sequenceNumberBall;
				})

				if (lastBackendBallMovementId !== -1)
					ballMovements.splice(0, lastBackendBallMovementId + 1);
				ballMovements.forEach((move: { sequenceNumberBall: number, dx: number, dy: number }) => {
					gameDataFront!.pongData._ballProperties._x += move.dx;
					gameDataFront!.pongData._ballProperties._y += move.dy;
				})

				setGameDataRender(gameDataFront);
			}
		})

		socket.on("endGame", (gameDataBack: GameData) => {
			if (gameDataBack) {
				if (gameDataBack.p1!.p1Info.id === socket.id) {
					setPongResult(gameDataBack.pongData._player1Properties._endResult);
				}
				else if (gameDataBack!.p2!.p2Info.id === socket.id) {
					setPongResult(gameDataBack.pongData._player2Properties._endResult);
				}
			}
		})

		socket.on('nameAlreadyUsed', () => {
			alert("Name already used");
		})

		socket.on('nameNotAlreadyUsed', () => {
			setWelcomePage(false);
			setSearchInput(true);
		})

		socket.on("playerNotFound", () => {
			alert("Player not found");
		})

		socket.on("codeNotValid", () => {
			setLoadingPage(false);
			setSearchInput(true);
			alert("Code not valid");
		})

		socket.on("gameNotFound", () => {
			setLoadingPage(false);
			setSearchInput(true);
			alert("Game not found");
		})

		socket.on("noGameToWatch", () => {
			alert("No game to watch");
		})

		socket.on("playerDisconnetion", (gameDataBack: GameData) => {
			if (gameDataBack !== null) {
				if ((gameDataBack!.p1!.p1Info.id === socket.id || gameDataBack!.p2!.p2Info.id === socket.id || playerId !== null)) {
					setPong(false);
					setSearchInput(true);
					setResultOk(true);
					setLoadingPage(false);
					if (playerId !== null) {
						setEndBattleWatch(true)
						playerId = null;
						setPlayerIdRender(playerId);
					}
					else
						setPlayerLeft(true);

					socket.emit("removeGameBackend", gameDataBack);
				}
			}
		})

		socket.on("disconnectPlayer", (playerIdBack: string) => {

			if (playerIdBack == socket.id || playerId !== null) {
				setPong(false);
				setSearchInput(true);
				if (playerId !== null) {
					setEndBattleWatch(true)
					playerId = null;
					setPlayerIdRender(playerId);
				}
				else
					setPlayerLeft(true);
				setResultOk(true);
				setLoadingPage(false);
				gameDataFront = null;
				setGameDataRender(null);
			}
		})

		return () => {
			// Unregistering events....

			socket.off('found');
			socket.off('watchGame');
			socket.off('updateGame');
			socket.off('endGame');
			socket.off('codeNotValid');
			socket.off('gameNotFound');
			socket.off('nameAlreadyUsed');
			socket.off('nameNotAlreadyUsed');
			socket.off('playerNotFound');
			socket.off('noGameToWatch');
			socket.off('disconnectPlayer');
			socket.off('playerDisconnetion');
		}
	}, []);

	function watchPlayer() {
		socket.emit("watchPlayer", playerToWatch)
	}

	function askRetry() {
		setPong(false);
		setLoadingPage(true);
		setPongResult(null);

		if (gameDataRender) {

			if (gameDataRender.p1!.p1Info.id === socket.id) {
				gameDataRender.pongData!._player1Properties._retry = 1;
			}
			else if (gameDataRender!.p2!.p2Info.id === socket.id) {
				gameDataRender.pongData!._player2Properties._retry = 1;
			}
			socket.emit('askRetry', gameDataRender);
		}
	}

	const goToWelcomePage = () => {
		setPong(false);
		setSearchInput(true);
		setPongResult(null);

		if (playerIdRender === null) {
			if (gameDataRender) {
				(gameDataRender!.p1!.p1Info.id === socket.id) ?
					(socket.emit("quitPlayer", gameDataRender!.p2!.p2Info.id)) : (socket.emit("quitPlayer", gameDataRender!.p1!.p1Info.id));
			}
		}

		gameDataFront = null;
		setGameDataRender(null);
	}

	function cancelSearch() {
		setSearchInput(true);
		setLoadingPage(false);
		if (playerCode !== null) {
			let obj: { name: string | null, playerCode: string } = {
				name: name,
				playerCode: playerCode
			}
			socket.emit("deletePlayerPrivateList", obj);
			setPlayerCode(null);
		}
		socket.emit('cancelSearch');
	}

	function searchPlayer() {
		setLoadingPage(true);
		setSearchInput(false);
		let obj: { name: string | null, mode: string } = {
			name: name,
			mode: mode
		}
		socket.emit('searchPlayer', obj);
	}

	function changeMode() {
		if (mode === "normal")
			setMode("mode1");
		else if (mode === "mode1")
			setMode("mode2");
		else
			setMode("normal");
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
					name: string | null
				} =
			{
				inviteCode: playerCode,
				name: name,
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
		if (Date.now() > now + limitTimeBetweenCode || now === 0) {
			if (gameId !== "Generate a game id")
				socket.emit("deletePrivateGame", gameId);
			setNow(Date.now());
			inviteCode = genStringInviteCode(15);
			setGameId(inviteCode);
			let obj:
				{
					inviteCode: string,
					mode: string
				} =
			{
				inviteCode: inviteCode,
				mode: mode
			}
			socket.emit("createPrivateGame", obj);
		}
		else {
			alert("You need to wait before generating a new code(" + Math.round(Math.round((now + limitTimeBetweenCode) - Date.now()) / 1000) + " secondes(s))");
		}
	}

	const moveBall = () => {
		if (contextJs && gameDataFront) {
			if (gameDataFront.p1!.p1Info.id == socket.id || gameDataFront.p2!.p2Info.id == socket.id || playerId !== null) {
				let currentPongData = gameDataFront.pongData;

				sequenceNumberBall++;
				ballMovements.push({
					sequenceNumberBall: sequenceNumberBall,
					dx: currentPongData._ballProperties._speedX,
					dy: currentPongData._ballProperties._speedY
				});

				currentPongData._ballProperties._x += currentPongData._ballProperties._speedX;
				currentPongData._ballProperties._y += currentPongData._ballProperties._speedY;


				if (checkBallBoundsY(currentPongData._ballProperties._y + currentPongData._ballProperties._speedY, currentPongData)) {
					currentPongData._ballProperties._speedY *= -1
				}

				if (checkBallCollision(currentPongData._ballProperties, currentPongData._player1Properties, currentPongData) && currentPongData._ballProperties._speedX < 0) {
					currentPongData._ballProperties._speedX *= -1
				}

				else if (checkBallCollision(currentPongData._ballProperties, currentPongData._player2Properties, currentPongData) && currentPongData._ballProperties._speedX > 0) {
					currentPongData._ballProperties._speedX *= -1
				}

				if (currentPongData._ballProperties._x < 0) {
					if (currentPongData._player2Properties._score < currentPongData._endScore) {
						if (currentPongData._mode === "mode1") {
							currentPongData._player1Properties._height *= 1.1;
							currentPongData._player2Properties._height *= 0.9;
						}
						resetGame(1, currentPongData);
					}
					else {
						currentPongData._ballProperties._speedX = 0;
						currentPongData._ballProperties._speedY = 0;
					}
				}
				else if (currentPongData._ballProperties._x > currentPongData._pongCanvasWidth) {
					currentPongData._player1Properties._score++;
					if (currentPongData._player1Properties._score < currentPongData._endScore) {
						if (currentPongData._mode === "mode1") {
							currentPongData._player2Properties._height *= 1.1;
							currentPongData._player1Properties._height *= 0.9;
						}
						resetGame(-1, currentPongData);
					}
					else {
						currentPongData._ballProperties._speedX = 0;
						currentPongData._ballProperties._speedY = 0;
					}
				}
			}
			socket.emit("updateBall", { gameData: gameDataFront, sequenceNumber: sequenceNumberBall });
		}
	}

	useEffect(() => {
		window.addEventListener('resize', detectSize);

		if (gameDataRender) {
			setResolutionCoef({
				...resolutionCoef,
				width: windowResolution.winWidth / gameDataRender!.pongData._pongCanvasWidth,
				height: windowResolution.winHeight / gameDataRender!.pongData._pongCanvasHeight
			})
		}

		return () => {
			window.removeEventListener('resize', detectSize);
		}
	}, [windowResolution])

	const movePlayers = () => {
		let objBack: {
			keycode: string,
			side: string | null,
			gameData: GameData | null,
			sequenceNumberPlayer1: number,
			sequenceNumberPlayer2: number
		} = {
			keycode: "null",
			side: side,
			gameData: gameDataFront,
			sequenceNumberPlayer1: 0,
			sequenceNumberPlayer2: 0
		}

		if (contextJs && gameDataFront) {
			if (keys.w.isPressed) {
				objBack.keycode = "KeyW";
				if (side === "right" && gameDataFront.pongData._player1Properties._y >= 0) {
					sequenceNumberPlayer1++;
					playerInputsPlayer1.push({
						sequenceNumberPlayer: sequenceNumberPlayer1,
						dy: -gameDataFront.pongData._player1Properties._speedY
					})

					objBack.sequenceNumberPlayer1 = sequenceNumberPlayer1;
					gameDataFront.pongData._player1Properties._y -= gameDataFront.pongData._player1Properties._speedY;
				}
				else if (side === "left" && gameDataFront.pongData._player2Properties._y >= 0) {
					sequenceNumberPlayer2++;
					playerInputsPlayer2.push({
						sequenceNumberPlayer: sequenceNumberPlayer2,
						dy: -gameDataFront.pongData._player2Properties._speedY
					});
					objBack.sequenceNumberPlayer2 = sequenceNumberPlayer2;
					gameDataFront.pongData._player2Properties._y -= gameDataFront.pongData._player2Properties._speedY;
				}
			}
			if (keys.s.isPressed) {
				objBack.keycode = "KeyS";
				if (side === "right" && gameDataFront.pongData._player1Properties._y <= (gameDataFront.pongData._pongCanvasHeight - gameDataFront.pongData._player1Properties._height)) {
					sequenceNumberPlayer1++;
					playerInputsPlayer1.push({
						sequenceNumberPlayer: sequenceNumberPlayer1,
						dy: gameDataFront.pongData._player1Properties._speedY
					});
					objBack.sequenceNumberPlayer1 = sequenceNumberPlayer1;
					gameDataFront.pongData._player1Properties._y += gameDataFront.pongData._player1Properties._speedY;
				}
				else if (side === "left" && gameDataFront.pongData._player2Properties._y <= (gameDataFront.pongData._pongCanvasHeight - gameDataFront.pongData._player2Properties._height)) {
					sequenceNumberPlayer2++;
					playerInputsPlayer2.push({
						sequenceNumberPlayer: sequenceNumberPlayer2,
						dy: gameDataFront.pongData._player2Properties._speedY
					});
					objBack.sequenceNumberPlayer2 = sequenceNumberPlayer2;
					gameDataFront.pongData._player2Properties._y += gameDataFront.pongData._player2Properties._speedY;
				}
			}
		}
		socket.emit('keydown', objBack);
	}

	const changeBackgroundColor = () => {
		if (gameDataFront && gameDataFront.pongData._mode === "mode2") {
			if ((colorBack3 + 50) < 255)
				colorBack3 = colorBack3 + 50;
			else {
				colorBack3 = 0;
				if ((colorBack2 + 50) < 255)
					colorBack2 = colorBack2 + 50;
				else {
					colorBack2 = 0;
					if ((colorBack1 + 50) < 255)
						colorBack1 = colorBack1 + 50;
					else
						colorBack1 = 0;
				}
			}
			if (contextJs !== null) {
				setColorBack1Render(colorBack1);
				setColorBack2Render(colorBack2);
				setColorBack3Render(colorBack3);
			}
		}
	}

	useEffect(() => {
		const changeBack = setInterval(changeBackgroundColor, 500);

		const movePlayerInterval = setInterval(movePlayers, frameRate);
		const moveBallInterval = setInterval(moveBall, frameRate);
		return () => {
			clearInterval(movePlayerInterval);
			clearInterval(moveBallInterval);
			clearInterval(changeBack);
		};

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

	const draw = () => {
		if (context && gameDataRender && gameDataRender.pongData) {
			if (gameDataRender.p1!.p1Info.id == socket.id || gameDataRender.p2!.p2Info.id == socket.id || playerIdRender !== null) {
				let currentPongData = gameDataRender.pongData;
				context.clearRect(0, 0, currentPongData._pongCanvasWidth * resolutionCoef!.width, currentPongData._pongCanvasHeight * resolutionCoef!.height);

				// color background
				if (currentPongData._mode !== "mode2") {
					context.fillStyle = currentPongData._colorBackground;
					context.fillRect(0, 0, currentPongData._pongCanvasWidth * resolutionCoef!.width, currentPongData._pongCanvasHeight * resolutionCoef!.height);
				}
				else {
					context.fillStyle = `rgb(${colorBack1Render}, ${colorBack2Render}, ${colorBack3Render})`;
					context.fillRect(0, 0, currentPongData._pongCanvasWidth * resolutionCoef!.width, currentPongData._pongCanvasHeight * resolutionCoef!.height);
				}


				// draw player1
				let flipDisplayPlayer2 = (sideRender === "right" || playerSide === "right") ? 0 : ((gameDataRender.pongData._pongCanvasWidth - (gameDataRender.pongData._pongCanvasWidth / 39)) * resolutionCoef!.width);
				context.fillStyle = currentPongData._player1Color;
				context.fillRect(
					(currentPongData._player1Properties._x * resolutionCoef!.width) + flipDisplayPlayer2,
					currentPongData._player1Properties._y * resolutionCoef!.height,
					currentPongData._player1Properties._width * resolutionCoef!.width,
					currentPongData._player1Properties._height * resolutionCoef!.height
				);
				// draw player2
				context.fillStyle = currentPongData._player2Color;
				context.fillRect(
					(currentPongData._player2Properties._x * resolutionCoef!.width) - flipDisplayPlayer2,
					currentPongData._player2Properties._y * resolutionCoef!.height,
					currentPongData._player2Properties._width * resolutionCoef!.width,
					currentPongData._player2Properties._height * resolutionCoef!.height
				);

				let flipDisplayBall = (sideRender === "right" || playerSide === "right") ? 0 : ((currentPongData._ballProperties._x * resolutionCoef!.width) - ((gameDataRender.pongData._pongCanvasWidth / 2) * resolutionCoef!.width) + ((currentPongData._ballProperties._width / 2) * resolutionCoef!.width));

				// draw ball
				context.fillStyle = currentPongData._ballColor;
				context.fillRect(
					currentPongData._ballProperties._x * resolutionCoef!.width - (flipDisplayBall * 2),
					currentPongData._ballProperties._y * resolutionCoef!.height,
					currentPongData._ballProperties._width * resolutionCoef!.width,
					currentPongData._ballProperties._height * resolutionCoef!.width
				);

				let flipDisplayScore = (sideRender === "right" || playerSide === "right") ? 0 : (((currentPongData._pongCanvasWidth * 4 / 5 - currentPongData._pongCanvasWidth / 20) * resolutionCoef!.width) - ((currentPongData._pongCanvasWidth / 4.2) * resolutionCoef!.width));

				// draw scores
				context.fillStyle = currentPongData._scoreAndCenterLineColor;
				context.font = `${currentPongData._fontSize * ((resolutionCoef!.width + resolutionCoef!.height) / 2)}px sans-serif`;
				context.fillText(
					currentPongData._player1Properties._score.toString(),
					((currentPongData._pongCanvasWidth / 4.2) * resolutionCoef!.width) + flipDisplayScore,
					(currentPongData._pongCanvasHeight / 5) * resolutionCoef!.height
				);
				context.fillText(
					currentPongData._player2Properties._score.toString(),
					((currentPongData._pongCanvasWidth * 4 / 5 - currentPongData._pongCanvasWidth / 20) * resolutionCoef!.width) - flipDisplayScore,
					(currentPongData._pongCanvasHeight / 5) * resolutionCoef!.height
				);

				for (let i = (currentPongData._pongCanvasHeight / 50) * resolutionCoef!.height; i < currentPongData._pongCanvasHeight * resolutionCoef!.height; i += (currentPongData._pongCanvasWidth / 30) * resolutionCoef!.width) {
					context.fillRect(
						currentPongData._pongCanvasWidth / 2 * resolutionCoef!.width,
						i,
						(currentPongData._pongCanvasWidth / 160) * resolutionCoef!.width,
						(currentPongData._pongCanvasWidth / 160) * resolutionCoef!.width
					);
				}
			}
		}
	}

	useEffect(() => {
		const canvas = canvasRef.current;
		contextJs = canvas!.getContext('2d');
		setContext(contextJs);

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
						{
							<Button
								id="gameMode"
								className="button"
								text={mode}
								click={changeMode}
							/>
						}
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
								&& <Button
									className="button"
									text={gameId}
									click={generateGameId}
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
							<div className="watchGame">
								<Input
									id="inputWatchGame"
									placeholder="Player's name"
									type="text"
									value=""
									updateString={(e: any) => (setPlayerToWatch(e.target.value))}
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
					<div className="pongDiv">
						<canvas
							id="pongCanvas"
							hidden={!pong}
							ref={canvasRef}
							width={window.innerWidth}
							height={window.innerHeight}
						/>
					</div>
				}

				{
					!searchInput && rainbowMode && pong &&
					<div className="jamCatDiv">
						<img src={jamCat} id="dancingCat"></img>
					</div>
				}

				{
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

				{
					pongResult &&
					<div className="messageEndPong">
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
					</div>
				}
				{
					playerLeft &&
					<div className="messageOnCenter">
						<h1 className="flex items-center text-3xl font-extrabold dark:text-white justify-center">Your opponent left</h1>
						<Button id="okOpponentLeft" className="button" text="ok" click={() => (setPlayerLeft(false), setResultOk(true))} />
					</div>
				}

				{
					endBattleWatch &&
					<div className="gameIsFinishedDiv">
						<h1 className="flex items-center text-3xl font-extrabold dark:text-white justify-center">The game is finished</h1>
						<Button id="endBattleWatch" className="button" text="ok" click={() => (setEndBattleWatch(false))} />
					</div>
				}

			</div>

		</div>
	);
};
