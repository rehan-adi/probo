import { Link } from 'react-router-dom';
import NotFoundIcon from '@/assets/images/404.avif';

export default function NotFoundPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen text-center px-2 bg-[#f4f4f5]">
			<img src={NotFoundIcon} alt="404 Not Found" className="w-[420px] max-w-full mb-6" />
			<h1 className="md:text-4xl text-2xl font-semibold mb-4">Uh oh!</h1>
			<p className="mb-6 text-sm text-[#757575]">
				Sorry, the page you were looking for was not found
			</p>
			<Link to="/" className="px-8 py-2.5 text-sm font-semibold bg-[#262626] text-white rounded-xl transition duration-200">
				Go to Home
			</Link>
		</div>
	);
}
