import { sign } from 'hono/jwt';
import { ENV } from '@/config/env';

/**
 *
 * @param id users id
 * @param phone users phone number
 * @param role users role
 * @returns it returns a jwt token
 */

export const generateJwtToken = async (
	id: string,
	phone: string,
	role: string,
): Promise<string> => {
	const payload = {
		id,
		phone,
		role,
		exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
	};

	const token = await sign(payload, ENV.JWT_SECRET);

	return token;
};
