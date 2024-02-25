import React, { useRef, useEffect } from 'react'
import UseCanvas from './useCanvas'

const PongCanvas = (props: any) => {

	let { draw, gameData, setContext, ...rest } = props;
	let canvasRef = UseCanvas(draw, gameData, setContext);

	return <canvas ref={canvasRef} {...rest} />
}

export default PongCanvas