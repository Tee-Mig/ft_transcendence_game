import { PongData, BallProperties, PlayerProperties } from "../classes/Classes";

export function checkBallBoundsY(nextPositionBallY: number, pongData: PongData | undefined): boolean {
	return (nextPositionBallY < 0 || nextPositionBallY > pongData!._pongCanvasHeight);
}

export function resetGame(direction: number, pongData: PongData | undefined) {
	pongData!._ballProperties = new BallProperties(pongData!._pongCanvasWidth, pongData!._pongCanvasHeight,
		pongData!._playerDefaultProperties._playerWidth, pongData!._ballSpeed, direction, undefined, pongData!._mode);
}

export function checkPlayerBounds(nextPositionPlayerY: number, pongData: PongData): boolean {
	return (nextPositionPlayerY < 0 || nextPositionPlayerY + pongData._playerDefaultProperties._playerHeight > pongData._pongCanvasHeight);
}

export function checkBallCollision(ballPos: BallProperties, playerPos: PlayerProperties, pongData: PongData | undefined): boolean {
	return ((ballPos._x + ballPos._width + 3) > playerPos._x)
		&& (ballPos._x < (playerPos._x + playerPos._width + 3))
		&& (ballPos._y < (playerPos._y + playerPos._height + 3))
		&& ((ballPos._y + ballPos._height + 3) > playerPos._y)
}

export function degreeToRad(degree: number): number {
	return (degree * (Math.PI / 180));
}

export function updateDirectionPlayer1(playerSegment: string, ball: BallProperties, pongdata: PongData | undefined) {
	let px: number | undefined;
	let py: number | undefined;

	if (playerSegment === "top") {
		px = ball._speedX * Math.cos(degreeToRad(45)) - ball._speedY * Math.sin(degreeToRad(45));
		py = ball._speedX * Math.sin(degreeToRad(45)) + ball._speedY * Math.sin(degreeToRad(45));
	}
	else if (playerSegment === "middleTop") {
		px = ball._speedX * Math.cos(degreeToRad(15)) - ball._speedY * Math.sin(degreeToRad(15));
		py = ball._speedX * Math.sin(degreeToRad(15)) + ball._speedY * Math.sin(degreeToRad(15));
	}
	else if (playerSegment === "middle") {
		px = ball._speedX * Math.cos(degreeToRad(0)) - ball._speedY * Math.sin(degreeToRad(0));
		py = ball._speedX * Math.sin(degreeToRad(0)) + ball._speedY * Math.sin(degreeToRad(0));
	}
	else if (playerSegment === "middleBottom") {
		px = ball._speedX * Math.cos(degreeToRad(-15)) - ball._speedY * Math.sin(degreeToRad(-15));
		py = ball._speedX * Math.sin(degreeToRad(-15)) + ball._speedY * Math.sin(degreeToRad(-15));
	}
	else {
		px = ball._speedX * Math.cos(degreeToRad(-45)) - ball._speedY * Math.sin(degreeToRad(-45));
		py = ball._speedX * Math.sin(degreeToRad(-45)) + ball._speedY * Math.sin(degreeToRad(-45));
	}

	if (px < pongdata!._ballProperties._minSpeedX)
		px = pongdata!._ballProperties._minSpeedX;
	else if (px > pongdata!._ballProperties._maxSpeedX)
		px = pongdata!._ballProperties._maxSpeedX;
	else
		ball._speedX = px
	if (py < pongdata!._ballProperties._minSpeedY)
		py = pongdata!._ballProperties._minSpeedY;
	else if (py > pongdata!._ballProperties._maxSpeedY)
		py = pongdata!._ballProperties._maxSpeedY;
	else
		ball._speedY = py
}

export function updateDirectionPlayer2(playerSegment: string, ball: BallProperties, pongdata: PongData | undefined) {
	let px: number | undefined;
	let py: number | undefined;

	if (playerSegment === "top") {
		px = ball._speedX * Math.cos(degreeToRad(-45)) - ball._speedY * Math.sin(degreeToRad(45));
		py = ball._speedX * Math.sin(degreeToRad(-45)) + ball._speedY * Math.sin(degreeToRad(45));
	}
	else if (playerSegment === "middleTop") {
		px = ball._speedX * Math.cos(degreeToRad(-15)) - ball._speedY * Math.sin(degreeToRad(15));
		py = ball._speedX * Math.sin(degreeToRad(-15)) + ball._speedY * Math.sin(degreeToRad(15));
	}
	else if (playerSegment === "middle") {
		px = ball._speedX * Math.cos(degreeToRad(0)) - ball._speedY * Math.sin(degreeToRad(0));
		py = ball._speedX * Math.sin(degreeToRad(0)) + ball._speedY * Math.sin(degreeToRad(0));
	}
	else if (playerSegment === "middleBottom") {
		px = ball._speedX * Math.cos(degreeToRad(15)) - ball._speedY * Math.sin(degreeToRad(-15));
		py = ball._speedX * Math.sin(degreeToRad(15)) + ball._speedY * Math.sin(degreeToRad(-15));
	}
	else {
		px = ball._speedX * Math.cos(degreeToRad(45)) - ball._speedY * Math.sin(degreeToRad(-45));
		py = ball._speedX * Math.sin(degreeToRad(45)) + ball._speedY * Math.sin(degreeToRad(-45));
	}

	if (px < pongdata!._ballProperties._minSpeedX)
		px = pongdata!._ballProperties._minSpeedX;
	else if (px > pongdata!._ballProperties._maxSpeedX)
		px = pongdata!._ballProperties._maxSpeedX;
	else
		ball._speedX = px
	if (py < pongdata!._ballProperties._minSpeedY)
		py = pongdata!._ballProperties._minSpeedY;
	else if (py > pongdata!._ballProperties._maxSpeedY)
		py = pongdata!._ballProperties._maxSpeedY;
	else
		ball._speedY = py
}

export function whereBallHitPlayer(ball: BallProperties, player: PlayerProperties): string {
	let playerSegment = Math.ceil(player._height / 5);

	if (ball._y < (player._y + playerSegment))
		return "top";
	else if (ball._y < (player._y + (playerSegment * 2)))
		return "middleTop";
	else if (ball._y < (player._y + (playerSegment * 3)))
		return "middle";
	else if (ball._y < (player._y + (playerSegment * 4)))
		return "middleBottom";
	else
		return "Bottom";
}