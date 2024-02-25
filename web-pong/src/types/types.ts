import { PongData } from "../classes/Classes";

export type GameData = {
	p1: { p1Info: { id: string, name: string }, p1Side: string, sequenceNumber: number, pongData: PongData } | undefined,
	p2: { p2Info: { id: string, name: string }, p2Side: string, sequenceNumber: number, pongData: PongData } | undefined,
	// pongData: PongData | undefined
};