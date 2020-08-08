import dgram from 'dgram';
import { Socket } from 'net';

const PORT = 48899;
const COMMAND_PORT = 5577;
const server = dgram.createSocket('udp4');

server.on('error', err => {
	console.error(`Server error: ${err}`);
	server.close();
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
		server.on('message', onReply);
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

const devices = new Map();

function onReply(buffer, source) {
	if (buffer.equals(broadcastMessage)) return;
	const message = buffer.toString();
	const parts = message.split(',');
	const info = {
		address: parts[0],
		id: parts[1],
		model: parts[2],
		lastSeen: new Date(),
	};
	if (!devices.has(info.id)) {
		console.log('New device', info);
		setDeviceLight(info, {});
	}
	devices.set(info.id, info);
}

function sendCommand(socket, data) {
	socket.write(Buffer.from(data));
}

function setDeviceLight(device, color) {
	const client = new Socket();
	client.on('data', buffer => {
		console.log(`Received from ${device.id} ${buffer}`, buffer);
	});
	client.on('close', () => {
		console.log('Disconnected from', device.id);
	});
	client.connect(COMMAND_PORT, device.address, () => {
		console.log('Connected to device', device.id);
		sendCommand(client, [
			0xef, 0x01, 0x77
		]);
		sendCommand(client, [
			0x41,
			// RGB
			0xff, 0x00, 0x00,
			// ???
			0x00, 0x00, 0x0f,
		]);
	});
}
