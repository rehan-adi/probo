import { v4 as uuid } from 'uuid';

/**
 * Generates a unique 6-character referral code.
 * The code contains uppercase alphanumeric characters.
 *
 * @returns {string} A 6-character referral code (e.g., "A1B2C3")
 */

export const generateReferralCode = (): string => {
	return uuid().replace(/-/g, '').slice(0, 6).toUpperCase();
};
