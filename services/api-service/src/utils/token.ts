import crypto from 'crypto';
import { Context } from 'hono';
import { ENV } from '@/config/env';
import { setCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';

export interface AccessTokenPayload {
	[key: string]: unknown;
	id: string;
	email?: string;
	role: string;
	exp?: number;
}

export const generateAccessToken = async (
	id: string,
	role: string,
	email?: string | null,
): Promise<string> => {
	const payload: AccessTokenPayload = {
		id,
		role,
		...(email && { email }),
		exp: Math.floor(Date.now() / 1000) + Number(ENV.ACCESS_TOKEN_EXPIRY),
	};

	return sign(payload, ENV.ACCESS_TOKEN_SECRET);
};

export const verifyAccessToken = async (token: string): Promise<AccessTokenPayload> => {
	return verify(token, ENV.ACCESS_TOKEN_SECRET) as Promise<AccessTokenPayload>;
};

export const generateRefreshTokenString = (): string => {
	return crypto.randomBytes(40).toString('hex');
};

export const hashRefreshToken = (token: string): string => {
	return crypto.createHash('sha256').update(token).digest('hex');
};

export const setAuthCookies = (c: Context, accessToken: string, refreshToken: string) => {
	setCookie(c, 'accessToken', accessToken, {
		secure: process.env.NODE_ENV === 'production',
		httpOnly: true,
		maxAge: Number(ENV.ACCESS_TOKEN_EXPIRY),
		sameSite: 'Strict',
		path: '/',
	});

	setCookie(c, 'refreshToken', refreshToken, {
		secure: process.env.NODE_ENV === 'production',
		httpOnly: true,
		maxAge: Number(ENV.REFRESH_TOKEN_EXPIRY),
		sameSite: 'Strict',
		path: '/api/v1/auth',
	});
};
