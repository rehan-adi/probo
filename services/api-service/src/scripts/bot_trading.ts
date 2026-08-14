import { Redis } from 'ioredis';
import { prisma } from '@probstreet/database';
import { pushToQueue } from '@/libs/redis/queue';
import { EVENTS } from '../config/constants';

const API_URL = 'http://localhost:3000/api/v1/capi';

const BOTS = [
	{ name: 'Satoshi N.', phone: '7777777701', style: 'aggressive', pref: 'YES' },
	{ name: 'Alex H.', phone: '7777777702', style: 'moderate', pref: 'NO' },
	{ name: 'Maria G.', phone: '7777777703', style: 'frequent', pref: 'YES' },
	{ name: 'John D.', phone: '7777777704', style: 'whale', pref: 'NO' },
	{ name: 'TraderX', phone: '7777777705', style: 'moderate', pref: 'YES' },
	{ name: 'Probstreet_Whale', phone: '7777777706', style: 'passive', pref: 'NO' },
	{ name: 'CryptoKing', phone: '7777777707', style: 'frequent', pref: 'YES' },
];

const REHAN_USER = { name: 'Rehan', phone: '9748151073' };
const AMM_USER = { name: 'AMM Bot', phone: '7777777700' };

async function loginUser(phone: string, name: string) {
	const email = `${phone}@bot.probstreet.local`;

	const loginRes = await fetch(`${API_URL}/auth/init-signin`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email }),
	});
	const loginData: any = await loginRes.json();

	//@ts-ignore
	if (!loginData.success)
		throw new Error(
			`Login failed for ${email}: ${loginData.message || JSON.stringify(loginData.error)}`,
		);

	const redis = new Redis('redis://127.0.0.1:6380');
	const otp = await redis.get(`otp:${email}`);
	redis.disconnect();
	if (!otp) throw new Error(`OTP not found in Redis for ${email}`);

	const verifyRes = await fetch(`${API_URL}/auth/verify-otp`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, otp }),
	});

	const cookie = verifyRes.headers.get('set-cookie');
	console.log('COOKIE:', cookie);
	const match = cookie?.match(/accessToken=([^;]+)/);
	const token = match ? match[1] : null;
	if (!token) {
		const text = await verifyRes.text();
		throw new Error(
			`Token not found for ${email}. Status: ${verifyRes.status}, Body: ${text}, Headers: ${JSON.stringify(Object.fromEntries(verifyRes.headers))}`,
		);
	}

	return token;
}

async function createMarket(token: string) {
	const body = {
		title: `Will Tesla (TSLA) stock price reach $300 by end of the 14 days? - ${Date.now()}`,
		thumbnail:
			'https://s3.coinmarketcap.com/static-gravity/image/34d989f64bf44f84bf3dfd398f6d2b67.png',
		categoryId: '11111111-1111-1111-1111-111111111111',
		sourceOfTruth: 'Official NASDAQ closing price.',
		eos: 'The market will resolve to YES if Tesla (TSLA) reaches $300 before the end of the year.',
		rules:
			'1. Market resolves based on official market data.\n2. Settlement will occur within 24 hours.',
		startTime: new Date().toISOString(),
		endTime: new Date(Date.now() + 86400000 * 14).toISOString(), // 14 days future
	};

	console.log(`Sending token: [${token}]`);
	const res = await fetch(`${API_URL}/market/create`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Cookie: `accessToken=${token}`,
		},
		body: JSON.stringify(body),
	});
	const data = await res.json();

	//@ts-ignore
	if (!data.success) throw new Error(`Create Market failed: ${data.message}`);

	//@ts-ignore
	return data.data;
}

async function placeOrder(
	token: string,
	marketId: string,
	symbol: string,
	side: string,
	action: string,
	price: number,
	quantity: number,
) {
	const res = await fetch(`${API_URL}/order/buy`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Cookie: `accessToken=${token}`,
		},
		body: JSON.stringify({
			marketId,
			symbol,
			side,
			action,
			orderType: 'LIMIT',
			price,
			quantity,
		}),
	});
	const text = await res.text();
	try {
		const data = JSON.parse(text);
		if (!data.success) {
			console.log(`\n    [API Error] ${data.message || data.error || JSON.stringify(data)}`);
		}
		return data.success;
	} catch (e) {
		console.log(`\n    [Fetch Error] ${text}`);
		return false;
	}
}

async function setupUser(phone: string, name: string) {
	let token = await loginUser(phone, name);

	const email = `${phone}@bot.probstreet.local`;
	const updateData: any = { username: name.replace(/\s+/g, '').toLowerCase() };
	if (phone === '9999999999') {
		updateData.role = 'ADMIN';
	}

	await prisma.user.updateMany({
		where: { email: email },
		data: updateData,
	});

	// If it's admin, login again to get a token with the ADMIN role in the JWT payload
	if (phone === '9999999999') {
		token = await loginUser(phone, name);
	}

	const user = await prisma.user.findFirst({ where: { email: email } });
	if (user) {
		await prisma.wallet.updateMany({
			where: { userId: user.id },
			data: { balance: 10000000 }, // 10 million INR
		});
		await pushToQueue(EVENTS.CREATE_USER, {
			id: user.id,
			username: user.username,
			phone: user.phone,
			kycVerificationStatus: 'VERIFIED',
			paymentVerificationStatus: 'VERIFIED',
		});
		await pushToQueue(EVENTS.INIT_BALANCE, {
			userId: user.id,
			amount: 10000000,
			locked: 0.0,
		});
	}
	return token;
}

async function seedLiquidity(token: string, marketId: string, symbol: string) {
	console.log(`Seeding initial liquidity for market: ${symbol}`);

	const fairValue = 5.0;

	// Seed bids (YES)
	for (let p = 0.5; p < fairValue; p += 0.5) {
		const qty = Math.floor(Math.random() * 500) + 100;
		process.stdout.write(`  [AMM] Placing BUY YES ${qty} shares @ ₹${p.toFixed(1)}... `);
		let successYes = await placeOrder(token, marketId, symbol, 'YES', 'BUY', p, qty);
		console.log(successYes ? '✅ Success' : '❌ Failed');
		await new Promise((r) => setTimeout(r, 50));
	}

	// Seed asks (NO)
	for (let p = 0.5; p < 10 - fairValue; p += 0.5) {
		const qty = Math.floor(Math.random() * 500) + 100;
		process.stdout.write(`  [AMM] Placing BUY NO ${qty} shares @ ₹${p.toFixed(1)}... `);
		let successNo = await placeOrder(token, marketId, symbol, 'NO', 'BUY', p, qty);
		console.log(successNo ? '✅ Success' : '❌ Failed');
		await new Promise((r) => setTimeout(r, 50));
	}

	console.log('Liquidity seeding complete.');
}

async function runBotTrading() {
	console.log('--- Probstreet Live Trading Bot Simulator ---');

	console.log('1. Setting up Admin...');
	const adminToken = await setupUser('9999999999', 'Admin');

	console.log('2. Setting up Rehan (Test Account)...');
	await setupUser(REHAN_USER.phone, REHAN_USER.name);

	console.log('2.5. Setting up AMM Bot...');
	const ammToken = await setupUser(AMM_USER.phone, AMM_USER.name);

	console.log('3. Setting up Bot Traders...');
	const botTokens: string[] = [];
	for (const bot of BOTS) {
		const t = await setupUser(bot.phone, bot.name);
		botTokens.push(t);
	}
	console.log('All bots logged in and funded with 10M INR.');

	console.log('4. Creating FIFA market...');
	const catId = '11111111-1111-1111-1111-111111111111';
	await prisma.category.upsert({
		where: { id: catId },
		update: {},
		create: {
			id: catId,
			categoryName: 'Finance',
		},
	});

	const market = await createMarket(adminToken);
	console.log(`Created Market: ${market.symbol} (${market.id})`);

	console.log('Waiting 3 seconds for AMM Bot to seed initial liquidity...');
	await seedLiquidity(ammToken, market.id, market.symbol);
	await new Promise((r) => setTimeout(r, 1000));

	console.log('5. Starting continuous trading simulation...');

	let iteration = 0;
	let fairValue = 5.5; // Starting fair value

	while (true) {
		iteration++;

		// Slowly drift fair value
		if (Math.random() > 0.8) {
			const drift = Math.random() > 0.5 ? 0.5 : -0.5;
			fairValue += drift;
			if (fairValue > 8.5) fairValue = 8.5;
			if (fairValue < 1.5) fairValue = 1.5;
		}

		const botIdx = Math.floor(Math.random() * BOTS.length);
		const bot = BOTS[botIdx];
		const token = botTokens[botIdx];

		// Logic for bot behavior
		let side = Math.random() > 0.3 ? bot.pref : bot.pref === 'YES' ? 'NO' : 'YES';
		const action = 'BUY';

		let price = 5;
		let qty = 10;
		let delay = 2000;

		const randomOffset = (max: number) => {
			const offset = Math.random() * max;
			// round to nearest 0.5
			return Math.round(offset * 2) / 2;
		};

		// Helper to ensure price is in valid range
		const clamp = (p: number) => Math.max(0.5, Math.min(9.5, p));

		// Fair value for the side being bought
		const fv = side === 'YES' ? fairValue : 10 - fairValue;

		switch (bot.style) {
			case 'aggressive': // Occasional taker
				// Takers cross the spread (price worse than fair value)
				price = clamp(fv + randomOffset(1.5) + 0.5);
				qty = Math.floor(Math.random() * 50) + 10;
				delay = Math.floor(Math.random() * 5000) + 3000; // Rare aggressive takes
				break;
			case 'moderate': // Spread across the book
				// Makers rest below fair value
				price = clamp(fv - randomOffset(2) - 0.5);
				qty = Math.floor(Math.random() * 100) + 20;
				delay = Math.floor(Math.random() * 300) + 200;
				break;
			case 'frequent': // Maker spammer close to spread
				price = clamp(fv - randomOffset(1) - 0.5);
				qty = Math.floor(Math.random() * 50) + 10;
				delay = Math.floor(Math.random() * 150) + 100;
				break;
			case 'whale': // Big maker walls deep
				price = clamp(fv - randomOffset(3) - 1.5);
				qty = Math.floor(Math.random() * 500) + 200;
				delay = Math.floor(Math.random() * 3000) + 2000;
				break;
			case 'passive': // Deep maker very far from spread
				price = clamp(fv - randomOffset(2) - 2.0);
				qty = Math.floor(Math.random() * 100) + 20;
				delay = Math.floor(Math.random() * 500) + 300;
				break;
		}

		process.stdout.write(
			`[${iteration}] ${bot.name} placing ${action} ${side} ${qty} shares @ ₹${price.toFixed(1)}... `,
		);
		const success = await placeOrder(token, market.id, market.symbol, side, action, price, qty);
		if (success) {
			console.log('✅ Success');
		} else {
			console.log('❌ Failed');
		}

		await new Promise((r) => setTimeout(r, delay));
	}
}

runBotTrading().catch((err) => console.error('Script Error:', err));
