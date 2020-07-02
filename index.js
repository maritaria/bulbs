import dgram from 'dgram';

const PORT = 48899;

const server = dgram.createSocket('udp4');

server.on('error', err => {
	console.error(`Server error: ${err}`);
	server.close();
});

server.on('message', (msg, rinfo) => {
	console.log(`Received: ${msg} from ${rinfo.address}:${rinfo.port}`);
});

server.on('listening', () => {
	const address = server.address();
	console.log(`Listening ${address.address}:${address.port}`);
});

server.bind(PORT);

// Device detector
const broadcastMessage = Buffer.from('HF-A11ASSISTHREAD');
let broadcastTimer = null;

server.on('listening', () => {
	server.setBroadcast(true);
	if (!broadcastTimer) {
		console.log('Starting broadcast timer');
		broadcastTimer = setInterval(detectDevices, 5 * 1000);
		detectDevices();
	}
});

server.on('close', () => {
	if (broadcastTimer) {
		console.log('Cancelling broadcast timer');
		cancelInterval(broadcastTimer);
		broadcastTimer = null;
	}
});

function detectDevices() {
	console.log('Sending detection broadcast...');
	server.send(broadcastMessage, PORT, '255.255.255.255');
}
