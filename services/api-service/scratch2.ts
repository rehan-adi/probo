import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';

const app = new Hono();
app.get('/', (c) => {
	const token = getCookie(c, 'accessToken');
	return c.text(`Token: ${token}`);
});

const req = new Request('http://localhost/', {
	headers: {
		Cookie:
			'accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE1ZTFkZGI4LThhNDAtNGU3My05NjZjLTAyMjQyYjdlNTYyZSIsInJvbGUiOiJBRE1JTiIsImVtYWlsIjoiOTk5OTk5OTk5OUBib3QucHJvYnN0cmVldC5sb2NhbCIsImV4cCI6MTc4NjcyODg1M30._WZor--GWtjyI7mu4w9xSWP2A52A3L3f6cO7ynxke8Q',
	},
});

async function run() {
	const res = await app.fetch(req);
	console.log(await res.text());
}
run();
