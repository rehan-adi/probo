import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { PROBO_API } from '@/utils/constants';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';

export default function Profile() {
	const [profile, setProfile] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	
	const [name, setName] = useState('');
	const [profilePic, setProfilePic] = useState('');
	
	const token = useAuthStore((state) => state.token);

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const res = await axios.get(`${PROBO_API}/profile/get`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.data.success) {
					setProfile(res.data.data);
					setName(res.data.data.name || '');
					setProfilePic(res.data.data.profilePic || '');
				}
			} catch (err) {
				console.error('Failed to fetch profile', err);
			} finally {
				setLoading(false);
			}
		};

		if (token) fetchProfile();
	}, [token]);

	const handleSave = async () => {
		setSaving(true);
		try {
			const res = await axios.patch(
				`${PROBO_API}/profile/update`,
				{ name, profilePic },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			
			if (res.data.success) {
				toast.success('Profile updated successfully');
				setProfile(res.data.data);
			}
		} catch (err) {
			toast.error('Failed to update profile');
			console.error('Failed to update profile', err);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<Loader2 className="animate-spin w-8 h-8 text-gray-500" />
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto p-4 md:p-8">
			<h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>

			<div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
				
				<div className="flex items-center gap-6">
					<div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border-4 border-gray-50">
						{profilePic ? (
							<img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
						) : (
							<span className="text-gray-400 font-bold text-3xl">{name ? name.charAt(0).toUpperCase() : 'P'}</span>
						)}
					</div>
					<div className="flex-1">
						<label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
						<input 
							type="text" 
							value={profilePic}
							onChange={(e) => setProfilePic(e.target.value)}
							placeholder="https://example.com/image.jpg"
							className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-gray-800 transition-colors"
						/>
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
					<input 
						type="text" 
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-gray-800 transition-colors"
					/>
				</div>
				
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
					<input 
						type="text" 
						value={profile?.phone}
						disabled
						className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl outline-none cursor-not-allowed"
					/>
				</div>

				<button
					onClick={handleSave}
					disabled={saving}
					className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex justify-center items-center"
				>
					{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
				</button>
			</div>
		</div>
	);
}
