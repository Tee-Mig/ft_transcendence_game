import React, { useRef, useEffect, useState } from 'react'

const UseCanvas = (draw: any, gameData: any, setContext: any) => {

	let canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		let canvas = canvasRef.current;
		setContext(canvas!.getContext('2d'));
		let animationFrameId: any;

		const render = () => {
			draw(gameData);
			animationFrameId = window.requestAnimationFrame(render);
		}
		render()

		return (() => { window.cancelAnimationFrame(animationFrameId) });
	}, [draw])

	return (canvasRef);
}

export default UseCanvas