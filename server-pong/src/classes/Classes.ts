export class PlayerDefaultProperties {
	_playerWidth: number;
	_playerHeight: number;
	_playerSpeedY: number;

	constructor(
		pongCanvasWidth: number,
		pongCanvasHeight: number,
		playerSpeedMultiplier: number = 1
	) {
		this._playerWidth = pongCanvasWidth / 80;
		this._playerHeight = pongCanvasHeight / 4;
		this._playerSpeedY = (pongCanvasHeight / 216) * playerSpeedMultiplier;
	}
}

export class PlayerProperties {
	_x: number;
	_y: number;
	_width: number;
	_height: number;
	_speedY: number;
	_score: number;
	_retry: number;
	_endResult: string | undefined;

	constructor(
		x: number,
		y: number,
		width: number,
		height: number,
		speedY: number,
		score: number = 0,
		retry: number = 0
	) {
		this._retry = retry;
		this._x = x;
		this._y = y;
		this._width = width;
		this._height = height;
		this._speedY = speedY;
		this._score = score;
	}
}

export class BallProperties {
	_ballWidth: number;
	_ballHeight: number;
	_ballSpeedMultiplier: number;

	_x: number;
	_y: number;
	_width: number;
	_height: number;
	_speedX: number;
	_speedY: number;
	_minSpeedX: number;
	_minSpeedY: number;
	_maxSpeedX: number;
	_maxSpeedY: number;
	_sequenceNumber: number;
	_mode: string;

	constructor(
		pongCanvasWidth: number,
		pongCanvasHeight: number,
		playerWidth: number,
		ballSpeedMultiplier: number = 1,
		direction: number = 1,
		sequenceNumber: number = 0,
		mode: string = "normal"
	) {
		this._ballWidth = playerWidth;
		this._ballHeight = playerWidth;
		this._mode = mode;
		this._ballSpeedMultiplier = ballSpeedMultiplier;
		if (this._mode === "mode2")
			this._ballSpeedMultiplier *= 3.5;
		this._x = pongCanvasWidth / 2;
		this._y = pongCanvasHeight / 2;
		this._width = this._ballWidth;
		this._height = this._ballHeight;
		this._speedX = pongCanvasWidth / 500 * this._ballSpeedMultiplier * direction;
		this._speedY = pongCanvasHeight / 250 * this._ballSpeedMultiplier;
		this._minSpeedX = this._speedX * 0.75;
		this._minSpeedY = this._speedY * 0.75;
		this._maxSpeedX = this._speedX * 2;
		this._maxSpeedY = this._speedY * 2;
		this._sequenceNumber = sequenceNumber;
	}
}

// default settings of pong
export class PongData {
	_pongCanvasWidth: number;
	_pongCanvasHeight: number;
	_playerDefaultProperties: PlayerDefaultProperties;
	_ballProperties: BallProperties;
	_player1Properties: PlayerProperties;
	_player2Properties: PlayerProperties;
	_colorBackground: string;
	_player1Color: string;
	_player2Color: string;
	_ballColor: string;
	_ballSpeed: number;
	_scoreAndCenterLineColor: string;
	_mode: string;
	_endScore: number;
	_defaultBallDirection: number;
	_fontSize: number;

	constructor(
		pongCanvasWidth: number = 1920,
		pongCanvasHeight: number = 1080,
		mode: string = "normal",
		ballSpeedMultiplier: number = 1,
		player1SpeedMultiplier: number = 1,
		player2SpeedMultiplier: number = 1,
		player1SizeMultiplier: number = 1,
		player2SizeMultiplier: number = 1,
		colorBackground: string = "#252930",
		player1Color: string = "FF14FB",
		player2Color: string = "FF14FB",
		ballColor: string = "FF14FB",
		scoreAndCenterLineColor: string = "FF14FB",
		endScore: number = 11,
		defaultBallDirection: number = 1
	) {
		this._ballSpeed = ballSpeedMultiplier;
		this._pongCanvasWidth = pongCanvasWidth;
		this._pongCanvasHeight = pongCanvasHeight;
		this._mode = mode;
		this._playerDefaultProperties = new PlayerDefaultProperties(pongCanvasWidth, pongCanvasHeight, 1);
		this._ballProperties = new BallProperties(pongCanvasWidth, pongCanvasHeight,
			this._playerDefaultProperties._playerWidth, ballSpeedMultiplier, defaultBallDirection, 0, this._mode);

		// init player1
		this._player1Properties = new PlayerProperties(
			this._pongCanvasWidth / 150,
			(this._pongCanvasHeight / 2) - (this._playerDefaultProperties._playerHeight / 2),
			this._playerDefaultProperties._playerWidth,
			(this._playerDefaultProperties._playerHeight) * ((player1SizeMultiplier / 10) + 1),
			this._playerDefaultProperties._playerSpeedY * player1SpeedMultiplier
		);
		// init player2
		this._player2Properties = new PlayerProperties(
			this._pongCanvasWidth - (this._pongCanvasWidth / 150) - this._playerDefaultProperties._playerWidth,
			(this._pongCanvasHeight / 2) - (this._playerDefaultProperties._playerHeight / 2),
			this._playerDefaultProperties._playerWidth,
			(this._playerDefaultProperties._playerHeight) * ((player2SizeMultiplier / 10) + 1),
			this._playerDefaultProperties._playerSpeedY * player2SpeedMultiplier
		);
		this._colorBackground = colorBackground;
		this._player2Color = player2Color;
		this._player1Color = player1Color;
		this._ballColor = ballColor;
		this._scoreAndCenterLineColor = scoreAndCenterLineColor;
		this._mode = mode;
		this._endScore = endScore;
		this._defaultBallDirection = defaultBallDirection;
		this._fontSize = pongCanvasWidth / 20;
	}

	scale() {
		console.log("Je suis dans test de pongData");
	}
}