import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';
import api from '@/config/axios';

interface UsernameModalProps {
	onClose: () => void;
	usernameChangedAt?: string | Date | null;
}

export function UsernameModal({ onClose, usernameChangedAt }: UsernameModalProps) {
	const { user, updateUser } = useAuthStore();
	const [newUsername, setNewUsername] = useState(user?.username || '');
	const [loading, setLoading] = useState(false);

	const checkCooldown = () => {
		if (!usernameChangedAt) return { canChange: true };

		const lastChanged = new Date(usernameChangedAt);
		const fourteenDaysAgo = new Date();
		fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

		if (lastChanged > fourteenDaysAgo) {
			const diffTime = Math.abs(lastChanged.getTime() - fourteenDaysAgo.getTime());
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			return { canChange: false, daysLeft: diffDays };
		}
		return { canChange: true };
	};

	const { canChange, daysLeft } = checkCooldown();

	const handleSave = async () => {
		if (!newUsername.trim()) {
			toast.error('Username cannot be empty');
			return;
		}

		if (newUsername === user?.username) {
			onClose();
			return;
		}

		try {
			setLoading(true);
			const response = await api.put('/settings/profile', { username: newUsername });
			if (response.data.user) {
				updateUser(response.data.user);
				toast.success('Username updated successfully');
				onClose();
			}
		} catch (error: any) {
			toast.error(error.response?.data?.error || 'Failed to update username');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
			<div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
				<div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
					<h3 className="text-xl font-bold text-gray-900 dark:text-white">Change Username</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
					>
						<X size={24} />
					</button>
				</div>

				<div className="p-6 space-y-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Username
						</label>
						<input
							type="text"
							value={newUsername}
							onChange={(e) => setNewUsername(e.target.value)}
							disabled={!canChange || loading}
							className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all disabled:opacity-50"
							placeholder="Enter new username"
						/>
						{!canChange && (
							<p className="mt-2 text-sm text-red-500">
								You can change your username again in {daysLeft} days.
							</p>
						)}
						{canChange && (
							<p className="mt-2 text-sm text-gray-500">
								You can only change your username once every 14 days.
							</p>
						)}
					</div>

					<button
						onClick={handleSave}
						disabled={
							!canChange || loading || !newUsername.trim() || newUsername === user?.username
						}
						className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
					>
						{loading ? 'Saving...' : 'Save Username'}
					</button>
				</div>
			</div>
		</div>
	);
}
