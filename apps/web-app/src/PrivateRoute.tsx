import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

const PrivateRoute = () => {
	const token = useAuthStore((state) => state.token);

	if (!token) {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
};

export default PrivateRoute;
