import { Hono } from 'hono';
import { Server } from 'socket.io';
import { createServer } from 'http';

const app = new Hono();

app.get('/api/v1/health', (c) => {
	return c.json(
		{
			success: true,
			message: 'stream service is up and running',
		},
		200,
	);
});

export const httpServer = createServer(app.fetch as any);

export const io = new Server(httpServer, {
	cors: {
		origin: 'localhost:5173',
		credentials: true,
		methods: ['GET', 'POST'],
	},
	transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
	console.log(`Client connected: ${socket.id}`);

	socket.on('SUBSCRIBE', (symbol: string) => {
		socket.join(symbol);
		console.log(`Client ${socket.id} joined symbol: ${symbol}`);
	});

	socket.on('UNSUBSCRIBE', (symbol: string) => {
		socket.leave(symbol);
		console.log(`Client ${socket.id} left symbol: ${symbol}`);
	});

	socket.on('disconnect', () => {
		console.log(`Client disconnected: ${socket.id}`);
	});
});
