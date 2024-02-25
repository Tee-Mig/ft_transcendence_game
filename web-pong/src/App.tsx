import React from 'react';
import { WebsocketProvider, socket } from './context/WebsocketContext';
import { Websocket } from './components/Front';

function App() {

	return (
		<WebsocketProvider value={socket}>
			<Websocket />
		</WebsocketProvider>
	);
}

export default App;
