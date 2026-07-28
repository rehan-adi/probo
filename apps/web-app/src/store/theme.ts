import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
	theme: 'light' | 'dark';
	toggleTheme: () => void;
	setTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>()(
	persist(
		(set) => ({
			theme: 'dark',
			toggleTheme: () =>
				set((state) => {
					const newTheme = state.theme === 'light' ? 'dark' : 'light';
					if (newTheme === 'dark') {
						document.documentElement.classList.add('dark');
					} else {
						document.documentElement.classList.remove('dark');
					}
					return { theme: newTheme };
				}),
			setTheme: (theme) =>
				set(() => {
					if (theme === 'dark') {
						document.documentElement.classList.add('dark');
					} else {
						document.documentElement.classList.remove('dark');
					}
					return { theme };
				}),
		}),
		{
			name: 'theme-storage',
		},
	),
);
