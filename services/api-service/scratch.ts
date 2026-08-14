import { verifyAccessToken } from './src/utils/token.ts';
import { ENV } from './src/config/env.ts';

const token =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE1ZTFkZGI4LThhNDAtNGU3My05NjZjLTAyMjQyYjdlNTYyZSIsInJvbGUiOiJBRE1JTiIsImVtYWlsIjoiOTk5OTk5OTk5OUBib3QucHJvYnN0cmVldC5sb2NhbCIsImV4cCI6MTc4NjcyODg1M30._WZor--GWtjyI7mu4w9xSWP2A52A3L3f6cO7ynxke8Q';

async function run() {
	try {
		const payload = await verifyAccessToken(token);
		console.log('SUCCESS:', payload);
	} catch (err) {
		console.error('FAILED:', err.message, err);
	}
}
run();
