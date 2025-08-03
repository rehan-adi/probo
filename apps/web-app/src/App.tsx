import { useEffect } from 'react';
import EventsPage from '@/pages/Events';
import WalletPage from '@/pages/Wallet';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuthStore } from './store/auth';
import NotFoundPage from './pages/NotFound';
import OnboardModal from '@/components/modals/OnboardModal';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
	const hydrate = useAuthStore((state) => state.hydrate);

	useEffect(() => {
		hydrate();
	}, []);

	return (
		<BrowserRouter>
			<Navbar />
			<OnboardModal />
			<Routes>
				<Route path="/" element={<EventsPage />} />
				<Route path="/wallet" element={<WalletPage />} />
				<Route path="*" element={<NotFoundPage />} />
			</Routes>
			<Footer />
		</BrowserRouter>
	);
}

export default App;
