import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { queryClient } from '@/lib/queryClient.ts';
import { QueryClientProvider } from '@tanstack/react-query';

createRoot(document.getElementById('root')!).render(
	<>
		<QueryClientProvider client={queryClient}>
			<App />
		</QueryClientProvider>
	</>,
);
