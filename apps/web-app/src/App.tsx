import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import EventsPage from '@/pages/Events';
import WalletPage from '@/pages/Wallet';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PrivateRoute from './PrivateRoute';
import NotFoundPage from './pages/NotFound';
import RechargePage from './pages/Recharge';
import { useAuthStore } from './store/auth';
import VerificationgePage from './pages/Verification';
import OnboardModal from '@/components/modals/OnboardModal';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TransactionHistoryPage from './pages/TransactionHistory';

function App() {
	const hydrate = useAuthStore((state) => state.hydrate);
	const isHydrated = useAuthStore((state) => state.isHydrated);

	useEffect(() => {
		hydrate();
	}, []);

	if (!isHydrated) {
		return (
			<div className="w-full bg-[#f4f4f5] flex justify-center items-center h-screen">
				<Loader2 className="animate-spin w-8 h-8" />
			</div>
		);
	}

	return (
		<BrowserRouter>
			<Navbar />
			<OnboardModal />
			<Routes>
				<Route path="/" element={<EventsPage />} />
				<Route element={<PrivateRoute />}>
					<Route path="/wallet">
						<Route index element={<WalletPage />} />
						<Route path="recharge" element={<RechargePage />} />
					</Route>
					<Route path='/verification' element={<VerificationgePage />}/>
					<Route path='/transaction-history' element={<TransactionHistoryPage />}/>
				</Route>
				<Route path="*" element={<NotFoundPage />} />
			</Routes>
			<Footer />
		</BrowserRouter>
	);
}

export default App;
