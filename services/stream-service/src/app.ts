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
		origin: '*',
	},
});

io.on('connection', (socket) => {
	console.log(`Client connected: ${socket.id}`);

	socket.on('subscribe', (symbol: string) => {
		socket.join(symbol);
		console.log(`Client ${socket.id} joined symbol: ${symbol}`);
	});

	socket.on('disconnect', () => {
		console.log(`Client disconnected: ${socket.id}`);
	});
});
