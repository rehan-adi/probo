import { Context } from 'hono';
import { logger } from '@/utils/logger';
import { prisma } from '@probo/database';
import { kycVerificationSchema, paymentVerificationSchema } from '@/validations/verification';

export const submitKyc = async (c: Context) => {
	try {
		const userId = c.get('user').id;

		if (!userId) {
			logger.warn({ path: 'submitKyc' }, 'Unauthorized access attempt');
			return c.json(
				{
					success: false,
					message: 'Unauthorized access',
				},
				401,
			);
		}

		const data = await c.req.json();
		const validateData = kycVerificationSchema.safeParse(data);

		if (!validateData.success) {
			logger.warn(
				{
					userId,
					issues: validateData.error.issues,
					path: 'submitKyc',
				},
				'KYC validation failed',
			);
			return c.json(
				{
					success: false,
					message: 'Validation failed',
					error: validateData.error.issues,
				},
				400,
			);
		}

		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
		});

		if (!user) {
			logger.warn({ userId, path: 'submitKyc' }, 'User not found');
			return c.json(
				{
					success: false,
					message: 'User not found',
				},
				404,
			);
		}

		if (user.kycVerificationStatus === 'VERIFIED') {
			logger.warn({ userId, path: 'submitKyc' }, 'Already verified user tried KYC again');
			return c.json(
				{
					success: false,
					message: 'KYC Already verified',
				},
				400,
			);
		}

		const existingKyc = await prisma.kyc.findFirst({
			where: {
				userId,
				panNumber: validateData.data.panNumber,
				status: {
					not: 'REJECTED',
				},
			},
		});

		if (existingKyc) {
			logger.warn({ userId, path: 'submitKyc' }, 'KYC already submitted and under review');
			return c.json({
				success: false,
				message: 'KYC already submitted and under review',
			});
		}

		await prisma.kyc.create({
			data: {
				userId: userId,
				panName: validateData.data.panName,
				panNumber: validateData.data.panNumber,
				dob: validateData.data.DOB,
				status: 'PENDING',
				remarks: null,
				submittedAt: new Date(),
			},
		});

		await prisma.user.update({
			where: {
				id: userId,
			},
			data: {
				kycVerificationStatus: 'PENDING',
			},
		});

		logger.info({ userId, path: 'submitKyc' }, 'KYC submitted successfully');

		return c.json({
			success: true,
			message: 'KYC submitted successfully',
		});
	} catch (error) {
		logger.error({ error, path: 'submitKyc' }, 'Unexpected error during KYC submission');
		return c.json(
			{
				success: false,
				error: 'Internal server error',
			},
			500,
		);
	}
};

export const submitPaymentMethods = async (c: Context) => {
	try {
		const userId = c.get('user').id;

		if (!userId) {
			logger.warn({ path: 'submitPaymentMethods' }, 'Unauthorized access attempt');
			return c.json(
				{
					success: false,
					message: 'Unauthorized access',
				},
				401,
			);
		}

		const body = await c.req.json();
		const validateData = paymentVerificationSchema.safeParse(body);

		if (!validateData.success) {
			logger.warn(
				{
					userId,
					issues: validateData.error.issues,
					path: 'submitPaymentMethods',
				},
				'Validation failed',
			);
			return c.json(
				{
					success: false,
					message: 'validation failed',
					error: validateData.error.issues,
				},
				400,
			);
		}

		const { upiId, bankAccountNumber, ifscCode } = validateData.data;

		if (upiId) {
			const existingUpi = await prisma.paymentMethod.findFirst({
				where: {
					userId,
					type: 'UPI',
					status: {
						not: 'REJECTED',
					},
				},
			});

			if (existingUpi) {
				logger.warn(
					{ userId, path: 'submitPaymentMethods' },
					'UPI already submitted and under review',
				);
				return c.json(
					{
						success: false,
						message: 'UPI already submitted. Only resubmit if rejected.',
					},
					400,
				);
			}

			await prisma.paymentMethod.create({
				data: {
					userId,
					type: 'UPI',
					upiNumber: upiId,
					status: 'PENDING',
					remarks: null,
					submittedAt: new Date(),
				},
			});

			await prisma.user.update({
				where: { id: userId },
				data: {
					paymentVerificationStatus: 'PENDING',
				},
			});
		} else {
			const existingBank = await prisma.paymentMethod.findFirst({
				where: {
					userId,
					type: 'BANK',
					status: {
						not: 'REJECTED',
					},
				},
			});

			if (existingBank) {
				logger.warn(
					{ userId, path: 'submitPaymentMethods' },
					'Bank details already submitted and under review',
				);
				return c.json(
					{
						success: false,
						message: 'Bank details already submitted. Only resubmit if rejected.',
					},
					400,
				);
			}

			await prisma.paymentMethod.create({
				data: {
					userId,
					type: 'BANK',
					accountNumber: bankAccountNumber,
					ifscCode: ifscCode,
					status: 'PENDING',
					remarks: null,
					submittedAt: new Date(),
				},
			});

			await prisma.user.update({
				where: { id: userId },
				data: {
					paymentVerificationStatus: 'PENDING',
				},
			});
		}

		logger.info({ userId, path: 'submitPaymentMethods' }, 'Payment details submitted successfully');

		return c.json({
			success: true,
			message: 'Payment details submitted successfully',
		});
	} catch (error) {
		logger.error({ error, path: 'submitPaymentMethods' }, 'Failed to submit payment details');
		return c.json(
			{
				success: false,
				error: 'Internal server error',
			},
			500,
		);
	}
};

export const getVerificationStatus = async (c: Context) => {
	try {
		const userId = c.get('user').id;

		if (!userId) {
			logger.warn({ path: 'getVerificationStatus' }, 'Unauthorized access attempt');
			return c.json(
				{
					success: false,
					message: 'Unauthorized access',
				},
				401,
			);
		}

		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
			select: {
				id: true,
				kycVerificationStatus: true,
				paymentVerificationStatus: true,
			},
		});

		if (!user) {
			logger.warn(
				{ userId, path: 'getVerificationStatus' },
				'User not found while fetching verification status',
			);
			return c.json(
				{
					success: false,
					message: 'User not found',
				},
				404,
			);
		}

		logger.info(
			{ userId, path: 'getVerificationStatus' },
			'Fetched verification status successfully',
		);

		return c.json(
			{
				success: true,
				message: 'Verification status fetched successfully',
				data: {
					userId: user.id,
					kycVerificationStatus: user.kycVerificationStatus,
					paymentVerificationStatus: user.paymentVerificationStatus,
				},
			},
			200,
		);
	} catch (error) {
		logger.error({ error, path: 'getVerificationStatus' }, 'Failed to fetch verification status');
		return c.json(
			{
				success: false,
				error: 'Internal server error',
			},
			500,
		);
	}
};

export const getVerificationDetails = async (c: Context) => {
	try {
		const userId = c.get('user').id;

		if (!userId) {
			logger.warn({ path: 'getVerificationDetails' }, 'Unauthorized access attempt');
			return c.json(
				{
					success: false,
					message: 'Unauthorized access',
				},
				401,
			);
		}

		const [kyc, payment] = await Promise.all([
			prisma.kyc.findFirst({
				where: { userId },
				select: {
					panName: true,
					panNumber: true,
					dob: true,
					status: true,
				},
			}),
			prisma.paymentMethod.findFirst({
				where: { userId },
				select: {
					type: true,
					status: true,
					upiNumber: true,
					accountNumber: true,
					ifscCode: true,
				},
			}),
		]);

		const paymentMethod = payment
			? payment.type === 'UPI'
				? {
						type: 'UPI',
						upiNumber: payment.upiNumber,
						status: payment.status,
					}
				: {
						type: 'BANK',
						accountNumber: payment.accountNumber,
						ifscCode: payment.ifscCode,
						status: payment.status,
					}
			: null;

		logger.info({ userId, path: 'getVerificationDetails' }, 'Fetched verification details');

		return c.json({
			success: true,
			message: 'Verification details fetched successfully',
			data: {
				kyc,
				paymentMethod,
				fetchedAt: new Date().toISOString(),
			},
		});
	} catch (error) {
		logger.error({ error, path: 'getVerificationDetails' }, 'Failed to fetch verification details');
		return c.json(
			{
				success: false,
				error: 'Internal server error',
			},
			500,
		);
	}
};
