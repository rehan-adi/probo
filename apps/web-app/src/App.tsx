import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuthStore } from './store/auth';
import OnboardModal from '@/components/modals/OnboardModal';

function App() {
	const hydrate = useAuthStore((state) => state.hydrate);

	useEffect(() => {
		hydrate();
	}, []);

	return (
		<>
			<Navbar />
			<OnboardModal />
			<div className="py-40 bg-[#f4f4f5]">This is Markets listing</div>
			<Footer />
		</>
	);
}

export default App;
