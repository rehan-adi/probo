import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

interface User {
	id: string;
	phone: string;
	role: string;
}

interface AuthState {
	user: User | null;
	token: string | null;
	login: (token: string) => void;
	logout: () => void;
	hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	// user: null,

	user: null,
		// id: 'default-id',
		// phone: '0000000000',
		// role: 'guest',


	token: null,

	login: (token: string) => {
		const decoded = jwtDecode<User>(token);
		localStorage.setItem('token', token);
		set({ user: decoded, token });
	},

	logout: () => {
		localStorage.removeItem('token');
		set({ user: null, token: null });
	},

	hydrate: () => {
		const token = localStorage.getItem('token');
		if (!token) return;
		try {
			const decoded = jwtDecode<User>(token);
			set({ token, user: decoded });
		} catch {
			localStorage.removeItem('token');
		}
	},
}));
