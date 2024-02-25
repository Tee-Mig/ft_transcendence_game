export class PlayerDefaultProperties {
	_playerWidth: number;
	_playerHeight: number;
	_playerVelocityY: number;

	constructor(
		pongCanvasWidth: number,
		pongCanvasHeight: number,
		playerVelocityY: number = 5,
	) {
		this._playerWidth = pongCanvasWidth / 80;
		this._playerHeight = pongCanvasHeight / 4;
		this._playerVelocityY = playerVelocityY;
	}
}

export class PlayerProperties {
	_x: number;
	_y: number;
	_width: number;
	_height: number;
	_speedY: number;
	_score: number;
	_endResult: string;
	_retry: number;

	constructor(
		x: number,
		y: number,
		width: number,
		height: number,
		speedY: number,
		score: number = 0,
		endResult: string = "none",
		retry: number = 0
	) {
		this._retry = retry;
		this._endResult = endResult;
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
	_ballSpeed: number;

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
		ballSpeed: number = 1,
		direction: number = 1,
		sequenceNumber: number = 0,
		mode: string = "normal"
	) {
		this._ballWidth = playerWidth;
		this._ballHeight = playerWidth;
		this._mode = mode;
		if (this._mode === "rainbow")
			this._ballSpeed = 3.5;
		else
			this._ballSpeed = ballSpeed;
		this._x = pongCanvasWidth / 2;
		this._y = pongCanvasHeight / 2;
		this._width = this._ballWidth;
		this._height = this._ballHeight;
		this._speedX = pongCanvasWidth / 500 * this._ballSpeed * direction; // 1.92
		this._speedY = pongCanvasHeight / 250 * this._ballSpeed; // 2.16
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
	_fontSize: number;
	_mode: string;

	constructor(
		pongCanvasWidth: number = 0,
		pongCanvasHeight: number = 0,
		mode: string = "normal",
		ballSpeed: number = 1
	) {
		this._mode = mode;
		this._pongCanvasWidth = pongCanvasWidth;
		this._pongCanvasHeight = pongCanvasHeight;
		this._fontSize = pongCanvasWidth / 20;
		this._playerDefaultProperties = new PlayerDefaultProperties(pongCanvasWidth, pongCanvasHeight);
		this._ballProperties = new BallProperties(pongCanvasWidth, pongCanvasHeight,
			this._playerDefaultProperties._playerWidth, ballSpeed, undefined, undefined, this._mode);

		// init player1
		this._player1Properties = new PlayerProperties(
			this._pongCanvasWidth / 150,
			(this._pongCanvasHeight / 2) - (this._playerDefaultProperties._playerHeight / 2),
			this._playerDefaultProperties._playerWidth,
			this._playerDefaultProperties._playerHeight,
			this._playerDefaultProperties._playerVelocityY
		);
		// init player2
		this._player2Properties = new PlayerProperties(
			this._pongCanvasWidth - (this, this._pongCanvasWidth / 150) - this._playerDefaultProperties._playerWidth,
			(this._pongCanvasHeight / 2) - (this._playerDefaultProperties._playerHeight / 2),
			this._playerDefaultProperties._playerWidth,
			this._playerDefaultProperties._playerHeight,
			this._playerDefaultProperties._playerVelocityY
		);
	}
}