import { io } from 'socket.io-client';

const url = import.meta.env.VITE_STREAM_SERVICE_URL;

export const socket = io(url, {
	autoConnect: false,
	timeout: 5000,
	transports: ['websocket', 'polling'],
});
