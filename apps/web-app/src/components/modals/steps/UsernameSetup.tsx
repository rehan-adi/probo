import { useState } from 'react';
import api from '@/config/axios';
import { Loader } from 'lucide-react';
import { motion } from 'framer-motion';

interface UsernameSetupProps {
	onNext: () => void;
}

export default function UsernameSetup({ onNext }: UsernameSetupProps) {
	const [username, setUsername] = useState('');
	const [isCheckingUsername, setIsCheckingUsername] = useState(false);
	const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

	const handleCheckUsername = async (val: string) => {
		if (val.length < 3) {
			setUsernameAvailable(null);
			return;
		}
		setIsCheckingUsername(true);
		try {
			const res = await api.get(`/onboarding/username/check?username=${val}`);
			setUsernameAvailable(res.data.data.isAvailable);
		} catch (error) {
			// ignore
		} finally {
			setIsCheckingUsername(false);
		}
	};

	const handleSetUsername = async () => {
		if (!usernameAvailable) return;

		try {
			await api.post('/onboarding/username', { username });
			onNext();
		} catch (error: any) {
			alert(error.response?.data?.error || 'Failed to set username');
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.98 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.98 }}
			transition={{ duration: 0.3 }}
			className="flex flex-col h-full justify-center max-w-[310px] mx-auto w-full py-2"
		>
			<div className="text-center mb-6">
				<h2 className="text-lg font-medium text-black dark:text-white tracking-tight">Pick a username</h2>
				<p className="text-gray-500 dark:text-gray-400 text-[13px] mt-1">This is how other traders will see you.</p>
			</div>

			<div className="flex flex-col relative">
				<div className="relative">
					<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
					<input
						type="text"
						value={username}
						onChange={(e) => {
							const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
							setUsername(val);
							handleCheckUsername(val);
						}}
						placeholder="username"
						className={`w-full pl-9 pr-12 py-3 bg-gray-50 dark:bg-[#28292E] border rounded-xl focus:outline-none transition-all text-[13px] text-gray-900 dark:text-white placeholder:text-gray-500 ${usernameAvailable === false
								? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
								: usernameAvailable === true
									? 'border-green-500 focus:ring-green-500/20 focus:border-green-500'
									: 'border-gray-200 dark:border-white/5'
							}`}
					/>
					<div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm flex items-center">
						{isCheckingUsername && <Loader className="w-4 h-4 animate-spin text-gray-400" />}
						{usernameAvailable === true && <span className="text-green-500 font-bold text-[15px]">✓</span>}
						{usernameAvailable === false && <span className="text-red-500 text-[11px] font-bold uppercase tracking-wider">Taken</span>}
					</div>
				</div>

				<button
					className={`mt-4 px-4 py-3 flex justify-center items-center rounded-xl w-full text-[13px] font-medium transition-all shadow-sm cursor-pointer ${usernameAvailable && username.length >= 3
							? 'bg-blue-600 text-white hover:bg-blue-700'
							: 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed'
						}`}
					disabled={!usernameAvailable || username.length < 3}
					onClick={handleSetUsername}
				>
					Continue
				</button>
			</div>
		</motion.div>
	);
}
