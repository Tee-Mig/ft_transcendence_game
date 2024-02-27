import { useContext, useEffect, useRef, useState } from "react";
import { WebsocketContext } from "../context/WebsocketContext";
import { GameData } from "../../../server-pong/dist/types/types";
import { PlayerProperties, PongData } from "../../../server-pong/dist/classes/Classes";
import Button from "./Button";
import { checkBallBoundsY, checkBallCollision, resetGame, updateDirectionPlayer1, updateDirectionPlayer2, whereBallHitPlayer } from "../pongFunctions/pongFunctions";
import { Socket } from "socket.io-client";
import Input from "./Input";
import Backdrop from "./Backdrop";
import { Interval } from "@nestjs/schedule";

export const Websocket = () => {

	// *pour responsivite du jeu
	const [windowResolution, detectResolution] = useState<{ winWidth: number, winHeight: number }>({
		winWidth: window.innerWidth,
		winHeight: window.innerHeight
	})

	// *pour canvas du jeu
	const socket = useContext(WebsocketContext);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

	// *variables jeu
	const [side, setSide] = useState<string | null>(null);
	let [gameData, setGameData] = useState<GameData | null>(null);
	const [name, setName] = useState<string | null>(null);
	const [resolutionCoef, setResolutionCoef] = useState<{ width: number, height: number }>({
		width: 0,
		height: 0
	});
	const [keys, setKeys] = useState<{ w: { isPressed: boolean }, s: { isPressed: boolean } }>({
		w: { isPressed: false },
		s: { isPressed: false }
	});

	// variables pour regler lags entre serveur et client
	const [playerInputsPlayer1, setPlayerInputsPlayer1] = useState<{ sequenceNumberPlayer: number, dy: number }[]>([]);
	const [playerInputsPlayer2, setPlayerInputsPlayer2] = useState<{ sequenceNumberPlayer: number, dy: number }[]>([]);
	let [sequenceNumberPlayer1, setSequenceNumberPlayer1] = useState<number>(0);
	let [sequenceNumberPlayer2, setSequenceNumberPlayer2] = useState<number>(0);
	const [ballMovements, setBallMovements] = useState<{ sequenceNumberBall: number, dx: number, dy: number }[]>([]);
	let [sequenceNumberBall, setSequenceNumberBall] = useState<number>(0);

	// *pour composants agencement -
	const [pong, setPong] = useState<boolean>(false);
	const [searchInput, setSearchInput] = useState<boolean>(false);
	const [welcomePage, setWelcomePage] = useState<boolean>(true);
	const [loadingPage, setLoadingPage] = useState<boolean>(false);
	const [pongResult, setPongResult] = useState<string | null>(null);
	const [playerLeft, setPlayerLeft] = useState<boolean>(false);
	const [resultOk, setResultOk] = useState<boolean>(false);

	// *autres variables
	const [playerCode, setPlayerCode] = useState<string | null>(null);
	const [gameId, setGameId] = useState<string>("Generate a game id");
	let [now, setNow] = useState<number>(0);
	// let now: number = 0;
	let inviteCode: string = "null";
	const limitTimeBetweenCode: number = 3 * 60000; // 3 minutes
	let [playerToWatch, setPlayerToWatch] = useState<string | undefined>();
	let playerId: string | null = null;

	// TODO mettre image localement ? car pas reussi a charger localement
	const loadingImg = 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExemxnNm9rMXJ3aGl4YW1tYzl1eHN2eHc0bHd1ZnR0ODN0emhkd2N3byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/vbeNMLuswd7RR25lah/giphy.gif';

	const detectSize = () => {
		detectResolution({
			winWidth: window.innerWidth,
			winHeight: window.innerHeight
		})
	}

	useEffect(() => {
		socket.on('found', (gameDataBack: GameData) => {
			if (gameDataBack.p1!.p1Info.id === socket.id) {
				setSide(gameDataBack.p1!.p1Side);
			}
			else if (gameDataBack.p2!.p2Info.id === socket.id) {
				setSide(gameDataBack.p2!.p2Side);
			}

			// TODO a mettre a jour en React -> mettre catJam au centre de canvas en transparent
			// if (mode === "rainbow")
			// 	document.getElementById("catJam")!.style.display = "inline";
			if (gameDataBack.p1!.p1Info.id === socket.id || gameDataBack.p2!.p2Info.id === socket.id) {

				setResolutionCoef({
					width: windowResolution.winWidth / gameDataBack!.pongData._pongCanvasWidth,
					height: windowResolution.winHeight / gameDataBack!.pongData._pongCanvasHeight
				});
				setGameData(gameDataBack);
				setPong(true);
				setLoadingPage(false);
			}
		})

		socket.on('watchGame', (info: { gameData: GameData, playerId: string }) => {
			setGameData(info.gameData);
			playerId = info.playerId;

			setPong(true);
			setSearchInput(false);
		})

		socket.on("updateGame", (backendPlayers: GameData[]) => {
			let myGameid
			if (playerId === null)
				myGameid = backendPlayers.findIndex((element: GameData) => element.p1!.p1Info.id === socket.id || element.p2!.p2Info.id === socket.id);
			else
				myGameid = backendPlayers.findIndex((element: GameData) => element.p1!.p1Info.id === playerId || element.p2!.p2Info.id === playerId);
			if (myGameid !== -1) {
				let gameDataTmp = backendPlayers[myGameid]
				if (side === "right") {
					const lastBackendInputId1 = playerInputsPlayer1.findIndex((input: { sequenceNumberPlayer: number, dy: number }) => {
						return gameDataTmp!.p1!.sequenceNumber === input.sequenceNumberPlayer;
					})
					if (lastBackendInputId1 !== -1)
						playerInputsPlayer1.splice(0, lastBackendInputId1 + 1);
					playerInputsPlayer1.forEach((input: { sequenceNumberPlayer: number, dy: number }) => {
						gameDataTmp.pongData!._player1Properties._y += input.dy;
					});
				}
				else if (side === "left") {
					const lastBackendInputId2 = playerInputsPlayer2.findIndex((input: { sequenceNumberPlayer: number, dy: number }) => {
						return gameDataTmp!.p2!.sequenceNumber === input.sequenceNumberPlayer;
					})

					if (lastBackendInputId2 !== -1)
						playerInputsPlayer2.splice(0, lastBackendInputId2 + 1);
					playerInputsPlayer2.forEach((input: { sequenceNumberPlayer: number, dy: number }) => {
						gameDataTmp.pongData!._player2Properties._y += input.dy;
					});
				}

				const lastBackendBallMovementId = ballMovements.findIndex((move: { sequenceNumberBall: number, dx: number, dy: number }) => {
					return gameDataTmp.pongData._ballProperties._sequenceNumber === move.sequenceNumberBall;
				})

				if (lastBackendBallMovementId !== -1)
					ballMovements.splice(0, lastBackendBallMovementId + 1);
				ballMovements.forEach((move: { sequenceNumberBall: number, dx: number, dy: number }) => {
					gameDataTmp.pongData._ballProperties._x += move.dx;
					gameDataTmp.pongData._ballProperties._y += move.dy;
				})

				setGameData(gameDataTmp);
			}
			else
				console.log("pas de game id");
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

		socket.on("playerDisconnetion", (gameDataBack: GameData) => {
			if (gameDataBack !== null) {
				if ((gameDataBack!.p1!.p1Info.id === socket.id || gameDataBack!.p2!.p2Info.id === socket.id)) {
					setPong(false);
					setSearchInput(true);
					setPlayerLeft(true);
					setResultOk(true);
					setLoadingPage(false)
				}
			}
			socket.emit("removeGameBackend", gameDataBack);
		})

		return () => {
			// Unregistering events....

			socket.off('found');
			// socket.off('gameNotFound');
			socket.off('playerNotFound');
			socket.off('nameAlreadyUsed');
			socket.off('nameNotAlreadyUsed');
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

		if (gameData) {

			if (gameData.p1!.p1Info.id === socket.id) {
				gameData.pongData!._player1Properties._retry = 1;
			}
			else if (gameData!.p2!.p2Info.id === socket.id) {
				gameData.pongData!._player2Properties._retry = 1;
			}
			socket.emit('askRetry', gameData);
		}
	}

	const goToWelcomePage = () => {
		setPong(false);
		setSearchInput(true);
		setPongResult(null);
		setGameId("Generate a game id");
		now = Date.now();
		playerId = null;

		socket.emit('removeGameBackend', gameData);


		// TODO ces 2 la marchent pas ??
		// gameData = undefined;
		// setGameDataReact(gameData);
		// id = undefined;
		// setIdReact(undefined);
	}

	function cancelSearch() {
		setSearchInput(true);
		setLoadingPage(false);
		socket.emit('cancelSearch');
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
					name: string | null
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
		if (Date.now() > now + limitTimeBetweenCode || now === 0) {
			console.log("generate code"); //
			if (gameId !== "Generate a game id")
				socket.emit("deletePrivateGame", { inviteCode });
			setNow(Date.now());
			inviteCode = genStringInviteCode(15);
			setGameId(inviteCode);

			let obj:
				{
					inviteCode: string,
					name: string | null
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

	useEffect(() => {
		window.addEventListener('resize', detectSize);

		if (gameData) {
			setResolutionCoef({
				...resolutionCoef,
				width: windowResolution.winWidth / gameData!.pongData._pongCanvasWidth,
				height: windowResolution.winHeight / gameData!.pongData._pongCanvasHeight
			})
		}

		return () => {
			window.removeEventListener('resize', detectSize);
		}
	}, [windowResolution])

	const moveBall = () => {
		if (context && gameData && gameData.pongData) {
			if (gameData.p1!.p1Info.id == socket.id || gameData.p2!.p2Info.id == socket.id) {

				let currentPongData = gameData.pongData;
				setSequenceNumberBall(sequenceNumberBall++);
				setBallMovements([...ballMovements, {
					sequenceNumberBall: sequenceNumberBall,
					dx: currentPongData._ballProperties._speedX,
					dy: currentPongData._ballProperties._speedY
				}])

				if (checkBallBoundsY(currentPongData._ballProperties._y + currentPongData._ballProperties._speedY, currentPongData))
					currentPongData._ballProperties._speedY *= -1;

				if (checkBallCollision(currentPongData._ballProperties, currentPongData._player1Properties, currentPongData) && currentPongData._ballProperties._speedX < 0) {
					if (currentPongData._ballProperties._x <= currentPongData._player1Properties._x + currentPongData._player1Properties._width) {
						updateDirectionPlayer1(whereBallHitPlayer(currentPongData._ballProperties, currentPongData._player1Properties), currentPongData._ballProperties, currentPongData);
						currentPongData._ballProperties._speedX *= -1;
					}
				}

				else if (checkBallCollision(currentPongData._ballProperties, currentPongData._player2Properties, currentPongData) && currentPongData._ballProperties._speedX > 0) {
					if (currentPongData._ballProperties._x + currentPongData._ballProperties._width >= currentPongData._player2Properties._x) {
						updateDirectionPlayer2(whereBallHitPlayer(currentPongData._ballProperties, currentPongData._player2Properties), currentPongData._ballProperties, currentPongData);
						currentPongData._ballProperties._speedX *= -1;
					}
				}

				if (currentPongData._ballProperties._x < 0) {
					currentPongData._player2Properties._score++;
					if (currentPongData._player2Properties._score < 1)
						resetGame(1, currentPongData);
					else {
						currentPongData._ballProperties._speedX = 0;
						currentPongData._ballProperties._speedY = 0;
					}
				}
				else if (currentPongData._ballProperties._x > currentPongData._pongCanvasWidth) {
					currentPongData._player1Properties._score++;
					if (currentPongData._player1Properties._score < 1)
						resetGame(-1, currentPongData);
					else {
						currentPongData._ballProperties._speedX = 0;
						currentPongData._ballProperties._speedY = 0;
					}
				}

				socket.emit("updateBall", { gameData: gameData, sequenceNumber: sequenceNumberBall });
			}
		}
	}

	useEffect(() => {
		const interval = setInterval(moveBall, 15);
		return () => { clearInterval(interval) };
	}, [])

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
			gameData: gameData,
			sequenceNumberPlayer1: 0,
			sequenceNumberPlayer2: 0
		}

		console.log("gameData === ");
		console.log(gameData);
		if (gameData && gameData.pongData) {
			if (keys.w.isPressed) {
				console.log("w pressed");
				objBack.keycode = "KeyW";
				if (side === "right" && gameData.pongData._player1Properties._y >= 0) {
					setSequenceNumberPlayer1(sequenceNumberPlayer1++);
					setPlayerInputsPlayer1([...playerInputsPlayer1, {
						sequenceNumberPlayer: sequenceNumberPlayer1,
						dy: -gameData.pongData._player1Properties._speedY
					}])
					objBack.sequenceNumberPlayer1 = sequenceNumberPlayer1;
					// setGameData({
					// 	...gameData, pongData: {
					// 		...gameData.pongData, _player1Properties: {
					// 			...gameData.pongData._player1Properties, _y: gameData.pongData._player1Properties._y - gameData.pongData._player1Properties._speedY
					// 		}
					// 	}
					// })
				}
				else if (side === "left" && gameData.pongData._player2Properties._y >= 0) {
					setSequenceNumberPlayer2(sequenceNumberPlayer2++);
					setPlayerInputsPlayer2([...playerInputsPlayer2, {
						sequenceNumberPlayer: sequenceNumberPlayer2,
						dy: -gameData.pongData._player2Properties._speedY
					}])
					objBack.sequenceNumberPlayer2 = sequenceNumberPlayer2;
					// setGameData({
					// 	...gameData, pongData: {
					// 		...gameData.pongData, _player2Properties: {
					// 			...gameData.pongData._player2Properties, _y: gameData.pongData._player2Properties._y - gameData.pongData._player2Properties._speedY
					// 		}
					// 	}
					// })
				}
				socket.emit('keydown', objBack);
			}
			if (keys.s.isPressed) {
				console.log("s pressed");
				objBack.keycode = "KeyS";
				if (side === "right" && gameData.pongData._player1Properties._y <= (gameData.pongData._pongCanvasHeight - gameData.pongData._player1Properties._height)) {
					setSequenceNumberPlayer1(sequenceNumberPlayer1++);
					setPlayerInputsPlayer1([...playerInputsPlayer1, {
						sequenceNumberPlayer: sequenceNumberPlayer1,
						dy: gameData.pongData._player1Properties._speedY
					}])
					objBack.sequenceNumberPlayer1 = sequenceNumberPlayer1;
					// setGameData({
					// 	...gameData, pongData: {
					// 		...gameData.pongData, _player1Properties: {
					// 			...gameData.pongData._player1Properties, _y: gameData.pongData._player1Properties._y + gameData.pongData._player1Properties._speedY
					// 		}
					// 	}
					// })
				}
				else if (side === "left" && gameData.pongData._player2Properties._y <= (gameData.pongData._pongCanvasHeight - gameData.pongData._player2Properties._height)) {
					setSequenceNumberPlayer2(sequenceNumberPlayer2++);
					setPlayerInputsPlayer2([...playerInputsPlayer2, {
						sequenceNumberPlayer: sequenceNumberPlayer2,
						dy: gameData.pongData._player2Properties._speedY
					}])
					objBack.sequenceNumberPlayer2 = sequenceNumberPlayer2;
					// setGameData({
					// 	...gameData, pongData: {
					// 		...gameData.pongData, _player2Properties: {
					// 			...gameData.pongData._player2Properties, _y: gameData.pongData._player2Properties._y + gameData.pongData._player2Properties._speedY
					// 		}
					// 	}
					// })
				}
				socket.emit('keydown', objBack);
			}
		}
	}

	useEffect(() => {
		const interval = setInterval(movePlayers, 15);
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

	const draw = () => {
		if (context && gameData) {
			if (gameData.p1?.p1Info.id == socket.id || gameData.p2?.p2Info.id == socket.id) {
				context.clearRect(0, 0, gameData.pongData._pongCanvasWidth * resolutionCoef!.width, gameData.pongData._pongCanvasHeight * resolutionCoef!.height);

				// color background
				context.fillStyle = gameData.pongData._colorBackground;
				context.fillRect(0, 0, gameData.pongData._pongCanvasWidth * resolutionCoef!.width, gameData.pongData._pongCanvasHeight * resolutionCoef!.height);


				// draw player1
				context.fillStyle = gameData.pongData._player1Color;
				context.fillRect(
					gameData.pongData._player1Properties._x * resolutionCoef!.width,
					gameData.pongData._player1Properties._y * resolutionCoef!.height,
					gameData.pongData._player1Properties._width * resolutionCoef!.width,
					gameData.pongData._player1Properties._height * resolutionCoef!.height
				);
				// draw player2
				context.fillStyle = gameData.pongData._player1Color;
				context.fillRect(
					gameData.pongData._player2Properties._x * resolutionCoef!.width,
					gameData.pongData._player2Properties._y * resolutionCoef!.height,
					gameData.pongData._player2Properties._width * resolutionCoef!.width,
					gameData.pongData._player2Properties._height * resolutionCoef!.height
				);

				// draw ball
				context.fillStyle = gameData.pongData._ballColor;
				context.fillRect(
					gameData.pongData._ballProperties._x * resolutionCoef!.width,
					gameData.pongData._ballProperties._y * resolutionCoef!.height,
					gameData.pongData._ballProperties._width * resolutionCoef!.width,
					gameData.pongData._ballProperties._height * resolutionCoef!.width
				);

				// draw scores
				context.fillStyle = gameData.pongData._scoreAndCenterLineColor;
				context.font = `${gameData.pongData._fontSize * ((resolutionCoef!.width + resolutionCoef!.height) / 2)}px sans-serif`; // todo adapter a l'ecran selon taille
				context.fillText(
					gameData.pongData._player1Properties._score.toString(),
					(gameData.pongData._pongCanvasWidth / 4.2) * resolutionCoef!.width,
					(gameData.pongData._pongCanvasHeight / 5) * resolutionCoef!.height
				);
				context.fillText(
					gameData.pongData._player2Properties._score.toString(),
					(gameData.pongData._pongCanvasWidth * 4 / 5 - gameData.pongData._pongCanvasWidth / 20) * resolutionCoef!.width,
					(gameData.pongData._pongCanvasHeight / 5) * resolutionCoef!.height
				);

				for (let i = (gameData.pongData._pongCanvasHeight / 50) * resolutionCoef!.height; i < gameData.pongData._pongCanvasHeight * resolutionCoef!.height; i += (gameData.pongData._pongCanvasWidth / 30) * resolutionCoef!.width) {
					context.fillRect(
						gameData.pongData._pongCanvasWidth / 2 * resolutionCoef!.width,
						i,
						(gameData.pongData._pongCanvasWidth / 160) * resolutionCoef!.width,
						(gameData.pongData._pongCanvasWidth / 160) * resolutionCoef!.width
					);
				}
			}
		}
	}

	useEffect(() => {
		const canvas = canvasRef.current;
		setContext(canvas!.getContext('2d'));

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
								&& (Date.now() < now + limitTimeBetweenCode)
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
									click={() => { navigator.clipboard.writeText(gameId); console.log(`${Date.now()} < ${now + limitTimeBetweenCode}`) }}
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
					<div className="text-center">
						<strong>Width = {windowResolution.winWidth}</strong>
						<strong>Height = {windowResolution.winHeight}</strong>
					</div>
				}

				<canvas
					id="pongCanvas"
					hidden={!pong}
					ref={canvasRef}
					// width={1920}
					// height={1080}
					width={window.innerWidth}
					height={window.innerHeight}
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

				{
					// TODO mettre Backdrop pour qu'on puisse pas cliquer sur les boutons derrieres?
					pongResult &&
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
						<Button id="okOpponentLeft" className="button" text="ok" click={() => (setPlayerLeft(false), setResultOk(true))} />
						{/* {<Backdrop onClick={setFalseLeftPlayer} />} */}
					</div>
				}

			</div>

		</div>
	);
};
