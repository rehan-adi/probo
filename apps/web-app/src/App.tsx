import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import EventsPage from '@/pages/Events';
import WalletPage from '@/pages/Wallet';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PrivateRoute from './PrivateRoute';
import RechargePage from '@/pages/Recharge';
import NotFoundPage from '@/pages/NotFound';
import { useAuthStore } from '@/store/auth';
import MarketDetails from '@/pages/EventDetails';
import CreateEvent from '@/pages/admin/CreateEvent';
import VerificationgePage from '@/pages/Verification';
import OnboardModal from '@/components/modals/OnboardModal';
import TransactionHistoryPage from '@/pages/TransactionHistory';
import VerificationListsPage from '@/pages/admin/VerificationLists';
import VerificationDetailsPage from '@/pages/admin/VerificationDetails';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

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
				{/* public routes  */}
				<Route path="/" element={<Navigate to="/events" replace />} />
				<Route path="/events" element={<EventsPage />} />
				<Route path="/events/:symbol" element={<MarketDetails />} />

				{/* all private routes */}
				<Route element={<PrivateRoute />}>
					{/* user specific routes */}
					<Route path="/wallet">
						<Route index element={<WalletPage />} />
						<Route path="recharge" element={<RechargePage />} />
					</Route>
					<Route path="/verification" element={<VerificationgePage />} />
					<Route path="/transaction-history" element={<TransactionHistoryPage />} />

					{/* admin specific routes  */}
					<Route path="/events/create" element={<CreateEvent />} />
					<Route path="/verifications" element={<VerificationListsPage />} />
					<Route path="/verifications/:id" element={<VerificationDetailsPage />} />
				</Route>
				<Route path="*" element={<NotFoundPage />} />
			</Routes>
			<Footer />
		</BrowserRouter>
	);
}

export default App;
