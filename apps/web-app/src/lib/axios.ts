import axios from 'axios';

export const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1/capi',
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},
});

export const adminApi = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL?.replace('/capi', '/aapi') || 'http://localhost:3000/api/v1/aapi',
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},
});
