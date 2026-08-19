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
		origin: true,
		credentials: true,
		methods: ['GET', 'POST'],
	},
	transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
	console.log(`Client connected: ${socket.id}`);

	// Subscribe only to tickers for an array or single symbol
	socket.on('SUBSCRIBE_TICKERS', (symbols: string | string[]) => {
		const list = Array.isArray(symbols) ? symbols : [symbols];
		list.forEach((sym) => socket.join(`ticker:${sym}`));
		console.log(`Client ${socket.id} subscribed tickers:`, list);
	});

	socket.on('UNSUBSCRIBE_TICKERS', (symbols: string | string[]) => {
		const list = Array.isArray(symbols) ? symbols : [symbols];
		list.forEach((sym) => socket.leave(`ticker:${sym}`));
		console.log(`Client ${socket.id} unsubscribed tickers:`, list);
	});

	// Subscribe to full market stream (ticker + orderbook + activity) for a single event
	socket.on('SUBSCRIBE_MARKET', (symbol: string) => {
		socket.join(`market:${symbol}`);
		console.log(`Client ${socket.id} subscribed full market: ${symbol}`);
	});

	socket.on('UNSUBSCRIBE_MARKET', (symbol: string) => {
		socket.leave(`market:${symbol}`);
		console.log(`Client ${socket.id} unsubscribed full market: ${symbol}`);
	});

	// Subscribe to user private notifications (portfolio/orders)
	socket.on('SUBSCRIBE_USER', (userId: string) => {
		socket.join(`user:${userId}`);
		socket.join(userId);
		console.log(`Client ${socket.id} subscribed user: ${userId}`);
	});

	socket.on('UNSUBSCRIBE_USER', (userId: string) => {
		socket.leave(`user:${userId}`);
		socket.leave(userId);
		console.log(`Client ${socket.id} unsubscribed user: ${userId}`);
	});

	// Legacy fallback support
	socket.on('SUBSCRIBE', (room: string) => {
		socket.join(room);
		socket.join(`ticker:${room}`);
		socket.join(`market:${room}`);
		socket.join(`user:${room}`);
	});

	socket.on('UNSUBSCRIBE', (room: string) => {
		socket.leave(room);
		socket.leave(`ticker:${room}`);
		socket.leave(`market:${room}`);
		socket.leave(`user:${room}`);
	});

	socket.on('disconnect', () => {
		console.log(`Client disconnected: ${socket.id}`);
	});
});
