import axios from 'axios';
import { useAuthStore } from '@/store/auth';

const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
	withCredentials: true, // Crucial for sending cookies
});

// Response interceptor for handling 401s (token refresh)
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		// If error is 401 and we haven't retried yet
		if (error.response?.status === 401 && !originalRequest._retry) {
			// Skip refresh logic if this was already a refresh call, login call, logout, or initial session check
			const excludedUrls = ['/auth/refresh', '/auth/verify-otp', '/auth/google/callback', '/auth/apple/callback', '/auth/telegram/callback', '/auth/logout', '/auth/me'];
			const isExcluded = excludedUrls.some(url => originalRequest.url.includes(url));

			if (isExcluded) {
				// If refresh failed, clear state locally without calling logout endpoint again
				if (originalRequest.url.includes('/auth/refresh')) {
					useAuthStore.getState().logout();
				}
				return Promise.reject(error);
			}

			originalRequest._retry = true;

			try {
				// Attempt to refresh token
				await api.post('/auth/refresh');
				
				// Retry the original request. The cookies will be automatically sent.
				return api(originalRequest);
			} catch (refreshError) {
				// Refresh token expired or invalid
				useAuthStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	}
);

export default api;
