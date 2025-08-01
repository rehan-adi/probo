import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OnboardModal from '@/components/modals/OnboardModal';

function App() {
	return (
		<>
			<Navbar />
			<OnboardModal />
			<div className="py-40">This is Markets listing</div>
			<Footer />
		</>
	);
}

export default App;
