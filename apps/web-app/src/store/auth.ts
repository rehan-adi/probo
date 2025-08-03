import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

interface User {
	id: string;
	phone: string;
	role: string;
	isNewUser?: boolean;
}

interface AuthState {
	user: User | null;
	token: string | null;
	isHydrated: boolean;
	login: (token: string) => void;
	logout: () => void;
	hydrate: () => void;
	setUserWithToken: (user: User, token: string) => void;
	isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	token: null,
	isHydrated: false,

	login: (token) => {
		try {
			const decoded = jwtDecode<User>(token);
			localStorage.setItem('token', token);
			set({ user: decoded, token });
		} catch (err) {
			console.error('Invalid token:', err);
		}
	},

	setUserWithToken: (user, token) => {
		localStorage.setItem('token', token);
		set({ user, token });
	},

	logout: () => {
		localStorage.removeItem('token');
		set({ user: null, token: null });
	},

	hydrate: () => {
		const token = localStorage.getItem('token');
		let decodedUser: User | null = null;

		if (token) {
			try {
				decodedUser = jwtDecode<User>(token);
			} catch (err) {
				console.error('Failed to decode token:', err);
			}
		}

		set({
			token: token || null,
			user: decodedUser,
			isHydrated: true,
		});
	},

	isLoggedIn: () => {
		const token = localStorage.getItem('token');
		return !!token;
	},
}));
