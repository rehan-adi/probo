import { useAuthStore } from '@/store/auth';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const isHydrated = useAuthStore((state) => state.isHydrated);

	if (!isHydrated) {
		return null;
	}

	if (!isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
};

export default PrivateRoute;
