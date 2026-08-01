import '@/lib/i18n';
import './index.css';
import App from './App.tsx';
import { createRoot } from 'react-dom/client';
import { queryClient } from '@/lib/queryClient.ts';
import { QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id';

createRoot(document.getElementById('root')!).render(
	<>
		<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</GoogleOAuthProvider>
	</>,
);
