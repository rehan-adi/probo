import { ENV } from '@/config/env';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

export const cashfree = new Cashfree(
	CFEnvironment.SANDBOX,
	ENV.CASHFREE_CLIENT_ID,
	ENV.CASHFREE_CLIENT_SECRET
);
