import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
	LayoutDashboard, 
	Activity, 
	CheckSquare, 
	PlusCircle, 
	Users, 
	WalletCards, 
	LogOut,
	ChevronRight,
	MoreVertical,
	Settings,
	User as UserIcon,
	Moon,
	Sun
} from 'lucide-react';
import logo from '@/assets/images/logo.avif';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AdminLayoutProps {
	children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
	const location = useLocation();
	const { user, logout } = useAuthStore();
	const { theme, toggleTheme } = useThemeStore();

	const navGroups = [
		{
			title: 'Overview',
			items: [
				{ title: 'Dashboard', href: '/dashboard/home', icon: LayoutDashboard },
			]
		},
		{
			title: 'Markets',
			items: [
				{ title: 'All Markets', href: '/dashboard/markets', icon: Activity },
				{ title: 'Create Market', href: '/dashboard/markets/create', icon: PlusCircle },
			]
		},
		{
			title: 'Users',
			items: [
				{ title: 'Verifications', href: '/dashboard/verifications', icon: CheckSquare },
				{ title: 'All Users', href: '/dashboard/users', icon: Users },
			]
		},
		{
			title: 'Finance',
			items: [
				{ title: 'Transactions', href: '/dashboard/transactions', icon: WalletCards },
			]
		}
	];

	return (
		<div className="flex h-full w-full bg-gray-50 dark:bg-[#121212] font-sans">
			{/* Sidebar */}
			<aside className="w-64 flex-shrink-0 bg-white dark:bg-[#1C1C1E] border-r border-gray-200 dark:border-white/10 hidden md:flex flex-col">
				<div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-white/10">
					<Link to="/" className="flex items-center gap-2">
						<img src={logo} alt="Probo" className="h-6 dark:invert" />
					</Link>
				</div>
				
				<nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">
					{navGroups.map((group) => (
						<div key={group.title}>
							<h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">
								{group.title}
							</h3>
							<div className="space-y-1">
								{group.items.map((item) => {
									const isActive = location.pathname === item.href || (item.href !== '/dashboard/home' && location.pathname.startsWith(item.href));
									return (
										<Link
											key={item.href}
											to={item.href}
											className={`group flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
												isActive
													? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
													: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
											}`}
										>
											<div className="flex items-center gap-3">
												<item.icon size={18} className={isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500'} />
												{item.title}
											</div>
											{isActive && <ChevronRight size={14} className="text-blue-700 dark:text-blue-400" />}
										</Link>
									);
								})}
							</div>
						</div>
					))}
				</nav>
				
				<div className="p-4 border-t border-gray-200 dark:border-white/10">
					<Popover>
						<PopoverTrigger asChild>
							<button className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors text-left group">
								<div className="w-9 h-9 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
									{user?.username?.charAt(0).toUpperCase() || 'A'}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
										{user?.username || 'Admin User'}
									</p>
								</div>
								<MoreVertical size={16} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
							</button>
						</PopoverTrigger>
						<PopoverContent className="w-56 p-1 bg-white dark:bg-[#2C2C2E] border-gray-200 dark:border-white/10 rounded-xl shadow-lg mb-2" align="start">
							<div className="p-2 border-b border-gray-100 dark:border-white/5 mb-1">
								<p className="text-sm font-medium text-gray-900 dark:text-white">Admin Account</p>
								<p className="text-xs text-gray-500">{user?.email}</p>
							</div>
							
							<button 
								onClick={toggleTheme}
								className="flex items-center justify-between px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors w-full text-left"
							>
								<div className="flex items-center gap-2">
									{theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
									Dark Mode
								</div>
								<div className={`w-8 h-4 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
									<div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
								</div>
							</button>

							<button 
								onClick={logout}
								className="flex items-center gap-2 px-2 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors w-full text-left mt-1"
							>
								<LogOut size={16} />
								Logout
							</button>
						</PopoverContent>
					</Popover>
				</div>
			</aside>

			{/* Main Content */}
			<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
				<header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-white/10 md:hidden sticky top-0 z-10">
					<Link to="/dashboard/home" className="flex items-center gap-2">
						<img src={logo} alt="Probo" className="h-6 dark:invert" />
					</Link>
					<button onClick={logout} className="text-gray-500 hover:text-red-500">
						<LogOut size={20} />
					</button>
				</header>
				
				<main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
					<div className="mx-auto max-w-7xl">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
