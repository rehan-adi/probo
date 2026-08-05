import '@/lib/i18n';
import './index.css';
import App from './App.tsx';
import { createRoot } from 'react-dom/client';
import { queryClient } from '@/lib/queryClient.ts';
import { QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id';

if (window.opener && window.location.hash.includes('access_token')) {
	const params = new URLSearchParams(window.location.hash.substring(1));
	const accessToken = params.get('access_token');
	if (accessToken) {
		window.opener.postMessage({ type: 'DISCORD_AUTH', accessToken }, window.location.origin);
		window.close();
	}
} else {
	createRoot(document.getElementById('root')!).render(
		<>
			<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
				<QueryClientProvider client={queryClient}>
					<App />
				</QueryClientProvider>
			</GoogleOAuthProvider>
		</>,
	);
}
